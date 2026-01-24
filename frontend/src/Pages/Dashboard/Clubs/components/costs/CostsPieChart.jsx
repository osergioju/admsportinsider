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

  const total = adapted.series[0].data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const option = {
    textStyle: {
      fontFamily: "Effra Trial",
      fontSize: 12
    },

    tooltip: {
      trigger: "item",
      formatter: ({ seriesName, name, value, percent }) =>
        `${seriesName}<br/>${name}<br/>R$ ${Number(value).toLocaleString(
          "pt-BR"
        )} (${percent}%)`
    },

    legend: {
      bottom: 0,
      left: "center",
      orient: "horizontal",
      icon: "circle",
      textStyle: {
        fontSize: 13
      }
    },

    series: [
      {
        name: "Receitas",
        type: "pie",
        radius: ["75%", "85%"], // espessura do anel
        avoidLabelOverlap: false,
        startAngle: 90,
        label: {
          show: true,
          position: "outside",
          formatter: "{d}%",
          fontSize: 14,
          color: "#000"
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10
        },
        itemStyle: {
          borderWidth: 0,
          borderColor: "#fff"
        },
        data: adapted.series[0].data
      }
    ],

    graphic: [
      {
        type: "text",
        left: "center",
        top: "45%",
        style: {
          text: "R$",
          fontSize: 22,
          fill: "#000",
          fontWeight: 300
        }
      },
      {
        type: "text",
        left: "center",
        top: "52%",
        style: {
          text: Number(total).toLocaleString("pt-BR"),
          fontSize: 54,
          fontWeight: 700,
          fill: "#000"
        }
      },
      {
        type: "text",
        left: "center",
        top: "65%",
        style: {
          text: "Milhões",
          fontSize: 18,
          fill: "#000"
        }
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
