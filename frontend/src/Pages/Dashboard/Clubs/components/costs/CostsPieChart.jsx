import ReactECharts from "echarts-for-react";
import { adaptCostsBreakdown } from "./costsBreakdown.adapter";

export default function CostsPieChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId
}) {
  const adapted = adaptCostsBreakdown(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap
  );

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de custos</p>;
  }

  const option = {
    tooltip: {
      trigger: "item",
      formatter: ({ seriesName, name, value, percent }) =>
        `${seriesName}<br/>${name}<br/>R$ ${Number(value).toLocaleString(
          "pt-BR"
        )} (${percent}%)`
    },
    legend: {
      bottom: 0
    },
    series: adapted.series
  };

  return (
    <div className="w-full h-80">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
