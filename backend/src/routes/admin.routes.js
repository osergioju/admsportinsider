import { Router } from "express";
import { getAdminDashboard, getAllCountries, uploadLeagueBalance } from "../controllers/admin.controller.js";

const router = Router();

// GET /admin/dashboard
router.get("/dashboard", getAdminDashboard);

// GET /admin/countries
router.get("/countries", getAllCountries);


// IMPORT DO XML - LIGAS
router.post("/leagues/import-balance", uploadLeagueBalance);

export default router;
