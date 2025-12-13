import express from "express";
import cors from "cors";
import { db } from "./src/config/db.js";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import financeiroRoutes from "./src/routes/financeiro.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import stripeRoutes from "./src/routes/stripe.routes.js";
import stripeWebhookRoutes from "./src/routes/stripeWebhook.routes.js";


const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORS =====
const allowedOrigins = [
  "http://localhost:5173",
  "https://sportinsider.com",
  "https://dashboard.sportinsider.com"
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

// ===== JSON NORMAL =====
app.use(express.json());

// Teste banco
db.query("SELECT NOW()")
  .then((res) => console.log("Conectado ao banco:", res.rows[0].now))
  .catch((err) => console.error("Erro ao conectar no banco:", err));

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

// ===== ROTA DE CHECKOUT =====
app.use("/stripe", stripeRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});