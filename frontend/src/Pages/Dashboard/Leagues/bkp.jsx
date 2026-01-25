import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";

// Sections (use as versões de League)
import RevenueSection from "./components/revenue/RevenueSection";
import RevenueBreakdownSection from "./components/revenueBreak/RevenueBreakdownSection";
import PayrollSection from "./components/payroll/PayrollSection";
import CostsSection from "./components/costs/CostsSection";
import NetResultTableSection from "./components/netResult/NetResultTableSection";
import NetResultSection from "./components/netResult/NetResultSection";
import DebtsSection from "./components/debts/DebtsSection";

export default function DashLeagueUniques() {
  const { id } = useParams();
  const mainLeagueId = Number(id);

  const [loading, setLoading] = useState(true);
  const [theLeague, setTheLeague] = useState(null);

  /**
   * id → nome da liga
   */
  const [leagueMap, setLeagueMap] = useState({});

  /**
   * ligas selecionadas POR GRÁFICO
   */
  const [chartComparisons, setChartComparisons] = useState({
    revenue: [],
    payroll: [],
    costs: [],
    netResult: [],
    netEvolution: [],
    debts: [],
    revenueBreakdown: []
  });

  /**
   * dados POR GRÁFICO
   * ex: chartData.revenue = { 1: [...], 3: [...] }
   */
  const [chartData, setChartData] = useState({
    revenue: {},
    payroll: {},
    costs: {},
    netResult: {},
    netEvolution: {},
    debts: {},
    revenueBreakdown: {}
  });

  /**
   * ligas por gráfico (sempre inclui a principal)
   */
  const leaguesForChart = (chartKey) => {
    return [
      mainLeagueId,
      ...chartComparisons[chartKey].filter(
        (leagueId) => Number(leagueId) !== mainLeagueId
      )
    ];
  };

  /**
   * load inicial (dados fixos da liga)
   */
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const [leagueRes] = await Promise.all([
          api.get(`/admin/leagues/${id}`)
        ]);

        setTheLeague(leagueRes.data);

        setLeagueMap({
          [mainLeagueId]: leagueRes.data.league.name
        });

      } catch (err) {
        console.error("Erro ao carregar dashboard da liga:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [id, mainLeagueId]);

  /**
   * fetch genérico por gráfico
   */
  async function fetchChartData(chartKey, endpointBuilder) {
    const leagues = leaguesForChart(chartKey);
    const existingData = chartData[chartKey];

    const leaguesToFetch = leagues.filter(
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
      console.error(`Erro ao buscar dados do gráfico ${chartKey}:`, err);
    }
  }

  /**
   * efeitos por gráfico
   */
  useEffect(() => {
    fetchChartData("revenue", (leagueId) =>
      `/dashboard/leagues/${leagueId}/financials/revenues`
    );
  }, [chartComparisons.revenue, mainLeagueId]);

  useEffect(() => {
    fetchChartData("payroll", (leagueId) =>
      `/dashboard/leagues/${leagueId}/financials/costs/payroll`
    );
  }, [chartComparisons.payroll, mainLeagueId]);

  useEffect(() => {
    fetchChartData("costs", (leagueId) =>
      `/dashboard/leagues/${leagueId}/financials/costs/breakdown`
    );
  }, [chartComparisons.costs, mainLeagueId]);

  useEffect(() => {
    fetchChartData("netResult", (leagueId) =>
      `/dashboard/leagues/${leagueId}/financials/net-result`
    );
  }, [chartComparisons.netResult, mainLeagueId]);

  useEffect(() => {
    fetchChartData("netEvolution", (leagueId) =>
      `/dashboard/leagues/${leagueId}/financials/net-result/evolution`
    );
  }, [chartComparisons.netEvolution, mainLeagueId]);

  useEffect(() => {
    fetchChartData("debts", (leagueId) =>
      `/dashboard/leagues/${leagueId}/financials/debts/breakdown`
    );
  }, [chartComparisons.debts, mainLeagueId]);

  useEffect(() => {
    fetchChartData("revenueBreakdown", (leagueId) =>
      `/dashboard/leagues/${leagueId}/financials/revenues/breakdown`
    );
  }, [chartComparisons.revenueBreakdown, mainLeagueId]);

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
      <div className="w-full">
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <RevenueSection
            data={chartData.revenue}
            selectedLeagues={chartComparisons.revenue}
            setSelectedLeagues={(updater) =>
              setChartComparisons((prev) => ({
                ...prev,
                revenue:
                  typeof updater === "function"
                    ? updater(prev.revenue)
                    : updater
              }))
            }
            leagueMap={leagueMap}
            setLeagueMap={setLeagueMap}
            mainLeagueId={mainLeagueId}
          />

          <RevenueBreakdownSection
            data={chartData.revenueBreakdown}
            selectedLeagues={chartComparisons.revenueBreakdown}
            setSelectedLeagues={(updater) =>
              setChartComparisons((prev) => ({
                ...prev,
                revenueBreakdown:
                  typeof updater === "function"
                    ? updater(prev.revenueBreakdown)
                    : updater
              }))
            }
            leagueMap={leagueMap}
            setLeagueMap={setLeagueMap}
            mainLeagueId={mainLeagueId}
          />
        </div>

        <div className="grid lg:grid-cols-1 gap-4 mb-4">
          <PayrollSection
            data={chartData.payroll}
            selectedLeagues={chartComparisons.payroll}
            setSelectedLeagues={(updater) =>
              setChartComparisons((prev) => ({
                ...prev,
                payroll:
                  typeof updater === "function"
                    ? updater(prev.payroll)
                    : updater
              }))
            }
            leagueMap={leagueMap}
            setLeagueMap={setLeagueMap}
            mainLeagueId={mainLeagueId}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <CostsSection
            data={chartData.costs}
            selectedLeagues={chartComparisons.costs}
            setSelectedLeagues={(updater) =>
              setChartComparisons((prev) => ({
                ...prev,
                costs:
                  typeof updater === "function"
                    ? updater(prev.costs)
                    : updater
              }))
            }
            leagueMap={leagueMap}
            setLeagueMap={setLeagueMap}
            mainLeagueId={mainLeagueId}
          />

          <NetResultSection
            data={chartData.netEvolution}
            selectedLeagues={chartComparisons.netEvolution}
            setSelectedLeagues={(updater) =>
              setChartComparisons((prev) => ({
                ...prev,
                netEvolution:
                  typeof updater === "function"
                    ? updater(prev.netEvolution)
                    : updater
              }))
            }
            leagueMap={leagueMap}
            setLeagueMap={setLeagueMap}
            mainLeagueId={mainLeagueId}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <DebtsSection
            data={chartData.debts}
            selectedLeagues={chartComparisons.debts}
            setSelectedLeagues={(updater) =>
              setChartComparisons((prev) => ({
                ...prev,
                debts:
                  typeof updater === "function"
                    ? updater(prev.debts)
                    : updater
              }))
            }
            leagueMap={leagueMap}
            setLeagueMap={setLeagueMap}
            mainLeagueId={mainLeagueId}
          />

          <NetResultTableSection
            data={chartData.netResult}
            selectedLeagues={chartComparisons.netResult}
            setSelectedLeagues={(updater) =>
              setChartComparisons((prev) => ({
                ...prev,
                netResult:
                  typeof updater === "function"
                    ? updater(prev.netResult)
                    : updater
              }))
            }
            leagueMap={leagueMap}
            setLeagueMap={setLeagueMap}
            mainLeagueId={mainLeagueId}
          />
        </div>
      </div>
    </div>
  );
}
