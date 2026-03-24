import db from  "../config/db.js";

// GET /admin/regions
export async function getAllRegions(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        id,
        code,
        name,
        active,
        created_at
      FROM regions
      ORDER BY name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar regiões" });
  }
}

// GET /admin/regions/:id
export async function getRegionById(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT 
        id,
        code,
        name,
        active,
        created_at
      FROM regions
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Região não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar região" });
  }
}

// POST /admin/regions
export async function createRegion(req, res) {
  const { code, name, active } = req.body;

  try {
    const result = await db.query(
      `
      INSERT INTO regions (code, name, active)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [code, name, active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(400).json({ error: "Código da região já existe" });
    }

    res.status(500).json({ error: "Erro ao criar região" });
  }
}

// PUT /admin/regions/:id
export async function updateRegion(req, res) {
  const { id } = req.params;
  const { code, name, active } = req.body;

  try {
    const result = await db.query(
      `
      UPDATE regions
      SET 
        code = $1,
        name = $2,
        active = $3
      WHERE id = $4
      RETURNING *
      `,
      [code, name, active, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Região não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(400).json({ error: "Código da região já existe" });
    }

    res.status(500).json({ error: "Erro ao atualizar região" });
  }
}

// DELETE /admin/regions/:id
export async function deleteRegion(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE regions SET active = false WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Região não encontrada" });
    }

    res.json({ success: true, message: "Região desativada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao desativar região" });
  }
}

export async function getFinancialIndicatorsByRegion(req, res) {
  const { id } = req.params;

  try {
    // 1. Buscar região (pra pegar o code = locale)
    const regionResult = await db.query(
      `SELECT id, code FROM regions WHERE id = $1`,
      [id]
    );

    if (regionResult.rowCount === 0) {
      return res.status(404).json({ error: "Região não encontrada" });
    }

    const locale = regionResult.rows[0].code;

    // 2. Buscar indicadores + tradução
    const result = await db.query(
      `
      SELECT 
        fi.id,
        fi.code,
        fi.name_pt,
        fit.name AS translation
      FROM financial_indicators fi
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id
       AND fit.locale = $1
      ORDER BY fi.id
      `,
      [locale]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar indicadores financeiros" });
  }
}

/**
 * POST /admin/regions/:id/financial-indicators
 * Salva traduções dos indicadores para a região
 */
export async function saveFinancialIndicatorsTranslations(req, res) {
  const { id } = req.params;
  const { translations } = req.body;

  try {
    const regionResult = await db.query(
      `SELECT id, code FROM regions WHERE id = $1`,
      [id]
    );

    if (regionResult.rowCount === 0) {
      return res.status(404).json({ error: "Região não encontrada" });
    }

    const locale = regionResult.rows[0].code;

    for (const item of translations) {
      // 🔥 IGNORA se não tiver tradução
      if (!item.name || item.name.trim() === "") {
        continue;
      }

      await db.query(
        `
        INSERT INTO financial_indicator_translations
          (financial_indicator_id, locale, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (financial_indicator_id, locale)
        DO UPDATE SET name = EXCLUDED.name
        `,
        [item.financial_indicator_id, locale, item.name]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar traduções" });
  }
}


// GET /admin/regions/:id/common-terms
export async function getCommonTermsByRegion(req, res) {
  const { id } = req.params;

  try {
    const regionResult = await db.query(
      `SELECT id, code FROM regions WHERE id = $1`,
      [id]
    );

    if (regionResult.rowCount === 0) {
      return res.status(404).json({ error: "Região não encontrada" });
    }

    const locale = regionResult.rows[0].code;

    const result = await db.query(
      `
      SELECT 
        ct.id,
        ct.code,
        ct.name_pt,
        ct.category,
        ctt.name AS translation
      FROM common_terms ct
      LEFT JOIN common_term_translations ctt
        ON ctt.common_term_id = ct.id
       AND ctt.locale = $1
      ORDER BY ct.category, ct.id
      `,
      [locale]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar termos comuns" });
  }
}

// POST /admin/regions/:id/common-terms
export async function saveCommonTermsTranslations(req, res) {
  const { id } = req.params;
  const { translations } = req.body;

  try {
    const regionResult = await db.query(
      `SELECT id, code FROM regions WHERE id = $1`,
      [id]
    );

    if (regionResult.rowCount === 0) {
      return res.status(404).json({ error: "Região não encontrada" });
    }

    const locale = regionResult.rows[0].code;

    for (const item of translations) {
      if (!item.name || item.name.trim() === "") {
        continue;
      }

      await db.query(
        `
        INSERT INTO common_term_translations
          (common_term_id, locale, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (common_term_id, locale)
        DO UPDATE SET name = EXCLUDED.name
        `,
        [item.common_term_id, locale, item.name]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar traduções de termos comuns" });
  }
}