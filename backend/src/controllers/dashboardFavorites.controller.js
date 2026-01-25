import db from  "../config/db.js";

export async function createFavorite(req, res) {
  try {
    const { chartType, mainClubId, selectedClubs } = req.body;
    const userId = req.user?.id || 1; // depois você troca pelo auth real

    if (!chartType || !mainClubId || !selectedClubs) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const result = await db.query(
      `
      INSERT INTO favorite_charts (user_id, chart_type, filters)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [
        userId,
        chartType,
        JSON.stringify({
          mainClubId,
          selectedClubs
        })
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar favorito:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

export async function listFavorites(req, res) {
  try {
    const userId = req.user?.id || 1;

    const result = await db.query(
      `
      SELECT id, chart_type, filters, created_at
      FROM favorite_charts
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar favoritos:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
