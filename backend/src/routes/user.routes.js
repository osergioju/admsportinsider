import { Router } from "express";
import { updatePassword, getProfile, updateProfile, addPreferences,updatePreferences, getRegions, getCurrencies} from "../controllers/user.controller.js";
import { getNotifications, markAsRead, getUnreadCount, markAllAsRead } from "../controllers/user.notification.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica a proteção em todas as rotas deste arquivo
router.use(authGuard);

// Atualizar e ver perfil
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Preferências
router.post("/preferences", addPreferences);
router.put("/preferences", updatePreferences);

// Pega regiòes e moedas
router.get('/regions', getRegions);
router.get('/currencies', getCurrencies);

// Notificações 
router.get("/notifications", getNotifications);
router.get("/notifications/unread/count", getUnreadCount);
router.patch("/notifications/:id/read", markAsRead);
router.patch("/notifications/read-all", markAllAsRead);

// Alterar senha 
router.put("/security/password", updatePassword);

export default router;
