import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getPublicChartData } from "../controllers/chartDefinitions.controller.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMBED_DIR = path.resolve(__dirname, "../../public/embed");

const router = Router();

// GET /public/charts/:token/data — dados do gráfico pro script de embed.
router.get("/charts/:token/data", getPublicChartData);

export default router;
export { EMBED_DIR };
