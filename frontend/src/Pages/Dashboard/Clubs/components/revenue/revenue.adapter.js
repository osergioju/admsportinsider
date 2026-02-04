export function adaptRevenueLineData(dataByClub,mainClubId, clubesSelecionados, clubMap, clubColorMap = {}) {
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
  const DEFAULT_COLOR = "#999999"; // cor genérica

  const series = clubesNoGrafico.map((clubId) => {
    const revenueByYear = {};

    (dataByClub[clubId] || []).forEach((item) => {
      if (item.code === "revenue") {
        revenueByYear[item.year] = item.converted_value;
      }
    });

    const clubColor =
      clubColorMap?.[clubId]?.color_one || DEFAULT_COLOR;

    return {
      id: clubId,
      name: clubMap?.[clubId] || `Clube ${clubId}`,
      data: years.map((year) => revenueByYear[year] ?? 0),
      color: clubColor 
    };
  });


  return { years, series };
}
