import db from  "../config/db.js";

/**
 * LISTAR NOTIFICAÇÕES COM PAGINAÇÃO
 */
export const getNotifications = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

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
      LIMIT $2 OFFSET $3
      `,
      [userId, pageSize, offset]
    );

    const totalResult = await db.query(
      `SELECT COUNT(*) FROM user_notifications WHERE user_id = $1`,
      [userId]
    );

    const total = parseInt(totalResult.rows[0].count);

    return res.status(200).json({
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: offset + rows.length < total
      }
    });

  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return res.status(500).json({ error: "Erro ao buscar notificações" });
  }
};


/**
 * MARCAR UMA NOTIFICAÇÃO COMO LIDA
 */
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


/**
 * CONTADOR DE NÃO LIDAS
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT COUNT(*) 
      FROM user_notifications
      WHERE user_id = $1
      AND read_at IS NULL
      `,
      [userId]
    );

    return res.status(200).json({
      unread: parseInt(result.rows[0].count)
    });

  } catch (error) {
    console.error("Erro ao contar notificações:", error);
    return res.status(500).json({ error: "Erro ao contar notificações" });
  }
};


/**
 * MARCAR TODAS COMO LIDAS
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
      UPDATE user_notifications
      SET read_at = NOW()
      WHERE user_id = $1
      AND read_at IS NULL
      `,
      [userId]
    );

    return res.status(200).json({
      message: "Todas as notificações marcadas como lidas",
      updated: result.rowCount
    });

  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    return res.status(500).json({
      error: "Erro ao marcar notificações"
    });
  }
};
