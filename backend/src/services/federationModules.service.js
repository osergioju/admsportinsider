import db from "../config/db.js";

const CODE_RE = /^[a-z0-9_-]{1,60}$/i;

// Indicadores de BALANÇO (estoque): no ciclo vale o valor do último ano (edition_year), não a soma.
// Os demais (receitas, custos, resultado...) são fluxo: somam os anos do ciclo — mesma regra que
// getFederationCycleFinancials já usava para revenue/costs/net_income (fluxo) e net_debt (estoque).
const STOCK_CODES = [
  "net_debt", "loans_debt", "tax_debt", "payroll_debt", "other_debt",
  "assets", "assets_current", "assents_non-current",
  "liabilities", "liabilities_current", "liabilities_non-current", "net_worth",
];

// "Copa do Mundo 2023-2026" → 2023-2026; sem intervalo no nome, ciclo de 4 anos terminando em edition_year.
function cycleLabel(name, editionYear) {
  const m = name?.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (m) return `${m[1]}-${m[2]}`;
  const end = editionYear ?? new Date().getFullYear();
  return `${end - 3}-${end}`;
}

// Aceita slug ou id numérico (o admin escolhe a federação por id; a página pública usa slug).
async function findFederation(slugOrId) {
  const isId = /^\d+$/.test(String(slugOrId));
  const result = await db.query(
    `SELECT id_federation, name, acronym, slug, sphere, financial_league_id
     FROM federations
     WHERE ${isId ? "id_federation = $1" : "slug = $1"} AND active = true
     LIMIT 1`,
    [isId ? Number(slugOrId) : slugOrId]
  );
  return result.rows[0] || null;
}

export async function resolveFederationId(slugOrId) {
  return (await findFederation(slugOrId))?.id_federation ?? null;
}

// Séries por CICLO (edição) de uma federação, convertidas para a moeda escolhida.
// Mesmo formato do módulo de clube ({years, indicators, series, currency}) para os blocos
// serem os mesmos: aqui "year" é o ano final do ciclo e period_labels dá o rótulo "2023-2026".
export async function resolveFederationModuleData(slugOrId, toCurrency, codes) {
  const fed = await findFederation(slugOrId);
  if (!fed) return null;

  const to = /^[A-Z]{3}$/.test(String(toCurrency)) ? toCurrency : "USD";
  const clean = [...new Set((codes || []).filter((c) => typeof c === "string" && CODE_RE.test(c)))].slice(0, 40);

  const base = {
    federation_id: fed.id_federation,
    entity_name: fed.acronym || fed.name,
    currency: to,
    period_kind: "cycle",
    period_labels: {},
    years: [],
    indicators: [],
    series: {},
  };
  if (!clean.length || !fed.financial_league_id) return base;

  const leagueRow = await db.query(`SELECT currency_code FROM leagues WHERE id_league = $1`, [fed.financial_league_id]);
  const fromCurrency = leagueRow.rows[0]?.currency_code || "USD";

  const result = await db.query(
    `
    WITH rate_cte AS (
      SELECT DISTINCT ON (EXTRACT(YEAR FROM period)::int)
        EXTRACT(YEAR FROM period)::int AS year, rate
      FROM currency_rates
      WHERE base_currency = $2 AND reference_currency = $3
      ORDER BY EXTRACT(YEAR FROM period)::int, period DESC
    ),
    last_rate AS (
      SELECT rate FROM currency_rates
      WHERE base_currency = $2 AND reference_currency = $3
      ORDER BY period DESC LIMIT 1
    )
    SELECT ce.edition_year, ce.name AS edition_name, fi.code, fi.name_pt,
           SUM(ef.value * COALESCE(r.rate, lr.rate, 1)) AS value
    FROM edition_financials ef
    JOIN competition_editions ce ON ce.id_edition = ef.id_edition
    JOIN financial_indicators fi ON fi.id = ef.id_indicator
    LEFT JOIN rate_cte r ON r.year = ef.year
    LEFT JOIN last_rate lr ON true
    WHERE ce.id_league = $1
      AND fi.code = ANY($4)
      AND (NOT (fi.code = ANY($5)) OR ef.year = ce.edition_year)
    GROUP BY ce.edition_year, ce.name, fi.code, fi.name_pt
    ORDER BY ce.edition_year ASC
    `,
    [fed.financial_league_id, fromCurrency, to, clean, STOCK_CODES]
  );

  const series = {};
  const labels = {};
  const period_labels = {};
  const yearsSet = new Set();
  for (const row of result.rows) {
    if (!series[row.code]) series[row.code] = {};
    series[row.code][row.edition_year] = parseFloat(row.value);
    labels[row.code] = row.name_pt;
    period_labels[row.edition_year] = cycleLabel(row.edition_name, row.edition_year);
    yearsSet.add(row.edition_year);
  }

  return {
    ...base,
    period_labels,
    years: [...yearsSet].sort((a, b) => a - b),
    indicators: clean.map((code) => ({ code, label: labels[code] || code })),
    series,
  };
}

// Indicadores que têm dado por ciclo em alguma federação — catálogo do editor de módulos.
export async function listFederationIndicators() {
  const result = await db.query(`
    SELECT fi.code, fi.name_pt, fi.level
    FROM financial_indicators fi
    WHERE EXISTS (SELECT 1 FROM edition_financials ef WHERE ef.id_indicator = fi.id)
    ORDER BY fi.level ASC, fi.name_pt ASC
  `);
  return result.rows;
}
