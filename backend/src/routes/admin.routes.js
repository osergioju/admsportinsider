import { Router } from "express";
import { getAdminDashboard, disableCountry, createCountry, getAllCountries, getAllLeagues, getAllCountriesById, uploadLeagueBalance, getAllUsers, getUserById, disableUser, enableUser, getAllPlans, changeUserPlan, resendConfirmationEmail, updateUser, updateUserPassword,getLeagueById,createLeague,updateLeague,disableLeague, getAllClubs, getClubById, createClub, updateClub, disableClub} from "../controllers/admin.controller.js";
import { getUsersInsights } from "../controllers/insights.controller.js";
const router = Router();

// GET /admin/dashboard
router.get("/dashboard", getAdminDashboard);

// PAÍSES - GESTÃO CRUD
router.get("/countries", getAllCountries);
router.get("/countries/:id", getAllCountriesById);
router.post("/send-countries", createCountry);
router.delete("/disable-country/:id", disableCountry);

// LIGAS - GESTÃO CRUD
router.get("/leagues", getAllLeagues);
router.get("/leagues/:id", getLeagueById);
router.post("/send-league", createLeague);
router.put("/leagues/:id/update", updateLeague);
router.delete("/disable-league/:id", disableLeague);

// CLUBES - GESTÃO CRUD
router.get("/clubs", getAllClubs);
router.get("/clubs/:id", getClubById);
router.post("/send-club", createClub);
router.put("/clubs/:id/update", updateClub);
router.delete("/disable-club/:id", disableClub);



// USUÁRIOS - GESTÃO
router.get("/users", getAllUsers);
router.post("/users/:id", getUserById);
router.post("/users/:id/disable", disableUser);
router.post("/users/:id/enable", enableUser);
router.post("/users/:id/change-plan", changeUserPlan);
router.put("/users/:id/update", updateUser);
router.post("/users/:id/resend-confirmation", resendConfirmationEmail);
router.get("/insights/users", getUsersInsights);
router.put("/users/:id/update-password", updateUserPassword);

// Pega os planos 
router.get("/plans", getAllPlans);

// IMPORT DO XML - LIGAS
router.post("/leagues/import-balance", uploadLeagueBalance);

export default router;


/***
 * DEPPOS VER SE VAI SER MELHOR DIVIDIR OS CONTROLERS DO ADMIN PQ VAI FICAR ENORME
 */