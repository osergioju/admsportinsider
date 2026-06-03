import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { adaptNetResultEvolution } from "./netResultEvolutionLeague.adapter";

export default function NetResultLineChart({
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

    return adaptNetResultEvolution(
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
        const idx   = params[0]?.dataIndex;
        const year  = adapted.years?.[idx];
        const label = adapted.xAxisLabels?.[idx] || params[0]?.axisValue;
        const isEditionName = label && label !== String(year);
        const header = isEditionName
          ? `<b>${label} (${year})</b><br/>`
          : `<b>${year}</b><br/>`;
        return header + params
          .map(p => `${p.marker} ${p.seriesName}: ${p.value}`)
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
      data: adapted.xAxisLabels || adapted.years,
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
        style={{ height: "100%", width: "100%" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
