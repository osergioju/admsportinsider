import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_ALGORITHM = "HS256";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido nas variáveis de ambiente");
}

// Gera o token de acesso (accessToken)
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM
  });
}

// Verifica se o token é válido
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM]
    });
  } catch (err) {
    return null;
  }
}
