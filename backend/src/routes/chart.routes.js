import { Router } from "express";
import { getCountries, getClubsByCountry, getLeaguesByCountry , getRevenuesChart} from "../controllers/chart.controller.js";

const router = Router();

// GET /Países
router.get("/countries", getCountries);

// GET /Ligas
router.get( "/countries/:id_country/leagues", getLeaguesByCountry);

// GET /Clubes
router.get("/countries/:id_country/clubs", getClubsByCountry);

// GET /chart/revenues
router.post("/revenues", getRevenuesChart);

export default router;
