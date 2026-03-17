export function adaptRevenueLineData(
  dataByLeague,
  ligasSelecionadas,
  leagueMap,
  leagueColor = {}
) {

  if (!dataByLeague || ligasSelecionadas.length === 0) return null;

  const yearsSet = new Set();

  ligasSelecionadas.forEach((leagueId) => {
    (dataByLeague[leagueId] || []).forEach((item) => {
      if (item.code === "recurring_revenue") {
        yearsSet.add(item.year);
      }
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  if (years.length === 0) return null;

  const DEFAULT_COLOR = "#999";

  const series = ligasSelecionadas.map((leagueId) => {

    const revenueByYear = {};

    (dataByLeague[leagueId] || []).forEach((item) => {
      if (item.code === "recurring_revenue") {
        revenueByYear[item.year] = parseFloat(item.value);
      }
    });

    return {
      id: leagueId,
      name: leagueMap?.[leagueId] || `Liga ${leagueId}`,
      color: leagueColor?.[leagueId]?.color_one || DEFAULT_COLOR,
      data: years.map((year) => revenueByYear[year] ?? 0)
    };

  });

  return { years, series };
}