import db from "../config/db.js";
import { getClubCurrency } from "../controllers/dashboard.controller.js";

const MAX_COMPARE = 4; // mesmo limite dos gráficos atuais da página financeira

// A coluna allowed_plan_ids vem da migração 25. Enquanto ela não foi aplicada, tudo funciona sem trava
// (em vez de quebrar o gerador). Só cacheia o "sim": depois de aplicada, vale sem reiniciar.
let planLockColumnExists = false;
export async function hasPlanLockColumn() {
  if (planLockColumnExists) return true;
  const r = await db.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_definitions' AND column_name = 'allowed_plan_ids'`
  );
  planLockColumnExists = r.rows.length > 0;
  return planLockColumnExists;
}

// ─── Trava por plano ─────────────────────────────────────────────────────────
// chart_definitions.allowed_plan_ids: NULL/vazio = todos os planos. Visitante sem login = plano 1.
export async function getUserPlanId(userId) {
  if (!userId) return 1;
  const r = await db.query(`SELECT plan_id FROM users WHERE id = $1`, [userId]);
  return r.rows[0]?.plan_id ?? 1;
}

export async function checkChartAccess(chart, userId) {
  const allowed = chart.allowed_plan_ids;
  if (!Array.isArray(allowed) || allowed.length === 0) return { allowed: true };

  const planId = await getUserPlanId(userId);
  if (allowed.includes(planId)) return { allowed: true };

  const plans = await db.query(`SELECT id, name FROM plans WHERE id = ANY($1) AND active = true ORDER BY price ASC`, [allowed]);
  return { allowed: false, requiredPlans: plans.rows };
}

// Resposta padrão de gráfico bloqueado: sem dado nenhum, só o que a tela precisa pra explicar o bloqueio.
export function lockedPayload(chart, requiredPlans) {
  return {
    locked: true,
    chart: { id: chart.id, title: chart.title, description: chart.description },
    required_plans: requiredPlans || [],
  };
}

// ─── Gráfico "do clube da página" ────────────────────────────────────────────
// Séries por clube (principal + comparados), na moeda pedida. Valores em milhões, como no resto do sistema.
export async function resolveContextChartData({ chart, mainClubId, compareIds = [], toCurrency, fromYear, untilYear }) {
  const params = chart.source_params || {};
  const codes = params.indicator_codes || [];
  const filters = chart.filters_enabled || {};

  const clubIds = [mainClubId, ...compareIds.filter((id) => id !== mainClubId)].slice(0, 1 + MAX_COMPARE);

  const clubsRes = await db.query(
    `SELECT id_club AS id, name, primary_color, secondary_color FROM clubs WHERE id_club = ANY($1)`,
    [clubIds]
  );
  const clubById = new Map(clubsRes.rows.map((c) => [c.id, c]));
  if (!clubById.has(mainClubId)) return null;

  // Sem seletor de moeda: moeda nativa do clube principal (os comparados são convertidos pra ela)
  const mainNative = await getClubCurrency(mainClubId, "BRL");
  const currency = filters.currency && toCurrency ? toCurrency : mainNative;

  const series = {};
  const labels = {};
  const yearsSet = new Set();
  const mainYears = new Set();

  for (const clubId of clubIds) {
    if (!clubById.has(clubId)) continue;
    const native = await getClubCurrency(clubId, "BRL");
    const convert = native !== currency;

    const result = await db.query(
      `
      WITH rate_cte AS (
        SELECT DISTINCT ON (EXTRACT(YEAR FROM period)::int)
          EXTRACT(YEAR FROM period)::int AS year, rate
        FROM currency_rates
        WHERE base_currency = $3 AND reference_currency = $4
        ORDER BY EXTRACT(YEAR FROM period)::int, period DESC
      ),
      last_rate AS (
        SELECT rate FROM currency_rates
        WHERE base_currency = $3 AND reference_currency = $4
        ORDER BY period DESC LIMIT 1
      )
      SELECT fi.code, fi.name_pt, f.year,
             SUM(f.value * ${convert ? "COALESCE(r.rate, lr.rate, 1)" : "1"}) AS value
      FROM club_financials f
      JOIN financial_indicators fi ON fi.id = f.id_indicator
      LEFT JOIN rate_cte r ON r.year = f.year
      LEFT JOIN last_rate lr ON true
      WHERE f.id_club = $1 AND fi.code = ANY($2)
      GROUP BY fi.code, fi.name_pt, f.year
      ORDER BY f.year ASC
      `,
      [clubId, codes, native, currency]
    );

    series[clubId] = {};
    for (const row of result.rows) {
      const v = parseFloat(row.value);
      if (!Number.isFinite(v) || v === 0) continue; // zero = ano sem dado (mesma regra da página atual)
      (series[clubId][row.code] ||= {})[row.year] = v;
      labels[row.code] = row.name_pt;
      if (clubId === mainClubId) mainYears.add(row.year);
      yearsSet.add(row.year);
    }
  }

  const inRange = (y) => (!fromYear || y >= fromYear) && (!untilYear || y <= untilYear);
  const years = [...yearsSet].filter(inRange).sort((a, b) => a - b);

  return {
    club_id: mainClubId,
    currency,
    currency_editable: !!filters.currency,
    clubs: clubIds.filter((id) => clubById.has(id)).map((id) => clubById.get(id)),
    // anos com dado do clube principal: opções do filtro de período
    available_years: [...mainYears].sort((a, b) => a - b),
    years,
    indicators: codes.map((code) => ({ code, label: labels[code] || code })),
    series,
  };
}
