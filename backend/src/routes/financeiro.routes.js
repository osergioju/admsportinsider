import { Router } from "express";
import { getFinanceOverview } from "../controllers/financeiro.controller.js";

const router = Router();

// GET /financeiro/overview
router.get("/overview", getFinanceOverview);

export default router;
