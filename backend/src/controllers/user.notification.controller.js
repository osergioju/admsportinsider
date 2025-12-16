import { db } from "../config/db.js";

export const getNotifications = async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `
      SELECT
        un.id,
        n.title,
        n.message,
        un.read_at,
        un.created_at
      FROM user_notifications un
      JOIN notifications n ON n.id = un.notification_id
      WHERE un.user_id = $1
      ORDER BY un.created_at DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar notificações" });
  }
};


export const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const { rowCount } = await db.query(
      `
      UPDATE user_notifications
      SET read_at = NOW()
      WHERE id = $1
        AND user_id = $2
        AND read_at IS NULL
      `,
      [id, userId]
    );

    // se não atualizou nada:
    if (rowCount === 0) {
      return res.status(200).json({
        message: "Notificação já lida ou inexistente."
      });
    }

    return res.status(200).json({
      message: "Notificação marcada como lida."
    });

  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);

    return res.status(500).json({
      error: "Erro ao marcar notificação como lida."
    });
  }
};

