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
      if (item.name_pt) {
        categorySet.add(item.name_pt);
      }
    });
  });

  const categories = Array.from(categorySet);

  const series = clubIds.map((clubId) => {
    const apiData = dataByClub[clubId];

    const values = categories.map((category) => {
      const found = Array.isArray(apiData)
        ? apiData.find((item) => item.name_pt === category)
        : null;

      return found ? Number(found.value) : 0;
    });

    const DEFAULT_COLOR = "#999999";

    const clubColor =
      clubColorMap?.[String(clubId)]?.color_one || DEFAULT_COLOR;

    return {
      name: clubMap[clubId] || `Clube ${clubId}`,
      type: "bar",
      barGap: "20%",
      barWidth: "20%",
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: clubColor }, // 👈 cor do clube no topo
          { offset: 1, color: "#ffffff" }  // base branca
        ])
      },
      data: values
    };

  });

  return { categories, series };
}
