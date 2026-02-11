export function adaptNetResultEvolution(
  dataByClub,
  clubesSelecionados,
  mainClubId,
  clubMap,
  clubColorMap,
  metric = "ebitda", // 👈 métrica desejada
  limit = 5
) {
  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  const clubIds = [mainClubId, ...clubesSelecionados];

  // 1) Coletar anos existentes (apenas da métrica escolhida)
  const yearsSet = new Set();

  clubIds.forEach((clubId) => {
    const apiData = dataByClub[clubId];
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
  const series = clubIds.map((clubId) => {
    const apiData = dataByClub[clubId] || [];
    const clubColor =
      clubColorMap?.[clubId]?.color_one || "#999999";

    // filtrar só a métrica desejada
    const filtered = apiData
      .filter((item) => item.code === metric)
      .sort((a, b) => a.year - b.year);

    // mapear valores por ano
    const values = years.map((year) => {
      const found = filtered.find((item) => item.year === year);
      return found ? Number(found.converted_value) : 0;
    });

    return {
      name: clubMap[clubId] || `Clube ${clubId}`,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,

      lineStyle: {
        width: 3,
        color: clubColor
      },

      itemStyle: {
        color: clubColor
      },

      areaStyle: { opacity: 0 },

      data: values
    };
  });

  return { years, series };
}
