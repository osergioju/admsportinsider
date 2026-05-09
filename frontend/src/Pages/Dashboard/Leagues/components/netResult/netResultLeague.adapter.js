export function adaptNetResultTable(
  dataByLeague,
  ligasSelecionadas = [], // 👈 default
  mainLeagueId,
  leagueMap,
  limit = 5
) {
  if (!dataByLeague || Object.keys(dataByLeague).length === 0) {
    return null;
  }

  const leagues = [mainLeagueId, ...ligasSelecionadas];

  const yearSet = new Set();

  // coletar todos os anos existentes
  leagues.forEach((leagueId) => {
    const apiData = dataByLeague[leagueId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach((item) => {
      yearSet.add(item.year);
    });
  });

  const years = Array.from(yearSet)
    .sort((a, b) => b - a)
    .slice(0, limit);

  // inverter ordem do values
  years.reverse();

  const rows = years.map((year) => {
    const byLeague = {};

    leagues.forEach((leagueId) => {
      const apiData = dataByLeague[leagueId];

      const map = {
        revenue: null,
        costs: null,
        net: null,
        ebitda: null
      };

      if (Array.isArray(apiData)) {
        apiData.forEach((item) => {
          if (item.year !== year) return;
          if (item.code === "revenue") map.revenue = item.converted_value;
          if (item.code === "costs") map.costs = item.converted_value;
          if (item.code === "net_income") map.net = item.converted_value;
          if (item.code === "ebitda") map.ebitda = item.converted_value;
          if (item.code === "financial_result" && map.ebitda == null) map.ebitda = item.converted_value;
        });
      }

      byLeague[leagueId] = map;
    });

    return { year, byLeague };
  });

  return { rows, leagues };
}
