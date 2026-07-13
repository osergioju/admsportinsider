import { resolveChartColor } from "../../../../../utils/chartColor";

export function adaptNetResultEvolution(
  dataByLeague,
  ligasSelecionadas,
  mainLeagueId,
  leagueMap,
  leagueColor,
  limit = 100
) {
  if (!dataByLeague || Object.keys(dataByLeague).length === 0) {
    return null;
  }

  const leagueIds = [mainLeagueId, ...ligasSelecionadas];

  // 1) Coletar todos os anos existentes
  const yearsSet = new Set();

  leagueIds.forEach((leagueId) => {
    const apiData = dataByLeague[leagueId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach((item) => {
      if (item.year && Number(item.converted_value) !== 0) yearsSet.add(item.year);
    });
  });

  const years = Array.from(yearsSet)
    .sort((a, b) => a - b)
    .slice(-limit);

  if (years.length === 0) return null;

  const yearLabels = {};
  leagueIds.forEach((leagueId) => {
    (dataByLeague[leagueId] || []).forEach((item) => {
      if (item.edition_name && item.year) yearLabels[item.year] = item.edition_name;
    });
  });
  const xAxisLabels = years.map(y => yearLabels[y] || String(y));

  // 2) Montar séries
  const series = leagueIds.map((leagueId) => {
    const apiData = dataByLeague[leagueId] || [];
    const leagueColorReal = resolveChartColor(leagueColor?.[leagueId]?.color_one);

    const sorted = [...apiData].sort((a, b) => a.year - b.year);

    const values = years.map((year) => {
      const found = sorted.find((item) => item.year === year);
      return found ? Number(found.converted_value) : 0;
    });

    return {
      name: leagueMap[leagueId] || `Liga ${leagueId}`,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,

      lineStyle: {
        width: 3,
        color: leagueColorReal
      },

      itemStyle: {
        color: leagueColorReal
      },

      areaStyle: { opacity: 0 },

      data: values
    };
  });

  return { years, xAxisLabels, series };
}
