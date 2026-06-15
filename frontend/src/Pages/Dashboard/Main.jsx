import HomeBanners from "../../components/uxui/banner"
import NotasSection from "./../Dashboard/Notas/NotasSection"
import RevenueSection from "./Leagues/components/revenue/RevenueSection"

import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
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

  // Apenas as moedas da página de finanças da FIFA: dólar, euro, real e libra
  const ALLOWED_CURRENCIES = ["USD", "EUR", "BRL", "GBP"];

  useEffect(() => {
    api.get(`/dashboard/leagues/${FIFA_LEAGUE_ID}/financials/currencies`)
      .then(({ data }) => setCurrencies((data || []).filter(c => ALLOWED_CURRENCIES.includes(c.code))))
      .catch(() => setCurrencies([]));
  }, []);

  // Mesmo endpoint da página de finanças da FIFA — conversão por ano idêntica
  useEffect(() => {
    api.get(`/dashboard/federations/fifa/finance-overview?to=${currency}`)
      .then(({ data }) => {
        const items = (data.editions || []).map(e => ({
          code: "revenue",
          year: e.edition_year,
          value: data.series?.revenue?.[e.edition_year] ?? null,
          converted_value: data.series?.revenue?.[e.edition_year] ?? null,
          edition_name: e.name,
        }));
        setRevenueData({ [FIFA_LEAGUE_ID]: items });
      })
      .catch((err) => console.error("Erro ao buscar receitas:", err));
  }, [currency]);

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
          title="Receitas da Fifa"
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
          showCompare={false}
          integratedTable
        />
      </div>

      <NotasSection />

      {/* Rodapé discreto — links de políticas (verificação Google OAuth) */}
      <footer className="pt-2 pb-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-300">
        <Link to="/privacidade" className="hover:text-gray-500 transition-colors">Política de Privacidade</Link>
        <span className="text-gray-200">·</span>
        <Link to="/legal" className="hover:text-gray-500 transition-colors">Responsabilidade legal</Link>
      </footer>
    </div>
  );
}
