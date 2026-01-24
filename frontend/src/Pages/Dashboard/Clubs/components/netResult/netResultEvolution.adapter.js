export function adaptNetResultEvolution(
  dataByClub,
  clubesSelecionados,
  mainClubId,
  clubMap,
  limit = 5
) {
  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  const clubIds = [mainClubId, ...clubesSelecionados];

  // 1) coletar todos os anos existentes
  const yearsSet = new Set();

  clubIds.forEach((clubId) => {
    const apiData = dataByClub[clubId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach((item) => {
      yearsSet.add(item.year);
    });
  });

  // ordenar e limitar aos últimos N anos
  const allYears = Array.from(yearsSet).sort((a, b) => a - b);
  const years = allYears.slice(-limit);

  // 2) montar séries
  const series = clubIds.map((clubId) => {
    const apiData = dataByClub[clubId];

    const sorted = Array.isArray(apiData)
      ? [...apiData].sort((a, b) => a.year - b.year)
      : [];

    const values = years.map((year) => {
      const found = sorted.find((item) => item.year === year);
      return found ? found.value : 0;
    });

    return {
      name: clubMap[clubId] || `Clube ${clubId}`,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      lineStyle: { width: 3 },
      areaStyle: { opacity: 0.15 },
      data: values
    };
  });

  return { years, series };
}
