import { Router } from "express";
import { newNotification, markAsRead } from "../controllers/notification.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = Router();

// Nova notificação
router.get("/new-notification", authGuard, newNotification);

export default router;
