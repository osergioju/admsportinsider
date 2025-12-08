import bcrypt from "bcryptjs";
import crypto from "crypto";
import { findUserByEmail } from "../models/user.model.js";
import { generateAccessToken } from "../config/jwt.js";
import { checkResetLimit } from "../utils/resetLimiter.js";
import { db } from "../config/db.js";
import { sendResetEmail, sendResetEmailSucess } from "../utils/mailer.js";

// LOGIN BÁSICO
export const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Buscar usuário no banco
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "O e-mail informado não pertence a nenhuma conta" });
    }

    // 2. Verificar se está ativo
    if (!user.active) {
      return res.status(403).json({
        error: "Sua conta está desativada. Entre em contato com o suporte."
      });
    }

    // 3. Verificar se o e-mail foi confirmado
    if (!user.email_verified) {
      return res.status(403).json({
        error: "Você precisa confirmar seu e-mail antes de acessar o sistema."
      });
    }

    // 4. Verificar senha
    const passwordMatch = await bcrypt.compare(senha, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    // 5. Gerar JWT
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 6. Atualizar last_login
    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
      [user.id]
    );

    await db.query(
      "INSERT INTO login_logs (user_id) VALUES ($1)",
      [user.id]
    );

    return res.json({
      message: "Login efetuado com sucesso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};


// Check no middleware pra ver quem sou eu
export const me = async (req, res) => {
  try {
    // Buscar dados atualizados no banco
    const result = await db.query(
      `SELECT id, name, email, role, email_verified, active, avatar_url
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = result.rows[0];

    // Verifica se usuário está ativo
    if (!user.active) {
      return res.status(403).json({
        error: "Conta desativada. Entre em contato com o suporte."
      });
    }

    // Verifica se e-mail foi confirmado
    if (!user.email_verified) {
      return res.status(403).json({
        error: "E-mail ainda não foi verificado."
      });
    }

    return res.json({
      authenticated: true,
      user
    });

  } catch (error) {
    console.error("Erro no /auth/me:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// RESET PASSWORD PADRÃO 
export async function resetPasswordRequest(req, res) {
  try {
    const { email } = req.body;
    console.log(req.body);
    console.log(email);
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

    // Esquema de limitar quantas vezes ele pode fazer isso, 5 é máximo e expira em 1h
    const limit = await checkResetLimit(email, ip);

    if (!limit.allowed) {
      return res.status(429).json({
        status: "error",
        message: "Muitas tentativas. Tente novamente mais tarde.",
        retryAt: limit.retryAt
      });
    }

    // Busca o user no banco, por e-mail
    const user = await findUserByEmail(email);

    // Se não encontrar, envia uma mensagem de sucesso pra fingir
    if (!user) {
      return res.json({
        status: "ok",
        message:
          "Se o e-mail existir, você receberá um link de redefinição em instantes."
      });
    }

    // Tirar o token velho desse usuário
    await db.query("DELETE FROM password_resets WHERE user_id = $1", [
      user.id
    ]);

    // Gera token novo pro usuário
    const token = crypto.randomBytes(48).toString("hex");

    // Criptografa o token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Expira em 15 minutos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Bota o token na base
    await db.query(
      `
      INSERT INTO password_resets (user_id, token_hash, ip_address, expires_at)
      VALUES ($1, $2, $3, $4)
      `,
      [user.id, tokenHash, ip, expiresAt]
    );

    // Envia o e-mail pro cara com os dados 
    await sendResetEmail(user.email, token);

    // Enviar e-mail pro cabra
    return res.json({
      status: "ok",
      message:
        "Se o e-mail existir, você receberá um link de redefinição em instantes."
    });

  } catch (error) {
    console.error("Erro no resetPasswordRequest:", error);
    return res.status(500).json({
      error: "Erro interno no servidor."
    });
  }
}

// RESET PASSWORD CONFIRM
export async function resetPasswordConfirm(req, res) {
  try {
    const { token, senha,  } = req.body;

    if (!token || !senha) {
      return res.status(400).json({
        status: "error",
        message: "Token e nova senha são obrigatórios."
      });
    }

    // Criar hash do token enviado
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // buscar token no banco
    const result = await db.query(
      `
      SELECT pr.id, pr.user_id, pr.expires_at, u.email
      FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.token_hash = $1
      `,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Token inválido ou já utilizado."
      });
    }

    const reset = result.rows[0];

    // Verificar expiração
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Token expirado. Solicite uma nova redefinição."
      });
    }
    
    // gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // atualizar senha do usuário
    await db.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, reset.user_id]
    );

    // Apagar token após o uso
    await db.query(
      "DELETE FROM password_resets WHERE id = $1",
      [reset.id]
    );

    // Pega o e-mail do user com base no id fazendo select na base
    const getUserMail = await db.query(
      `
      SELECT email
      FROM users WHERE id = $1
      `,
      [reset.user_id]
    );

    const email = getUserMail.rows[0].email

    // enviar e-mail de sucesso falando q ele mudou a senha 
    await sendResetEmailSucess(email);

    return res.json({
      status: "ok",
      message: "Senha redefinida com sucesso."
    });

  } catch (error) {
    console.error("Erro no resetPasswordConfirm:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
