import { Router } from "express";
import { getFavorites, toggleFavorite } from "../controllers/favorites.controller.js"; // ajuste o caminho
import { authGuard } from "../middlewares/auth.middleware.js";

const router = Router();

//
router.get("/all", authGuard, getFavorites);
router.post("/toggle", authGuard, toggleFavorite);

export default router;

// No seu arquivo de rotas principal, registre assim:
// app.use("/dashboard/favorites", favoritesRouter);