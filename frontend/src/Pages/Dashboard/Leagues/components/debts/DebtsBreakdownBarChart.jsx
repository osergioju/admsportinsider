import ReactECharts from "echarts-for-react";
import { adaptDebtsBreakdown } from "./debtsBreakdownLeague.adapter";
import { useTranslation } from "../../../../../context/TranslationContext";

function NoDebtsData() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="font-semibold text-[#0A0A0A] text-lg">
        {t("debts.no_data_title", "Ah, não!")}
      </p>
      <p className="text-sm text-gray-400 max-w-xs mt-2">
        {t("debts.no_data_desc_league", "Esses dados não estão disponíveis no documento publicado pela liga.")}
      </p>
    </div>
  );
}

export default function DebtsBreakdownBarChart({
  data,
  ligasSelecionadas,
  leagueMap,
  mainLeagueId
}) {
  const adapted = adaptDebtsBreakdown(
    data,
    ligasSelecionadas,
    mainLeagueId,
    leagueMap
  );

  if (!adapted) {
    return <NoDebtsData />;
  }

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value) =>
        `${Number(value).toLocaleString("pt-BR")}`
    },
    grid: {
      left: 10,
      right: 20,
      bottom: 20,
      top: 20,
      containLabel: true
    },
    xAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => `${(value / 1e6).toFixed(0)}M`
      }
    },
    yAxis: {
      type: "category",
      data: adapted.categories
    },
    series: adapted.series
  };


  const lenghtData = option.series[0].data.length;

  return (
    <div className="w-full max-w-full h-[250px] lg:h-[360px] overflow-hidden">
      {
        lenghtData === 0 ? (
          <NoDebtsData />
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
