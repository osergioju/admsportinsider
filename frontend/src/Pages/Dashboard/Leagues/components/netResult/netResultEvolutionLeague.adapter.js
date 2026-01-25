export function adaptNetResultEvolution(
  dataByLeague,
  ligasSelecionadas,
  mainLeagueId,
  leagueMap,
  leagueColor,
  limit = 5
) {
  if (!dataByLeague || Object.keys(dataByLeague).length === 0) {
    return null;
  }

  const leagueIds = [mainLeagueId, ...ligasSelecionadas];

  // 1) Coletar todos os anos existentes
  const yearsSet = new Set();

  leagueIds.forEach((leagueId) => {
    const apiData = dataByLeague[leagueId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach(({ year }) => {
      if (year) yearsSet.add(year);
    });
  });

  // Ordenar e limitar aos últimos N anos
  const years = Array.from(yearsSet)
    .sort((a, b) => a - b)
    .slice(-limit);

  // 2) Montar séries
  const series = leagueIds.map((leagueId) => {
    const apiData = dataByLeague[leagueId] || [];
    const leagueColorReal =
      leagueColor?.[leagueId]?.color_one || "#999999"; // fallback seguro

    const sorted = [...apiData].sort((a, b) => a.year - b.year);

    const values = years.map((year) => {
      const found = sorted.find((item) => item.year === year);
      return found ? Number(found.value) : 0;
    });

    return {
      name: leagueMap[leagueId] || `Liga ${leagueId}`,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,

      lineStyle: {
        width: 3,
        color: leagueColorReal
      },

      itemStyle: {
        color: leagueColorReal
      },

      areaStyle: { opacity: 0 },

      data: values
    };
  });

  return { years, series };
}
