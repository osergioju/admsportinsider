import { Router } from "express";
import { getAdminDashboard, deleteCountry, createCountry, getAllCountries, getAllCountriesById, uploadLeagueBalance, getAllUsers, getUserById, disableUser, enableUser, getAllPlans, changeUserPlan, resendConfirmationEmail } from "../controllers/admin.controller.js";

const router = Router();

// GET /admin/dashboard
router.get("/dashboard", getAdminDashboard);

// PAÍSES - GESTÃO
router.get("/countries", getAllCountries);
router.get("/countries/:id", getAllCountriesById);
router.post("/send-countries", createCountry);
router.delete("/delete-country/:id", deleteCountry);

// USUÁRIOS - GESTÃO
router.get("/users", getAllUsers);
router.post("/users/:id", getUserById);
router.post("/users/:id/disable", disableUser);
router.post("/users/:id/enable", enableUser);
router.post("/users/:id/change-plan", changeUserPlan);
router.post("/users/:id/resend-confirmation", resendConfirmationEmail);

// Pega os planos 
router.get("/plans", getAllPlans);

// IMPORT DO XML - LIGAS
router.post("/leagues/import-balance", uploadLeagueBalance);

export default router;


/***
 * DEPPOS VER SE VAI SER MELHOR DIVIDIR OS CONTROLERS DO ADMIN PQ VAI FICAR ENORME
 */