export function adaptCostsBreakdown(apiData) {
  if (!apiData?.data) return null;

  return apiData.data
    .filter(item => item.name_pt)
    .map(item => ({
        name: item.name_pt.replace("(-)", ""),
        value: item.value.replace("-", ""),
    }));
}
