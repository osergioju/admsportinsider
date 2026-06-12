import { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { adaptRevenueLineData } from "./revenueLeague.adapter";

// Paddings do grid no modo integrado — a tabela abaixo usa os mesmos valores
// para alinhar cada coluna ao ponto correspondente do gráfico.
// No mobile o eixo Y é compacto ("80k"), então sobra mais largura.
const GRID_LEFT = 64;
const GRID_RIGHT = 16;
const GRID_LEFT_MOBILE = 38;
const GRID_RIGHT_MOBILE = 10;

// Valor em milhões → string compacta no eixo/tabela mobile (80.000 → "80k")
function compactM(v) {
  const a = Math.abs(v);
  if (a >= 1000) return `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

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

  // Detecta mobile para compactar grid/eixo/tabela (só importa no modo integrado)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const gridLeft = isMobile ? GRID_LEFT_MOBILE : GRID_LEFT;
  const gridRight = isMobile ? GRID_RIGHT_MOBILE : GRID_RIGHT;

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
      ? { left: gridLeft, right: gridRight, bottom: 8, top: 50, containLabel: false }
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
          ? (value) => (isMobile ? compactM(value) : value.toLocaleString("pt-BR"))
          : (value) => `${(value / 100).toFixed()}M`,
        color: "#666",
        fontSize: isMobile ? 10 : 12,
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
        <div style={{ paddingLeft: gridLeft, paddingRight: gridRight }}>

          {/* Cabeçalho: logo + ano (+ sede só no desktop) */}
          <div className="flex border-t border-gray-100 pt-2 sm:pt-3 pb-1.5 sm:pb-2">
            {adapted.years.map((y, i) => {
              const label = adapted.xAxisLabels?.[i];
              const hasName = label && label !== String(y);
              return (
                <div key={y} className="flex-1 min-w-0 flex flex-col items-center gap-0.5 sm:gap-1 px-px">
                  {yearLogos?.[y] && (
                    <img
                      src={yearLogos[y]}
                      alt={`Copa do Mundo ${y}`}
                      className="h-6 w-7 sm:h-8 sm:w-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <span className="text-[10px] sm:text-xs font-semibold text-[#626262]">{y}</span>
                  {/* Sede só no desktop (no mobile truncava para "Cor..." e apertava tudo) */}
                  {hasName && (
                    <span className="hidden sm:block text-[9px] leading-tight text-gray-400 text-center px-0.5 max-w-full truncate" title={label}>
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
              <div className="flex py-1.5 sm:py-2 border-t border-gray-50">
                {serie.data.map((v, i) => (
                  <div
                    key={`${serie.id}-${adapted.years[i]}`}
                    className="flex-1 min-w-0 text-center text-[10px] sm:text-xs tabular-nums font-medium px-px"
                    style={{ color: serie.color }}
                  >
                    {v == null || Number(v) === 0
                      ? <span className="text-gray-300">—</span>
                      : (isMobile
                          ? compactM(Number(v))
                          : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 }))}
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
