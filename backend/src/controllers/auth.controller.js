import bcrypt from "bcryptjs";
import crypto from "crypto";
import { findUserByEmail } from "../models/user.model.js";
import { generateAccessToken } from "../config/jwt.js";
import { checkResetLimit } from "../utils/resetLimiter.js";
import { db } from "../config/db.js";
import { sendResetEmail } from "../utils/mailer.js";

// LOGIN BÁSICO
export const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Buscar usuário no banco
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "O e-mail informado não pertence a nenhuma conta" });
    }

    // 2. Verificar senha
    const passwordMatch = await bcrypt.compare(senha, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    // 3. Gerar JWT
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 4. Atualizar last_login
    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
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
    return res.json({
      authenticated: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno" });
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

export async function resetPasswordConfirm(req, res) {
  try {
    const { token, senha } = req.body;

    if (!token || !senha) {
      return res.status(400).json({
        status: "error",
        message: "Token e nova senha são obrigatórios."
      });
    }

    // 1. Criar hash do token enviado
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Buscar token no banco
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

    // 3. Verificar expiração
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Token expirado. Solicite uma nova redefinição."
      });
    }

    // 4. Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // 5. Atualizar senha do usuário
    await db.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, reset.user_id]
    );

    // 6. Apagar token após o uso
    await db.query(
      "DELETE FROM password_resets WHERE id = $1",
      [reset.id]
    );

    return res.json({
      status: "ok",
      message: "Senha redefinida com sucesso."
    });

  } catch (error) {
    console.error("Erro no resetPasswordConfirm:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
