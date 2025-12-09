import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/user.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica a proteção em todas as rotas deste arquivo
router.use(authGuard);

// GET /user/profile
router.get("/profile", getProfile);

// PUT /user/profile
router.put("/profile", updateProfile);

export default router;
