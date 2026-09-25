import db from "../config/db.js";
import { resolveChartSeries } from "../services/chartData.service.js";
import {
  checkChartAccess, lockedPayload, resolveContextChartData, hasPlanLockColumn,
} from "../services/chartContext.service.js";

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
      SELECT *
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

// ─── Leitura (dashboard, autenticado) — renderização interna, sem marca ──────
export async function getChartData(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM chart_definitions WHERE id = $1 AND status != 'archived'`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Gráfico não encontrado" });

    const chart = result.rows[0];
    if (chart.source_params?.entity_mode === "context") {
      return res.status(400).json({ message: "Este gráfico depende do clube da página. Use o endpoint do clube." });
    }

    const access = await checkChartAccess(chart, req.user?.id);
    if (!access.allowed) return res.json(lockedPayload(chart, access.requiredPlans));

    const data = await resolveChartSeries(chart.source_params);
    return res.json({ title: chart.title, chart_type: chart.chart_type, target_max: chart.source_params?.target_max || null, ...data });
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico:", error);
    return res.status(500).json({ message: "Erro ao buscar dados do gráfico" });
  }
}

// GET /dashboard/clubs/:id/charts/:chartId/data?compare=1,2&from=2015&until=2024&to=EUR
// Gráfico "do clube da página": o clube vem da rota, não do gráfico. Comparação, período e moeda só
// valem se o admin ligou no gerador (filters_enabled). A trava por plano é validada AQUI (no servidor).
export async function getClubContextChartData(req, res) {
  const clubId = Number(req.params.id);
  const chartId = Number(req.params.chartId);
  if (!Number.isInteger(clubId) || !Number.isInteger(chartId)) return res.status(400).json({ message: "Parâmetros inválidos" });

  try {
    const result = await db.query(`SELECT * FROM chart_definitions WHERE id = $1 AND status != 'archived'`, [chartId]);
    const chart = result.rows[0];
    if (!chart) return res.status(404).json({ message: "Gráfico não encontrado" });
    if (chart.source_params?.entity_mode !== "context") {
      return res.status(400).json({ message: "Este gráfico não é do tipo 'clube da página'." });
    }

    const access = await checkChartAccess(chart, req.user?.id);
    if (!access.allowed) return res.json(lockedPayload(chart, access.requiredPlans));

    const filters = chart.filters_enabled || {};
    const compareIds = filters.compare
      ? String(req.query.compare || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const toInt = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
    const toCurrency = /^[A-Z]{3}$/.test(String(req.query.to || "")) ? req.query.to : req.financialContext?.toCurrency;

    const data = await resolveContextChartData({
      chart,
      mainClubId: clubId,
      compareIds,
      toCurrency,
      fromYear: filters.period ? toInt(req.query.from) : null,
      untilYear: filters.period ? toInt(req.query.until) : null,
    });
    if (!data) return res.status(404).json({ message: "Clube não encontrado" });

    return res.json({
      locked: false,
      chart: {
        id: chart.id,
        title: chart.title,
        description: chart.description,
        chart_type: chart.chart_type,
        filters_enabled: filters,
        target_max: chart.source_params?.target_max || null,
      },
      ...data,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico do clube:", error);
    return res.status(500).json({ message: "Erro ao buscar dados do gráfico" });
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

const CHART_TYPES = ["line", "bar", "stacked_bar", "gauge"];
const FILTER_KEYS = ["compare", "period", "currency", "table"];

function validateChartPayload(body) {
  const { title, chart_type, source_params } = body;
  if (!title || !title.trim()) return "Título é obrigatório";
  if (!CHART_TYPES.includes(chart_type)) return "Tipo de gráfico inválido";
  if (!source_params || !source_params.scope) return "Escolha o escopo do gráfico";

  if (source_params.entity_mode === "context") {
    // "Clube da página": não fixa entidade (o clube vem da página onde o gráfico aparece)
    if (source_params.scope !== "club") return "Gráfico contextual só existe para clube";
  } else if (!source_params.entity_id) {
    return "Selecione a entidade (clube/liga/federação)";
  }
  if (!Array.isArray(source_params.indicator_codes) || !source_params.indicator_codes.length) {
    return "Selecione ao menos um indicador";
  }
  if (body.allowed_plan_ids != null && !(Array.isArray(body.allowed_plan_ids) && body.allowed_plan_ids.every(Number.isInteger))) {
    return "Planos permitidos inválidos";
  }
  return null;
}

// Só as 4 opções conhecidas, sempre booleanas (o resto do JSON enviado é descartado)
function cleanFilters(raw) {
  const out = {};
  for (const k of FILTER_KEYS) out[k] = raw?.[k] === true;
  return out;
}

// Lista de planos → array de inteiros únicos, ou null (= todos os planos)
function cleanPlanIds(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return [...new Set(raw.map(Number).filter(Number.isInteger))];
}

export async function createChart(req, res) {
  const error = validateChartPayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const { title, description = null, chart_type, source_params, is_embeddable = false } = req.body;
  const filters = cleanFilters(req.body.filters_enabled);
  const planIds = cleanPlanIds(req.body.allowed_plan_ids);
  try {
    if (planIds && !(await hasPlanLockColumn())) {
      return res.status(409).json({ message: "A trava por plano precisa da migração 25 (schema/25_chart_context_plan_lock.sql) aplicada no banco." });
    }
    const hasLock = await hasPlanLockColumn();
    const result = await db.query(
      `INSERT INTO chart_definitions (title, description, chart_type, source_params, filters_enabled, is_embeddable${hasLock ? ", allowed_plan_ids" : ""})
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6${hasLock ? ", $7" : ""})
       RETURNING id`,
      [title, description, chart_type, JSON.stringify(source_params), JSON.stringify(filters), is_embeddable, ...(hasLock ? [planIds] : [])]
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

  const { title, description = null, chart_type, source_params, is_embeddable = false } = req.body;
  const filters = cleanFilters(req.body.filters_enabled);
  const planIds = cleanPlanIds(req.body.allowed_plan_ids);
  try {
    const hasLock = await hasPlanLockColumn();
    if (planIds && !hasLock) {
      return res.status(409).json({ message: "A trava por plano precisa da migração 25 (schema/25_chart_context_plan_lock.sql) aplicada no banco." });
    }
    await db.query(
      `UPDATE chart_definitions
       SET title = $1, description = $2, chart_type = $3, source_params = $4::jsonb,
           filters_enabled = $5::jsonb, is_embeddable = $6${hasLock ? ", allowed_plan_ids = $8" : ""}, updated_at = NOW()
       WHERE id = $7`,
      [title, description, chart_type, JSON.stringify(source_params), JSON.stringify(filters), is_embeddable, id, ...(hasLock ? [planIds] : [])]
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
    let params = chart.source_params;
    // Gráfico "do clube da página": o snippet de embed informa o clube (data-club-id → ?club=)
    if (params?.entity_mode === "context") {
      const clubId = Number(req.query.club);
      if (!Number.isInteger(clubId) || clubId <= 0) {
        return res.status(400).json({ message: "Este gráfico é do tipo 'clube da página': informe data-club-id no código de incorporação." });
      }
      params = { ...params, scope: "club", entity_id: clubId };
    }
    const data = await resolveChartSeries(params);
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
