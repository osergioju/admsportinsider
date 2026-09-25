import { formatFinancial } from "./formatFinancial";
import { resolveChartColor, gradientAreaStyle } from "./chartColor";

// Compartilhado entre o preview do Gerador de Gráficos (admin) e o ChartBlock
// (renderização pública, dentro do PRO — sem marca, diferente do script de embed).
const COLORS = ["#7F33D9", "#00A896", "#F2994A", "#EB5757", "#2D9CDB"];

export function buildLineOrBarOption(chartType, data) {
  const { years = [], indicators = [], series = {} } = data;
  return {
    textStyle: { fontFamily: "Effra Trial", fontSize: 12 },
    tooltip: { trigger: "axis" },
    legend: { show: indicators.length > 1, top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 12, right: 12, bottom: 8, top: indicators.length > 1 ? 36 : 16, containLabel: true },
    xAxis: {
      type: "category",
      data: years,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#666", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#666", fontSize: 11 },
      splitLine: { lineStyle: { color: "#eee" } },
    },
    series: indicators.map((ind, i) => ({
      name: ind.label,
      type: chartType === "stacked_bar" ? "bar" : chartType,
      ...(chartType === "stacked_bar" ? { stack: "total" } : {}),
      data: years.map((y) => series[ind.code]?.[y] ?? null),
      itemStyle: { color: COLORS[i % COLORS.length] },
    })),
  };
}

export function buildGaugeOption(data, targetMax) {
  const { years = [], indicators = [], series = {} } = data;
  const indicator = indicators[0];
  const lastYear = years[years.length - 1];
  const value = indicator ? series[indicator.code]?.[lastYear] ?? 0 : 0;
  const max = targetMax || Math.max(value * 1.5, 100);
  return {
    series: [
      {
        type: "gauge",
        min: 0,
        max,
        progress: { show: true, width: 14 },
        axisLine: { lineStyle: { width: 14 } },
        axisTick: { show: false },
        splitLine: { length: 10 },
        axisLabel: { fontSize: 10, distance: 14 },
        pointer: { show: true },
        title: { fontSize: 12, offsetCenter: [0, "70%"] },
        detail: {
          valueAnimation: true,
          fontSize: 22,
          offsetCenter: [0, "40%"],
          formatter: (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 }),
        },
        data: [{ value, name: indicator?.label || "" }],
      },
    ],
  };
}

export function buildChartOption(chartType, data, targetMax) {
  return chartType === "gauge" ? buildGaugeOption(data, targetMax) : buildLineOrBarOption(chartType, data);
}

// ─── Gráfico do módulo de clube ──────────────────────────────────────────────
// Valores vêm em MILHÕES da moeda nativa do clube. Cores: as do clube (primária, secundária,
// terciária) e depois a paleta padrão. Zero/nulo = ano sem dado (não plota queda pra zero).
// chartType: "line" | "bar" | "stacked_bar"
const FALLBACK_COLORS = ["#7F33D9", "#00A896", "#F2994A", "#EB5757", "#2D9CDB"];

// Contagens (ex.: público): valor cru, K/M/B — sem "M = milhões" nem moeda
function compactCount(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const fmt = (n, d) => n.toLocaleString("pt-BR", { maximumFractionDigits: d });
  if (abs >= 1e9) return `${sign}${fmt(abs / 1e9, 1)}B`;
  if (abs >= 1e6) return `${sign}${fmt(abs / 1e6, 1)}M`;
  if (abs >= 1e3) return `${sign}${fmt(abs / 1e3, 0)}K`;
  return `${sign}${fmt(abs, 0)}`;
}

function compactAxis(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const fmt = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return abs >= 1000 ? `${sign}${fmt(abs / 1000)}B` : `${sign}${fmt(abs)}M`;
}

