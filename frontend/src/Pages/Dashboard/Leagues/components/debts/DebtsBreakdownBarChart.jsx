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


  const lenghtData = option.series[0].data.length;
      
  return (
      <div className="w-full max-w-full h-[250px] lg:h-[360px] overflow-hidden">
        {
          lenghtData === 0 ? (
            <div className="flex items-center justify-center pt-20">
              <p className="text-sm lg:text-xl text-gray-400">Dados indisponíveis</p>
            </div>
          ) : (
            <ReactECharts
              option={option}
              style={{ height: "100%", width: "100%" }}
              notMerge
              lazyUpdate
            />
          )
        }
      </div>
    );
}
  