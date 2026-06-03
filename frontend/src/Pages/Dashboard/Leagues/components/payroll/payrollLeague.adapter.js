export function adaptPayrollLineData(
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

  // coletar todos os anos existentes
  const yearsSet = new Set();

  leagueIds.forEach((leagueId) => {
    const apiData = dataByLeague[leagueId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach((item) => {
      if (Number(item.converted_value) !== 0) yearsSet.add(item.year);
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  if (years.length === 0) return null;

  const yearLabels = {};
  leagueIds.forEach((leagueId) => {
    (dataByLeague[leagueId] || []).forEach((item) => {
      if (item.edition_name && item.year) yearLabels[item.year] = item.edition_name;
    });
  });
  const xAxisLabels = years.map(y => yearLabels[y] || String(y));

  const DEFAULT_COLOR = "#999999";

  const series = leagueIds.map((leagueId) => {
    const apiData = dataByLeague[leagueId];

    const sorted = Array.isArray(apiData)
      ? [...apiData].sort((a, b) => a.year - b.year)
      : [];

    const values = years.map((year) => {
      const found = sorted.find((item) => item.year === year);
      return found ? found.converted_value : 0;
    });

    const leagueColorReal =
      leagueColor?.[String(leagueId)]?.color_one || DEFAULT_COLOR;

    return {
      name: leagueMap[leagueId] || `Liga ${leagueId}`,
      type: "line",
      data: values,
      smooth: false,
      symbol: "circle",
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: leagueColorReal // cor da linha
      },
      itemStyle: {
        color: leagueColorReal // cor dos pontos
      },
      areaStyle: {
        opacity: 0,
        color: leagueColorReal // cor da área
      }
    };
  });

  return { years, xAxisLabels, series };
}
