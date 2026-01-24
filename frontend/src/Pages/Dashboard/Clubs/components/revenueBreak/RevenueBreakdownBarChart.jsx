import ReactECharts from "echarts-for-react";
import { adaptRevenueBreakdown } from "./revenueBreakdown.adapter";

export default function RevenueBreakdownBarChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId
}) {
  const adapted = adaptRevenueBreakdown(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap
  );

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
  }

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value) =>
        `R$ ${Number(value).toLocaleString("pt-BR")}`
    },
    grid: {
      left: 0,
      right: 0,
      bottom: 0,
      top: 20,
      containLabel: true
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => `R$ ${(value / 1e6).toFixed(0)}M`
      }
    },
    xAxis: {
      type: "category",
      data: adapted.categories,
      axisLabel: {
        rotate: 30,
        interval: 0
      }
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
