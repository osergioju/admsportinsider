import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";

import RevenueSection from "./components/revenue/RevenueSection";
import RevenueBreakdownSection from "./components/revenueBreak/RevenueBreakdownSection";
import PayrollSection from "./components/payroll/PayrollSection";
import CostsSection from "./components/costs/CostsSection";
import NetResultTableSection from "./components/netResult/NetResultTableSection";
import NetResultSection from "./components/netResult/NetResultSection";
import DebtsSection from "./components/debts/DebtsSection";

import { AuthContext } from "../../../context/AuthContext";
import PlanUpgradePrompt from "../Clubs/components/blockplan/PlanUpgradePrompt";

export default function DashLeagueUniques() {
  const { id } = useParams();
  const mainLeagueId = Number(id);

  // Usuário & plano
  const { user } = useContext(AuthContext);
  const planID = user?.plan_id;

  // Permissões por gráfico
  const chartPermissions = {
    revenue: [1, 2, 3],
    payroll: [2, 3],
    costs: [3],
    netResult: [2, 3],
    netEvolution: [2, 3],
    debts: [1, 2, 3],
    revenueBreakdown: [1, 2, 3],
  };

  const hasAccess = (chartKey, planID) =>
    chartPermissions[chartKey]?.includes(planID);

  const [loading, setLoading] = useState(true);
  const [theLeague, setTheLeague] = useState(null);

  // id → nome da liga (global, reaproveitado)
  const [leagueMap, setLeagueMap] = useState({});
  const [leagueColor, setLeagueColor] = useState({});

  // Moeda por gráfico
  const [chartCurrencies, setChartCurrencies] = useState({
    revenue: user.currency_code,
    payroll: user.currency_code,
    costs: user.currency_code,
    netResult: user.currency_code,
    netEvolution: user.currency_code,
    debts: user.currency_code,
    revenueBreakdown: user.currency_code,
  });

  // Ligas selecionadas POR GRÁFICO
  const [chartComparisons, setChartComparisons] = useState({
    revenue: [],
    payroll: [],
    costs: [],
    netResult: [],
    netEvolution: [],
    debts: [],
    revenueBreakdown: [],
  });

  // Dados POR GRÁFICO — ex: chartData.revenue = { 1: [...], 3: [...] }
  const [chartData, setChartData] = useState({
    revenue: {},
    payroll: {},
    costs: {},
    netResult: {},
    netEvolution: {},
    debts: {},
    revenueBreakdown: {},
  });

  // Ligas por gráfico (sempre inclui a principal)
  const leaguesForChart = (chartKey) => [
    mainLeagueId,
    ...chartComparisons[chartKey].filter(
      (leagueId) => Number(leagueId) !== mainLeagueId
    ),
  ];

  // Load inicial (dados fixos da liga)
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const [leagueRes] = await Promise.all([
          api.get(`/admin/leagues/${id}`),
        ]);

        setTheLeague(leagueRes.data);

        setLeagueMap({
          [mainLeagueId]: leagueRes.data.league.name,
        });

        setLeagueColor({
          [mainLeagueId]: {
            color_one: leagueRes.data.league.primary_color,
          },
        });
      } catch (err) {
        console.error("Erro ao carregar dashboard da liga:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [id, mainLeagueId]);

  // Fetch genérico por gráfico (com suporte a force, igual ao Clubs)
  async function fetchChartData(chartKey, endpointBuilder, force = false) {
    const leagues = leaguesForChart(chartKey);
    const existingData = chartData[chartKey];

    const leaguesToFetch = force
      ? leagues
      : leagues.filter((leagueId) => !existingData[leagueId]);

    if (leaguesToFetch.length === 0) return;

    try {
      const responses = await Promise.all(
        leaguesToFetch.map((leagueId) => api.get(endpointBuilder(leagueId)))
      );

      const newData = {};
      responses.forEach((res, index) => {
        newData[leaguesToFetch[index]] = res.data.data;
      });

      setChartData((prev) => ({
        ...prev,
        [chartKey]: {
          ...prev[chartKey],
          ...newData,
        },
      }));
    } catch (err) {
      console.error(`Erro ao buscar dados do gráfico ${chartKey}:`, err);
    }
  }

  // ✅ Evolução temporal — com filtros de ano
  useEffect(() => {
    fetchChartData(
      "revenue",
      (leagueId) =>
        `/dashboard/leagues/${leagueId}/financials/revenues?from=RUB&to=${chartCurrencies.revenue}&fromYear=2018&toYear=2024`,
      true
    );
  }, [chartComparisons.revenue, mainLeagueId, chartCurrencies.revenue]);

  // ✅ Evolução temporal — com filtros de ano
  useEffect(() => {
    fetchChartData(
      "payroll",
      (leagueId) =>
        `/dashboard/leagues/${leagueId}/financials/costs/payroll?from=RUB&to=${chartCurrencies.payroll}&fromYear=2018&toYear=2024`,
      true
    );
  }, [chartComparisons.payroll, mainLeagueId, chartCurrencies.payroll]);

  // ❌ Breakdown do último ano apenas — sem filtros de ano
  useEffect(() => {
    fetchChartData(
      "costs",
      (leagueId) =>
        `/dashboard/leagues/${leagueId}/financials/costs/breakdown?from=RUB&to=${chartCurrencies.costs}`,
      true
    );
  }, [chartComparisons.costs, mainLeagueId, chartCurrencies.costs]);

  // ✅ Evolução temporal — últimos 3 anos, 12 registros
  useEffect(() => {
    fetchChartData(
      "netResult",
      (leagueId) =>
        `/dashboard/leagues/${leagueId}/financials/net-result?from=RUB&to=${chartCurrencies.netResult}&fromYear=2021&toYear=2024`,
      true
    );
  }, [chartComparisons.netResult, mainLeagueId, chartCurrencies.netResult]);

  // ✅ Evolução temporal — com filtros de ano
  useEffect(() => {
    fetchChartData(
      "netEvolution",
      (leagueId) =>
        `/dashboard/leagues/${leagueId}/financials/net-result/evolution?from=RUB&to=${chartCurrencies.netEvolution}&fromYear=2018&toYear=2024`,
      true
    );
  }, [chartComparisons.netEvolution, mainLeagueId, chartCurrencies.netEvolution]);

  // ❌ Breakdown do último ano apenas — sem filtros de ano
  useEffect(() => {
    fetchChartData(
      "debts",
      (leagueId) =>
        `/dashboard/leagues/${leagueId}/financials/debts/breakdown?from=RUB&to=${chartCurrencies.debts}`,
      true
    );
  }, [chartComparisons.debts, mainLeagueId, chartCurrencies.debts]);

  // ❌ Breakdown do último ano apenas — sem filtros de ano
  useEffect(() => {
    fetchChartData(
      "revenueBreakdown",
      (leagueId) =>
        `/dashboard/leagues/${leagueId}/financials/revenues/breakdown?from=RUB&to=${chartCurrencies.revenueBreakdown}`,
      true
    );
  }, [chartComparisons.revenueBreakdown, mainLeagueId, chartCurrencies.revenueBreakdown]);

  if (loading || !theLeague) {
    return <p className="text-sm text-gray-500">Carregando dashboard…</p>;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="w-full bg-white border rounded-2xl p-6 lg:p-10 flex items-center">
        <img
          src={theLeague.league.logo_url}
          className="w-20"
          alt={theLeague.league.name}
        />
        <div className="ml-6">
          <h3 className="text-2xl lg:text-3xl font-light flex items-center gap-2">
            {theLeague.league.name}
            <span className="text-gray-400">—</span>
            {theLeague.league.country_name}
            <img className="w-6" src={theLeague.league.flag_url} />
          </h3>
          {theLeague.league.description && (
            <p className="text-sm text-gray-500 mt-2 max-w-3xl">
              {theLeague.league.description}
            </p>
          )}
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="max-w-full w-full overflow-hidden relative">

        <div className="max-w-full w-full grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("revenue", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <RevenueSection
              data={chartData.revenue}
              selectedLeagues={chartComparisons.revenue}
              setSelectedLeagues={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  revenue:
                    typeof updater === "function"
                      ? updater(prev.revenue)
                      : updater,
                }))
              }
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              mainLeagueId={mainLeagueId}
              currency={chartCurrencies.revenue}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({ ...prev, revenue: value }))
              }
            />
          )}

          {!hasAccess("revenueBreakdown", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <RevenueBreakdownSection
              data={chartData.revenueBreakdown}
              selectedLeagues={chartComparisons.revenueBreakdown}
              setSelectedLeagues={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  revenueBreakdown:
                    typeof updater === "function"
                      ? updater(prev.revenueBreakdown)
                      : updater,
                }))
              }
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={chartCurrencies.revenueBreakdown}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({ ...prev, revenueBreakdown: value }))
              }
            />
          )}
        </div>

        <div className="w-full grid lg:grid-cols-1 gap-4 mb-4">
          {!hasAccess("payroll", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <PayrollSection
              data={chartData.payroll}
              selectedLeagues={chartComparisons.payroll}
              setSelectedLeagues={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  payroll:
                    typeof updater === "function"
                      ? updater(prev.payroll)
                      : updater,
                }))
              }
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={chartCurrencies.payroll}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({ ...prev, payroll: value }))
              }
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("costs", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <CostsSection
              data={chartData.costs}
              selectedLeagues={chartComparisons.costs}
              setSelectedLeagues={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  costs:
                    typeof updater === "function"
                      ? updater(prev.costs)
                      : updater,
                }))
              }
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={chartCurrencies.costs}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({ ...prev, costs: value }))
              }
            />
          )}

          {!hasAccess("netResult", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <NetResultSection
              data={chartData.netEvolution}
              selectedLeagues={chartComparisons.netEvolution}
              setSelectedLeagues={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  netEvolution:
                    typeof updater === "function"
                      ? updater(prev.netEvolution)
                      : updater,
                }))
              }
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={chartCurrencies.netEvolution}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({ ...prev, netEvolution: value }))
              }
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("debts", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <DebtsSection
              data={chartData.debts}
              selectedLeagues={chartComparisons.debts}
              setSelectedLeagues={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  debts:
                    typeof updater === "function"
                      ? updater(prev.debts)
                      : updater,
                }))
              }
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={chartCurrencies.debts}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({ ...prev, debts: value }))
              }
            />
          )}

          {!hasAccess("netResult", planID) ? (
            <PlanUpgradePrompt title="Gráfico de receitas disponível apenas para os planos Pro e Premium" />
          ) : (
            <NetResultTableSection
              data={chartData.netResult}
              selectedLeagues={chartComparisons.netResult}
              setSelectedLeagues={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  netResult:
                    typeof updater === "function"
                      ? updater(prev.netResult)
                      : updater,
                }))
              }
              leagueMap={leagueMap}
              setLeagueMap={setLeagueMap}
              mainLeagueId={mainLeagueId}
              leagueColor={leagueColor}
              setLeagueColor={setLeagueColor}
              currency={chartCurrencies.netResult}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({ ...prev, netResult: value }))
              }
            />
          )}
        </div>

      </div>
    </div>
  );
}