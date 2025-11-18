import bcrypt from "bcryptjs";
import { findUserByEmail } from "../models/user.model.js";
import { generateAccessToken } from "../config/jwt.js";
import { db } from "../config/db.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuário no banco
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "O e-mail informado não pertence a nenhuma conta" });
    }

    // 2. Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas 2" });
    }

    // 3. Gerar JWT
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 4. Atualizar last_login
    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
      [user.id]
    );

    return res.json({
      message: "Login efetuado com sucesso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// Check no middleware pra ver quem sou eu
export const me = async (req, res) => {
  try {
    return res.json({
      authenticated: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno" });
  }
};
