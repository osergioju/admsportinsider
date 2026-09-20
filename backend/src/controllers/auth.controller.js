import bcrypt from "bcryptjs";
import crypto from "crypto";
import { findUserByEmail, createPublicUser } from "../models/user.model.js";
import { generateAccessToken } from "../config/jwt.js";
import { checkResetLimit } from "../utils/resetLimiter.js";
import db from "../config/db.js";
import { sendResetEmail, sendResetEmailSucess, reSendMail, addContactToBrevo } from "../utils/mailer.js";

// Tokens pro cadastro, pra chegar no e-mail e confirmar e tal
function generateEmailToken() {
  return crypto.randomBytes(32).toString("hex"); // token "cru"
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

// Hash "de mentira" com custo igual ao usado de verdade (10). Serve só pra
// gastar o mesmo tempo de um bcrypt.compare real quando o usuário não existe
// ou não tem senha (conta Google) — sem isso dava pra descobrir por timing
// quais e-mails têm conta só medindo o tempo de resposta do /login.
const DUMMY_HASH = bcrypt.hashSync("timing-attack-mitigation", 10);

// LOGIN BÁSICO
export const login = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { senha } = req.body;

  try {
    // 1. Buscar usuário no banco
    const user = await findUserByEmail(email);

    if (!user || !user.active || !user.email_verified || !user.password_hash) {
      // Roda o compare mesmo sem usuário/senha real, só pra igualar o tempo
      // de resposta ao caso de credenciais existentes e erradas.
      await bcrypt.compare(senha || "", DUMMY_HASH);
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const passwordMatch = await bcrypt.compare(senha, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
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
        role: user.role,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req, res) => {
  const { nome, senha, newsletter } = req.body;
  const email = normalizeEmail(req.body.email);

  // 1. Validação básica
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Informe um e-mail válido." });
  }

  // Mesmo mínimo exigido em /user/security/password, pra não ter duas
  // políticas de senha diferentes dentro do mesmo produto.
  if (senha.length < 8) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 8 caracteres." });
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

    // 6. Adicionar contato na lista do Brevo (somente se aceitou newsletter)
    if (newsletter === true) {
      try {
        const planRes = await db.query(`SELECT name FROM plans WHERE id = 1`);
        const planName = planRes.rows[0]?.name || "Gratuito";
        await addContactToBrevo({ email: newUser.email, name: newUser.name, planName });
        console.log(`[Brevo] Contato adicionado: ${newUser.email} | Plano: ${planName}`);
      } catch (brevoErr) {
        console.error("[Brevo] Falha ao adicionar contato:", brevoErr.message);
      }
    }

    // 7. Gerar Token JWT para já logar o usuário direto
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
  const email = normalizeEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ error: "E-mail não informado." });
  }

  // Resposta sempre igual (existir ou não a conta, verificado ou não) pra não
  // dar pra descobrir por aqui quais e-mails têm conta cadastrada.
  const genericResponse = {
    message: "Se o e-mail existir e ainda não tiver sido confirmado, enviaremos uma nova confirmação."
  };

  // 1️⃣ Busca usuário
  const { rows } = await db.query(
    "SELECT id, email_verified FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );

  if (!rows.length) {
    return res.status(200).json(genericResponse);
  }

  const user = rows[0];

  if (user.email_verified) {
    return res.status(200).json(genericResponse);
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

  return res.status(200).json(genericResponse);
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

    // Nunca devolve o hash da senha pro cliente, nem pro próprio dono da conta
    delete row.password_hash;

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
    const email = normalizeEmail(req.body.email);

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
    const { token, senha } = req.body;

    if (!token || !senha) {
      return res.status(400).json({
        status: "error",
        message: "Token e nova senha são obrigatórios."
      });
    }

    if (senha.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "A senha deve ter no mínimo 8 caracteres."
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

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

    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Token expirado. Solicite uma nova redefinição."
      });
    }


    const hashedPassword = await bcrypt.hash(senha, 10);

    const updateResult = await db.query(
      "UPDATE users SET password_hash = $1, email_verified = true WHERE id = $2",
      [hashedPassword, reset.user_id]
    );

    const deleteResult = await db.query(
      "DELETE FROM password_resets WHERE id = $1",
      [reset.id]
    );

    // ✅ CORREÇÃO: email já veio na primeira query, não precisa buscar de novo
    const email = reset.email;

    await sendResetEmailSucess(email);

    return res.json({
      status: "ok",
      message: "Senha redefinida com sucesso."
    });

  } catch (error) {
    console.error("[ERRO] resetPasswordConfirm:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}