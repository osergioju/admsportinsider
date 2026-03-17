import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

export default function ReceitaLineChart({
  data,
  ligasSelecionadas,
  leagueMap,
  leagueColor,
  selectedYear
}) {

  if (!data || ligasSelecionadas.length === 0) {
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
  }


  const values = ligasSelecionadas.map((leagueId) => {
  const leagueData = data[leagueId] || [];
  const item = leagueData.find(
    (i) =>
      i.code === "recurring_revenue" &&
      Number(i.year) === Number(selectedYear)
  );
  const baseColor = leagueColor?.[leagueId]?.color_one || "#7f34d9";

    return {
      name: leagueMap?.[leagueId] || `Liga ${leagueId}`,
      value: item ? Number(item.value) : 0,
      itemStyle: {
        borderRadius: [18, 18, 0, 0], // ← arredonda só o topo
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: baseColor },
          { offset: 1, color: baseColor + "33" }
        ])
      }
    };

  });

  const option = {

    textStyle: {
      fontFamily: "Effra Trial",
      fontSize: 12
    },

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {

        const p = params[0];

        return `
          ${p.marker} ${p.name}<br/>
          Receita: R$ ${Number(p.value).toLocaleString("pt-BR")}
        `;

      }
    },

    grid: {
      left: 0,
      right: 0,
      bottom: 0,
      top: 30,
      containLabel: true
    },

    xAxis: {
      type: "category",
      data: values.map((v) => v.name),
      axisLine: { show: false },
      axisTick: { show: false }
    },

    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        formatter: (value) => `R$ ${(value / 1000).toFixed(0)}M`
      },
      splitLine: {
        lineStyle: { color: "#eee" }
      }
    },

    series: [
      {
        type: "bar",
        data: values,
        barWidth: 40,
        emphasis: {
          focus: "self"
        }
      }
    ]

  };

  return (
    <div className="w-full h-60 max-w-full overflow-hidden">
      <ReactECharts
        option={option}
        notMerge={true}
        lazyUpdate={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}