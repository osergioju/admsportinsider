import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { adaptRevenueLineData } from "./revenue.adapter";

export default function RevenueLineChart({ data, clubesSelecionados }) {
  /**
   * data agora é um objeto:
   * {
   *   [clubId]: [{ year, value, ... }]
   * }
   */
  const adapted = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return null;

    return adaptRevenueLineData(data, clubesSelecionados);
  }, [data, clubesSelecionados]);

  if (!adapted) {
    return (
      <p className="text-sm text-gray-400">
        Sem dados de receita para exibição
      </p>
    );
  }

  const option = {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) =>
        `R$ ${Number(value).toLocaleString("pt-BR")}`
    },
    legend: {
      top: 0,
      right: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      itemStyle: {
        borderRadius: 3
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
      data: adapted.years
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => `R$ ${(value / 1000).toFixed(0)}M`
      }
    },
    series: adapted.series.map((serie) => ({
      ...serie,
      type: "line",
      smooth: false,
      symbol: "circle",
      symbolSize: 0,
      emphasis: { focus: "series" }
    }))
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
