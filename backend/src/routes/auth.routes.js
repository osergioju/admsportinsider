import { Router } from "express";
import { login, me } from "../controllers/auth.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = Router();

// POST /auth/login
router.post("/login", login);
router.get("/me", authGuard, me);

// POST /auth/register
// router.post("/register", register);

export default router;
