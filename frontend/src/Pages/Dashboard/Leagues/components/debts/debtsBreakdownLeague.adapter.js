export function adaptDebtsBreakdown(
  dataByLeague,
  ligasSelecionadas,
  mainLeagueId,
  leagueMap
) {
  if (!dataByLeague || Object.keys(dataByLeague).length === 0) {
    return null;
  }

  const leagueIds = [mainLeagueId, ...ligasSelecionadas];

  // coletar todas as categorias (tipos de dívida)
  const categorySet = new Set();

  leagueIds.forEach((leagueId) => {
    const apiData = dataByLeague[leagueId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach((item) => {
      if (item.name_pt) {
        categorySet.add(item.name_pt);
      }
    });
  });

  const categories = Array.from(categorySet);

  const series = leagueIds.map((leagueId) => {
    const apiData = dataByLeague[leagueId];

    const values = categories.map((category) => {
      const found = Array.isArray(apiData)
        ? apiData.find((item) => item.name_pt === category)
        : null;

      return found ? Number(found.converted_value) : 0;
    });

    return {
      name: leagueMap[leagueId] || `Liga ${leagueId}`,
      type: "bar",
      barGap: "20%",
      barWidth: "20%",
      itemStyle: {
        borderRadius: [6, 6, 6, 6]
      },
      data: values
    };
  });

  return { categories, series };
}
