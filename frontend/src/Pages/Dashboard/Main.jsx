import HomeBanners from "../../components/uxui/banner"
import NotasSection from "./../Dashboard/Notas/NotasSection"
import RevenueSection from "./Leagues/components/revenue/RevenueSection"
import FinanceCarousel from "./Finance/FinanceCarousel"
import SlotRenderer from "../../components/publications/SlotRenderer"

import { useState, useEffect, useMemo, useContext } from "react"
import { Link } from "react-router-dom"
import { api } from "../../services/api"
import { worldCupLogo } from "../../utils/worldCupLogo"
import { AuthContext } from "../../context/AuthContext"
import { Crown, ArrowRight } from "lucide-react"

// Liga "FIFA Financeiro" — dados por ciclo de Copa do Mundo
const FIFA_LEAGUE_ID = 310;
const FIFA_COLOR = "#02285b";

export default function Main() {
  const { user } = useContext(AuthContext);
  const isFreePlan = !!user && user.plan_id === 1;

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

      {/* ══════════════ HOME MODULAR (Publicações) — em avaliação ══════════════ */}

      {/* Chamada grande (2 slots) */}
      <SlotRenderer pageKey="home" zone="hero" />

      {/* Banner de upgrade — só pra quem está no plano grátis */}
      {isFreePlan && (
        <Link
          to="/me/plans"
          className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-1 bg-gradient-to-r from-[#7F33D9] to-[#4C1D95] hover:opacity-95 transition-opacity"
        >
          <div className="w-full flex items-center justify-between gap-4 bg-white rounded-xl px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7F33D9]/10 flex items-center justify-center text-[#7F33D9] shrink-0">
                <Crown size={20} />
              </div>
              <div>
                <p className="font-semibold text-[#111] text-sm">Desbloqueie todo o potencial da plataforma</p>
                <p className="text-xs text-gray-500">Conheça os planos Premium e Business</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-[#7F33D9] shrink-0 whitespace-nowrap">
              Ver planos <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      )}

      {/* Carrossel automático — seção Finanças (curadoria manual em Publicações) */}
      <FinanceCarousel />

      {/* Corpo: gráfico + publicidade pequenos, big numbers (curadoria manual em Publicações) */}
      <SlotRenderer pageKey="home" zone="body" />

      <NotasSection />

      {/* ══════════════ FIM DO CONTEÚDO MODULAR ══════════════ */}


      {/* ──────────────────────────────────────────────────────────────────────
          LEGADO — layout fixo anterior, mantido só para comparação visual.
          Remover depois que a Home modular acima estiver aprovada e populada.
      ────────────────────────────────────────────────────────────────────── */}
      <div className="pt-10 mt-10 border-t-4 border-dashed border-gray-200">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-300 mb-6">
          ↓ Layout antigo (referência temporária) ↓
        </p>

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
        </div>
      </div>

      {/* Rodapé discreto — notas de atualização (políticas migraram p/ a sidebar) */}
      <footer className="pt-2 pb-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-300">
        <Link to="/update-notes" className="hover:text-gray-500 transition-colors">Notas de atualização</Link>
      </footer>
    </div>
  );
}
