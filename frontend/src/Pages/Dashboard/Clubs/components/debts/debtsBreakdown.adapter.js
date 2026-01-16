export function adaptDebtsBreakdown(apiData) {
  if (!apiData?.data) return null;

  const categories = [];
  const values = [];

  apiData.data.forEach(item => {
    const label = item.name_pt;
    if (!label) return;

    categories.push(label);
    values.push(item.value);
  });

  return {
    categories,
    values
  };
}
