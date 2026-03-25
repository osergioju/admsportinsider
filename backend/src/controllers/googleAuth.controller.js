import axios from "axios";
import db from  "../config/db.js";
import { findUserByEmail } from "../models/user.model.js";
import { generateAccessToken } from "../config/jwt.js";

const prod_url = process.env.PROD_URL;
// ==============================================
// 1) Redireciona para o Google
// ==============================================
export const startGoogleAuth = (req, res) => {
  const redirectUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "email profile",
      access_type: "offline",
      prompt: "consent"
    });

  return res.redirect(redirectUrl);
};

// ==============================================
// 2) Callback do Google
// ==============================================
export const googleAuthCallback = async (req, res) => {
  const { code } = req.query;

  // Deu ruim
  if (!code) {
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

    // modelo A: backend resolve tudo e manda só o token pro front
    const redirectUrl = prod_url + `/auth/google/callback?token=${token}`;
    return res.redirect(redirectUrl);

  } catch (err) {
    console.error("Erro no Google Auth:", err.response?.data || err);
    return res.redirect(
      prod_url + "/login?error=google_error"
    );
  }
};
