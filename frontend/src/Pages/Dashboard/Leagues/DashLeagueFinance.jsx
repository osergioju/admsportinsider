import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";
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

import RevenueSection from "./components/revenue/RevenueSection";
import RevenueBreakdownSection from "./components/revenueBreak/RevenueBreakdownSection";
import PayrollSection from "./components/payroll/PayrollSection";
import CostsSection from "./components/costs/CostsSection";
import NetResultTableSection from "./components/netResult/NetResultTableSection";
import NetResultSection from "./components/netResult/NetResultSection";
import DebtsSection from "./components/debts/DebtsSection";

import { AuthContext } from "../../../context/AuthContext";
import PlanUpgradePrompt from "../Clubs/components/blockplan/PlanUpgradePrompt";

export default function DashLeagueFinance() {
  const { t } = useTranslation();
  const { id } = useParams();
  const mainLeagueId = Number(id);

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
  const [theLeague, setTheLeague] = useState(null);
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
        const [leagueRes, currenciesRes] = await Promise.all([
          api.get(`/dashboard/leagues/${id}/info`),
          api.get(`/dashboard/leagues/${id}/financials/currencies`),
        ]);
        setTheLeague(leagueRes.data);
        setLeagueMap({ [mainLeagueId]: leagueRes.data.league.name });
        setLeagueColor({ [mainLeagueId]: { color_one: leagueRes.data.league.primary_color } });
        setCurrencies(currenciesRes.data || []);
      } catch (err) {
        console.error("Erro ao carregar dashboard da liga:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [id, mainLeagueId]);

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
    const builders = {
      revenue:          (lid) => `/dashboard/leagues/${lid}/financials/revenues?to=${displayCurrency}&fromYear=2018&toYear=2025`,
      payroll:          (lid) => `/dashboard/leagues/${lid}/financials/costs/payroll?to=${displayCurrency}&fromYear=2018&toYear=2025`,
      costs:            (lid) => `/dashboard/leagues/${lid}/financials/costs/breakdown?to=${displayCurrency}`,
      netResult:        (lid) => `/dashboard/leagues/${lid}/financials/net-result?to=${displayCurrency}&fromYear=2021&toYear=2025`,
      netEvolution:     (lid) => `/dashboard/leagues/${lid}/financials/net-result/evolution?to=${displayCurrency}&fromYear=2018&toYear=2025`,
      debts:            (lid) => `/dashboard/leagues/${lid}/financials/debts/breakdown?to=${displayCurrency}`,
      revenueBreakdown: (lid) => `/dashboard/leagues/${lid}/financials/revenues/breakdown?to=${displayCurrency}`,
    };
    Object.entries(builders).forEach(([key, builder]) => {
      fetchChartData(key, builder, true);
    });
  }, [
    mainLeagueId, displayCurrency,
    chartComparisons.revenue, chartComparisons.payroll, chartComparisons.costs,
    chartComparisons.netResult, chartComparisons.netEvolution,
    chartComparisons.debts, chartComparisons.revenueBreakdown,
  ]);

  if (loading || !theLeague) {
    return <p className="text-sm text-gray-500">{t("ui.loading_dashboard", "Carregando dashboard…")}</p>;
  }

  const lg = theLeague.league;
  const sj = lg.structure_json ?? {};
  const competitionTitle = sj.competition_name ?? lg.name;

  const [c1, c2, c3] = resolveColors(lg.primary_color, lg.secondary_color, lg.tertiary_color);
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const glowPrimary = rgb1 ? `radial-gradient(circle, rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.45) 0%, transparent 70%)` : "rgba(0,0,0,0.2)";
  const glowSecondary = rgb2 ? `radial-gradient(circle, rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.35) 0%, transparent 70%)` : glowPrimary;

  return (
    <div className="space-y-6">
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
              {lg.logo_url && (
                <img
                  src={`https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${lg.slug}.webp`}
                  alt={competitionTitle}
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              )}
            </div>
            <div className="flex-1 justify-center min-w-0 items-center">
              <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold drop-shadow-md truncate">
                {competitionTitle}
              </h1>
              {lg.country_name && (
                <span className="inline-block mt-1.5 text-white/70 text-sm font-semibold bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                  {lg.country_name}
                </span>
              )}
            </div>
            {lg.flag_url && (
              <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden shadow-lg" style={{ border: "2px solid rgba(255,255,255,0.28)" }} title={lg.country_name}>
                <img src={lg.flag_url} alt={lg.country_name} className="w-full h-full object-cover" />
              </div>
            )}
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
