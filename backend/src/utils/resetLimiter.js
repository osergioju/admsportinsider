import db from  "../config/db.js";
import dayjs from "dayjs";

// Limite por IP fica a cargo do mailRateLimiter (express-rate-limit) na rota
// /auth/reset-password — a tabela password_reset_attempts não tem coluna ip
// e evitamos migração de schema aqui. `ip` é aceito só pra manter a assinatura
// e permitir logging futuro sem quebrar quem já chama essa função.
export async function checkResetLimit(email, ip) {
  const oneHourAgo = dayjs().subtract(1, "hour").toDate();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Lock por e-mail (via hash) pra impedir que duas requisições concorrentes
    // pro mesmo e-mail leiam "0 tentativas" ao mesmo tempo e ambas insiram/passem.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [email]);

    const { rows } = await client.query(
      `SELECT * FROM password_reset_attempts
       WHERE email = $1 AND last_attempt > $2
       ORDER BY last_attempt DESC
       LIMIT 1`,
      [email, oneHourAgo]
    );

    if (rows.length === 0) {
      await client.query(
        `INSERT INTO password_reset_attempts (email, attempts, last_attempt) VALUES ($1, 1, NOW())`,
        [email]
      );
      await client.query("COMMIT");
      return { allowed: true };
    }

    const attempt = rows[0];

    if (attempt.attempts >= 5) {
      await client.query("COMMIT");
      return {
        allowed: false,
        retryAt: dayjs(attempt.last_attempt).add(1, "hour").toISOString()
      };
    }

    await client.query(
      `UPDATE password_reset_attempts
       SET attempts = attempts + 1, last_attempt = NOW()
       WHERE id = $1`,
      [attempt.id]
    );
    await client.query("COMMIT");
    return { allowed: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
