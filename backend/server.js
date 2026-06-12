import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import db from  "./src/config/db.js";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import financeiroRoutes from "./src/routes/financeiro.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import stripeRoutes from "./src/routes/stripe.routes.js";
import chartRoutes from "./src/routes/chart.routes.js";
import stripeWebhookRoutes from "./src/routes/stripeWebhook.routes.js";
import currenciesRoutes from "./src/routes/currency.routes.js";
import contactRoutes from "./src/routes/contact.routes.js";
import favoritesRoutes from "./src/routes/favorites.routes.js";

import { multerErrorHandler } from "./src/middlewares/multerErrorHandler.js";
import { startNotificationCron } from "./src/jobs/notificationCron.js";
import { startSubscriptionExpiringCron } from "./src/jobs/subscriptionExpiringCron.js";
 
// Swagger
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Minha API",
      version: "1.0.0",
    },
  },
  apis: [process.cwd() + "/src/routes/*.js"], // onde estão suas rotas
};

const swaggerSpec = swaggerJsdoc(options);

dotenv.config();

// DISABLE_CRONS=true no .env local impede que ambientes de dev
// disparem notificações/assinaturas contra o banco de produção.
// No PM2 em cluster, só a instância 0 roda os crons (NODE_APP_INSTANCE
// é definido pelo PM2; fora dele a var não existe e os crons rodam normal).
const isPrimaryInstance = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === "0";
if (process.env.DISABLE_CRONS !== "true" && isPrimaryInstance) {
  startNotificationCron();
  startSubscriptionExpiringCron();
}

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 CONFIA EM 1 PROXY (NGINX)
app.set("trust proxy", 1);

// ===== CORS =====
const allowedOrigins = [
  "http://localhost:5173",

  "https://sportinsider.com",
  "https://dashboard.sportinsider.com",
  "https://dash.crtcomunicacao.com.br",
  "https://pro.sportinsider.com.br",
  "http://146.190.159.239",
  "https://146.190.159.239",
  "http://146.190.159.239:3000"
];


app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin não permitido pelo CORS"));
    }
  },
  credentials: true,
}));

// ===== WEBHOOK (vem ANTES do express.json()) =====
app.use("/stripe", stripeWebhookRoutes);

// ===== ARQUIVOS ESTÁTICOS =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== JSON NORMAL =====
app.use(express.json());

// Teste banco
db.query("SELECT NOW()")
  .then((res) => console.log("SPORTINSIDER PRO CONNECTED"))
  .catch((err) => console.error("ERROR DATABASE:", err));

// Rotas principais
app.get("/", (req, res) => {
  res.send("API funcionando!");
});
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/financeiro", financeiroRoutes);
app.use("/upload", uploadRoutes);
app.use("/chart", chartRoutes);
app.use("/currency", currenciesRoutes);
app.use("/public", contactRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===== ROTA DE CHECKOUT =====
app.use("/stripe", stripeRoutes);

// 🔴 MIDDLEWARE DE ERRO (SEMPRE NO FINAL)
app.use(multerErrorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
