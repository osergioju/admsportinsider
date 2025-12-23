import { Router } from "express";
import { updatePassword, getProfile, updateProfile, getPreferences, updatePreferences } from "../controllers/user.controller.js";
import { getNotifications, markAsRead, getUnreadCount, markAllAsRead } from "../controllers/user.notification.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica a proteção em todas as rotas deste arquivo
router.use(authGuard);

// Atualizar e ver perfil
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Preferências
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

// Notificações 
router.get("/notifications", getNotifications);
router.get("/notifications/unread/count", getUnreadCount);
router.patch("/notifications/:id/read", markAsRead);
router.patch("/notifications/read-all", markAllAsRead);

// Alterar senha 
router.put("/security/password", updatePassword);

export default router;
