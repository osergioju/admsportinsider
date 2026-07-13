import { resolveChartColor } from "../../../../../utils/chartColor";

export function adaptNetResultEvolutionByLeague(
  data,
  selectedLeagues = [],
  leagueMap,
  mainLeagueId,
  leagueColor,
  metric = "net_income",
  limit = 100
) {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const leagueIds = Array.from(
    new Set([mainLeagueId, ...selectedLeagues])
  );

  // 1) Coletar anos existentes (somente da métrica escolhida)
  const yearsSet = new Set();

  leagueIds.forEach((leagueId) => {
    const apiData = data[leagueId];
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

  const yearLabels = {};
  leagueIds.forEach((leagueId) => {
    (data[leagueId] || []).forEach((item) => {
      if (item.edition_name && item.year) yearLabels[item.year] = item.edition_name;
    });
  });
  const xAxisLabels = years.map(y => yearLabels[y] || String(y));

  // 2) Montar séries
  const series = leagueIds.map((leagueId) => {
    const apiData = data[leagueId] || [];
    const color = resolveChartColor(leagueColor?.[leagueId]?.color_one);

    // cria mapa { ano: valor }
    const valueByYear = apiData
      .filter((item) => item.code === metric)
      .reduce((acc, item) => {
        acc[item.year] = Number(item.value);
        return acc;
      }, {});

    const values = years.map((year) => valueByYear[year] ?? 0);

    return {
      name: leagueMap[leagueId] || `Liga ${leagueId}`,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      showSymbol: true,
      lineStyle: {
        width: 33,
        color
      },

      itemStyle: {
        color
      },

      areaStyle: { opacity: 0 },

      data: values
    };
  });

  return { years, xAxisLabels, series };
}
