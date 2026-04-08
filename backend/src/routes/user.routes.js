import { Router } from "express";
import { updatePassword, getProfile, updateProfile, addPreferences, updatePreferences, getRegions, getCurrencies, getFaqs, getCommonTranslations } from "../controllers/user.controller.js";
import { getNotifications, markAsRead, getUnreadCount, markAllAsRead } from "../controllers/user.notification.controller.js";
import { getRelatorios, getRelatorioById, getNotas } from "../controllers/user.relatorios.controller.js";
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

// Faq
router.get("/faq", getFaqs);

/**
 * @swagger
 * /user/translations:
 *   get:
 *     summary: Retorna as traduções dos termos comuns para o locale do usuário logado
 *     description: |
 *       Lê o `region_id` das preferências do usuário, resolve o `locale` (ex: `en-US`, `ES`)
 *       e retorna um objeto chave-valor com todos os `common_terms` traduzidos.
 *       Se não houver tradução cadastrada para o locale, cai automaticamente para `name_pt`.
 *       Se o usuário não tiver região salva, retorna em `pt-BR`.
 *
 *       **Uso no frontend:**
 *       ```js
 *       const { t } = useTranslation();
 *       t("menu.home")           // → "Home page" (en-US) | "Página inicial" (pt-BR)
 *       t("menu.clubs", "Clubes") // → tradução ou fallback hardcoded
 *       ```
 *
 *       **Codes disponíveis hoje (common_terms):**
 *       | code | pt-BR |
 *       |------|-------|
 *       | menu.home | Página inicial |
 *       | menu.leagues | Ligas |
 *       | menu.clubs | Clubes |
 *       | menu.players | Jogadores |
 *       | menu.reports | Relatórios |
 *       | menu.profile | Perfil |
 *       | menu.financial | Financeiro |
 *       | menu.faq | Perguntas frequentes |
 *       | menu.contact | Fale conosco |
 *       | menu.logout | Sair |
 *
 *       Novos termos devem ser inseridos na tabela `common_terms` pelo admin
 *       e traduzidos na aba **Regiões → Termos comuns**.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mapa de traduções resolvido para o locale do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *             example:
 *               menu.home: "Home page"
 *               menu.leagues: "Leagues"
 *               menu.clubs: "Clubs"
 *               menu.players: "Players"
 *               menu.reports: "Reports"
 *               menu.profile: "Profile"
 *               menu.financial: "Finances"
 *               menu.faq: "FAQ"
 *               menu.contact: "Contact us"
 *               menu.logout: "Logout"
 *       401:
 *         description: Token não informado ou inválido
 *       500:
 *         description: Erro interno
 */
router.get("/translations", getCommonTranslations);

// Importar seus middlewares já existentes de autenticação, se necessário:
// const { authMiddleware } = require("../middlewares/authMiddleware");

// GET /user/relatorios?first=12&after=cursor
router.get("/relatorios", getRelatorios);
router.get("/notas", getNotas);

// GET /user/relatorios/:id
router.get("/relatorios/:id", getRelatorioById);



export default router;
