import db from "../config/db.js";
import { resolveChartSeries } from "./chartData.service.js";
import { getClubCurrency } from "../controllers/dashboard.controller.js";

const CODE_RE = /^[a-z0-9_-]{1,60}$/i;
// {{revenue.value}} — código do indicador + campo. {{club}} (sem ponto) não pede dado.
const TOKEN_RE = /\{\{\s*([a-z0-9_-]+)\.([a-z_]+)\s*\}\}/gi;

function codesFromText(text, into) {
  if (typeof text !== "string") return;
  // {{info.campo}} lê atributos da entidade (competição), não é código de indicador
  for (const m of text.matchAll(TOKEN_RE)) if (m[1].toLowerCase() !== "info") into.add(m[1]);
}

// Junta todos os códigos de indicador que os blocos da árvore precisam:
//  - club_chart / federation_chart: indicadores do gráfico + tokens {{codigo.campo}} nos textos
//  - number no modo "indicator": o indicador escolhido
// (Há uma cópia equivalente no frontend — utils/clubModules.js — usada na pré-visualização do admin.)
export function collectModuleCodes(node, into = new Set()) {
  if (!node) return [...into];
  if (node.type === "stack") {
    (node.children || []).forEach((c) => collectModuleCodes(c, into));
  } else if (node.type === "block") {
    const content = node.content || {};
    if (["club_chart", "federation_chart", "league_chart"].includes(node.block_type)) {
      (content.indicator_codes || []).forEach((c) => into.add(c));
      codesFromText(content.title, into);
      codesFromText(content.subtitle, into);
      codesFromText(content.description, into);
      codesFromText(content.body, into);
    } else if (node.block_type === "number" && content.mode === "indicator" && content.indicator_code) {
      into.add(content.indicator_code);
    }
  }
  return [...into];
}

// Séries financeiras (moeda nativa do clube) para um conjunto de indicadores.
// Único ponto de resolução usado por: endpoint de layout (público/SSR) e pré-visualização do admin.
export async function resolveClubModuleData(clubId, codes) {
  const clean = [...new Set((codes || []).filter((c) => typeof c === "string" && CODE_RE.test(c)))].slice(0, 40);

  const clubRes = await db.query(`SELECT name FROM clubs WHERE id_club = $1`, [clubId]);
  if (!clubRes.rows.length) return null;

  const currency = await getClubCurrency(clubId, "BRL");

  let data = { years: [], indicators: [], series: {} };
  if (clean.length) {
    data = await resolveChartSeries({ scope: "club", entity_id: clubId, indicator_codes: clean });
  }

  return { club_id: clubId, club_name: clubRes.rows[0].name, entity_name: clubRes.rows[0].name, currency, ...data };
}
