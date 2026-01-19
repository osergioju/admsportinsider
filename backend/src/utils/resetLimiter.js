import db from  from "../config/db.js";
import dayjs from "dayjs";

export async function checkResetLimit(email, ip) {
  const oneHourAgo = dayjs().subtract(1, "hour").toDate();

  // Buscar tentativas recentes desse email
  const result = await db.query(
    `SELECT * FROM password_reset_attempts 
     WHERE email = $1 AND last_attempt > $2`,
    [email, oneHourAgo]
  );

  // Se não existe → cria um registro novo
  if (result.rows.length === 0) {
    await db.query(
      `INSERT INTO password_reset_attempts (email, attempts) VALUES ($1, 1)`,
      [email]
    );

    return { allowed: true };
  }

  const attempt = result.rows[0];

  // Se ultrapassou 5 tentativas → bloqueia
  if (attempt.attempts >= 5) {
    return {
      allowed: false,
      retryAt: dayjs(attempt.last_attempt).add(1, "hour").toISOString()
    };
  }

  // Atualiza tentativa
  await db.query(
    `UPDATE password_reset_attempts
     SET attempts = attempts + 1, last_attempt = NOW()
     WHERE id = $1`,
    [attempt.id]
  );

  return { allowed: true };
}
