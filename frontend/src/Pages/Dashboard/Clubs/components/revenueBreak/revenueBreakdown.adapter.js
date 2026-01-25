import * as echarts from "echarts";

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
  
  const series = clubIds.map((clubId) => {
    
    const apiData = dataByClub[clubId];

    const values = categories.map((category) => {
      const found = Array.isArray(apiData)
        ? apiData.find((item) => item.name === category)
        : null;

      return found ? Number(found.value) : 0;
    });

    // Se o valor for negativo  
    const DEFAULT_COLOR = "#999999";

    const clubColor =
      clubColorMap?.[String(clubId)]?.color_one || DEFAULT_COLOR;

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
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, isNegative
              ? [
                  { offset: 0, color: "#ffffff" },
                  { offset: 1, color: clubColor }
                ]
              : [
                  { offset: 0, color: clubColor },
                  { offset: 1, color: "#ffffff" }
                ]
            )
          }
        };
      })
    };


  });

  return { categories, series };
}
