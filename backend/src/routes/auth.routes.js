import { Router } from "express";
import { login, register, resendVerification, verifyMail, me, resetPasswordRequest, resetPasswordConfirm } from "../controllers/auth.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";
import { startGoogleAuth, googleAuthCallback } from "../controllers/googleAuth.controller.js";
import { loginRateLimiter } from "../middlewares/rateLimiter.middleware.js";
const router = Router();

// Login e register
router.post("/login", loginRateLimiter, login);  
router.post("/register", register);

// Verifica e-mail e reenvia caso a pessoa tenha expirado e tal
router.get("/verify-email", verifyMail);
router.post("/resend-verification", resendVerification);

// Troca a senha. envia e-mail de troca e troca de verdade
router.post("/reset-password", resetPasswordRequest);
router.post("/reset-password/confirm", resetPasswordConfirm);

// Se atutentica, garante que vc é vc
router.get("/me", authGuard, me);

// Login com Google
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
