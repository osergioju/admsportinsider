import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { adaptPayrollLineData } from "./payrollLeague.adapter";

export default function PayrollLineChart({
  data,
  ligasSelecionadas,
  leagueMap,
  mainLeagueId,
  leagueColor,
  startYear,
  endYear
}) {

  const adapted = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return null;
    let filteredData = data;
    if (startYear || endYear) {
      filteredData = {};

      Object.keys(data).forEach((leagueId) => {
        filteredData[leagueId] = data[leagueId].filter((item) => {

          if (startYear && item.year < startYear) return false;
          if (endYear && item.year > endYear) return false;

          return true;
        });
      });
    }

    return adaptPayrollLineData(
      filteredData,
      ligasSelecionadas,
      mainLeagueId,
      leagueMap,
      leagueColor,
    );

  }, [data, mainLeagueId, ligasSelecionadas, leagueMap, leagueColor, startYear, endYear]);


  if (!adapted) {
    return (
      <p className="text-sm text-gray-400">
        Sem dados de folha salarial
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
              `${p.marker} ${p.seriesName}: ${p.value}`
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
        formatter: (value) => `${(value / 1000).toFixed(0)}M`,
        color: "#666",
        fontFamily: "Effra Trial"
      },
      splitLine: {
        lineStyle: {
          color: "#eee"
        }
      }
    },

    areaStyle: {
      opacity: 0
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
    <div className="w-full max-w-full h-[250px] lg:h-[360px] overflow-hidden">
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "100%" }}
        notMerge
      />
    </div>
  );
}
