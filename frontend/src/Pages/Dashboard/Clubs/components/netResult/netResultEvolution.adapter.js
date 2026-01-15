export function adaptNetResultEvolution(apiData, limit = 5) {
  if (!apiData?.data) return null;

  const sorted = [...apiData.data]
    .sort((a, b) => a.year - b.year)
    .slice(-limit);

  return {
    years: sorted.map(item => item.year),
    values: sorted.map(item => item.value)
  };
}
