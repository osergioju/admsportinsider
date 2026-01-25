export function adaptCostsBreakdown(
  dataByLeague,
  ligasSelecionadas,
  mainLeagueId,
  leagueMap
) {
  if (!dataByLeague || Object.keys(dataByLeague).length === 0) {
    return null;
  }

  const leagueIds = [mainLeagueId, ...ligasSelecionadas];

  const series = leagueIds.map((leagueId, index) => {
    const apiData = dataByLeague[leagueId];
    if (!Array.isArray(apiData)) return null;

    const values = apiData
      .filter((item) => item.name_pt)
      .map((item) => ({
        name: item.name_pt.replace("(-)", ""),
        value: Number(item.value.toString().replace("-", ""))
      }));

    const total = leagueIds.length;

    return {
      name: leagueMap[leagueId] || `Liga ${leagueId}`,
      type: "pie",
      radius: ["30%", "55%"],
      center: [
        `${((index + 1) * 100) / (total + 1)}%`,
        "45%"
      ],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: "#fff",
        borderWidth: 0
      },
      label: {
        show: true,
        formatter: "{b}"
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: "bold"
        }
      },
      data: values
    };
  });

  return { series };
}
