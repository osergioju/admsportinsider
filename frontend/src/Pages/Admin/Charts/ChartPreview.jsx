import ReactECharts from "echarts-for-react";

const COLORS = ["#7F33D9", "#00A896", "#F2994A", "#EB5757", "#2D9CDB"];

function buildLineOrBarOption(chartType, data) {
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
      type: chartType,
      data: years.map((y) => series[ind.code]?.[y] ?? null),
      itemStyle: { color: COLORS[i % COLORS.length] },
      smooth: chartType === "line" ? false : undefined,
    })),
  };
}

function buildGaugeOption(data, targetMax) {
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

export default function ChartPreview({ chartType, data, targetMax, height = 280 }) {
  if (!data) return null;

  const option =
    chartType === "gauge" ? buildGaugeOption(data, targetMax) : buildLineOrBarOption(chartType, data);

  return (
    <div style={{ width: "100%", height }}>
      <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />
    </div>
  );
}
