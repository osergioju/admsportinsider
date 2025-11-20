import { Router } from "express";
import { login, me, resetPasswordRequest, resetPasswordConfirm } from "../controllers/auth.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = Router();

// Rotas de autenticação, login, cadastro, troca senha etc 
router.post("/login", login);
router.post("/reset-password", resetPasswordRequest);
router.get("/me", authGuard, me);
router.post("/reset-password/confirm", resetPasswordConfirm);


export default router;
