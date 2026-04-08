export function adaptNetResultEvolutionByLeague(
  data,
  selectedLeagues = [],
  leagueMap,
  mainLeagueId,
  leagueColor,
  metric = "ebitda",
  limit = 5
) {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const leagueIds = Array.from(
    new Set([mainLeagueId, ...selectedLeagues])
  );

  // 1) Coletar anos existentes (somente da métrica escolhida)
  const yearsSet = new Set();

  leagueIds.forEach((leagueId) => {
    const apiData = data[leagueId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach(({ year, code }) => {
      if (year && code === metric) {
        yearsSet.add(year);
      }
    });
  });

  const years = Array.from(yearsSet)
    .sort((a, b) => a - b)
    .slice(-limit);

  // 2) Montar séries
  const series = leagueIds.map((leagueId) => {
    const apiData = data[leagueId] || [];
    const color = leagueColor?.[leagueId].color_one || "#999999";

    // cria mapa { ano: valor }
    const valueByYear = apiData
      .filter((item) => item.code === metric)
      .reduce((acc, item) => {
        acc[item.year] = Number(item.value);
        return acc;
      }, {});

    const values = years.map((year) => valueByYear[year] ?? 0);

    return {
      name: leagueMap[leagueId] || `Liga ${leagueId}`,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      showSymbol: true,
      lineStyle: {
        width: 33,
        color
      },

      itemStyle: {
        color
      },

      areaStyle: { opacity: 0 },

      data: values
    };
  });

  return { years, series };
}
