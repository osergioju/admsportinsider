export function adaptRevenueLineData(apiData) {
  if (!apiData?.data) return null;

  const years = [...new Set(apiData.data.map(item => item.year))].sort();

  const revenue = {};

  apiData.data.forEach(item => {
    if (item.code === "revenue") revenue[item.year] = item.value;
  });

  return {
    years,
    series: [
      {
        name: "Receita",
        data: years.map(y => revenue[y] ?? 0)
      }
    ]
  };
}
