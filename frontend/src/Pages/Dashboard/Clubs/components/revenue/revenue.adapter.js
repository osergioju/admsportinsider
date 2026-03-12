export function adaptRevenueLineData(
  dataByClub,
  mainClubId,
  clubesSelecionados,
  clubMap,
  clubColorMap = {}
) {
  if (!dataByClub || !mainClubId) return null;

  const clubes = [
    mainClubId,
    ...(Array.isArray(clubesSelecionados)
      ? clubesSelecionados.filter(id => String(id) !== String(mainClubId))
      : [])
  ];

  const yearsSet = new Set();
  const revenueByClubYear = {};

  clubes.forEach((clubId) => {
    const clubData = dataByClub[clubId] || [];

    revenueByClubYear[clubId] = {};

    clubData.forEach((item) => {
      if (item.code !== "revenue") return;

      yearsSet.add(item.year);
      revenueByClubYear[clubId][item.year] = item.converted_value;
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  const DEFAULT_COLOR = "#999999";

  const series = clubes.map((clubId) => ({
    id: clubId,
    name: clubMap?.[clubId] || `Clube ${clubId}`,
    color: clubColorMap?.[clubId]?.color_one || DEFAULT_COLOR,
    data: years.map((year) => revenueByClubYear[clubId]?.[year] ?? 0)
  }));

  return { years, series };
}