import ReactECharts from "echarts-for-react";
import { adaptCostsBreakdown } from "./costsBreakdown.adapter";

export default function CostsPieChart({ data }) {
  const adapted = adaptCostsBreakdown(data);

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de custos</p>;
  }

  const option = {
    tooltip: {
      trigger: "item",
      formatter: ({ name, value, percent }) =>
        `${name}<br/>R$ ${Number(value).toLocaleString("pt-BR")} (${percent}%)`
    },
    legend: {
      bottom: 0
    },
    series: [
      {
        name: "Custos",
        type: "pie",
        radius: ["45%", "70%"], // donut
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: "#fff",
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: "{b}"
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold"
          }
        },
        data: adapted
      }
    ]
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
