export function adaptPayrollLineData(
  dataByClub,
  clubesSelecionados,
  mainClubId,
  clubMap
) {
  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  const clubIds = [mainClubId, ...clubesSelecionados];

  // coletar todos os anos existentes
  const yearsSet = new Set();

  clubIds.forEach((clubId) => {
    const apiData = dataByClub[clubId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach((item) => {
      yearsSet.add(item.year);
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

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
      data: values,
      smooth: false,
      symbol: "circle",
      symbolSize: 8,
      lineStyle: { width: 3 },
      areaStyle: { opacity: 0.1 }
    };
  });

  return { years, series };
}
