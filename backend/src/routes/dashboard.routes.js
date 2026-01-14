import { Router } from "express";
import { getReceita, getClubes, getRevenueEvolutionByLeague, getRevenues,getRevenuesBreakdown,getPayrollCosts,getCostsBreakdown,getNetResult,getNetResultEvolution,getDebtsBreakdown,getDebtsEvolution,getFinancialIndicators,getAvailableYears} from "../controllers/dashboard.controller.js";

const router = Router();

// GET /dashboard/clubes
router.get("/clubes", getClubes);

// GET /dashboard/receita
router.get("/receita", getReceita);

// GET receita das ligas
router.get("/ligas/receita", getRevenueEvolutionByLeague);


// TODOS OS ENDPOINS PARA DAR GET NA PÁGINA ÚNICA DE CLUBE (COM COMPARATIVOS RSRSR)
// Receitas
router.get("/clubs/:id/financials/revenues", getRevenues);
router.get("/clubs/:id/financials/revenues/breakdown", getRevenuesBreakdown);

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


export default router;
