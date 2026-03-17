import HomeBanners from "../../components/uxui/banner"
import ReceitaSection from "./Charts/Receitas/ReceitaSection"
import { useState, useEffect } from "react"
import { api } from "../../services/api"

export default function Main() {
  const DEFAULT_LEAGUES = [
    { id: 5, name: "Premier League Russa de Futebol", color: "#1729b3" },
    { id: 3, name: "Brasileirão Série A", color: "#80de2e" },
  ];
  
  const [currency, setCurrency] = useState("RUB");

  const [selectedLeagues, setSelectedLeagues] = useState(
      DEFAULT_LEAGUES.map(l => l.id)
    );

    const [leagueMap, setLeagueMap] = useState(
      Object.fromEntries(DEFAULT_LEAGUES.map(l => [l.id, l.name]))
    );

    const [leagueColor, setLeagueColor] = useState(
      Object.fromEntries(
        DEFAULT_LEAGUES.map(l => [
          l.id,
          { color_one: l.color }
        ])
      )
    );

    const [chartData, setChartData] = useState({
      revenue: {}
    });

    
  /**
   * Fetch genérico
   */
  async function fetchChartData(chartKey, endpointBuilder) {

    const existingData = chartData[chartKey];

    const leaguesToFetch = selectedLeagues.filter(
      (leagueId) => !existingData[leagueId]
    );

    if (leaguesToFetch.length === 0) return;

    try {

      const responses = await Promise.all(
        leaguesToFetch.map((leagueId) =>
          api.get(endpointBuilder(leagueId))
        )
      );

      const newData = {};

      responses.forEach((res, index) => {
        newData[leaguesToFetch[index]] = res.data.data;
      });

      setChartData((prev) => ({
        ...prev,
        [chartKey]: {
          ...prev[chartKey],
          ...newData
        }
      }));

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  }

  /**
   * Carregar receitas das ligas
   */
  useEffect(() => {

    fetchChartData(
      "revenue",
      (leagueId) =>
        `/dashboard/leagues/${leagueId}/financials/revenues?from=RUB&to=${currency}&fromYear=2018&toYear=2024`
    );

  }, [selectedLeagues, currency]);

  return (
    <div className="space-y-8">

      {/* Banners */}
      <div className="w-full grid lg:grid-cols-2 lg:gap-4 mb-4">
        <HomeBanners />
        <HomeBanners />
      </div>

      {/* Gráfico receitas ligas */}
      <ReceitaSection
        data={chartData.revenue}
        selectedLeagues={selectedLeagues}
        setSelectedLeagues={setSelectedLeagues}
        leagueMap={leagueMap}
        setLeagueMap={setLeagueMap}
        leagueColor={leagueColor}
        setLeagueColor={setLeagueColor}
      />
    </div>
  );
}