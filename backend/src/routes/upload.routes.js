import { Router } from "express";
import { importLeagueBalance } from "../controllers/upload.controller.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// Sobe as ligas
router.post("/leagues/import-balance", upload.single("file"), importLeagueBalance);

export default router;

