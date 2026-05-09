import { useTranslation } from "../../../../../context/TranslationContext";
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { adaptRevenueBreakdown } from "./revenueBreakdown.adapter";

export default function RevenueBreakdownBarChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId,
  clubColorMap,
  startYear,
  endYear
}) {
  const { t } = useTranslation();



  const adapted = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return null;

    const safeClubes = Array.isArray(clubesSelecionados)
      ? clubesSelecionados
      : [];

    const hasYearFilter = startYear || endYear;

    const filteredData = hasYearFilter
      ? Object.fromEntries(
        Object.entries(data).map(([clubId, items]) => [
          clubId,
          items.filter((item) => {
            if (startYear && item.year < startYear) return false;
            if (endYear && item.year > endYear) return false;
            return true;
          })
        ])
      )
      : data;

    return adaptRevenueBreakdown(
      filteredData,
      safeClubes,   // ✅ ordem corrigida
      mainClubId,
      clubMap,
      clubColorMap
    );
  }, [
    data,
    clubesSelecionados,
    mainClubId,
    clubMap,
    clubColorMap,
    startYear,
    endYear
  ]);

  if (!adapted) {
    ;
    return <p className="text-sm text-gray-400">{t("club.finance.no_revenue", "Sem dados de receita")}</p>;
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
              `<b>${p.axisValue}</b>: ${Number(p.value).toLocaleString("en-US")}`
          )
          .join("<br/>");
      }


    },
    grid: {
      left: 0,
      right: 0,
      bottom: 0,
      top: 20,
      containLabel: true
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => `${(value / 1e6).toFixed(0)}M`
      }
    },
    xAxis: {
      type: "category",
      data: adapted.categories,
      axisLabel: {
        interval: 0,
        rotate: 0,
        width: 80,
        overflow: "break",
        lineHeight: 16
      }
    },
    series: adapted.series
  };



  return (
    <div className="w-full max-w-full h-[250px] lg:h-[460px] overflow-hidden">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge
      />
    </div>
  );
}