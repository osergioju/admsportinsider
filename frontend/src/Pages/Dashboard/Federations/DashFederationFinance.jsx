import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import { api } from "../../../services/api";
import { federationLogo } from "../../../utils/federationUrl";
import { useTranslation } from "../../../context/TranslationContext";

function hexToRgb(hex) {
  if (!hex) return null;
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3
    ? cleaned.split("").map(c => c + c).join("")
    : cleaned;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function resolveColors(primary, secondary, tertiary) {
  const c1 = primary || "#1a1a2e";
  const c2 = secondary || c1;
  const c3 = tertiary || c2;
  return [c1, c2, c3];
}
// Primeira cor visível sobre fundo branco (pula brancos/quase-brancos)
function pickChartColor(...colors) {
  for (const c of colors) {
    const rgb = hexToRgb(c);
    if (!rgb) continue;
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    if (lum < 0.85) return c;
  }
  return "#7F33D9";
}

import RevenueSection from "../Leagues/components/revenue/RevenueSection";
import RevenueBreakdownSection from "../Leagues/components/revenueBreak/RevenueBreakdownSection";
import PayrollSection from "../Leagues/components/payroll/PayrollSection";
import CostsSection from "../Leagues/components/costs/CostsSection";
import NetResultTableSection from "../Leagues/components/netResult/NetResultTableSection";
import NetResultSection from "../Leagues/components/netResult/NetResultSection";
import DebtsSection from "../Leagues/components/debts/DebtsSection";

import { AuthContext } from "../../../context/AuthContext";
import PlanUpgradePrompt from "../Clubs/components/blockplan/PlanUpgradePrompt";

export default function DashFederationFinance() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [federation, setFederation] = useState(null);
  const [mainLeagueId, setMainLeagueId] = useState(null);
  const [theLeague, setTheLeague] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const { user } = useContext(AuthContext);
  const planID = user?.plan_id;

  const chartPermissions = {
    revenue: [1, 2, 3],
    payroll: [1, 2, 3],
    costs: [1, 2, 3],
    netResult: [1, 2, 3],
    netEvolution: [1, 2, 3],
    debts: [1, 2, 3],
    revenueBreakdown: [1, 2, 3],
  };

  const hasAccess = (chartKey, planID) => {
    if (!user) return true;
    return chartPermissions[chartKey]?.includes(planID);
  };

  const [loading, setLoading] = useState(true);
  const [leagueMap, setLeagueMap] = useState({});
  const [leagueColor, setLeagueColor] = useState({});

  const defaultCurrency = user?.currency_code ?? "BRL";
  const [displayCurrency, setDisplayCurrency] = useState(defaultCurrency);
  const [currencies, setCurrencies] = useState([]);

  const [chartComparisons, setChartComparisons] = useState({
    revenue: [],
    payroll: [],
    costs: [],
    netResult: [],
    netEvolution: [],
    debts: [],
    revenueBreakdown: [],
  });

  const [chartData, setChartData] = useState({
    revenue: {},
    payroll: {},
    costs: {},
    netResult: {},
    netEvolution: {},
    debts: {},
    revenueBreakdown: {},
  });

  const leaguesForChart = (chartKey) => [
    mainLeagueId,
    ...chartComparisons[chartKey].filter((lid) => Number(lid) !== mainLeagueId),
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const fedRes = await api.get(`/dashboard/federations/${slug}`);
        const fed = fedRes.data.federation;
        setFederation(fed);

        // Sem liga financeira vinculada → renderiza a página com gráficos vazios
        // (mesmo comportamento de clubes/ligas sem dados)
        const numId = fed.financial_league_id;
        if (!numId) return;

        const [leagueRes, currenciesRes] = await Promise.all([
          api.get(`/dashboard/leagues/${numId}/info`),
          api.get(`/dashboard/leagues/${numId}/financials/currencies`),
        ]);
        setMainLeagueId(numId);
        setTheLeague(leagueRes.data);
        setLeagueMap({ [numId]: fed.acronym || fed.name });
        setLeagueColor({ [numId]: { color_one: pickChartColor(fed.primary_color, fed.secondary_color, fed.tertiary_color) } });
        setCurrencies(currenciesRes.data || []);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else console.error("Erro ao carregar dashboard da federação:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [slug]);

  async function fetchChartData(chartKey, endpointBuilder, force = false) {
    const leagues = leaguesForChart(chartKey);
    const existingData = chartData[chartKey];
    const leaguesToFetch = force ? leagues : leagues.filter((lid) => !existingData[lid]);
    if (leaguesToFetch.length === 0) return;
    try {
      const responses = await Promise.all(
        leaguesToFetch.map((lid) => api.get(endpointBuilder(lid)))
      );
      const newData = {};
      responses.forEach((res, index) => { newData[leaguesToFetch[index]] = res.data.data; });
      setChartData((prev) => ({ ...prev, [chartKey]: { ...prev[chartKey], ...newData } }));
    } catch (err) {
      console.error(`Erro ao buscar dados do gráfico ${chartKey}:`, err);
    }
  }

  useEffect(() => {
    if (!mainLeagueId) return;
    if (!theLeague) return; // aguarda info da liga para saber se tem edições
    // Ligas com edições (Copa do Mundo, Euro…) não têm filtro de ano — exibem todos os ciclos
    const hasEditions = theLeague?.league?.has_editions;
    const yearParams  = hasEditions ? "" : "&fromYear=2018&toYear=2025";
    const yearParamsNR = hasEditions ? "" : "&fromYear=2021&toYear=2025";
    const builders = {
      revenue:          (lid) => `/dashboard/leagues/${lid}/financials/revenues?to=${displayCurrency}${yearParams}`,
      payroll:          (lid) => `/dashboard/leagues/${lid}/financials/costs/payroll?to=${displayCurrency}${yearParams}`,
      costs:            (lid) => `/dashboard/leagues/${lid}/financials/costs/breakdown?to=${displayCurrency}`,
      netResult:        (lid) => `/dashboard/leagues/${lid}/financials/net-result?to=${displayCurrency}${yearParamsNR}`,
      netEvolution:     (lid) => `/dashboard/leagues/${lid}/financials/net-result/evolution?to=${displayCurrency}${yearParams}`,
      debts:            (lid) => `/dashboard/leagues/${lid}/financials/debts/breakdown?to=${displayCurrency}`,
      revenueBreakdown: (lid) => `/dashboard/leagues/${lid}/financials/revenues/breakdown?to=${displayCurrency}`,
    };
    Object.entries(builders).forEach(([key, builder]) => {
      fetchChartData(key, builder, true);
    });
  }, [
    mainLeagueId, displayCurrency, theLeague,
    chartComparisons.revenue, chartComparisons.payroll, chartComparisons.costs,
    chartComparisons.netResult, chartComparisons.netEvolution,
    chartComparisons.debts, chartComparisons.revenueBreakdown,
  ]);

  if (notFound) {
    return (
      <div className="w-full pb-20">
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <Shield size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm font-medium mb-1">Federação não encontrada</p>
          <button onClick={() => navigate("/dashboard/federations")} className="mt-4 text-sm text-[#7F33D9] font-bold hover:underline">
            Voltar para federações
          </button>
        </div>
      </div>
    );
  }

  if (loading || !federation) {
    return <p className="text-sm text-gray-500">{t("ui.loading_dashboard", "Carregando dashboard…")}</p>;
  }

  const fedName = federation.acronym || federation.name;

  const [c1, c2, c3] = resolveColors(federation.primary_color, federation.secondary_color, federation.tertiary_color);
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const glowPrimary = rgb1 ? `radial-gradient(circle, rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.45) 0%, transparent 70%)` : "rgba(0,0,0,0.2)";
  const glowSecondary = rgb2 ? `radial-gradient(circle, rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.35) 0%, transparent 70%)` : glowPrimary;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/dashboard/federations/${slug}`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#7F33D9] transition font-medium"
        >
          <ChevronLeft size={16} />{t("ui.back", "Voltar")}
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-2">
          {federation.slug
            ? <img src={federationLogo(federation.slug, "thumb")} className="w-5 h-5 object-contain" alt={federation.acronym} onError={e => e.currentTarget.style.display = "none"} />
            : <Shield size={14} className="text-[#7F33D9]" />
          }
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{federation.name}</span>
        </div>
      </div>

      {/* HEADER */}
      <div
        className="w-full rounded-2xl overflow-hidden relative"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, ${c1} 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, ${c2} 0%, transparent 60%),
            linear-gradient(135deg, ${c1}, ${c2}, ${c3})
          `,
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)" }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none blur-3xl" style={{ background: glowPrimary }} />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none blur-3xl" style={{ background: glowSecondary }} />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center p-2.5">
              {federation.slug
                ? <img
                    src={federationLogo(federation.slug, "medium")}
                    alt={federation.name}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                : <Shield size={40} className="text-white/60" />
              }
            </div>
            <div className="flex-1 justify-center min-w-0 items-center">
              <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold drop-shadow-md truncate">
                {fedName}
              </h1>
              {federation.full_name && (
                <span className="inline-block mt-1.5 text-white/70 text-sm font-semibold bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                  {federation.full_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICOS FINANCEIROS */}
      <div className="max-w-full w-full overflow-hidden relative">

        <div className="max-w-full w-full grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("revenue", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <RevenueSection
              data={chartData.revenue}
              selectedLeagues={chartComparisons.revenue}
              setSelectedLeagues={(updater) => setChartComparisons((prev) => ({ ...prev, revenue: typeof updater === "function" ? updater(prev.revenue) : updater }))}
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              mainLeagueId={mainLeagueId}
              currency={displayCurrency}
              setCurrency={setDisplayCurrency}
              currencies={currencies}
            />
          )}

          {!hasAccess("revenueBreakdown", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <RevenueBreakdownSection
              data={chartData.revenueBreakdown}
              selectedLeagues={chartComparisons.revenueBreakdown}
              setSelectedLeagues={(updater) => setChartComparisons((prev) => ({ ...prev, revenueBreakdown: typeof updater === "function" ? updater(prev.revenueBreakdown) : updater }))}
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={displayCurrency}
              setCurrency={setDisplayCurrency}
              currencies={currencies}
            />
          )}
        </div>

        <div className="w-full grid lg:grid-cols-1 gap-4 mb-4">
          {!hasAccess("payroll", planID) ? (
            <PlanUpgradePrompt title="Gráfico de folha salarial disponível apenas para os planos Pro e Premium" />
          ) : (
            <PayrollSection
              data={chartData.payroll}
              selectedLeagues={chartComparisons.payroll}
              setSelectedLeagues={(updater) => setChartComparisons((prev) => ({ ...prev, payroll: typeof updater === "function" ? updater(prev.payroll) : updater }))}
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={displayCurrency}
              setCurrency={setDisplayCurrency}
              currencies={currencies}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("costs", planID) ? (
            <PlanUpgradePrompt title="Gráfico de custos disponível apenas para os planos Pro e Premium" />
          ) : (
            <CostsSection
              data={chartData.costs}
              selectedLeagues={chartComparisons.costs}
              setSelectedLeagues={(updater) => setChartComparisons((prev) => ({ ...prev, costs: typeof updater === "function" ? updater(prev.costs) : updater }))}
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={displayCurrency}
              setCurrency={setDisplayCurrency}
              currencies={currencies}
            />
          )}

          {!hasAccess("netResult", planID) ? (
            <PlanUpgradePrompt title="Gráfico de resultado líquido disponível apenas para os planos Pro e Premium" />
          ) : (
            <NetResultSection
              data={chartData.netEvolution}
              selectedLeagues={chartComparisons.netEvolution}
              setSelectedLeagues={(updater) => setChartComparisons((prev) => ({ ...prev, netEvolution: typeof updater === "function" ? updater(prev.netEvolution) : updater }))}
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={displayCurrency}
              setCurrency={setDisplayCurrency}
              currencies={currencies}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("debts", planID) ? (
            <PlanUpgradePrompt title="Gráfico de dívidas disponível apenas para os planos Pro e Premium" />
          ) : (
            <DebtsSection
              data={chartData.debts}
              selectedLeagues={chartComparisons.debts}
              setSelectedLeagues={(updater) => setChartComparisons((prev) => ({ ...prev, debts: typeof updater === "function" ? updater(prev.debts) : updater }))}
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={displayCurrency}
              setCurrency={setDisplayCurrency}
              currencies={currencies}
            />
          )}

          {!hasAccess("netResult", planID) ? (
            <PlanUpgradePrompt title="Gráfico de resultado financeiro disponível apenas para os planos Pro e Premium" />
          ) : (
            <NetResultTableSection
              data={chartData.netResult}
              selectedLeagues={chartComparisons.netResult}
              setSelectedLeagues={(updater) => setChartComparisons((prev) => ({ ...prev, netResult: typeof updater === "function" ? updater(prev.netResult) : updater }))}
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={displayCurrency}
              setCurrency={setDisplayCurrency}
              currencies={currencies}
            />
          )}
        </div>

      </div>
    </div>
  );
}
