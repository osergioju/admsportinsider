import { Router } from "express";
import { getReceita, getClubes } from "../controllers/dashboard.controller.js";

const router = Router();

// GET /dashboard/clubes
router.get("/clubes", getClubes);

// GET /dashboard/receita
router.get("/receita", getReceita);

export default router;
