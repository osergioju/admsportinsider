const LABELS = {
  media: "Direitos de transmissão",
  commercial: "Comercial",
  matchday: "Matchday",
  prizes: "Premiações",
  transfers_revenue: "Atletas",
  other_revenue: "Outros"
};

export function adaptRevenueBreakdown(apiData) {
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
