export function adaptRevenueLineData(
  dataByLeague,
  mainLeagueId,
  ligasSelecionadas,
  leagueMap,
  leagueColor = {}
) {
  if (
    !dataByLeague ||
    !mainLeagueId ||
    Object.keys(dataByLeague).length === 0
  ) {
    return null;
  }

  const safeLigasSelecionadas = Array.isArray(ligasSelecionadas)
    ? ligasSelecionadas
    : [];

  // 🟢 Fonte ÚNICA de verdade
  const ligasNoGrafico = [
    mainLeagueId,
    ...safeLigasSelecionadas.filter(
      (id) => String(id) !== String(mainLeagueId)
    )
  ];

  const yearsSet = new Set();

  // recurring_revenue tem prioridade; revenue é fallback para ligas que não têm o primeiro
  const isRevenue = (code) => code === "recurring_revenue" || code === "revenue";

  ligasNoGrafico.forEach((leagueId) => {
    (dataByLeague[leagueId] || []).forEach((item) => {
      if (isRevenue(item.code)) yearsSet.add(item.year);
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  if (years.length === 0) return null;

  const DEFAULT_COLOR = "#999999";

  const series = ligasNoGrafico.map((leagueId) => {
    const revenueByYear = {};

    (dataByLeague[leagueId] || []).forEach((item) => {
      if (item.code === "recurring_revenue") {
        revenueByYear[item.year] = item.converted_value;
      } else if (item.code === "revenue" && revenueByYear[item.year] == null) {
        revenueByYear[item.year] = item.converted_value;
      }
    });

    const leagueColorReal =
      leagueColor?.[leagueId]?.color_one || DEFAULT_COLOR;

    return {
      id: leagueId,
      name: leagueMap?.[leagueId] || `Liga ${leagueId}`,
      data: years.map((year) => revenueByYear[year] ?? 0),
      color: leagueColorReal
    };
  });

  return { years, series };
}
