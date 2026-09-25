import db from "../config/db.js";
import { getLeagueCurrency } from "../controllers/dashboard.controller.js";

const CODE_RE = /^[a-z0-9_-]{1,60}$/i;

// Aceita slug ou id numérico (a página pública usa slug; o admin escolhe por id).
async function findLeague(slugOrId) {
  const isId = /^\d+$/.test(String(slugOrId));
  const result = await db.query(
    `SELECT id_league, slug, name, team_type, organizer, structure_json
     FROM leagues
     WHERE ${isId ? "id_league = $1" : "slug = $1"}
     LIMIT 1`,
    [isId ? Number(slugOrId) : slugOrId]
  );
  return result.rows[0] || null;
}

export async function resolveLeagueId(slugOrId) {
  return (await findLeague(slugOrId))?.id_league ?? null;
}

// Séries anuais de uma competição (mesma fonte das páginas de finanças: unified_league_financials,
// que já funde liga + edições) na moeda da competição, no mesmo formato do módulo de clube.
//
// Indicadores de edição vêm prefixados por competição (world-cup_prizes_total,
// intercontinental-cup_attendance-total...). A página antiga pedia "prizes_total"/"attendance-total"
// e casava por SUFIXO — mantido, mas SÓ quando não existe o código exato (senão "revenue" casaria com
// "transfers_revenue", "financial_revenue"... e somaria errado).
export async function resolveLeagueModuleData(slugOrId, codes) {
  const league = await findLeague(slugOrId);
  if (!league) return null;

  const clean = [...new Set((codes || []).filter((c) => typeof c === "string" && CODE_RE.test(c)))].slice(0, 40);
  const currency = await getLeagueCurrency(league.id_league, "BRL");
  const sj = league.structure_json || {};

  // Competição "com seções especiais" = tem texto OU dado de Premiações/Público. Regra da página:
  // nessas (e nas de seleções) as tiras financeiras não aparecem.
  const specialRes = await db.query(
    `SELECT 1
     FROM unified_league_financials f
     JOIN financial_indicators fi ON fi.id = f.id_indicator
     WHERE f.id_league = $1 AND f.value <> 0
       AND (fi.code IN ('prizes_total', 'attendance-total')
            OR fi.code LIKE '%\\_prizes\\_total' OR fi.code LIKE '%\\_attendance-total')
     LIMIT 1`,
    [league.id_league]
  );
  const hasSpecial = !!(sj.prizes_text || sj.attendance_text) || specialRes.rows.length > 0;

  const base = {
    league_id: league.id_league,
    entity_name: league.name,
    team_type: league.team_type,
    // Textos/atributos da competição usados nas variáveis {{info.campo}}
    info: {
      prizes_text: sj.prizes_text || "",
      attendance_text: sj.attendance_text || "",
      organizer: league.organizer || "",
      has_special: hasSpecial,
    },
    currency,
    period_kind: "year",
    years: [],
    indicators: [],
    series: {},
  };
  if (!clean.length) return base;

  const patterns = clean.map((c) => "%\\_" + c.replaceAll("_", "\\_"));
  const result = await db.query(
    `
    SELECT fi.code, fi.name_pt, f.year, SUM(f.value) AS value
    FROM unified_league_financials f
    JOIN financial_indicators fi ON fi.id = f.id_indicator
    WHERE f.id_league = $1 AND (fi.code = ANY($2) OR fi.code LIKE ANY($3))
    GROUP BY fi.code, fi.name_pt, f.year
    ORDER BY f.year ASC
    `,
    [league.id_league, clean, patterns]
  );

  const series = {};
  const labels = {};
  const yearsSet = new Set();
  for (const code of clean) {
    const exact = result.rows.filter((r) => r.code === code);
    const rows = exact.length ? exact : result.rows.filter((r) => r.code.endsWith("_" + code));
    for (const r of rows) {
      if (!series[code]) series[code] = {};
      series[code][r.year] = (series[code][r.year] || 0) + parseFloat(r.value);
      labels[code] = r.name_pt;
      yearsSet.add(r.year);
    }
  }

  return {
    ...base,
    years: [...yearsSet].sort((a, b) => a - b),
    indicators: clean.map((code) => ({ code, label: labels[code] || code })),
    series,
  };
}

// Indicadores que têm dado em alguma competição + os genéricos que casam por sufixo
// (prizes_total, attendance-total), pro editor de módulos.
export async function listLeagueIndicators() {
  const result = await db.query(`
    SELECT DISTINCT fi.code, fi.name_pt, fi.level
    FROM financial_indicators fi
    WHERE EXISTS (SELECT 1 FROM unified_league_financials u WHERE u.id_indicator = fi.id)
    ORDER BY fi.level ASC, fi.name_pt ASC
  `);
  const generic = [
    { code: "prizes_total", name_pt: "Premiações totais (qualquer competição)", level: 1 },
    { code: "attendance-total", name_pt: "Público total (qualquer competição)", level: 1 },
  ];
  return [...generic, ...result.rows.filter((r) => !generic.some((g) => g.code === r.code))];
}
