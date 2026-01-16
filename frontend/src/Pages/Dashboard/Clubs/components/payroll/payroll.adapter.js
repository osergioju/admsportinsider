export function adaptPayrollLineData(apiData) {
  if (!apiData?.data) return null;

  const sorted = [...apiData.data].sort((a, b) => a.year - b.year);

  return {
    years: sorted.map(item => item.year),
    values: sorted.map(item => item.value)
  };
}
