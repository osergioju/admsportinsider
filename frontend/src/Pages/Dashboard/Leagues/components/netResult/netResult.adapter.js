export function adaptNetResultTable(apiData, limit = 5) {
  if (!apiData?.data) return [];

  const map = {};

  apiData.data.forEach(item => {
    if (!map[item.year]) {
      map[item.year] = {
        year: item.year,
        revenue: null,
        costs: null,
        net: null
      };
    }

    if (item.code === "revenue") map[item.year].revenue = item.value;
    if (item.code === "costs") map[item.year].costs = item.value;
    if (item.code === "net_income") map[item.year].net = item.value;
  });

  return Object.values(map)
    .sort((a, b) => b.year - a.year)
    .slice(0, limit);
}
