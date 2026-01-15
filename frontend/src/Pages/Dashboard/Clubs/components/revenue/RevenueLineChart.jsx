import ReactECharts from "echarts-for-react";
import { adaptRevenueLineData } from "./revenue.adapter";

export default function RevenueLineChart({ data }) {
  const adapted = adaptRevenueLineData(data);

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
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
        formatter: value => `R$ ${(value / 1000).toFixed(0)}M`
      }
    },
    series: adapted.series.map(s => ({
      ...s,
      type: "line",
      smooth: true,
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
