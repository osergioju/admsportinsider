import axios from "axios";
import crypto from "crypto";
import db from  "../config/db.js";
import { findUserByEmail } from "../models/user.model.js";
import { generateAccessToken } from "../config/jwt.js";
import { addContactToBrevo } from "../utils/mailer.js";

const prod_url = process.env.PROD_URL;
const isProd = process.env.NODE_ENV === "production";

// ==============================================
// 1) Redireciona para o Google
// ==============================================
export const startGoogleAuth = (req, res) => {
  // Proteção contra CSRF de login: sem isso um atacante pode iniciar o
  // próprio fluxo, capturar o link de callback com o `code` dele e induzir
  // a vítima a abri-lo — a vítima acabaria logada na conta do atacante.
  const state = crypto.randomBytes(24).toString("hex");

  res.cookie("google_oauth_state", state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000
  });

  const redirectUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "email profile",
      access_type: "offline",
      prompt: "consent",
      state
    });

  return res.redirect(redirectUrl);
};

// ==============================================
// 2) Callback do Google
// ==============================================
export const googleAuthCallback = async (req, res) => {
  const { code, state } = req.query;
  const expectedState = req.cookies?.google_oauth_state;

  res.clearCookie("google_oauth_state");

  // Sem code, sem state, ou state que não bate com o cookie que a gente
  // mesmo setou em startGoogleAuth → provável CSRF, aborta.
  if (!code || !state || !expectedState || state !== expectedState) {
    return res.redirect(
      prod_url + "/login?error=google_failed"
    );
  }

  try {
    // ==============================================
    // 1) Trocar CODE por TOKEN
    // ==============================================
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code"
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenResponse.data;

    // ==============================================
    // 2) Pegar dados do usuário
    // ==============================================
    const googleUserResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const googleUser = googleUserResponse.data;

    if (googleUser.verified_email === false) {
      return res.redirect(prod_url + "/login?error=google_failed");
    }

    const email = googleUser.email;
    const name = googleUser.name;
    const avatar = googleUser.picture;
    const providerId = googleUser.id;

    // ==============================================
    // 3) Verificar se usuário existe
    // ==============================================
    let user = await findUserByEmail(email);

    // ---------------------------
    // CASO A: não existe → criar
    // ---------------------------
    if (!user) {
      const now = new Date();

      const insert = await db.query(
        `INSERT INTO users 
          (name, email, password_hash, role, plan_id, last_login, created_at, updated_at, 
           email_verified, active, country, provider, provider_id, avatar_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          name,
          email,
          null,          // não tem senha
          "user",
          1,
          now,
          now,
          now,
          true,          // Google já verifica email
          true,
          null,
          "google",
          providerId,
          avatar
        ]
      );

      user = insert.rows[0];

      // Adiciona o novo usuário Google na lista do Brevo
      try {
        const planRes = await db.query(`SELECT name FROM plans WHERE id = 1`);
        const planName = planRes.rows[0]?.name || "Gratuito";
        await addContactToBrevo({ email: user.email, name: user.name, planName });
        console.log(`[Brevo] Contato Google adicionado: ${user.email} | Plano: ${planName}`);
      } catch (brevoErr) {
        console.error("[Brevo] Falha ao adicionar contato Google:", brevoErr.message);
      }
    }

    // ---------------------------
    // CASO B: existe mas provider=email → bloquear
    // ---------------------------
    else if (user.provider === "email") {
      return res.redirect(
        prod_url + "login?error=email_in_used"
      );
    }

    // ---------------------------
    // CASO C: existe e provider=google → OK
    // ---------------------------

    // validar se está ativo
    if (!user.active) {
      return res.status(403).json({
        error: "Sua conta está desativada. Entre em contato com o suporte."
      });
    }

    // validar se email está verificado
    if (!user.email_verified) {
      return res.status(403).json({
        error: "Você precisa confirmar seu e-mail antes de acessar o sistema."
      });
    }

    // atualizar last_login
    await db.query(
      "UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1",
      [user.id]
    );

    // registrar log
    await db.query("INSERT INTO login_logs (user_id) VALUES ($1)", [user.id]);

    // gerar token
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Em vez de mandar o JWT na URL (fica em histórico do navegador e em
    // logs), gera um código de uso único de vida curta pro front trocar
    // pelo token via POST em /auth/google/exchange.
    const exchangeCode = crypto.randomBytes(32).toString("hex");
    const exchangeCodeHash = crypto.createHash("sha256").update(exchangeCode).digest("hex");

    await db.query(
      `INSERT INTO oauth_login_codes (code_hash, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '60 seconds')`,
      [exchangeCodeHash, token]
    );

    const redirectUrl = prod_url + `/auth/google/callback?code=${exchangeCode}`;
    return res.redirect(redirectUrl);

  } catch (err) {
    console.error("Erro no Google Auth:", err.response?.data || err);
    return res.redirect(
      prod_url + "/login?error=google_error"
    );
  }
};

// ==============================================
// 3) Troca do código de uso único pelo JWT
// ==============================================
export const exchangeGoogleCode = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Código não informado." });
  }

  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  try {
    // UPDATE ... WHERE used_at IS NULL ... RETURNING garante troca única mesmo
    // sob concorrência (duas requisições com o mesmo código não passam as duas).
    const { rows } = await db.query(
      `UPDATE oauth_login_codes
       SET used_at = NOW()
       WHERE code_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       RETURNING token`,
      [codeHash]
    );

    if (!rows.length) {
      return res.status(400).json({ error: "Código inválido, expirado ou já utilizado." });
    }

    return res.json({ token: rows[0].token });
  } catch (err) {
    console.error("Erro ao trocar código do Google Auth:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};
