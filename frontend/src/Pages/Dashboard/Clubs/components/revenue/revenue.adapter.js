export function adaptRevenueLineData(dataByClub,mainClubId,clubesSelecionados,clubMap = {}) {
  if (
    !dataByClub ||
    !mainClubId ||
    Object.keys(dataByClub).length === 0
  ) {
    return null;
  }

  const safeClubesSelecionados = Array.isArray(clubesSelecionados)
    ? clubesSelecionados
    : [];

  // 🟢 Fonte ÚNICA de verdade
  const clubesNoGrafico = [
    mainClubId,
    ...safeClubesSelecionados.filter(
      (id) => String(id) !== String(mainClubId)
    )
  ];

  const yearsSet = new Set();

  clubesNoGrafico.forEach((clubId) => {
    (dataByClub[clubId] || []).forEach((item) => {
      if (item.code === "revenue") {
        yearsSet.add(item.year);
      }
    });
  });

  const years = Array.from(yearsSet).sort();

  // Séries APENAS dos clubes do gráfico
  const series = clubesNoGrafico.map((clubId) => {
    const revenueByYear = {};

    (dataByClub[clubId] || []).forEach((item) => {
      if (item.code === "revenue") {
        revenueByYear[item.year] = item.value;
      }
    });

    return {
      name: clubMap?.[clubId] || `Clube ${clubId}`,
      data: years.map((year) => revenueByYear[year] ?? 0)
    };
  });

  return { years, series };
}
