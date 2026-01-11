// middlewares/auth.middleware.js
import { verifyAccessToken } from "../config/jwt.js";

export function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não informado" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token malformado" });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }

  req.user = decoded;
  return next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    req.user = null;
    return next();
  }

  const decoded = verifyAccessToken(token);
  req.user = decoded || null;

  return next();
}
