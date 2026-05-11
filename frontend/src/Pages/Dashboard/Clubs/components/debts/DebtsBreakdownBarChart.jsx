import { useTranslation } from "../../../../../context/TranslationContext";
import ReactECharts from "echarts-for-react";

function NoDebtsData() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="font-semibold text-[#0A0A0A] text-lg">
        {t("debts.no_data_title", "Ah, não!")}
      </p>
      <p className="text-sm text-gray-400 max-w-xs mt-2">
        {t("debts.no_data_desc", "Esses dados não estão disponíveis no documento publicado pelo clube.")}
      </p>
    </div>
  );
}
import { adaptDebtsBreakdown } from "./debtsBreakdown.adapter";
import { useContext } from "react";
import { AuthContext } from "../../../../../context/AuthContext"
import PlanUpgradePrompt from "../blockplan/PlanUpgradePrompt";

export default function DebtsBreakdownBarChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId
}) {
  const { t } = useTranslation();
  const adapted = adaptDebtsBreakdown(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap
  );

  const { user } = useContext(AuthContext);
  const planID = user?.plan_id;

  if (!adapted) {
    return <NoDebtsData />;
  }

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value) =>
        `R$ ${Number(value).toLocaleString("pt-BR")}`
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
    <div className="w-full max-w-full overflow-hidden">
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
