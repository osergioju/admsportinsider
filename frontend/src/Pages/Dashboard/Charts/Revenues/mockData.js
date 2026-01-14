export function mockRevenuesData(selectedClubs) {
  const years = [2020, 2021, 2022, 2023, 2024];

  return {
    years,
    series: selectedClubs.map(club => ({
      club,
      values: years.map(() =>
        Math.floor(Math.random() * 20000)
      )
    }))
  };
}
