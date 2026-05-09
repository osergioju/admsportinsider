export function adaptNetResultEvolution(
  dataByClub,
  clubesSelecionados,
  mainClubId,
  clubMap,
  clubColorMap,
  limit = 5
) {
  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  const clubIds = [mainClubId, ...clubesSelecionados];

  // 1) Coletar todos os anos existentes
  const yearsSet = new Set();

  clubIds.forEach((clubId) => {
    const apiData = dataByClub[clubId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach(({ year }) => {
      if (year) yearsSet.add(year);
    });
  });

  // Ordenar e limitar aos últimos N anos
  const years = Array.from(yearsSet)
    .sort((a, b) => a - b)
    .slice(-limit);

  if (years.length === 0) return null;

  // 2) Montar séries
  const series = clubIds.map((clubId) => {
    const apiData = dataByClub[clubId] || [];
    const clubColor =
      clubColorMap?.[clubId]?.color_one || "#999999"; // fallback seguro

    const sorted = [...apiData].sort((a, b) => a.year - b.year);

    const values = years.map((year) => {
      const found = sorted.find((item) => item.year === year);
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
