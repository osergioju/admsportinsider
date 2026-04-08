import HomeBanners from "../../components/uxui/banner"
import ReceitaSection from "./Charts/Receitas/ReceitaSection"
import NotasSection from "./../Dashboard/Notas/NotasSection"

import { useState, useEffect, useRef } from "react"
import { api } from "../../services/api"

export default function Main() {
  const DEFAULT_LEAGUES = [
    { id: 5, name: "Premier League Russa de Futebol", color: "#1729b3" },
    { id: 3, name: "Brasileirão Série A", color: "#80de2e" },
  ];

  const [currency, setCurrency] = useState("BRL");

  const [selectedLeagues, setSelectedLeagues] = useState(
    DEFAULT_LEAGUES.map(l => l.id)
  );

  const [leagueMap, setLeagueMap] = useState(
    Object.fromEntries(DEFAULT_LEAGUES.map(l => [l.id, l.name]))
  );

  const [leagueColor, setLeagueColor] = useState(
    Object.fromEntries(
      DEFAULT_LEAGUES.map(l => [l.id, { color_one: l.color }])
    )
  );

  const [revenueData, setRevenueData] = useState({});

  /**
   * ref para evitar closure stale: sempre aponta para o estado atual
   */
  const revenueDataRef = useRef({});
  useEffect(() => { revenueDataRef.current = revenueData; }, [revenueData]);

  /**
   * ref de montagem: evita que o effect de moeda dispare no primeiro render
   * (o effect de ligas já cobre o carregamento inicial)
   */
  const mountedRef = useRef(false);

  /**
   * Busca receitas das ligas.
   * force=true  → re-busca TODAS as ligas (ex: moeda mudou).
   * force=false → busca apenas ligas ainda não em cache.
   */
  async function fetchRevenue(leagues, cur, force) {
    const existing = revenueDataRef.current;

    const toFetch = force
      ? [...leagues]
      : leagues.filter((id) => !existing[id]);

    if (toFetch.length === 0) return;

    try {
      const responses = await Promise.all(
        toFetch.map((leagueId) =>
          api.get(
            `/dashboard/leagues/${leagueId}/financials/revenues?to=${cur}&fromYear=2018&toYear=2024`
          )
        )
      );

      const newData = {};
      responses.forEach((res, i) => {
        newData[toFetch[i]] = res.data.data;
      });

      setRevenueData((prev) =>
        force
          ? newData                   // substitui tudo (moeda mudou)
          : { ...prev, ...newData }   // mescla (liga nova adicionada)
      );
    } catch (err) {
      console.error("Erro ao buscar receitas:", err);
    }
  }

  /**
   * Moeda mudou → re-fetch forçado de todas as ligas.
   * Pulado no primeiro render (mountedRef ainda false).
   */
  useEffect(() => {
    if (!mountedRef.current) return;
    if (selectedLeagues.length === 0) return;
    fetchRevenue(selectedLeagues, currency, true);
  }, [currency]);

  /**
   * Ligas mudaram → fetch incremental (só novas).
   * Marca montagem no primeiro run para liberar o effect de moeda.
   */
  useEffect(() => {
    mountedRef.current = true;
    fetchRevenue(selectedLeagues, currency, false);
  }, [selectedLeagues]);

  return (
    <div className="space-y-8">

      {/* Banners */}
      <div className="w-full grid mb-4">
        <HomeBanners />
      </div>

      {/* Gráfico receitas ligas */}
      <ReceitaSection
        data={revenueData}
        selectedLeagues={selectedLeagues}
        setSelectedLeagues={setSelectedLeagues}
        leagueMap={leagueMap}
        setLeagueMap={setLeagueMap}
        leagueColor={leagueColor}
        setLeagueColor={setLeagueColor}
        currency={currency}
        setCurrency={setCurrency}
      />

      <NotasSection />
    </div>
  );
}
