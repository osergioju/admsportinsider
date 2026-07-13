import { resolveChartColor } from "../../../../../utils/chartColor";

export function adaptRevenueBreakdown(
  dataByClub,
  clubesSelecionados,
  mainClubId,
  clubMap,
  clubColorMap
) {
  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  const clubIds = [mainClubId, ...clubesSelecionados];

  // juntar todas as categorias existentes
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

  if (categories.length === 0) return null;

  const series = clubIds.map((clubId) => {
    
    const apiData = dataByClub[clubId];

    const values = categories.map((category) => {
      const found = Array.isArray(apiData)
        ? apiData.find((item) => item.name === category)
        : null;

      return found ? Number(found.converted_value) : 0;
    });

    const clubColor = resolveChartColor(clubColorMap?.[String(clubId)]?.color_one);

    return {
      name: clubMap[clubId] || `Clube ${clubId}`,
      type: "bar",
      barGap: "20%",
      barWidth: "20%",
      data: values.map(v => {
        const isNegative = v < 0;

        return {
          value: v,
          itemStyle: {
            borderRadius: isNegative
              ? [0, 0, 6, 6]   // negativo: arredonda embaixo
              : [6, 6, 0, 0],  // positivo: arredonda em cima
            color: clubColor
          }
        };
      })
    };


  });

  return { categories, series };
}
