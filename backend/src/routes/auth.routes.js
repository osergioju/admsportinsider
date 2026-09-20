import { Router } from "express";
import {
  login,
  register,
  resendVerification,
  verifyMail,
  me,
  resetPasswordRequest,
  resetPasswordConfirm
} from "../controllers/auth.controller.js";

import { authGuard } from "../middlewares/auth.middleware.js";
import {
  loginRateLimiter,
  mailRateLimiter,
  tokenRateLimiter
} from "../middlewares/rateLimiter.middleware.js";

import {
  startGoogleAuth,
  googleAuthCallback,
  exchangeGoogleCode
} from "../controllers/googleAuth.controller.js";

const router = Router();

// 🔐 Login e cadastro
router.post("/login", loginRateLimiter, login);
router.post("/register", mailRateLimiter, register);

// 📧 Verificação de e-mail
router.get("/verify-email", tokenRateLimiter, verifyMail);
router.post("/resend-verification", mailRateLimiter, resendVerification);

// 🔑 Recuperação de senha
router.post("/reset-password", mailRateLimiter, resetPasswordRequest);
router.post("/reset-password/confirm", tokenRateLimiter, resetPasswordConfirm);

// 👤 Usuário autenticado
router.get("/me", authGuard, me);

// 🔐 Login com Google
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleAuthCallback);
router.post("/google/exchange", tokenRateLimiter, exchangeGoogleCode);

export default router;
