import { resolveChartColor } from "../../../../utils/chartColor";

export function adaptRevenueLineData(
  dataByLeague,
  ligasSelecionadas,
  leagueMap,
  leagueColor = {}
) {

  if (!dataByLeague || ligasSelecionadas.length === 0) return null;

  const yearsSet = new Set();

  const isRevenue = (code) => code === "recurring_revenue" || code === "revenue";

  ligasSelecionadas.forEach((leagueId) => {
    (dataByLeague[leagueId] || []).forEach((item) => {
      if (isRevenue(item.code)) yearsSet.add(item.year);
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  if (years.length === 0) return null;

  const series = ligasSelecionadas.map((leagueId) => {

    const revenueByYear = {};

    (dataByLeague[leagueId] || []).forEach((item) => {
      if (item.code === "recurring_revenue") {
        revenueByYear[item.year] = parseFloat(item.value);
      } else if (item.code === "revenue" && revenueByYear[item.year] == null) {
        revenueByYear[item.year] = parseFloat(item.value);
      }
    });

    return {
      id: leagueId,
      name: leagueMap?.[leagueId] || `Liga ${leagueId}`,
      color: resolveChartColor(leagueColor?.[leagueId]?.color_one),
      data: years.map((year) => revenueByYear[year] ?? 0)
    };

  });

  return { years, series };
}