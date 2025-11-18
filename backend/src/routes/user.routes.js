import { Router } from "express";
import { getProfile } from "../controllers/user.controller.js";

const router = Router();

// GET /user/profile
router.get("/profile", getProfile);

export default router;
