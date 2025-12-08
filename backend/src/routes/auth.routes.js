import { Router } from "express";
import { login, me, resetPasswordRequest, resetPasswordConfirm } from "../controllers/auth.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";
import { startGoogleAuth, googleAuthCallback } from "../controllers/googleAuth.controller.js";

const router = Router();

// Rotas de autenticação (email/senha)
router.post("/login", login);
router.post("/reset-password", resetPasswordRequest);
router.get("/me", authGuard, me);
router.post("/reset-password/confirm", resetPasswordConfirm);

// Login com Google
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
