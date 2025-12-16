import { Router } from "express";
import { newNotification, markAsRead } from "../controllers/notification.controller.js";

const router = Router();

// Nova notificação
router.get("/new-notification", newNotification);

export default router;
