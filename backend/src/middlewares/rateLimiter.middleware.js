import rateLimit from "express-rate-limit";

// 🔐 Login – brute force
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de login. Tente novamente em alguns minutos."
  }
});

// 📧 Ações que disparam e-mail (menos restritivo)
export const mailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas requisições. Aguarde alguns minutos."
  }
});

// 🔑 Confirmações por token (mais permissivo)
export const tokenRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas. Tente novamente mais tarde."
  }
});
