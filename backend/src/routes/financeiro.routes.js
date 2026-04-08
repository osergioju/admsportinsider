import { Router } from "express";
import { getFinanceOverview } from "../controllers/financeiro.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /financeiro/overview
router.get("/overview", authGuard, getFinanceOverview);

export default router;
