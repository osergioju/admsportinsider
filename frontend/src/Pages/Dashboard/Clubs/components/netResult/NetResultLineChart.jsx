import ReactECharts from "echarts-for-react";
import { adaptNetResultEvolution } from "./netResultEvolution.adapter";

export default function NetResultLineChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId
}) {
  const adapted = adaptNetResultEvolution(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap
  );

  if (!adapted) {
    return (
      <p className="text-sm text-gray-400">
        Sem dados de resultado líquido
      </p>
    );
  }

  const option = {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) =>
        `R$ ${Number(value).toLocaleString("pt-BR")}`
    },
    grid: {
      left: 40,
      right: 20,
      bottom: 30,
      top: 20,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: adapted.years
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => `R$ ${(value / 1e6).toFixed(0)}M`
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
