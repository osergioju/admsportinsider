import ReactECharts from "echarts-for-react";
import { adaptCostsBreakdown } from "./costsBreakdownLeague.adapter";

export default function CostsPieChart({
  data,
  ligasSelecionadas,
  leagueMap,
  mainLeagueId
}) {
  const adapted = adaptCostsBreakdown(
    data,
    ligasSelecionadas,
    mainLeagueId,
    leagueMap
  );

  const sliceColors = ["#161616", "#6C6969", "#B2B1B1", "#D9D9D9"];

  if (!adapted) {
    return <p className="text-sm text-gray-400">Dados indisponíveis</p>;
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
      icon: "roundRect",
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 10,
      padding: [0, 0, 0, 0],
      textStyle: {
        fontSize: 12
      }
    },

    series: [
      {
        name: "Receitas",
        type: "pie",
        radius: ["65%", "70%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: false,
        startAngle: 0,
        label: {
          show: true,
          position: "outside",
          formatter: "{d}%",
          fontSize: 14,
          color: "#000"
        },
        labelLine: {
          show: false
        },
        itemStyle: {
          borderWidth: 0,
          borderColor: "#fff"
        },
        data: adapted.series[0].data.map((item, i) => ({
          ...item,
          itemStyle: {
            color: sliceColors[i % sliceColors.length]
          }
        }))
      }
    ],

    graphic: [
      {
        type: "text",
        left: "center",
        top: "34%",
        style: {
          text: Number(total).toLocaleString("pt-BR").split(",")[0],
          fontSize: 62,
          fontSpacing: 130,
          fill: "#0A0A0A",
          fontWeight: 300,
          fontFamily: "Effra Trial"
        }
      },
      {
        type: "text",
        left: "center",
        top: "50%",
        style: {
          text: "Milhões",
          fontSize: 18,
          fontFamily: "Effra Trial",
          fontWeight: 300,
          fill: "#0A0A0A"
        }
      }
    ]
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
  