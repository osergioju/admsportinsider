import { Router } from "express";
import {
  getReceita,
  getClubes,
  getRevenueEvolutionByLeague,

  // CLUBS
  getRevenues,
  getRevenuesBreakdown,
  getPayrollCosts,
  getCostsBreakdown,
  getNetResult,
  getNetResultEvolution,
  getDebtsBreakdown,
  getDebtsEvolution,
  getFinancialIndicators,
  getAvailableYears,

  // LEAGUES (mesmos dados, outra entidade)
  getLeagueRevenues,
  getLeagueRevenuesBreakdown,
  getLeaguePayrollCosts,
  getLeagueCostsBreakdown,
  getLeagueNetResult,
  getLeagueNetResultEvolution,
  getLeagueDebtsBreakdown,
  getLeagueDebtsEvolution,
  getLeagueFinancialIndicators,
  getLeagueAvailableYears

} from "../controllers/dashboard.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

import {
  createFavorite,
  listFavorites
} from "../controllers/dashboardFavorites.controller.js";

const router = Router();

/* ===============================
   DASHBOARD GERAL
================================ */

// GET /dashboard/clubes
router.get("/clubes", getClubes);

// GET /dashboard/receita
router.get("/receita", getReceita);

// GET /dashboard/ligas/receita
router.get("/ligas/receita", getRevenueEvolutionByLeague);


/* ===============================
   CLUBS — PÁGINA ÚNICA
================================ */

// Receitas
router.get("/clubs/:id/financials/revenues", getRevenues);
router.get("/clubs/:id/financials/revenues/breakdown", authGuard, getRevenuesBreakdown);

// Custos
router.get("/clubs/:id/financials/costs/payroll", getPayrollCosts);
router.get("/clubs/:id/financials/costs/breakdown", getCostsBreakdown);

// Resultado líquido
router.get("/clubs/:id/financials/net-result", getNetResult);
router.get("/clubs/:id/financials/net-result/evolution", getNetResultEvolution);

// Dívidas
router.get("/clubs/:id/financials/debts/breakdown", getDebtsBreakdown);
router.get("/clubs/:id/financials/debts/evolution", getDebtsEvolution);

// Indicadores financeiros
router.get("/clubs/:id/financials/indicators", getFinancialIndicators);

// Anos disponíveis
router.get("/clubs/:id/financials/available-years", getAvailableYears);


/* ===============================
   LEAGUES — PÁGINA ÚNICA
   (mesma estrutura dos clubes)
================================ */

// Receitas
router.get("/leagues/:id/financials/revenues", getLeagueRevenues);
router.get("/leagues/:id/financials/revenues/breakdown", getLeagueRevenuesBreakdown);

// Custos
router.get("/leagues/:id/financials/costs/payroll", getLeaguePayrollCosts);
router.get("/leagues/:id/financials/costs/breakdown", getLeagueCostsBreakdown);

// Resultado líquido
router.get("/leagues/:id/financials/net-result", getLeagueNetResult);
router.get("/leagues/:id/financials/net-result/evolution", getLeagueNetResultEvolution);

// Dívidas
router.get("/leagues/:id/financials/debts/breakdown", getLeagueDebtsBreakdown);
router.get("/leagues/:id/financials/debts/evolution", getLeagueDebtsEvolution);

// Indicadores financeiros
router.get("/leagues/:id/financials/indicators", getLeagueFinancialIndicators);

// Anos disponíveis
router.get("/leagues/:id/financials/available-years", getLeagueAvailableYears);


// Favortiressss 
router.post("/favorites", createFavorite);
router.get("/favorites", listFavorites);

export default router;
