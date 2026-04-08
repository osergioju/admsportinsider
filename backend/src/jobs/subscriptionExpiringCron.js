import cron from "node-cron";
import db from "../config/db.js";
import { sendSubscriptionExpiringEmail, sendSubscriptionEndedEmail } from "../utils/mailer.js";

/**
 * Roda diariamente às 9h.
 * Duas responsabilidades:
 *
 * 1. LEMBRETE — envia e-mail para usuários com cancel_at_period_end = true
 *    cujo plano encerra entre 2 e 3 dias a partir de agora.
 *
 * 2. SEGURANÇA — faz downgrade local para quem já passou da data e o webhook
 *    do Stripe não chegou (customer.subscription.deleted falhou na entrega).
 */
export function startSubscriptionExpiringCron() {
  const cronExpression = process.env.NODE_ENV === "production" ? "0 9 * * *" : "* * * * *";
  cron.schedule(cronExpression, async () => {

    // ── 1. Lembrete de expiração ─────────────────────────────────────────────
    console.log("[subscriptionExpiringCron] Verificando assinaturas prestes a expirar...");
    try {
      const { rows: expiring } = await db.query(`
        SELECT u.name, u.email, p.name AS plan_name, u.subscription_current_period_end
        FROM users u
        JOIN plans p ON p.id = u.plan_id
        WHERE u.cancel_at_period_end = true
          AND u.subscription_current_period_end >= NOW() + interval '2 days'
          AND u.subscription_current_period_end <  NOW() + interval '3 days'
      `);

      console.log(`[subscriptionExpiringCron] ${expiring.length} usuário(s) prestes a expirar.`);

      for (const user of expiring) {
        try {
          await sendSubscriptionExpiringEmail(user.email, {
            name: user.name,
            planName: user.plan_name,
            periodEnd: user.subscription_current_period_end,
          });
          console.log(`[subscriptionExpiringCron] Lembrete enviado para: ${user.email}`);
        } catch (err) {
          console.error(`[subscriptionExpiringCron] Falha ao enviar lembrete para ${user.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error("[subscriptionExpiringCron] Erro na query de lembrete:", err.message);
    }

    // ── 2. Segurança — downgrade para quem o webhook não chegou ──────────────
    console.log("[subscriptionExpiringCron] Verificando assinaturas expiradas sem downgrade...");
    try {
      const { rows: expired } = await db.query(`
        SELECT u.id, u.name, u.email
        FROM users u
        WHERE u.cancel_at_period_end = true
          AND u.subscription_current_period_end < NOW()
          AND u.plan_id != 1
      `);

      console.log(`[subscriptionExpiringCron] ${expired.length} usuário(s) com downgrade pendente.`);

      for (const user of expired) {
        try {
          await db.query(`
            UPDATE users SET
              plan_id = 1,
              subscription_status = 'canceled',
              stripe_subscription_id = NULL,
              stripe_price_id = NULL,
              cancel_at_period_end = false,
              subscription_current_period_end = NULL
            WHERE id = $1
          `, [user.id]);

          await sendSubscriptionEndedEmail(user.email, { name: user.name });

          console.log(`[subscriptionExpiringCron] Downgrade aplicado + e-mail enviado para: ${user.email}`);
        } catch (err) {
          console.error(`[subscriptionExpiringCron] Falha no downgrade de ${user.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error("[subscriptionExpiringCron] Erro na query de downgrade:", err.message);
    }

  });
}
