import ReactECharts from "echarts-for-react";
import { adaptRevenueBreakdown } from "./revenueBreakdown.adapter";

export default function RevenueBreakdownBarChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId,
  clubColorMap
}) {
  const adapted = adaptRevenueBreakdown(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap,
    clubColorMap
  );

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
  }

  const option = {
    textStyle: {
      fontFamily: "Effra Trial",
      fontSize: 12
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#fff",
      borderColor: "#ddd",
      borderWidth: 1,
      textStyle: {
        color: "#000",
        fontFamily: "Effra Trial",
        fontWeight: "normal"
      },
      formatter: (params) => {
        return params
          .map(
            (p) =>
              `${p.marker} ${p.seriesName}: R$ ${Number(p.value).toLocaleString("pt-BR")}`
          )
          .join("<br/>");
      }
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
        interval: 0,
        rotate: 0,
        width: 80,          
        overflow: "break",
        lineHeight: 16
      }
    },
    series: adapted.series
  };

  return (
    <div className="w-full h-[300px]">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
