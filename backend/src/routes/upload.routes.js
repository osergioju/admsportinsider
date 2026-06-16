import { Router } from "express";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";
import { analyzeXlsx, validateXlsxImport, importLeagueCountry, previewXlsxClubs } from "../controllers/upload.controller.js";
import {
  importMatches, importPlayers, importTeams,
  previewTeams, previewMatches, previewPlayers,
  previewLeaguesBulk, importLeaguesBulk,
  deleteTeamStats,
  deleteMatches,
  countMatches,
} from "../controllers/import.controller.js";
import { adminGuard } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(adminGuard);

// analiza pra criar os mapas 
router.post("/xlsx/analyze", uploadXlsx, analyzeXlsx);

// Valida os dados pra subir 
router.post("/xlsx/validate", uploadXlsx, validateXlsxImport);

// Preview clubes do XLSX (resolve match por slug/nome, retorna não-encontrados)
router.post("/xlsx/preview-clubs", uploadXlsx, previewXlsxClubs);

// Importa tudo, tanto liga quanto clube
router.post("/xlsx/import-country", uploadXlsx, importLeagueCountry);

// Preview — analisam o CSV e retornam dados para mapeamento no front
router.post("/import/teams/preview",   uploadXlsx, previewTeams);
router.post("/import/matches/preview", uploadXlsx, previewMatches);
router.post("/import/players/preview", uploadXlsx, previewPlayers);

// Import real
router.post("/import/teams",   uploadXlsx, importTeams);
router.post("/import/players", uploadXlsx, importPlayers);
router.post("/import/matches", uploadXlsx, importMatches);

// Bulk leagues (CSV ponto-e-vírgula)
router.post("/import/leagues/preview", uploadXlsx, previewLeaguesBulk);
router.post("/import/leagues",         uploadXlsx, importLeaguesBulk);

// Apaga stats de times de uma liga+temporada
router.delete("/import/teams/:leagueId/seasons/:year", deleteTeamStats);

// Conta partidas existentes de uma liga+temporada (p/ perguntar "substituir?")
router.get("/import/matches/:leagueId/seasons/:year/count", countMatches);

// Apaga partidas de uma liga+temporada
router.delete("/import/matches/:leagueId/seasons/:year", deleteMatches);

export default router;
