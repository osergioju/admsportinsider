import cron from "node-cron";
import db from "../config/db.js";

let isRunning = false;

export function startNotificationCron() {
  cron.schedule("* * * * *", async () => {
    // 🔒 evita overlap se uma execução demorar mais que 1 minuto
    if (isRunning) {
      console.warn("[notificationCron] execução anterior ainda rodando, pulando");
      return;
    }
    isRunning = true;

    const client = await db.connect();
    try {
      // 1️⃣ claim atômico: marca como "processing" e devolve só as que conseguiu pegar
      //    (FOR UPDATE SKIP LOCKED garante que múltiplos workers nunca peguem a mesma)
      await client.query("BEGIN");

      const { rows: notifications } = await client.query(`
        UPDATE notifications
        SET sent_at = NOW()
        WHERE id IN (
          SELECT id FROM notifications
          WHERE status = 'scheduled'
            AND send_at <= NOW()
            AND sent_at IS NULL
          ORDER BY send_at
          LIMIT 500
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id, target
      `);

      if (notifications.length === 0) {
        await client.query("COMMIT");
        return;
      }

      // 2️⃣ separa por target em uma passada
      const userIds = notifications.filter(n => n.target === "user" || n.target === "all").map(n => n.id);
      const adminIds = notifications.filter(n => n.target === "admin" || n.target === "all").map(n => n.id);

      // 3️⃣ insere tudo em batch (1 query por grupo, não N)
      if (userIds.length) {
        await client.query(`
          INSERT INTO user_notifications (user_id, notification_id)
          SELECT u.id, n.id
          FROM users u
          CROSS JOIN unnest($1::int[]) AS n(id)
          WHERE u.role = 'user'
          ON CONFLICT DO NOTHING
        `, [userIds]);
      }

      if (adminIds.length) {
        await client.query(`
          INSERT INTO user_notifications (user_id, notification_id)
          SELECT u.id, n.id
          FROM users u
          CROSS JOIN unnest($1::int[]) AS n(id)
          WHERE u.role IN ('admin', 'admin_master')
          ON CONFLICT DO NOTHING
        `, [adminIds]);
      }

      await client.query("COMMIT");
      console.log(`[notificationCron] ${notifications.length} notificação(ões) processada(s)`);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => { });
      console.error("[notificationCron] erro:", error.message);
    } finally {
      client.release();
      isRunning = false;
    }
  });
}