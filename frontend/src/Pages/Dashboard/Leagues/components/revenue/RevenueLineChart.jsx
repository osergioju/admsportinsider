import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { adaptRevenueLineData } from "./revenueLeague.adapter";

// Paddings fixos do grid no modo integrado — a tabela abaixo usa os mesmos
// valores para alinhar cada coluna ao ponto correspondente do gráfico
const GRID_LEFT = 64;
const GRID_RIGHT = 16;

export default function RevenueLineChart({
  data,
  mainLeagueId,
  ligasSelecionadas,
  leagueMap,
  leagueColor,
  startYear,
  endYear,
  integratedTable = false,
  yearLogos = null
}) {


  const adapted = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return null;
    let filteredData = data;
    if (startYear || endYear) {
      filteredData = {};

      Object.keys(data).forEach((leagueId) => {
        filteredData[leagueId] = data[leagueId].filter((item) => {
          if (item.code !== "recurring_revenue" && item.code !== "revenue") return true;

          if (startYear && item.year < startYear) return false;
          if (endYear && item.year > endYear) return false;

          return true;
        });
      });
    }

    return adaptRevenueLineData(
      filteredData,
      mainLeagueId,
      ligasSelecionadas,
      leagueMap,
      leagueColor,
    );

  }, [data, mainLeagueId, ligasSelecionadas, leagueMap, leagueColor, startYear, endYear]);

  if (!adapted) {
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
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
        const fmtVal = (v) => integratedTable
          ? Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })
          : (v / 10).toFixed(1);
        return header + params
          .map(p => `${p.marker} ${p.seriesName}: ${fmtVal(p.value)}`)
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

    grid: integratedTable
      ? { left: GRID_LEFT, right: GRID_RIGHT, bottom: 8, top: 50, containLabel: false }
      : { left: 0, right: 0, bottom: 0, top: 50, containLabel: true },

    xAxis: {
      type: "category",
      data: adapted.xAxisLabels || adapted.years,
      // No modo integrado os anos ficam na tabela alinhada logo abaixo
      boundaryGap: integratedTable ? true : false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: integratedTable ? { show: false } : {
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
        formatter: integratedTable
          ? (value) => value.toLocaleString("pt-BR")
          : (value) => `${(value / 100).toFixed()}M`,
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
    <div className="w-full max-w-full overflow-hidden">
      <div className="w-full h-[250px] lg:h-[360px]">
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          notMerge
        />
      </div>

      {/* ── Tabela integrada: colunas alinhadas aos pontos do gráfico ── */}
      {integratedTable && (
        <div style={{ paddingLeft: GRID_LEFT, paddingRight: GRID_RIGHT }}>

          {/* Cabeçalho: logo + ano + sede */}
          <div className="flex border-t border-gray-100 pt-3 pb-2">
            {adapted.years.map((y, i) => {
              const label = adapted.xAxisLabels?.[i];
              const hasName = label && label !== String(y);
              return (
                <div key={y} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                  {yearLogos?.[y] && (
                    <img
                      src={yearLogos[y]}
                      alt={`Copa do Mundo ${y}`}
                      className="h-8 w-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <span className="text-xs font-semibold text-[#626262]">{y}</span>
                  {hasName && (
                    <span className="text-[9px] leading-tight text-gray-400 text-center px-0.5 max-w-full truncate" title={label}>
                      {label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Uma linha de valores por liga */}
          {adapted.series.map((serie) => (
            <div key={serie.id}>
              {adapted.series.length > 1 && (
                <div className="flex items-center gap-1.5 pt-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: serie.color }} />
                  <span className="text-[11px] text-gray-500 font-medium">{serie.name}</span>
                </div>
              )}
              <div className="flex py-2 border-t border-gray-50">
                {serie.data.map((v, i) => (
                  <div
                    key={`${serie.id}-${adapted.years[i]}`}
                    className="flex-1 min-w-0 text-center text-xs tabular-nums font-medium"
                    style={{ color: serie.color }}
                  >
                    {v == null || Number(v) === 0
                      ? <span className="text-gray-300">—</span>
                      : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
