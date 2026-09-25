import { formatFinancial } from "./formatFinancial";

// ─── Módulos das páginas de clube, federação e competição ────────────────────
// Blocos "club_chart"/"federation_chart"/"league_chart" e "number" (modo indicador) não têm dado próprio: leem as
// séries da entidade da página (clube, federação ou competição), entregues por ClubModuleContext.
// Clube = série por ANO; federação = série por CICLO (period_kind "cycle", rótulo "2023-2026" em
// period_labels, "year" = ano final do ciclo). Aqui ficam as regras puras compartilhadas.

// {{revenue.value}} — código do indicador + campo. {{club}}/{{federation}}/{{name}} (sem ponto) = nome da entidade.
export const TOKEN_RE = /\{\{\s*([a-z0-9_-]+)\.([a-z_]+)\s*\}\}/gi;

// Campos disponíveis nas variáveis — usado também como ajuda no editor do admin.
export const TOKEN_FIELDS = [
  { field: "year", desc: "ano do último dado (ciclo: ano final)" },
  { field: "period", desc: "período do último dado (ano, ou ciclo como \"2023-2026\")" },
  { field: "period_start", desc: "início do período (ciclo: 2023)" },
  { field: "period_end", desc: "fim do período (ciclo: 2026)" },
  { field: "value", desc: "valor do último ano, com moeda" },
  { field: "abs", desc: "valor absoluto (sem sinal), com moeda" },
  { field: "prev_year", desc: "ano anterior com dado" },
  { field: "prev_value", desc: "valor do ano anterior" },
  { field: "change_pct", desc: "variação % (sem sinal)" },
  { field: "trend", desc: "\"aumento\" ou \"redução\"" },
  { field: "compare", desc: "\", aumento de X% em relação a AAAA\" (ciclo: \"ao período anterior\"; vazio se não houver anterior)" },
  { field: "result", desc: "\"lucro\" ou \"prejuízo\"" },
  { field: "compare_result", desc: "comparação de lucro/prejuízo com o ano anterior" },
  { field: "compare_abs", desc: "\", acima/abaixo dos X registrados em AAAA\" (compara valores absolutos)" },
];

// {{info.campo}} — atributos da entidade (competição): textos de Premiações/Público, organizador.
export const INFO_FIELDS = [
  { field: "prizes_text", desc: "texto de Premiações cadastrado na competição" },
  { field: "attendance_text", desc: "texto de Público cadastrado na competição" },
  { field: "organizer", desc: "organizador da competição" },
];

function codesFromText(text, into) {
  if (typeof text !== "string") return;
  // {{info.campo}} lê atributos da entidade, não é código de indicador
  for (const m of text.matchAll(TOKEN_RE)) if (m[1].toLowerCase() !== "info") into.add(m[1]);
}

// Espelho de collectModuleCodes (backend/src/services/clubModules.service.js).
export function collectModuleCodes(node, into = new Set()) {
  if (!node) return [...into];
  if (node.type === "stack") {
    (node.children || []).forEach((c) => collectModuleCodes(c, into));
  } else if (node.type === "block") {
    const content = node.content || {};
    if (["club_chart", "federation_chart", "league_chart"].includes(node.block_type)) {
      (content.indicator_codes || []).forEach((c) => into.add(c));
      ["title", "subtitle", "description", "body"].forEach((k) => codesFromText(content[k], into));
    } else if (node.block_type === "number" && content.mode === "indicator" && content.indicator_code) {
      into.add(content.indicator_code);
    }
  }
  return [...into];
}

// Últimos dois anos com dado (ignora nulo e zero — mesma regra da página antiga).
export function latestTwo(moduleData, code) {
  const byYear = moduleData?.series?.[code] || {};
  const sorted = Object.entries(byYear)
    .map(([year, value]) => ({ year: Number(year), value: Number(value) }))
    .filter((r) => Number.isFinite(r.value) && r.value !== 0)
    .sort((a, b) => b.year - a.year);
  return [sorted[0] || null, sorted[1] || null];
}

function periodParts(label) {
  const m = String(label).match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
  return m ? { start: m[1], end: m[2] } : { start: String(label), end: String(label) };
}

