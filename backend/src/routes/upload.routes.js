import { Router } from "express";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";
import { analyzeXlsx, validateXlsxImport, importLeagueCountry, importCompetitionStats, importPlayerStats, importMatchStats } from "../controllers/upload.controller.js";

const router = Router();

// analiza pra criar os mapas 
router.post("/xlsx/analyze", uploadXlsx, analyzeXlsx);

// Valida os dados pra subir 
router.post("/xlsx/validate", uploadXlsx, validateXlsxImport);

// Importa tudo, tanto liga quanto clube
router.post( "/xlsx/import-country", uploadXlsx, importLeagueCountry);

// Importar o dado da competição 
router.post("/xlsx/import-competition-stats", uploadXlsx, importCompetitionStats);

// Importar jogadores
router.post("/xlsx/import-player-stats", uploadXlsx, importPlayerStats);

// Imprtar estatísticas da partida
router.post("/xlsx/import-match-stats",uploadXlsx,importMatchStats);
export default router;
