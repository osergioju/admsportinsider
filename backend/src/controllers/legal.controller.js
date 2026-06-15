import db from "../config/db.js";

// Normaliza paragraphs para um array de strings não-vazias.
function normalizeParagraphs(input) {
  let arr = input;
  if (typeof input === "string") {
    // Aceita um textão: separa por linha em branco (parágrafos).
    arr = input.split(/\n\s*\n/);
  }
  if (!Array.isArray(arr)) return [];
  return arr.map(p => String(p).trim()).filter(Boolean);
}

// ─── PÚBLICO (deslogado) — usado na página /legal ────────────────────────────
export async function getPublicLegalSections(req, res) {
  try {
    const result = await db.query(`
      SELECT id, tag, paragraphs
      FROM legal_sections
      WHERE is_active = true
      ORDER BY sort_order ASC, id ASC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar seções legais:", error);
    return res.status(500).json({ message: "Erro ao buscar seções legais" });
  }
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
export async function getAllLegalSections(req, res) {
  try {
    const result = await db.query(`
      SELECT id, tag, paragraphs, is_active, sort_order
      FROM legal_sections
      ORDER BY sort_order ASC, id ASC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar seções legais:", error);
    return res.status(500).json({ message: "Erro ao listar seções legais" });
  }
}

export async function createLegalSection(req, res) {
  const { tag, sort_order = 0, is_active = true } = req.body;
  const paragraphs = normalizeParagraphs(req.body.paragraphs);

  if (!tag || paragraphs.length === 0) {
    return res.status(400).json({ message: "Título e ao menos um parágrafo são obrigatórios" });
  }

  try {
    const result = await db.query(
      `INSERT INTO legal_sections (tag, paragraphs, sort_order, is_active)
       VALUES ($1, $2::jsonb, $3, $4)
       RETURNING id`,
      [tag, JSON.stringify(paragraphs), sort_order, is_active]
    );
    return res.status(201).json({ message: "Seção criada com sucesso", id: result.rows[0].id });
  } catch (error) {
    console.error("Erro ao criar seção legal:", error);
    return res.status(500).json({ message: "Erro ao criar seção legal" });
  }
}

export async function updateLegalSection(req, res) {
  const { id } = req.params;
  const { tag, sort_order, is_active } = req.body;
  const paragraphs = normalizeParagraphs(req.body.paragraphs);

  if (!tag || paragraphs.length === 0) {
    return res.status(400).json({ message: "Título e ao menos um parágrafo são obrigatórios" });
  }

  try {
    await db.query(
      `UPDATE legal_sections
       SET tag = $1,
           paragraphs = $2::jsonb,
           sort_order = COALESCE($3, sort_order),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5`,
      [tag, JSON.stringify(paragraphs), sort_order ?? null, is_active ?? null, id]
    );
    return res.json({ message: "Seção atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar seção legal:", error);
    return res.status(500).json({ message: "Erro ao atualizar seção legal" });
  }
}

export async function deleteLegalSection(req, res) {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM legal_sections WHERE id = $1`, [id]);
    return res.json({ message: "Seção excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao remover seção legal:", error);
    return res.status(500).json({ message: "Erro ao remover seção legal" });
  }
}

export async function updateLegalOrder(req, res) {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "Formato inválido" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const item of items) {
      await client.query(
        `UPDATE legal_sections SET sort_order = $1, updated_at = NOW() WHERE id = $2`,
        [item.sort_order, item.id]
      );
    }
    await client.query("COMMIT");
    return res.json({ message: "Ordem atualizada com sucesso" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao atualizar ordem das seções legais:", error);
    return res.status(500).json({ message: "Erro ao atualizar ordem" });
  } finally {
    client.release();
  }
}
