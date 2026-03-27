import ReactECharts from "echarts-for-react";
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
  const adapted = adaptDebtsBreakdown(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap
  );

  const { user } = useContext(AuthContext);
  const planID = user?.plan_id;

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de dívidas</p>;
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
