import bcrypt from "bcryptjs";
import crypto from "crypto";
import { findUserByEmail, createPublicUser } from "../models/user.model.js";
import { generateAccessToken } from "../config/jwt.js";
import { checkResetLimit } from "../utils/resetLimiter.js";
import { db } from "../config/db.js";
import { sendResetEmail, sendResetEmailSucess, reSendMail } from "../utils/mailer.js";

// Tokens pro cadastro, pra chegar no e-mail e confirmar e tal
function generateEmailToken() {
  return crypto.randomBytes(32).toString("hex"); // token "cru"
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// LOGIN BÁSICO
export const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Buscar usuário no banco
    const user = await findUserByEmail(email);

    if (!user || !user.active || !user.email_verified) {
      return res.status(401).json({
        error: "Credenciais inválidas"
      });
    }

    const passwordMatch = await bcrypt.compare(senha, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Credenciais inválidas"
      });
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

export const register = async (req, res) => {
  const { nome, email, senha } = req.body;

  // 1. Validação básica
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres." });
  }

  try {
    // 2. Verificar se usuário já existe
    const userExists = await findUserByEmail(email);
    if (userExists) {
      return res.status(409).json({ error: "Este e-mail já está em uso." });
    }

    // 3. Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(senha, salt);

    // 4. Salvar no banco (usando a função nova do model)
    const newUser = await createPublicUser({
      nome,
      email,
      passwordHash
    });

    // 5. Enviar e-mail de confirmação (depois a gente faz isso direito)
    try {
        const token = generateEmailToken();
        const tokenHash = hashToken(token);

        await db.query(`
          INSERT INTO email_verifications (user_id, token_hash, expires_at)
          VALUES ($1, $2, NOW() + INTERVAL '24 hours')
        `, [newUser.id, tokenHash]);

        await reSendMail(newUser.email, token); // agora manda token
    } catch (mailError) {
        console.error("Erro ao enviar email de boas-vindas:", mailError);
        // Não bloqueamos o cadastro se o email falhar
    }

    // 6. Gerar Token JWT para já logar o usuário direto
    const token = generateAccessToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });
    
    // Registrar log de login (já que ele entrou ao se cadastrar)
    await db.query("INSERT INTO login_logs (user_id) VALUES ($1)", [newUser.id]);

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso! Verifique seu e-mail.",
      token,
      user: newUser
    });

  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro interno ao criar conta." });
  }
};

export async function verifyMail(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token não informado." });
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // 1️⃣ Busca o token (mesmo que já tenha sido usado)
  const { rows } = await db.query(`
    SELECT ev.id, ev.user_id, ev.used_at, u.email_verified
    FROM email_verifications ev
    JOIN users u ON u.id = ev.user_id
    WHERE ev.token_hash = $1
      AND ev.expires_at > NOW()
    LIMIT 1
  `, [tokenHash]);

  if (!rows.length) {
    return res.status(400).json({
      error: "Token inválido ou expirado."
    });
  }

  const verification = rows[0];

  // 2️⃣ Se já estiver confirmado, responde sucesso (IDEMPOTENTE)
  if (verification.email_verified) {
    return res.status(200).json({
      message: "E-mail já confirmado."
    });
  }

  // 3️⃣ Confirma usuário
  await db.query(`
    UPDATE users
    SET email_verified = true,
        updated_at = NOW()
    WHERE id = $1
  `, [verification.user_id]);

  // 4️⃣ Marca token como usado (se ainda não estiver)
  if (!verification.used_at) {
    await db.query(`
      UPDATE email_verifications
      SET used_at = NOW()
      WHERE id = $1
    `, [verification.id]);
  }

  return res.status(200).json({
    message: "E-mail confirmado com sucesso."
  });
}


export async function resendVerification(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "E-mail não informado." });
  }

  // 1️⃣ Busca usuário
  const { rows } = await db.query(
    "SELECT id, email_verified FROM users WHERE email = $1",
    [email]
  );

  if (!rows.length) {
    // segurança: não revela se existe ou não
    return res.status(200).json({
      message: "Se o e-mail existir, enviaremos a confirmação."
    });
  }

  const user = rows[0];

  if (user.email_verified) {
    return res.status(400).json({
      error: "E-mail já confirmado."
    });
  }

  // 2️⃣ Invalida tokens antigos
  await db.query(
    "UPDATE email_verifications SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
    [user.id]
  );

  // 3️⃣ Cria novo token
  const token = generateEmailToken();
  const tokenHash = hashToken(token);

  await db.query(`
    INSERT INTO email_verifications (user_id, token_hash, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '24 hours')
  `, [user.id, tokenHash]);

  // 4️⃣ Envia e-mail
  await reSendMail(email, token);

  return res.status(200).json({
    message: "Novo e-mail de confirmação enviado."
  });
}

// Check no middleware pra ver quem sou eu
export const me = async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT
        u.*,
        p.name AS plan_name,

        up.first_login_completed,
        up.email_notifications,
        up.product_updates,

        r.id   AS region_id,
        r.code AS region_code,
        r.name AS region_name,

        c.id   AS currency_id,
        c.code AS currency_code,
        c.name AS currency_name,
        c.symbol AS currency_symbol

      FROM users u
      LEFT JOIN plans p ON p.id = u.plan_id
      LEFT JOIN user_preferences up ON up.user_id = u.id
      LEFT JOIN regions r ON r.id = up.region_id
      LEFT JOIN currencies c ON c.id = up.currency_id
      WHERE u.id = $1;
      `,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const row = result.rows[0];

    if (!row.active) {
      return res.status(403).json({
        error: "Conta desativada. Entre em contato com o suporte."
      });
    }

    if (!row.email_verified) {
      return res.status(403).json({
        error: "E-mail ainda não foi verificado."
      });
    }

    // Monta objeto de preferências
    const preferences =
      row.first_login_completed === null
        ? null
        : {
            region_id: row.region_id,
            currency_id: row.currency_id,
            first_login_completed: row.first_login_completed
          };

    // Remove campos que não pertencem ao user direto
    delete row.region_id;
    delete row.currency_id;
    delete row.first_login_completed;

    return res.json({
      authenticated: true,
      user: {
        ...row,
        preferences
      }
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
          "Se o e-mail estiver atrelado a uma conta, você receberá um link de redefinição em instantes."
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
        "Se o e-mail estiver atrelado a uma conta, você receberá um link de redefinição em instantes."
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
