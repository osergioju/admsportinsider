import cron from "node-cron";
import db from  "../config/db.js";

export function startNotificationCron() {
  // roda a cada 1 minuto
  cron.schedule("* * * * *", async () => {
    try {
      // 1️⃣ buscar notificações que precisam ser enviadas
      const { rows: notifications } = await db.query(`
        SELECT id, target
        FROM notifications
        WHERE status = 'scheduled'
          AND send_at <= NOW()
          AND sent_at IS NULL
      `);

      for (const notification of notifications) {
        const { id: notificationId, target } = notification;

        // 2️⃣ entrega para usuários
        if (target === "user" || target === "all") {
          await db.query(`
            INSERT INTO user_notifications (user_id, notification_id)
            SELECT id, $1
            FROM users
            WHERE role = 'user'
            ON CONFLICT DO NOTHING
          `, [notificationId]);
        }

        // 3️⃣ entrega para admins
        if (target === "admin" || target === "all") {
          await db.query(`
            INSERT INTO user_notifications (user_id, notification_id)
            SELECT id, $1
            FROM users
            WHERE role IN ('admin', 'admin_master')
            ON CONFLICT DO NOTHING
          `, [notificationId]);
        }

        // 4️⃣ marca como enviada
        await db.query(`
          UPDATE notifications
          SET sent_at = NOW()
          WHERE id = $1
        `, [notificationId]);
      }

    } catch (error) {
      console.error("Erro no cron de notificações:", error);
    }
  });
}
