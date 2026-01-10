import { Router } from "express";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";
import { importClubBalance } from "../controllers/upload.controller.js";

const router = Router();

// Sobe as ligas

// Sobe os clubes
router.post("/clubs/import-balance", uploadXlsx, importClubBalance);

export default router;

 