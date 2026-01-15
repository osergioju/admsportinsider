import ReactECharts from "echarts-for-react";
import { adaptNetResultEvolution } from "./netResultEvolution.adapter";

export default function NetResultLineChart({ data }) {
  const adapted = adaptNetResultEvolution(data);

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de resultado líquido</p>;
  }

  const option = {
    tooltip: {
      trigger: "axis",
      valueFormatter: value =>
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
        formatter: value => `R$ ${(value / 1e6).toFixed(0)}M`
      }
    },
    series: [
      {
        name: "Resultado líquido",
        type: "line",
        data: adapted.values,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.15 },
        itemStyle: {
          color: "#2563eb"
        }
      }
    ]
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
