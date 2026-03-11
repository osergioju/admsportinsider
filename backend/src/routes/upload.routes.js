import { Router } from "express";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";
import { analyzeXlsx, validateXlsxImport, importLeagueCountry } from "../controllers/upload.controller.js";
import { importMatches, importPlayers } from "../controllers/import.controller.js";

const router = Router();

// analiza pra criar os mapas 
router.post("/xlsx/analyze", uploadXlsx, analyzeXlsx);

// Valida os dados pra subir 
router.post("/xlsx/validate", uploadXlsx, validateXlsxImport);

// Importa tudo, tanto liga quanto clube
router.post( "/xlsx/import-country", uploadXlsx, importLeagueCountry);

// Importar estatísticas de clubes (teams.csv)
//router.post("/import/teams", uploadXlsx, importTeams);

// Importar estatísticas de jogadores (players.csv)
router.post("/import/players", uploadXlsx, importPlayers);

// Importar partidas (matches.csv)importMatches
router.post("/import/matches", uploadXlsx, importMatches);

export default router;