export function buildClubChartOption({ chartType, moduleData, codes, colors = [], yearFrom, yearTo, valueFormat }) {
  const currency = moduleData?.currency || "BRL";
  const labels = Object.fromEntries((moduleData?.indicators || []).map((i) => [i.code, i.label]));
  const palette = [...colors.map((c) => resolveChartColor(c, null)).filter(Boolean), ...FALLBACK_COLORS];

  const cell = (code, year) => {
    const v = Number(moduleData?.series?.[code]?.[year]);
    return Number.isFinite(v) && v !== 0 ? v : null;
  };

  const years = (moduleData?.years || [])
    .filter((y) => (!yearFrom || y >= yearFrom) && (!yearTo || y <= yearTo))
    .filter((y) => codes.some((code) => cell(code, y) != null));

  const isCount = valueFormat === "number";
  const axisFmt = isCount ? compactCount : compactAxis;
  const isLine = chartType === "line";
  const stacked = chartType === "stacked_bar";

  return {
    textStyle: { fontFamily: "Effra Trial", fontSize: 12 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: isLine ? "line" : "shadow" },
      backgroundColor: "#fff",
      borderColor: "#ddd",
      borderWidth: 1,
      textStyle: { color: "#000", fontFamily: "Effra Trial", fontWeight: "normal" },
      valueFormatter: (v) => (v == null ? "—" : isCount ? Math.round(v).toLocaleString("pt-BR") : formatFinancial(v, currency, "pt-BR")),
    },
    legend: {
      show: codes.length > 1,
      top: 0,
      right: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontFamily: "Effra Trial", fontSize: 12, color: "#333" },
    },
    grid: { left: 0, right: 0, bottom: 0, top: codes.length > 1 ? 50 : 24, containLabel: true },
    xAxis: {
      type: "category",
      // federação: cada ponto é um ciclo ("2023-2026"); clube: o ano
      data: years.map((y) => moduleData?.period_labels?.[y] ?? y),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#666", fontSize: 12, fontFamily: "Effra Trial" },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { formatter: axisFmt, color: "#666", fontFamily: "Effra Trial" },
      splitLine: { lineStyle: { color: "#eee" } },
    },
    series: codes.map((code, i) => {
      const color = palette[i % palette.length];
      const base = {
        name: labels[code] || code,
        type: isLine ? "line" : "bar",
        data: years.map((y) => cell(code, y)),
        itemStyle: { color },
      };
      if (isLine) {
        return {
          ...base,
          smooth: false,
          symbol: "circle",
          symbolSize: 9,
          lineStyle: { width: 3, color },
          areaStyle: gradientAreaStyle(color),
          emphasis: { focus: "series" },
        };
      }
      return {
        ...base,
        ...(stacked ? { stack: "total" } : {}),
        barMaxWidth: codes.length > 1 ? 36 : 70,
        itemStyle: { color, borderRadius: stacked ? 0 : [6, 6, 0, 0] },
        // barra única: valor em cima de cada barra (como o gráfico por ciclo da federação)
        ...(codes.length === 1
          ? { label: { show: true, position: "top", formatter: (p) => (p.value == null ? "" : axisFmt(p.value)), fontSize: 10, color: "#6b7280" } }
          : {}),
      };
    }),
  };
}

// ─── Gráfico "do clube da página" (com comparação de clubes) ─────────────────
// data: { years, indicators, currency, clubs:[{id,name,primary_color,secondary_color}], series:{clubId:{code:{ano:valor}}} }
// Nomes: 1 clube → indicador; 1 indicador → clube; senão "Clube · Indicador".
export function buildContextChartOption({ chartType, data }) {
  const { years = [], indicators = [], clubs = [], series = {}, currency = "BRL" } = data;
  const isLine = chartType === "line";
  const stacked = chartType === "stacked_bar";
  const oneClub = clubs.length === 1;
  const oneIndicator = indicators.length === 1;
  const single = oneClub && oneIndicator;

  const clubColors = (club, i) => {
    const own = [club.primary_color, club.secondary_color].map((c) => resolveChartColor(c, null)).filter(Boolean);
    return own.length ? own : [FALLBACK_COLORS[i % FALLBACK_COLORS.length]];
  };

  const seriesList = [];
  clubs.forEach((club, ci) => {
    const own = clubColors(club, ci);
    indicators.forEach((ind, ii) => {
      let color;
      if (oneIndicator) color = own[0];
      else if (oneClub) color = [...own, ...FALLBACK_COLORS][ii % (own.length + FALLBACK_COLORS.length)];
      else color = FALLBACK_COLORS[(ci * indicators.length + ii) % FALLBACK_COLORS.length];

      const name = oneClub ? ind.label : oneIndicator ? club.name : `${club.name} · ${ind.label}`;
      const values = years.map((y) => {
        const v = series[club.id]?.[ind.code]?.[y];
        return v == null ? null : v;
      });
      seriesList.push({
        name,
        type: isLine ? "line" : "bar",
        data: values,
        itemStyle: { color, ...(isLine ? {} : { borderRadius: stacked ? 0 : [6, 6, 0, 0] }) },
        ...(stacked ? { stack: `club-${club.id}` } : {}),
        ...(isLine
          ? { smooth: false, symbol: "circle", symbolSize: 9, lineStyle: { width: 3, color }, ...(single ? { areaStyle: gradientAreaStyle(color) } : {}), emphasis: { focus: "series" } }
          : { barMaxWidth: 36 }),
      });
    });
  });

  return {
    textStyle: { fontFamily: "Effra Trial", fontSize: 12 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: isLine ? "line" : "shadow" },
      backgroundColor: "#fff",
      borderColor: "#ddd",
      borderWidth: 1,
      textStyle: { color: "#000", fontFamily: "Effra Trial", fontWeight: "normal" },
      valueFormatter: (v) => (v == null ? "—" : formatFinancial(v, currency, "pt-BR")),
    },
    legend: { show: seriesList.length > 1, top: 0, right: 0, icon: "roundRect", itemWidth: 10, itemHeight: 10, textStyle: { fontFamily: "Effra Trial", fontSize: 12, color: "#333" } },
    grid: { left: 0, right: 0, bottom: 0, top: seriesList.length > 1 ? 50 : 24, containLabel: true },
    xAxis: { type: "category", data: years, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: "#666", fontSize: 12, fontFamily: "Effra Trial" } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, axisLabel: { formatter: compactAxis, color: "#666", fontFamily: "Effra Trial" }, splitLine: { lineStyle: { color: "#eee" } } },
    series: seriesList,
  };
}
