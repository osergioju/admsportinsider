import { Router } from "express";
import {
   getReceita,
   getClubes,
   getRevenueEvolutionByLeague,
   getCountries,
   countriesSearch,
   playersSearch,
   getCountryDetail,

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
   getAvailableCurrencies,

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
   getLeagueAvailableYears,
   getLeagueAvailableCurrencies

} from "../controllers/dashboard.controller.js";
import { authGuard, optionalAuth } from "../middlewares/auth.middleware.js";

import { createFavorite, listFavorites } from "../controllers/dashboardFavorites.controller.js";
import { getClubCompetitions, getClubPlayers, getPlayerDetail, searchPlayers, getPlayerCountries, getLeagueSports, getMatchDetail } from "../controllers/sports.controller.js";
import { financialContext } from "../middlewares/financialContext.middleware.js";
import { clubsGroupedByCountry, clubsSearch, getClubById, getLeagueById, leaguesSearch, getContinentalLeagues, getDashboardFederations, getDashboardFederationBySlug } from "../controllers/admin.controller.js";
import { getFederationCycleFinancials, getLeagueCycleFinancials } from "../controllers/federationFinancial.controller.js";

const router = Router();

/* ===============================
   DASHBOARD GERAL
================================ */

// GET /dashboard/clubes
router.get("/clubes", optionalAuth, getClubes);

// GET /dashboard/countries
router.get("/countries", optionalAuth, getCountries);
router.post("/countries/search", optionalAuth, countriesSearch);
router.get("/countries/:id", optionalAuth, getCountryDetail);

// GET /dashboard/receita
router.get("/receita", optionalAuth, getReceita);

// GET /dashboard/ligas/receita
router.get("/ligas/receita", optionalAuth, getRevenueEvolutionByLeague);

// POST /busca jogadores
router.post("/players/search", optionalAuth, playersSearch);


/* ===============================
   CLUBS — LISTAGEM PÚBLICA
================================ */

router.get("/clubs", clubsGroupedByCountry);
router.post("/clubs/search", clubsSearch);
router.get("/clubs/:id/info", getClubById);

/* ===============================
   CLUBS — PÁGINA ÚNICA
================================ */

// Receitas
router.get("/clubs/:id/financials/revenues", optionalAuth, financialContext, getRevenues);
router.get("/clubs/:id/financials/revenues/breakdown", optionalAuth, financialContext, getRevenuesBreakdown);

// Custos
router.get("/clubs/:id/financials/costs/payroll", optionalAuth, financialContext, getPayrollCosts);
router.get("/clubs/:id/financials/costs/breakdown", optionalAuth, financialContext, getCostsBreakdown);

// Resultado líquido
router.get("/clubs/:id/financials/net-result", optionalAuth, financialContext, getNetResult);
router.get("/clubs/:id/financials/net-result/evolution", optionalAuth, financialContext, getNetResultEvolution);

// Dívidas
router.get("/clubs/:id/financials/debts/breakdown", optionalAuth, financialContext, getDebtsBreakdown);
router.get("/clubs/:id/financials/debts/evolution", optionalAuth, financialContext, getDebtsEvolution);

// Indicadores financeiros
router.get("/clubs/:id/financials/indicators", optionalAuth, financialContext, getFinancialIndicators);

// Anos disponíveis
router.get("/clubs/:id/financials/available-years", optionalAuth, financialContext, getAvailableYears);

// Moedas disponíveis para conversão (apenas pares com dados de taxa)
router.get("/clubs/:id/financials/currencies", optionalAuth, getAvailableCurrencies);


router.get("/leagues/continental", getContinentalLeagues);
router.get("/leagues/:id/cycle-financials", getLeagueCycleFinancials);

// FEDERAÇÕES
router.get("/federations", getDashboardFederations);
router.get("/federations/:slug", getDashboardFederationBySlug);
router.get("/federations/:slug/cycle-financials", getFederationCycleFinancials);
router.get("/leagues/:id/info", getLeagueById);
router.post("/leagues/search", leaguesSearch);

/* ===============================
   LEAGUES — PÁGINA ÚNICA
   (mesma estrutura dos clubes)
================================ */

// Receitas
router.get("/leagues/:id/financials/revenues", optionalAuth, financialContext, getLeagueRevenues);
router.get("/leagues/:id/financials/revenues/breakdown", optionalAuth, financialContext, getLeagueRevenuesBreakdown);

// Custos
router.get("/leagues/:id/financials/costs/payroll", optionalAuth, financialContext, getLeaguePayrollCosts);
router.get("/leagues/:id/financials/costs/breakdown", optionalAuth, financialContext, getLeagueCostsBreakdown);

// Resultado líquido
router.get("/leagues/:id/financials/net-result", optionalAuth, financialContext, getLeagueNetResult);
router.get("/leagues/:id/financials/net-result/evolution", optionalAuth, financialContext, getLeagueNetResultEvolution);

// Dívidas
router.get("/leagues/:id/financials/debts/breakdown", optionalAuth, financialContext, getLeagueDebtsBreakdown);
router.get("/leagues/:id/financials/debts/evolution", optionalAuth, financialContext, getLeagueDebtsEvolution);

// Indicadores financeiros
router.get("/leagues/:id/financials/indicators", optionalAuth, financialContext, getLeagueFinancialIndicators);

// Anos disponíveis
router.get("/leagues/:id/financials/available-years", optionalAuth, financialContext, getLeagueAvailableYears);

// Moedas disponíveis para conversão
router.get("/leagues/:id/financials/currencies", optionalAuth, getLeagueAvailableCurrencies);


/* ===============================
   SPORTS — DADOS ESPORTIVOS
================================ */

// Listagem global de jogadores
router.get("/players", optionalAuth, searchPlayers);

// Países com jogadores (deve ficar antes de /players/:id)
router.get("/players/countries", optionalAuth, getPlayerCountries);

// Competições + tabela + stats do clube
router.get("/clubs/:id/sports/competitions", optionalAuth, getClubCompetitions);

// Elenco do clube na temporada
router.get("/clubs/:id/sports/players", optionalAuth, getClubPlayers);

// Detalhe do jogador
router.get("/players/:id", optionalAuth, getPlayerDetail);

// Liga esportivo (classificação + partidas)
router.get("/leagues/:id/sports", optionalAuth, getLeagueSports);

// Detalhe de partida
router.get("/matches/:id", optionalAuth, getMatchDetail);


// Favortiressss
router.post("/favorites", authGuard, createFavorite);
router.get("/favorites", authGuard, listFavorites);

export default router;
