import { withGradientArea } from "../../../../../utils/chartColor";
import { useTranslation } from "../../../../../context/TranslationContext";
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { adaptRevenueLineData } from "./revenue.adapter";

export default function RevenueLineChart({
  data,
  clubesSelecionados,
  clubMap,
  clubColorMap,
  mainClubId,
  startYear,
  endYear
}) {
  const { t } = useTranslation();
  const adapted = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return null;

    let filteredData = data;

    if (startYear || endYear) {
      filteredData = {};

      Object.keys(data).forEach((clubId) => {
        filteredData[clubId] = data[clubId].filter((item) => {
          if (item.code !== "revenue") return true;

          if (startYear && item.year < startYear) return false;
          if (endYear && item.year > endYear) return false;

          return true;
        });
      });
    }

    return adaptRevenueLineData(
      filteredData,
      mainClubId,
      clubesSelecionados,
      clubMap,
      clubColorMap
    );

  }, [data, mainClubId, clubesSelecionados, clubMap, clubColorMap, startYear, endYear]);


  if (!adapted) {
    return (
      <p className="text-sm text-gray-400">
        {t("club.finance.no_revenue_data", "Sem dados de receita para exibição")}
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
        return params.map((p) => {
          const v = Number(p.value);
          const abs = Math.abs(v);
          const sign = v < 0 ? "-" : "";
          const fmt = abs >= 1000
            ? `${sign}${(abs / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`
            : `${sign}${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
          return `${p.marker} ${p.seriesName}: ${fmt}`;
        }).join("<br/>");
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
        formatter: (value) => {
          const abs = Math.abs(value);
          const sign = value < 0 ? "-" : "";
          if (abs >= 1000) {
            return `${sign}${(abs / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;
          }
          return `${sign}${abs.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
        },
        color: "#666",
        fontFamily: "Effra Trial"
      },
      splitLine: {
        lineStyle: {
          color: "#eee"
        }
      }
    },

    series: adapted.series.map((serie) => withGradientArea({
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
    <div className="w-full max-w-full h-[250px] lg:h-[300px] overflow-hidden">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge
      />
    </div>
  );
}