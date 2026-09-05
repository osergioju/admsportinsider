import db from "../config/db.js";

const SOURCE_TABLE_BY_SCOPE = {
  club: { table: "club_financials", idColumn: "id_club" },
  league: { table: "unified_league_financials", idColumn: "id_league" },
  federation: { table: "unified_league_financials", idColumn: "id_league" },
};

// Federação não tem tabela financeira própria: aponta pra uma liga (financial_league_id)
// que já concentra os dados (unified_league_financials funde liga + edições de competição).
async function resolveFederationLeagueId(entityId) {
  const result = await db.query(
    `SELECT financial_league_id FROM federations WHERE id_federation = $1`,
    [entityId]
  );
  return result.rows[0]?.financial_league_id ?? null;
}

// Resolve a série de dados (ano -> valor, por código de indicador) de um gráfico,
// a partir de source_params, sem depender de um chart_definitions salvo.
// Usado tanto no preview do builder quanto na renderização (interna e, mais tarde, embed).
export async function resolveChartSeries(sourceParams) {
  const { scope, entity_id, indicator_codes } = sourceParams || {};

  if (!["club", "league", "federation"].includes(scope)) {
    throw new Error("Escopo inválido (use 'club', 'league' ou 'federation')");
  }
  if (!entity_id) {
    throw new Error("entity_id é obrigatório");
  }
  if (!Array.isArray(indicator_codes) || indicator_codes.length === 0) {
    throw new Error("Selecione ao menos um indicador");
  }

  let queryEntityId = entity_id;
  if (scope === "federation") {
    queryEntityId = await resolveFederationLeagueId(entity_id);
    if (!queryEntityId) return { entity: null, indicators: [], series: {} };
  }

  const { table, idColumn } = SOURCE_TABLE_BY_SCOPE[scope];

  const result = await db.query(
    `
      SELECT fi.code, fi.name_pt, f.year, SUM(f.value) AS value
      FROM ${table} f
      JOIN financial_indicators fi ON fi.id = f.id_indicator
      WHERE f.${idColumn} = $1 AND fi.code = ANY($2)
      GROUP BY fi.code, fi.name_pt, f.year
      ORDER BY f.year ASC
    `,
    [queryEntityId, indicator_codes]
  );

  const series = {};
  const indicatorLabels = {};
  const yearsSet = new Set();
  for (const row of result.rows) {
    if (!series[row.code]) series[row.code] = {};
    series[row.code][row.year] = parseFloat(row.value);
    indicatorLabels[row.code] = row.name_pt;
    yearsSet.add(row.year);
  }

  return {
    years: [...yearsSet].sort((a, b) => a - b),
    indicators: indicator_codes.map((code) => ({ code, label: indicatorLabels[code] || code })),
    series,
  };
}
