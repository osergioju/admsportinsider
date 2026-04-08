import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

export default function ReceitaLineChart({
  data,
  ligasSelecionadas,
  leagueMap,
  leagueColor,
  selectedYear,
}) {
  if (!data || ligasSelecionadas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-[#AFAFB2] text-sm gap-2">
        <span className="text-2xl opacity-30">📊</span>
        <span>Adicione ligas para visualizar o gráfico</span>
      </div>
    );
  }

  const values = ligasSelecionadas.map((leagueId) => {
    const leagueData = data[leagueId] || [];
    const item = leagueData.find(
      (i) => i.code === "recurring_revenue" && Number(i.year) === Number(selectedYear)
    );
    // Usa converted_value (já convertido para a moeda selecionada pelo backend)
    const baseColor = leagueColor?.[leagueId]?.color_one || "#7f34d9";

    return {
      name: leagueMap?.[leagueId] || `Liga ${leagueId}`,
      value: item ? Number(item.converted_value ?? item.value) : 0,
      itemStyle: {
        borderRadius: [100, 100, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: baseColor },
          { offset: 1, color: baseColor + "44" },
        ]),
      },
    };
  });

  const maxValue = Math.max(...values.map((v) => v.value), 1);

  const option = {
    textStyle: { fontFamily: "Effra Trial", fontSize: 12 },

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      backgroundColor: "#fff",
      borderColor: "#f0f0f0",
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: "#333", fontSize: 13 },
      formatter: (params) => {
        const p = params[0];
        return `
          <div style="font-size:12px;color:#999;margin-bottom:4px">${p.name}</div>
          <div style="font-size:15px;font-weight:500;color:#111">
            ${Number(p.value).toLocaleString("pt-BR")}
          </div>
        `;
      },
    },

    grid: { left: 0, right: 0, bottom: 0, top: 20, containLabel: true },

    xAxis: {
      type: "category",
      data: values.map((v) => v.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 12,
        color: "#999",
        interval: 0,
        formatter: (val) => val.length > 18 ? val.slice(0, 17) + "…" : val,
      },
    },

    yAxis: {
      type: "value",
      max: Math.ceil(maxValue * 1.15),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#bbb",
        fontSize: 11,
        formatter: (v) => {
          if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
          if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
          return v;
        },
      },
      splitLine: { lineStyle: { color: "#f3f3f3", type: "dashed" } },
    },

    series: [
      {
        type: "bar",
        data: values,
        barMaxWidth: 56,
        emphasis: { focus: "self", itemStyle: { opacity: 0.85 } },
        label: {
          show: true,
          position: "top",
          fontSize: 11,
          color: "#555",
          formatter: (p) => {
            const v = Number(p.value);
            if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return v || "—";
          },
        },
      },
    ],
  };

  return (
    <div className="w-full max-w-full overflow-hidden" style={{ height: 280 }}>
      <ReactECharts
        option={option}
        notMerge={true}
        lazyUpdate={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
