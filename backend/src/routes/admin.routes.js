import { Router } from "express";
import { getAdminDashboard, deleteCountry, createCountry, getAllCountries,getAllCountriesById, uploadLeagueBalance } from "../controllers/admin.controller.js";

const router = Router();

// GET /admin/dashboard
router.get("/dashboard", getAdminDashboard);

// GET /admin/countries
router.get("/countries", getAllCountries);
router.get("/countries/:id", getAllCountriesById);
router.post("/send-countries", createCountry);
router.delete("/delete-country/:id", deleteCountry);

// IMPORT DO XML - LIGAS
router.post("/leagues/import-balance", uploadLeagueBalance);

export default router;
