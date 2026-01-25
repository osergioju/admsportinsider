import * as echarts from "echarts";

export function adaptRevenueBreakdown(
  dataByLeague,
  ligasSelecionadas,
  mainLeagueId,
  leagueMap,
  leagueColor
) {
  if (!dataByLeague || Object.keys(dataByLeague).length === 0) {
    return null;
  }

  const leagueIds = [mainLeagueId, ...ligasSelecionadas];

  // juntar todas as categorias existentes
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

      return found ? Number(found.value) : 0;
    });

    const DEFAULT_COLOR = "#999999";

    const leagueColorReal =
      leagueColor?.[String(leagueId)]?.color_one || DEFAULT_COLOR;

    return {
      name: leagueMap[leagueId] || `Liga ${leagueId}`,
      type: "bar",
      barGap: "20%",
      barWidth: "20%",
      data: values.map((v) => {
        const isNegative = v < 0;

        return {
          value: v,
          itemStyle: {
            borderRadius: isNegative
              ? [0, 0, 6, 6]   // negativo: arredonda embaixo
              : [6, 6, 0, 0],  // positivo: arredonda em cima
            color: new echarts.graphic.LinearGradient(
              0,
              0,
              0,
              1,
              isNegative
                ? [
                    { offset: 0, color: "#ffffff" },
                    { offset: 1, color: leagueColorReal }
                  ]
                : [
                    { offset: 0, color: leagueColorReal },
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
