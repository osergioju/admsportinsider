import { Router } from "express";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";
import { analyzeXlsx, validateXlsxImport, importLeagueCountry } from "../controllers/upload.controller.js";
import {
  importMatches, importPlayers, importTeams,
  previewTeams, previewMatches, previewPlayers,
} from "../controllers/import.controller.js";
import { adminGuard } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(adminGuard);

// analiza pra criar os mapas 
router.post("/xlsx/analyze", uploadXlsx, analyzeXlsx);

// Valida os dados pra subir 
router.post("/xlsx/validate", uploadXlsx, validateXlsxImport);

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

export default router;
