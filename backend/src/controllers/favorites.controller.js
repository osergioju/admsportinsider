import db from  "../config/db.js";

/**
 * GET /dashboard/favorites
 * Retorna todos os favoritos do usuário logado
 */
export async function getFavorites(req, res) {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, entity_id, entity_type, created_at
       FROM favorites
       WHERE id_user = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    console.error("Erro ao buscar favoritos:", err);
    return res.status(500).json({ message: "Erro ao buscar favoritos" });
  }
}

/**
 * POST /dashboard/favorites/toggle
 * Adiciona ou remove um favorito (toggle)
 * Body: { entity_id: number, entity_type: "club" | "league" }
 */
export async function toggleFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { entity_id, entity_type } = req.body;

    if (!entity_id || !entity_type) {
      return res.status(400).json({ message: "entity_id e entity_type são obrigatórios" });
    }

    if (!["club", "league"].includes(entity_type)) {
      return res.status(400).json({ message: "entity_type inválido" });
    }

    // Verifica se já existe
    const existing = await db.query(
      `SELECT id FROM favorites
       WHERE id_user = $1 AND entity_id = $2 AND entity_type = $3`,
      [userId, entity_id, entity_type]
    );

    if (existing.rows.length > 0) {
      // Remove
      await db.query(
        `DELETE FROM favorites
         WHERE id_user = $1 AND entity_id = $2 AND entity_type = $3`,
        [userId, entity_id, entity_type]
      );

      return res.json({ favorited: false, message: "Removido dos favoritos" });
    } else {
      // Adiciona
      await db.query(
        `INSERT INTO favorites (id_user, entity_id, entity_type)
         VALUES ($1, $2, $3)`,
        [userId, entity_id, entity_type]
      );

      return res.json({ favorited: true, message: "Adicionado aos favoritos" });
    }
  } catch (err) {
    console.error("Erro ao favoritar:", err);
    return res.status(500).json({ message: "Erro ao favoritar" });
  }
}