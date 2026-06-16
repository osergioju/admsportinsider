import db from "../config/db.js";

// Verifica se o HTML tem conteúdo de verdade (não só tags vazias tipo <p></p>).
function htmlHasContent(html) {
  if (typeof html !== "string") return false;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}

// ─── PÚBLICO (deslogado) — usado na página /legal ────────────────────────────
export async function getPublicLegalSections(req, res) {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    const result = await db.query(`
      SELECT id, tag, body_html, paragraphs
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
      SELECT id, tag, body_html, paragraphs, is_active, sort_order
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
  const { tag, body_html, sort_order = 0, is_active = true } = req.body;

  if (!tag || !htmlHasContent(body_html)) {
    return res.status(400).json({ message: "Título e conteúdo são obrigatórios" });
  }

  try {
    const result = await db.query(
      `INSERT INTO legal_sections (tag, body_html, sort_order, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [tag, body_html, sort_order, is_active]
    );
    return res.status(201).json({ message: "Seção criada com sucesso", id: result.rows[0].id });
  } catch (error) {
    console.error("Erro ao criar seção legal:", error);
    return res.status(500).json({ message: "Erro ao criar seção legal" });
  }
}

export async function updateLegalSection(req, res) {
  const { id } = req.params;
  const { tag, body_html, sort_order, is_active } = req.body;

  if (!tag || !htmlHasContent(body_html)) {
    return res.status(400).json({ message: "Título e conteúdo são obrigatórios" });
  }

  try {
    await db.query(
      `UPDATE legal_sections
       SET tag = $1,
           body_html = $2,
           sort_order = COALESCE($3, sort_order),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5`,
      [tag, body_html, sort_order ?? null, is_active ?? null, id]
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
