import { Router } from "express";
import { getReceita, getClubes, getRevenueEvolutionByLeague} from "../controllers/dashboard.controller.js";

const router = Router();

// GET /dashboard/clubes
router.get("/clubes", getClubes);

// GET /dashboard/receita
router.get("/receita", getReceita);

// GET receita das ligas
router.get("/ligas/receita", getRevenueEvolutionByLeague);

export default router;
