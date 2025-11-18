import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./src/config/db.js";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import financeiroRoutes from "./src/routes/financeiro.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
const allowedOrigins = [
  "http://localhost:5173",          // seu frontend dev
  "https://sportinsider.com",       // seu frontend produção
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
app.use(express.json());

// Teste banco
db.query("SELECT NOW()")
  .then((res) => console.log("Conectado ao banco:", res.rows[0].now))
  .catch((err) => console.error("Erro ao conectar no banco:", err));

// Rota raiz
app.get("/", (req, res) => {
  res.send("API funcionando!");
});

// Rotas principais
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/financeiro", financeiroRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
