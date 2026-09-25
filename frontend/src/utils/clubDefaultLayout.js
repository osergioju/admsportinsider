import { makeId } from "./layoutTree";

// Layout padrão da página do clube — reproduz as três "tiras" que a página tinha fixas
// (Receitas, Dívidas, Resultado). Usado quando nenhum layout foi salvo no admin e como
// ponto de partida ao criar o layout padrão / o layout próprio de um clube.
// Gera ids novos a cada chamada (a árvore do editor exige ids únicos).
function chartContentBlock({ title, body, codes, chartType }) {
  return {
    id: makeId(),
    type: "block",
    width: 12,
    block_type: "club_chart",
    status: "active",
    content: {
      variant: "split",
      chart_side: "left",
      chart_type: chartType,
      indicator_codes: codes,
      title,
      body,
    },
  };
}

export function makeDefaultClubTree() {
  return {
    id: "root",
    type: "stack",
    direction: "column",
    children: [
      chartContentBlock({
        title: "Receitas em {{revenue.year}}",
        body: "O {{club}} registrou receita de {{revenue.value}} em {{revenue.year}}{{revenue.compare}}.",
        codes: ["revenue"],
        chartType: "line",
      }),
      chartContentBlock({
        title: "Dívidas em {{net_debt.year}}",
        body: "O {{club}} encerrou {{net_debt.year}} com dívida líquida de {{net_debt.value}}{{net_debt.compare}}.",
        codes: ["loans_debt", "tax_debt", "payroll_debt", "other_debt"],
        chartType: "stacked_bar",
      }),
      chartContentBlock({
        title: "Resultado em {{net_income.year}}",
        body: "O {{club}} teve {{net_income.result}} de {{net_income.abs}} em {{net_income.year}}{{net_income.compare_result}}.",
        codes: ["net_income"],
        chartType: "line",
      }),
    ],
  };
}

// Layout padrão da página de FEDERAÇÃO — as duas tiras que ela tinha fixas (Receitas por ciclo e
// Resultado líquido). Dados por ciclo (edições), na moeda escolhida no seletor da página.
export function makeDefaultFederationTree() {
  const block = ({ title, body, codes }) => ({
    id: makeId(),
    type: "block",
    width: 12,
    block_type: "federation_chart",
    status: "active",
    content: { variant: "split", chart_side: "left", chart_type: "bar", indicator_codes: codes, title, body },
  });
  return {
    id: "root",
    type: "stack",
    direction: "column",
    children: [
      block({
        title: "Receitas por ciclo",
        body: "A {{name}} projeta receita de {{revenue.value}} entre {{revenue.period_start}} e {{revenue.period_end}}{{revenue.compare}}.",
        codes: ["revenue"],
      }),
      block({
        title: "Resultado líquido",
        body: "A {{name}} projeta {{net_income.result}} de {{net_income.abs}} entre {{net_income.period_start}} e {{net_income.period_end}}{{net_income.compare_result}}.",
        codes: ["net_income"],
      }),
    ],
  };
}

// Layout padrão da página de COMPETIÇÃO — reproduz a lógica que a página sempre teve, agora como
// condições dos blocos: Premiações e Público só aparecem se a competição tem texto ou dado; as três
// tiras financeiras não aparecem em competições de seleções nem nas que têm Premiações/Público.
// "prizes_total" e "attendance-total" casam com o indicador prefixado da competição (world-cup_prizes_total...).
export function makeDefaultLeagueTree() {
  const block = ({ title, body, codes, chartType, valueFormat, visibility }) => ({
    id: makeId(),
    type: "block",
    width: 12,
    block_type: "league_chart",
    status: "active",
    content: {
      variant: "split",
      chart_side: "left",
      chart_type: chartType,
      indicator_codes: codes,
      value_format: valueFormat,
      title,
      body,
      ...visibility,
    },
  });
  const special = { hide_when_empty: true };
  const finance = { team_scope: "club", hide_if_has_special: true };
  return {
    id: "root",
    type: "stack",
    direction: "column",
    children: [
      block({ title: "Premiações", body: "{{info.prizes_text}}", codes: ["prizes_total"], chartType: "bar", valueFormat: "currency", visibility: special }),
      block({ title: "Público", body: "{{info.attendance_text}}", codes: ["attendance-total"], chartType: "bar", valueFormat: "number", visibility: special }),
      block({
        title: "Receitas em {{revenue.year}}",
        body: "{{name}} registrou receita de {{revenue.value}} em {{revenue.year}}{{revenue.compare}}.",
        codes: ["revenue"], chartType: "line", valueFormat: "currency", visibility: finance,
      }),
      block({
        title: "Dívidas em {{net_debt.year}}",
        body: "{{name}} encerrou {{net_debt.year}} com dívida líquida de {{net_debt.value}}{{net_debt.compare}}.",
        codes: ["loans_debt", "tax_debt", "payroll_debt", "other_debt"], chartType: "stacked_bar", valueFormat: "currency", visibility: finance,
      }),
      block({
        title: "Resultado em {{net_income.year}}",
        body: "{{name}} teve {{net_income.result}} de {{net_income.abs}} em {{net_income.year}}{{net_income.compare_abs}}.",
        codes: ["net_income"], chartType: "line", valueFormat: "currency", visibility: finance,
      }),
    ],
  };
}

// ─── Atalhos do editor (páginas de clube, federação e competição) ─────────────────────────────────────
// Blocos novos entram como rascunho, sem indicador: só aparecem na página depois de configurados e publicados.
// blockType: "club_chart" | "federation_chart" | "league_chart" (uma por página de entidade)
export function newClubChartBlock(variant = "basic", width = 12, blockType = "club_chart") {
  return {
    id: makeId(),
    type: "block",
    width,
    block_type: blockType,
    status: "draft",
    content: {
      variant,
      chart_side: "left",
      chart_type: blockType === "club_chart" ? "line" : "bar",
      indicator_codes: [],
      title: "",
      subtitle: "",
      body: "",
    },
  };
}

// Grid de gráficos: linha com N gráficos lado a lado (no mobile empilham sozinhos).
export function newClubChartGridRow(columns = 2, blockType = "club_chart") {
  const width = Math.floor(12 / columns);
  return {
    id: makeId(),
    type: "stack",
    direction: "row",
    width: 12,
    children: Array.from({ length: columns }, () => newClubChartBlock("basic", width, blockType)),
  };
}

// Página financeira do clube: bloco "Gráfico" (do gerador, tipo "clube da página"), em rascunho até escolher o gráfico.
export function newFinanceChartBlock(width = 12) {
  return { id: makeId(), type: "block", width, block_type: "chart", status: "draft", content: {}, chart_id: null };
}

export function newFinanceChartGridRow(columns = 2) {
  const width = Math.floor(12 / columns);
  return {
    id: makeId(),
    type: "stack",
    direction: "row",
    width: 12,
    children: Array.from({ length: columns }, () => newFinanceChartBlock(width)),
  };
}
