import ReactECharts from "echarts-for-react";
import { adaptDebtsBreakdown } from "./debtsBreakdownLeague.adapter";

export default function DebtsBreakdownBarChart({
  data,
  ligasSelecionadas,
  leagueMap,
  mainLeagueId
}) {
  const adapted = adaptDebtsBreakdown(
    data,
    ligasSelecionadas,
    mainLeagueId,
    leagueMap
  );

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de dívidas</p>;
  }

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value) =>
        `R$ ${Number(value).toLocaleString("pt-BR")}`
    },
    grid: {
      left: 10,
      right: 20,
      bottom: 20,
      top: 20,
      containLabel: true
    },
    xAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => `R$ ${(value / 1e6).toFixed(0)}M`
      }
    },
    yAxis: {
      type: "category",
      data: adapted.categories
    },
    series: adapted.series
  };

  return (
    <div className="w-full h-72">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
