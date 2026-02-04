import ReactECharts from "echarts-for-react";
import { adaptRevenueBreakdown } from "./revenueBreakdown.adapter";

export default function RevenueBreakdownBarChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId,
  clubColorMap
}) {
  const adapted = adaptRevenueBreakdown(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap,
    clubColorMap
  );

  if (!adapted) {;
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
  }

  const firstClubId = Object.keys(data || {})[0];
  const currency = firstClubId
    ? data[firstClubId]?.[0]?.currency_converted
    : "USD";

  const currencySymbolMap = {
    USD: "$",
    EUR: "€",
    BRL: "R$",
    RUB: "₽"
  };

  const currencySymbol = currencySymbolMap[currency] || currency;

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
              `<b>${p.axisValue}</b>: ${currencySymbol} ${Number(p.value).toLocaleString("en-US")}`
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
    <div className="w-full max-w-full h-[250px] lg:h-[360px] overflow-hidden">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
