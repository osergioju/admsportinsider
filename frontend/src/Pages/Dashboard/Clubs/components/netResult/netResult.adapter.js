export function adaptNetResultTable(
  dataByClub,
  clubesSelecionados,
  mainClubId,
  clubMap,
  limit = 5
) {
  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  const clubs = [mainClubId, ...clubesSelecionados];

  const yearSet = new Set();

  // coletar todos os anos existentes
  clubs.forEach((clubId) => {
    const apiData = dataByClub[clubId];
    if (!Array.isArray(apiData)) return;

    apiData.forEach((item) => {
      yearSet.add(item.year);
    });
  });

  const years = Array.from(yearSet)
    .sort((a, b) => b - a)
    .slice(0, limit);

  // Inverter ordem do values 
  years.reverse();

  const rows = years.map((year) => {
    const byClub = {};

    clubs.forEach((clubId) => {
      const apiData = dataByClub[clubId];

      const map = {
        revenue: null,
        costs: null,
        net: null
      };

      if (Array.isArray(apiData)) {
        apiData.forEach((item) => {
          if (item.year !== year) return;
          if (item.code === "revenue") map.revenue = item.converted_value;
          if (item.code === "costs") map.costs = item.converted_value;
          if (item.code === "net_income") map.net = item.converted_value;
          if (item.code === "ebitda") map.ebitda = item.converted_value;
        });
      }

      byClub[clubId] = map;
    });

    return { year, byClub };
  });

  return { rows, clubs };
}
