export function adaptDebtsBreakdown(
  dataByClub,
  clubesSelecionados,
  mainClubId,
  clubMap
) {
  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  const clubIds = [mainClubId, ...clubesSelecionados];

  // coletar todas as categorias (tipos de dívida)
  const categorySet = new Set();

  clubIds.forEach((clubId) => {
    const apiData = dataByClub[clubId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach((item) => {
      if (item.name) {
        categorySet.add(item.name);
      }
    });
  });

  const categories = Array.from(categorySet);

  const series = clubIds.map((clubId) => {
    const apiData = dataByClub[clubId];

    const values = categories.map((category) => {
      const found = Array.isArray(apiData)
        ? apiData.find((item) => item.name === category)
        : null;

      return found ? Number(found.converted_value ?? found.value) : 0;
    });

    return {
      name: clubMap[clubId] || `Clube ${clubId}`,
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