function fieldValue(field, latest, prev, fmt, moduleData) {
  if (!latest) return "—";
  const isCycle = moduleData?.period_kind === "cycle";
  const labelOf = (row) => String(moduleData?.period_labels?.[row.year] ?? row.year);
  const pct = prev ? ((latest.value - prev.value) / Math.abs(prev.value)) * 100 : null;
  const pctText = pct != null ? (isCycle ? Math.abs(pct).toFixed(0) : Math.abs(pct).toFixed(1).replace(".", ",")) : null;
  // "em relação a 2023" (ano) | "em relação ao período anterior" (ciclo)
  const versus = prev ? (isCycle ? "ao período anterior" : `a ${prev.year}`) : "";
  const registeredIn = prev ? (isCycle ? "registrado no período anterior" : `registrado em ${prev.year}`) : "";

  switch (field) {
    case "year": return String(latest.year);
    case "period": return labelOf(latest);
    case "period_start": return periodParts(labelOf(latest)).start;
    case "period_end": return periodParts(labelOf(latest)).end;
    case "value": return fmt(latest.value);
    case "abs": return fmt(Math.abs(latest.value));
    case "prev_year": return prev ? String(prev.year) : "—";
    case "prev_value": return prev ? fmt(prev.value) : "—";
    case "change_pct": return pctText != null ? `${pctText}%` : "—";
    case "trend": return pct == null ? "—" : pct >= 0 ? "aumento" : "redução";
    case "compare":
      return pct == null ? "" : `, ${pct >= 0 ? "aumento" : "redução"} de ${pctText}% em relação ${versus}`;
    case "result": return latest.value >= 0 ? "lucro" : "prejuízo";
    case "compare_result":
      return prev
        ? `, ${latest.value >= prev.value ? "acima" : "abaixo"} ${prev.value >= 0 ? "do lucro" : "do prejuízo"} de ${fmt(Math.abs(prev.value))} ${registeredIn}`
        : "";
    case "compare_abs":
      return prev
        ? `, ${Math.abs(latest.value) >= Math.abs(prev.value) ? "acima" : "abaixo"} dos ${fmt(Math.abs(prev.value))} registrados em ${prev.year}`
        : "";
    default: return "—";
  }
}

// Formata um valor conforme o bloco: "currency" (padrão: milhões na moeda da entidade) ou
// "number" (contagem, ex.: público — inteiro localizado, sem moeda).
export function makeFormatter(moduleData, valueFormat) {
  if (valueFormat === "number") {
    return (v) => Math.round(Number(v)).toLocaleString("pt-BR");
  }
  const currency = moduleData?.currency || "BRL";
  return (v) => formatFinancial(v, currency, "pt-BR");
}

// Troca as variáveis do texto pelos dados da entidade. Variável desconhecida vira "—".
export function renderTokens(text, { clubName, moduleData, valueFormat }) {
  if (typeof text !== "string" || !text) return "";
  const fmt = makeFormatter(moduleData, valueFormat);

  return text
    // {{club}} / {{federation}} / {{name}}: nome da entidade da página
    .replace(/\{\{\s*(club|federation|name)\s*\}\}/gi, clubName || "")
    .replace(TOKEN_RE, (_, code, field) => {
      if (code.toLowerCase() === "info") return String(moduleData?.info?.[field.toLowerCase()] ?? "");
      const [latest, prev] = latestTwo(moduleData, code);
      return fieldValue(field.toLowerCase(), latest, prev, fmt, moduleData);
    });
}

// Há algum valor não-zero para algum dos indicadores? (senão o bloco mostra "sem dados")
export function hasAnyData(moduleData, codes) {
  return (codes || []).some((code) => latestTwo(moduleData, code)[0]);
}

// Condições de exibição do bloco (content): esconder sem dados, por tipo de competição, e quando a
// competição já tem as seções de Premiações/Público (regra que a página de competição sempre teve:
// seleções e competições com Premiações/Público não mostram as tiras financeiras).
//   hide_when_empty     — sem dado no gráfico e sem texto {{info.*}} preenchido
//   team_scope          — "any" | "club" | "national" (moduleData.team_type; só competições)
//   hide_if_has_special — esconde se a competição tem texto ou dado de Premiações/Público (info.has_special)
export function isBlockVisible(content, moduleData) {
  const c = content || {};
  const type = moduleData?.team_type;

  if (c.team_scope === "national" && type !== "national") return false;
  if (c.team_scope === "club" && type === "national") return false;

  if (c.hide_if_has_special && moduleData?.info?.has_special) return false;

  if (c.hide_when_empty) {
    const hasData = hasAnyData(moduleData, c.indicator_codes);
    const infoUsed = [c.title, c.subtitle, c.body].join(" ").matchAll(/\{\{\s*info\.([a-z_]+)\s*\}\}/gi);
    const hasInfo = [...infoUsed].some((m) => moduleData?.info?.[m[1].toLowerCase()]);
    if (!hasData && !hasInfo) return false;
  }
  return true;
}
