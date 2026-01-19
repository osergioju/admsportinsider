import { Router } from "express";
import {uploadClubXlsx, getAttributeKeys, createUser, getAdminDashboard, disableCountry, createCountry, getAllCountries, getAllLeagues, getAllCountriesById, getAllUsers, getUserById, disableUser, enableUser, changeUserPlan, resendConfirmationEmail, updateUser, updateUserPassword,getLeagueById,createLeague,updateLeague,disableLeague, getAllClubs, clubsSearch, leaguesSearch, getClubById, createClub, updateClub, disableClub} from "../controllers/admin.controller.js";
import { getUsersInsights } from "../controllers/insights.controller.js";
import { getAllPlans, getPlanById, createPlan, updatePlan, disablePlan } from "../controllers/admin.plans.controller.js";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";
import { uploadImage } from "../middlewares/uploadImage.js";
import { uploadClubLogo } from "../controllers/upload.controller.js";
import { newNotification, listNotifications, updateNotification, deleteNotification } from "../controllers/notification.controller.js";
import { getAllBanners, getBannerById, createBanner, updateBanner, deleteBanner, uploadBannerImage } from "../controllers/banner.controller.js";

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
router.post("/leagues/search", leaguesSearch);

// CLUBES - GESTÃO CRUD
router.get("/clubs", getAllClubs);
router.get("/clubs/:id", getClubById);
router.post("/send-club", createClub);
router.put("/clubs/:id/update", updateClub);
router.delete("/disable-club/:id", disableClub);
router.get("/attribute-keys", getAttributeKeys);
router.post("/import-clubs-xlsx", uploadXlsx, uploadClubXlsx);
router.post("/clubs/search", clubsSearch);


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
router.post("/create-user", createUser); // Criar usuaário 

// Subir foto do clube
router.post("/upload-club-logo",uploadImage,uploadClubLogo);

// PLANOS - CRUD
router.get("/plans", getAllPlans);
router.get("/plans/:id", getPlanById);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", disablePlan);

// Notificações 
router.post("/new-notification", newNotification);
router.get("/notifications", listNotifications);
router.put("/notifications/:id", updateNotification);
router.delete("/notifications/:id", deleteNotification);

// Banners 
// BANNERS
router.get("/banners", getAllBanners);
router.get("/banners/:id", getBannerById);
router.post("/banners", createBanner);
router.put("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);
router.post("/banners/upload-image", uploadImage, uploadBannerImage);

export default router;


/***
 * DEPPOS VER SE VAI SER MELHOR DIVIDIR OS CONTROLERS DO ADMIN PQ VAI FICAR ENORME
 */