import ReactECharts from "echarts-for-react";
import { adaptNetResultEvolution } from "./netResultTableLine.adapter"

export default function NetResultLine({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId,
  clubColorMap
}) {
  const adapted = adaptNetResultEvolution(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap,
    clubColorMap
  );

  if (!adapted) {
    return (
      <p className="text-sm text-gray-400">
        Sem dados de resultado líquido
      </p>
    );
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
    legend: {
      top: 0,
      right: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      itemStyle: { borderRadius: 3 },
      textStyle: {
        fontFamily: "Effra Trial",
        fontSize: 12,
        color: "#333"
      }
    },

    grid: {
      left: 0,
      right: 0,
      bottom: 0,
      top: 50,
      containLabel: true
    },

    xAxis: {
      type: "category",
      data: adapted.years,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#666",
        fontSize: 12,
        fontFamily: "Effra Trial"
      }
    },

    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        formatter: (value) => `R$ ${(value / 1000).toFixed(0)}M`,
        color: "#666",
        fontFamily: "Effra Trial"
      },
      splitLine: {
        lineStyle: {
          color: "#eee"
        }
      }
    },

    series: adapted.series.map((serie) => ({
      ...serie,
      type: "line",
      smooth: false,
      symbol: "circle",
      symbolSize: 9,
      lineStyle: {
        width: 3
      },
      emphasis: { focus: "series" }
    }))
  };

  return (
    <div className="w-full max-w-full h-[250px] overflow-hidden">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
