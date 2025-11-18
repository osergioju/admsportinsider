import { Router } from "express";
import { getAdminDashboard } from "../controllers/admin.controller.js";

const router = Router();

// GET /admin/dashboard
router.get("/dashboard", getAdminDashboard);

export default router;
