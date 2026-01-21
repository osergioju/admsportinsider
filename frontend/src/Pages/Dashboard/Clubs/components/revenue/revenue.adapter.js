export function adaptRevenueLineData(dataByClub, clubMap = {}) {
  if (!dataByClub || Object.keys(dataByClub).length === 0) {
    return null;
  }

  // 1️⃣ União de todos os anos
  const yearsSet = new Set();

  Object.values(dataByClub).forEach((clubData) => {
    clubData.forEach((item) => {
      if (item.code === "revenue") {
        yearsSet.add(item.year);
      }
    });
  });

  const years = Array.from(yearsSet).sort();

  // 2️⃣ Séries por clube
  const series = Object.entries(dataByClub).map(
    ([clubId, clubData]) => {
      const revenueByYear = {};

      clubData.forEach((item) => {
        if (item.code === "revenue") {
          revenueByYear[item.year] = item.value;
        }
      });

      return {
        name: clubMap[clubId] || `Clube ${clubId}`,
        data: years.map((year) => revenueByYear[year] ?? 0)
      };
    }
  );

  return {
    years,
    series
  };
}
