import db from  from "../config/db.js";

// Criar as notificações
export const newNotification = async (req, res) => {
  const { title, message, target, status, send_at } = req.body;

  try {
    if (!title || !message) {
      return res.status(400).json({
        error: "Título e mensagem são obrigatórios."
      });
    }

    const sendAtUtc = send_at
      ? new Date(`${send_at}:00-03:00`).toISOString()
      : null;

    await db.query(
      `
      INSERT INTO notifications (
        title,
        message,
        target,
        status,
        send_at
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        title,
        message,
        target || "all",
        status || "draft",
        sendAtUtc
      ]
    );

    return res.status(201).json({
      message: "Notificação criada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao criar notificação:", error);

    return res.status(500).json({
      error: "Erro interno ao criar notificação."
    });
  }
};



// Listar as notificações
export const listNotifications = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        title,
        message,
        target,
        status,
        send_at,
        created_at
      FROM notifications
      ORDER BY created_at DESC
    `);

    return res.status(200).json(rows);

  } catch (error) {
    console.error("Erro ao listar notificações:", error);

    return res.status(500).json({
      error: "Erro ao listar notificações."
    });
  }
};

export const updateNotification = async (req, res) => {
  const { id } = req.params;
  const { title, message, target, status, send_at } = req.body;

  try {
    // validação mínima
    if (!title || !message) {
      return res.status(400).json({
        error: "Título e mensagem são obrigatórios."
      });
    }

    // regra simples de negócio
    if (status === "scheduled" && !send_at) {
      return res.status(400).json({
        error: "Notificação agendada precisa de data de envio."
      });
    }

    const { rows } = await db.query(
      `
      UPDATE notifications
      SET
        title = $1,
        message = $2,
        target = $3,
        status = $4,
        send_at = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
      `,
      [
        title,
        message,
        target,
        status,
        send_at || null,
        id
      ]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Notificação não encontrada."
      });
    }

    return res.status(200).json({
      message: "Notificação atualizada com sucesso.",
      notification: rows[0]
    });

  } catch (error) {
    console.error("Erro ao atualizar notificação:", error);

    return res.status(500).json({
      error: "Erro interno ao atualizar notificação."
    });
  }
};

export const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await db.query(
      `
      DELETE FROM notifications
      WHERE id = $1
      `,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        error: "Notificação não encontrada."
      });
    }

    return res.status(200).json({
      message: "Notificação excluída com sucesso."
    });

  } catch (error) {
    console.error("Erro ao excluir notificação:", error);

    return res.status(500).json({
      error: "Erro interno ao excluir notificação."
    });
  }
};

