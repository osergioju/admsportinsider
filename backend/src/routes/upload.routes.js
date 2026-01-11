import { Router } from "express";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";
import { analyzeXlsx, validateXlsxImport, importLeagueCountry } from "../controllers/upload.controller.js";

const router = Router();

// analiza pra criar os mapas 
router.post("/xlsx/analyze", uploadXlsx, analyzeXlsx);

// Valida os dados pra subir 
router.post("/xlsx/validate", uploadXlsx, validateXlsxImport);

// Importa tudo, tanto liga quanto clube
router.post( "/xlsx/import-country", uploadXlsx, importLeagueCountry);

export default router;
