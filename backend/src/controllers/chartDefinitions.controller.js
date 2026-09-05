import db from "../config/db.js";
import { resolveChartSeries } from "../services/chartData.service.js";

const ENTITY_TABLE_BY_SCOPE = {
  club: { table: "clubs", idColumn: "id_club", nameColumn: "name" },
  league: { table: "leagues", idColumn: "id_league", nameColumn: "name" },
  federation: { table: "federations", idColumn: "id_federation", nameColumn: "name" },
};

// ─── Catálogo de dados (indicadores financeiros) ──────────────────────────────
export async function getDataCatalog(req, res) {
  try {
    const result = await db.query(`
      SELECT id, code, name_pt, level
      FROM financial_indicators
      ORDER BY id ASC
    `);
    return res.json({ indicators: result.rows });
  } catch (error) {
    console.error("Erro ao buscar catálogo de dados:", error);
    return res.status(500).json({ message: "Erro ao buscar catálogo de dados" });
  }
}

// ─── Busca de entidades (clube/liga/federação) para o gerador de gráficos ────
export async function searchEntities(req, res) {
  const { scope, q = "" } = req.query;
  const entity = ENTITY_TABLE_BY_SCOPE[scope];
  if (!entity) {
    return res.status(400).json({ message: "Escopo inválido (use club, league ou federation)" });
  }

  try {
    const result = await db.query(
      `SELECT ${entity.idColumn} AS id, ${entity.nameColumn} AS name
       FROM ${entity.table}
       WHERE ${entity.nameColumn} ILIKE $1
       ORDER BY ${entity.nameColumn} ASC
       LIMIT 20`,
      [`%${q}%`]
    );
    return res.json({ entities: result.rows });
  } catch (error) {
    console.error("Erro ao buscar entidades:", error);
    return res.status(500).json({ message: "Erro ao buscar entidades" });
  }
}

// ─── Preview (rascunho não salvo) ─────────────────────────────────────────────
export async function previewChart(req, res) {
  const { source_params } = req.body;
  try {
    const data = await resolveChartSeries(source_params);
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// ─── CRUD ──────────────────────────────────────────────────────────────────
export async function getAllCharts(req, res) {
  try {
    const result = await db.query(`
      SELECT id, title, description, chart_type, source_type, source_params,
             filters_enabled, is_embeddable, embed_token, status, updated_at
      FROM chart_definitions
      WHERE status != 'archived'
      ORDER BY updated_at DESC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar gráficos:", error);
    return res.status(500).json({ message: "Erro ao listar gráficos" });
  }
}

export async function getChartById(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query(`SELECT * FROM chart_definitions WHERE id = $1`, [id]);
    if (!result.rows.length) return res.status(404).json({ message: "Gráfico não encontrado" });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar gráfico:", error);
    return res.status(500).json({ message: "Erro ao buscar gráfico" });
  }
}

function validateChartPayload(body) {
  const { title, chart_type, source_params } = body;
  if (!title || !title.trim()) return "Título é obrigatório";
  if (!["line", "bar", "gauge"].includes(chart_type)) return "Tipo de gráfico inválido";
  if (!source_params || !source_params.scope || !source_params.entity_id) {
    return "Selecione a entidade (clube/liga/federação)";
  }
  if (!Array.isArray(source_params.indicator_codes) || !source_params.indicator_codes.length) {
    return "Selecione ao menos um indicador";
  }
  return null;
}

export async function createChart(req, res) {
  const error = validateChartPayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const { title, description = null, chart_type, source_params, filters_enabled = {}, is_embeddable = false } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO chart_definitions (title, description, chart_type, source_params, filters_enabled, is_embeddable)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
       RETURNING id`,
      [title, description, chart_type, JSON.stringify(source_params), JSON.stringify(filters_enabled), is_embeddable]
    );
    return res.status(201).json({ message: "Gráfico criado com sucesso", id: result.rows[0].id });
  } catch (error) {
    console.error("Erro ao criar gráfico:", error);
    return res.status(500).json({ message: "Erro ao criar gráfico" });
  }
}

export async function updateChart(req, res) {
  const { id } = req.params;
  const error = validateChartPayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const { title, description = null, chart_type, source_params, filters_enabled = {}, is_embeddable = false } = req.body;
  try {
    await db.query(
      `UPDATE chart_definitions
       SET title = $1, description = $2, chart_type = $3, source_params = $4::jsonb,
           filters_enabled = $5::jsonb, is_embeddable = $6, updated_at = NOW()
       WHERE id = $7`,
      [title, description, chart_type, JSON.stringify(source_params), JSON.stringify(filters_enabled), is_embeddable, id]
    );
    return res.json({ message: "Gráfico atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar gráfico:", error);
    return res.status(500).json({ message: "Erro ao atualizar gráfico" });
  }
}

export async function deleteChart(req, res) {
  const { id } = req.params;
  try {
    await db.query(`UPDATE chart_definitions SET status = 'archived', updated_at = NOW() WHERE id = $1`, [id]);
    return res.json({ message: "Gráfico arquivado com sucesso" });
  } catch (error) {
    console.error("Erro ao arquivar gráfico:", error);
    return res.status(500).json({ message: "Erro ao arquivar gráfico" });
  }
}

// ─── Público (embed) ──────────────────────────────────────────────────────
// Usado pelo script de incorporação (chart-embed.js), sem autenticação.
// Só resolve gráficos marcados como is_embeddable=true.
export async function getPublicChartData(req, res) {
  const { token } = req.params;
  try {
    const result = await db.query(
      `SELECT title, chart_type, source_params
       FROM chart_definitions
       WHERE embed_token = $1 AND is_embeddable = true AND status != 'archived'`,
      [token]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Gráfico não encontrado ou não incorporável" });

    const chart = result.rows[0];
    const data = await resolveChartSeries(chart.source_params);
    return res.json({ title: chart.title, chart_type: chart.chart_type, target_max: chart.source_params?.target_max || null, ...data });
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico incorporado:", error);
    return res.status(500).json({ message: "Erro ao buscar dados do gráfico" });
  }
}

export async function regenerateEmbedToken(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE chart_definitions SET embed_token = gen_random_uuid(), updated_at = NOW() WHERE id = $1 RETURNING embed_token`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Gráfico não encontrado" });
    return res.json({ embed_token: result.rows[0].embed_token });
  } catch (error) {
    console.error("Erro ao gerar novo token de embed:", error);
    return res.status(500).json({ message: "Erro ao gerar novo token de embed" });
  }
}
