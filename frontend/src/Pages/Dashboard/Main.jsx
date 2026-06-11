import HomeBanners from "../../components/uxui/banner"
import NotasSection from "./../Dashboard/Notas/NotasSection"
import RevenueSection from "./Leagues/components/revenue/RevenueSection"

import { useState, useEffect, useMemo, useRef } from "react"
import { api } from "../../services/api"
import { worldCupLogo } from "../../utils/worldCupLogo"

// Liga "FIFA Financeiro" — dados por ciclo de Copa do Mundo
const FIFA_LEAGUE_ID = 310;
const FIFA_COLOR = "#02285b";

export default function Main() {
  const [currency, setCurrency] = useState("BRL");
  const [currencies, setCurrencies] = useState([]);

  // Comparações adicionadas pelo usuário (a FIFA é a liga principal)
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [leagueMap, setLeagueMap] = useState({ [FIFA_LEAGUE_ID]: "FIFA" });
  const [leagueColor, setLeagueColor] = useState({ [FIFA_LEAGUE_ID]: { color_one: FIFA_COLOR } });

  const [revenueData, setRevenueData] = useState({});
  const revenueDataRef = useRef({});
  useEffect(() => { revenueDataRef.current = revenueData; }, [revenueData]);

  useEffect(() => {
    api.get(`/dashboard/leagues/${FIFA_LEAGUE_ID}/financials/currencies`)
      .then(({ data }) => setCurrencies(data || []))
      .catch(() => setCurrencies([]));
  }, []);

  async function fetchRevenue(leagues, cur, force) {
    const existing = revenueDataRef.current;
    const toFetch = force ? [...leagues] : leagues.filter((id) => !existing[id]);
    if (toFetch.length === 0) return;
    try {
      // Sem filtro de ano: a liga principal (FIFA) é por edições/ciclos
      const responses = await Promise.all(
        toFetch.map((leagueId) =>
          api.get(`/dashboard/leagues/${leagueId}/financials/revenues?to=${cur}`)
        )
      );
      const newData = {};
      responses.forEach((res, i) => { newData[toFetch[i]] = res.data.data; });
      setRevenueData((prev) => (force ? newData : { ...prev, ...newData }));
    } catch (err) {
      console.error("Erro ao buscar receitas:", err);
    }
  }

  useEffect(() => {
    fetchRevenue([FIFA_LEAGUE_ID, ...selectedLeagues], currency, true);
  }, [currency]);

  useEffect(() => {
    fetchRevenue([FIFA_LEAGUE_ID, ...selectedLeagues], currency, false);
  }, [selectedLeagues]);

  // Logos das Copas por ciclo (apenas anos presentes nos dados da FIFA)
  const yearLogos = useMemo(() => {
    const map = {};
    (revenueData[FIFA_LEAGUE_ID] || []).forEach((item) => {
      if (item.code === "revenue" || item.code === "recurring_revenue") {
        map[Number(item.year)] = worldCupLogo(item.year);
      }
    });
    return map;
  }, [revenueData]);

  return (
    <div className="space-y-8">

      {/* Banners */}
      <div className="w-full grid mb-4">
        <HomeBanners />
      </div>

      {/* Gráfico principal: Receitas da Fifa por ciclo da Copa do Mundo */}
      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <RevenueSection
          title="Receitas da Fifa (por ciclo da Copa do Mundo)"
          data={revenueData}
          selectedLeagues={selectedLeagues}
          setSelectedLeagues={setSelectedLeagues}
          leagueMap={leagueMap}
          setLeagueMap={setLeagueMap}
          leagueColor={leagueColor}
          setLeagueColor={setLeagueColor}
          mainLeagueId={FIFA_LEAGUE_ID}
          currency={currency}
          setCurrency={setCurrency}
          currencies={currencies}
          yearLogos={yearLogos}
        />
      </div>

      <NotasSection />
    </div>
  );
}
