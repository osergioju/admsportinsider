export function adaptCostsBreakdown(
  dataByClub,
  clubesSelecionados,
  mainClubId,
  clubMap
) {

  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  const clubIds = [mainClubId, ...clubesSelecionados];

  const series = clubIds.map((clubId, index) => {
    const apiData = dataByClub[clubId];
    
    if (!Array.isArray(apiData)) return null;

    const values = apiData
      .filter((item) => item.name) // ← MUDEI AQUI: era item.name_pt
      .map((item) => ({
        name: item.name.replace("(-)", "").trim(), // ← MUDEI AQUI também
        value: Math.abs(Number(item.converted_value)) // ← Simplificado
      }));


    const total = clubIds.length;

    return {
      name: clubMap[clubId] || `Clube ${clubId}`,
      type: "pie",
      radius: ["30%", "55%"],
      center: [
        `${((index + 1) * 100) / (total + 1)}%`,
        "45%"
      ],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: "#fff",
        borderWidth: 0
      },
      label: {
        show: true,
        formatter: "{b}"
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: "bold"
        }
      },
      data: values
    };
  });

  // Filtrar nulls caso algum clube não tenha dados
  const validSeries = series.filter(s => s !== null);

  return { series: validSeries };
}