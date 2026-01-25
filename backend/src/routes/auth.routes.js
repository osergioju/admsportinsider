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
  googleAuthCallback
} from "../controllers/googleAuth.controller.js";

const router = Router();

// 🔐 Login e cadastro
router.post("/login", login);
router.post("/register", register);

// 📧 Verificação de e-mail
router.get("/verify-email", verifyMail);
router.post("/resend-verification", resendVerification);

// 🔑 Recuperação de senha
router.post("/reset-password", resetPasswordRequest);
router.post("/reset-password/confirm", resetPasswordConfirm);

// 👤 Usuário autenticado
router.get("/me", authGuard, me);

// 🔐 Login com Google
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
