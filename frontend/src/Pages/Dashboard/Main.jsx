import HomeBanners from "../../components/uxui/banner"
import ReceitaSection from "./Charts/Receitas/ReceitaSection"
import NotasSection from "./../Dashboard/Notas/NotasSection"

import { useState, useEffect, useRef } from "react"
import { api } from "../../services/api"

export default function Main() {
  const DEFAULT_LEAGUES = [
    { id: 75, name: "J League 1", color: "#7f34d9" },
    { id: 22, name: "Austrian Football Bundesliga", color: "#7f34d9" },
    { id: 93, name: "Challenge League", color: "#7f34d9" },
    { id: 89, name: "Russian Premier League", color: "#7f34d9" }
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
  const [leagueMetaMap, setLeagueMetaMap] = useState({});

  const revenueDataRef = useRef({});
  useEffect(() => { revenueDataRef.current = revenueData; }, [revenueData]);

  const mountedRef = useRef(false);

  // Busca metadata (logo, bandeira, país) para ligas que ainda não têm entrada
  const leagueMetaMapRef = useRef({});
  useEffect(() => { leagueMetaMapRef.current = leagueMetaMap; }, [leagueMetaMap]);

  async function fetchLeagueMeta(ids) {
    const toFetch = ids.filter((id) => !leagueMetaMapRef.current[id]);
    if (!toFetch.length) return;
    const results = await Promise.allSettled(
      toFetch.map((id) => api.get(`/dashboard/leagues/${id}/info`))
    );
    const next = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        const l = r.value.data.league;
        console.log("[leagueMeta]", toFetch[i], { slug: l.slug, logo_url: l.logo_url });
        next[toFetch[i]] = { slug: l.slug, logo_url: l.logo_url, flag_url: l.flag_url, country_name: l.country_name };
      }
    });
    if (Object.keys(next).length) setLeagueMetaMap((p) => ({ ...p, ...next }));
  }

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
            `/dashboard/leagues/${leagueId}/financials/revenues?to=${cur}&fromYear=2018&toYear=${new Date().getFullYear()}`
          )
        )
      );
      const newData = {};
      responses.forEach((res, i) => { newData[toFetch[i]] = res.data.data; });
      setRevenueData((prev) =>
        force ? newData : { ...prev, ...newData }
      );
    } catch (err) {
      console.error("Erro ao buscar receitas:", err);
    }
  }

  useEffect(() => {
    if (!mountedRef.current) return;
    if (selectedLeagues.length === 0) return;
    fetchRevenue(selectedLeagues, currency, true);
  }, [currency]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRevenue(selectedLeagues, currency, false);
    fetchLeagueMeta(selectedLeagues);
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
        leagueMetaMap={leagueMetaMap}
        setLeagueMetaMap={setLeagueMetaMap}
        currency={currency}
        setCurrency={setCurrency}
      />

      <NotasSection />
    </div>
  );
}

