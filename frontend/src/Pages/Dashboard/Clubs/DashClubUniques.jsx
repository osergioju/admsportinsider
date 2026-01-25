import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";
import { CalendarDays, Castle, Handshake } from "lucide-react";

// Sections
import RevenueSection from "./components/revenue/RevenueSection";
import RevenueBreakdownSection from "./components/revenueBreak/RevenueBreakdownSection";
import PayrollSection from "./components/payroll/PayrollSection";
import CostsSection from "./components/costs/CostsSection";
import NetResultTableSection from "./components/netResult/NetResultTableSection";
import NetResultSection from "./components/netResult/NetResultSection";
import DebtsSection from "./components/debts/DebtsSection";

export default function DashClubUniques() {
  const { id } = useParams();
  const mainClubId = Number(id);

  const [loading, setLoading] = useState(true);
  const [theClub, setTheClub] = useState(null);

  /**
   * apa id → nome do clube (global, reaproveitado)
   */
  const [clubMap, setClubMap] = useState({});
  const [clubColorMap, setClubColorMap] = useState({});

  /**
   * clubes selecionados POR GRÁFICO
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
    netEvolution : {},
    debts: {},
    revenueBreakdown: {}
  });

  // dados fixos (sem comparação)
  const [revenuesBreakdown, setRevenuesBreakdown] = useState(null);
  const [payrollCosts, setPayrollCosts] = useState(null);
  const [costsBreakdown, setCostsBreakdown] = useState(null);
  const [netResult, setNetResult] = useState(null);
  const [netEvolution, setNetEvolution] = useState(null);
  const [debtsBreakdown, setDebtsBreakdown] = useState(null);
  const [debtsEvolution, setDebtsEvolution] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [availableYears, setAvailableYears] = useState(null);

  /**
   * clubes por gráfico (sempre inclui o principal)
   */
  const clubsForChart = (chartKey) => {
    return [
      mainClubId,
      ...chartComparisons[chartKey].filter(
        (clubId) => Number(clubId) !== mainClubId
      )
    ];
  };

  /**
   * load inicial (dados fixos do clube)
   */
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const [
          theclubData,
          revenuesBreakdownRes,
          payrollCostsRes,
          costsBreakdownRes,
          netResultRes,
          netResultEvolutionRes,
          debtsBreakdownRes,
          debtsEvolutionRes,
          indicatorsRes,
          yearsRes
        ] = await Promise.all([
          api.get(`/admin/clubs/${id}`),
          api.get(`/dashboard/clubs/${id}/financials/revenues/breakdown`),
          api.get(`/dashboard/clubs/${id}/financials/costs/payroll`),
          api.get(`/dashboard/clubs/${id}/financials/costs/breakdown`),
          api.get(`/dashboard/clubs/${id}/financials/net-result`),
          api.get(`/dashboard/clubs/${id}/financials/net-result/evolution`),
          api.get(`/dashboard/clubs/${id}/financials/debts/breakdown`),
          api.get(`/dashboard/clubs/${id}/financials/debts/evolution`),
          api.get(`/dashboard/clubs/${id}/financials/indicators`),
          api.get(`/dashboard/clubs/${id}/financials/available-years`)
        ]);

        setTheClub(theclubData.data);

        setClubMap({
          [mainClubId]: theclubData.data.club.name
        });

        // Seta a cor aqui
        setClubColorMap({
          [mainClubId]: {
            color_one: theclubData.data.club.primary_color,
            color_two: theclubData.data.club.secondary_color
          }
        })

        setRevenuesBreakdown(revenuesBreakdownRes.data);
        setPayrollCosts(payrollCostsRes.data);
        setCostsBreakdown(costsBreakdownRes.data);
        setNetResult(netResultRes.data);
        setNetEvolution(netResultEvolutionRes.data);
        setDebtsBreakdown(debtsBreakdownRes.data);
        setDebtsEvolution(debtsEvolutionRes.data);
        setIndicators(indicatorsRes.data);
        setAvailableYears(yearsRes.data);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [id, mainClubId]);

  /**
   * fetch genérico por gráfico
   */
  async function fetchChartData(chartKey, endpointBuilder) {
    const clubs = clubsForChart(chartKey);
    const existingData = chartData[chartKey];

    const clubsToFetch = clubs.filter(
      (clubId) => !existingData[clubId]
    );

    if (clubsToFetch.length === 0) return;

    try {
      const responses = await Promise.all(
        clubsToFetch.map((clubId) =>
          api.get(endpointBuilder(clubId))
        )
      );

      const newData = {};
      responses.forEach((res, index) => {
        newData[clubsToFetch[index]] = res.data.data;
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
    fetchChartData("revenue", (clubId) =>
      `/dashboard/clubs/${clubId}/financials/revenues`
    );
  }, [chartComparisons.revenue, mainClubId]);

  useEffect(() => {
    fetchChartData("payroll", (clubId) =>
      `/dashboard/clubs/${clubId}/financials/costs/payroll`
    );
  }, [chartComparisons.payroll, mainClubId]);

  useEffect(() => {
    fetchChartData("costs", (clubId) =>
      `/dashboard/clubs/${clubId}/financials/costs/breakdown`
    );
  }, [chartComparisons.costs, mainClubId]);

  useEffect(() => {
    fetchChartData("netResult", (clubId) =>
      `/dashboard/clubs/${clubId}/financials/net-result`
    );
  }, [chartComparisons.netResult, mainClubId]);

  useEffect(() => {
    fetchChartData("netEvolution", (clubId) =>
      `/dashboard/clubs/${clubId}/financials/net-result/evolution`
    );
  }, [chartComparisons.netEvolution, mainClubId]);


  useEffect(() => {
    fetchChartData("debts", (clubId) =>
      `/dashboard/clubs/${clubId}/financials/debts/breakdown`
    );
  }, [chartComparisons.debts, mainClubId]);

  useEffect(() => {
    fetchChartData("revenueBreakdown", (clubId) =>
      `/dashboard/clubs/${clubId}/financials/revenues/breakdown`
    );
  }, [chartComparisons.revenueBreakdown, mainClubId]);


  if (loading || !theClub) {
    return <p className="text-sm text-gray-500">Carregando dashboard…</p>;
  }

  const foundedAt = theClub?.club?.founded_at
    ? theClub.club.founded_at
        .split("T")[0]
        .split("-")
        .reverse()
        .join("/")
    : "—";


  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div
        className="relative w-full p-4 flex items-center lg:px-6 rounded-2xl border"
        style={{
          background: `linear-gradient(
            135deg,
            ${theClub.club.primary_color} 85%,
            ${theClub.club.secondary_color || "#FFF5F5"} 106%
          )`
        }}
      >
        <div className="overflow-hidden absolute bg-black rounded-full w-10 h-10 right-4 top-4">
          <img className="h-full" src={theClub.club.flag_url} alt="" />
        </div>

        <img src={theClub.club.crest_url} className="w-20 lg:w-36" alt="" />

        <div className="ml-4 lg:ml-10 border-b border-white pb-4 lg:pb-6">
          <h3 className="text-white text-2xl mb-3 lg:text-3xl font-light">
            {theClub.club.name}
          </h3>

          <ul className="flex items-center gap-4">
            <li className="text-white text-sm flex items-center gap-2">
              <CalendarDays className="w-4" />
              Fundação: <strong>{foundedAt}</strong>
            </li>

            <li className="text-white text-sm flex items-center gap-2">
              <Castle className="w-4" />
              {theClub.club?.stadium_name || "Estádio não informado"}
            </li>

            <li className="text-white text-sm flex items-center gap-2">
              <Handshake className="w-4" />
              {theClub.club?.ownership_model || "Modelo não informado"}
            </li>
          </ul>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="w-full">
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <RevenueSection
              data={chartData.revenue}
              selectedClubs={chartComparisons.revenue}
              setSelectedClubs={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  revenue:
                    typeof updater === "function"
                      ? updater(prev.revenue)
                      : updater
                }))
              }
              clubMap={clubMap}
              setClubMap={setClubMap}
              clubColorMap={clubColorMap}
              setClubColorMap={setClubColorMap}
              mainClubId={mainClubId}
            />

            <RevenueBreakdownSection
              data={chartData.revenueBreakdown}
              selectedClubs={chartComparisons.revenueBreakdown}
              setSelectedClubs={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  revenueBreakdown:
                    typeof updater === "function"
                      ? updater(prev.revenueBreakdown)
                      : updater
                }))
              }
              clubMap={clubMap}
              setClubMap={setClubMap}
              mainClubId={mainClubId}
              clubColorMap={clubColorMap}
              setClubColorMap={setClubColorMap}
            />
        </div>
       
         <div className="grid lg:grid-cols-1 gap-4 mb-4">
            <PayrollSection
              data={chartData.payroll}
              selectedClubs={chartComparisons.payroll}
              setSelectedClubs={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  payroll:
                    typeof updater === "function"
                      ? updater(prev.payroll)
                      : updater
                }))
              }
              clubMap={clubMap}
              setClubMap={setClubMap}
              mainClubId={mainClubId}
              clubColorMap={clubColorMap}
              setClubColorMap={setClubColorMap}
            />
         </div>
    
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <CostsSection
              data={chartData.costs}
              selectedClubs={chartComparisons.costs}
              setSelectedClubs={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  costs:
                    typeof updater === "function"
                      ? updater(prev.costs)
                      : updater
                }))
              }
              clubMap={clubMap}
              setClubMap={setClubMap}
              mainClubId={mainClubId}
            />

            <NetResultSection
              data={chartData.netEvolution}
              selectedClubs={chartComparisons.netEvolution}
              setSelectedClubs={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  netEvolution:
                    typeof updater === "function"
                      ? updater(prev.netEvolution)
                      : updater
                }))
              }
              clubMap={clubMap}
              setClubMap={setClubMap}
              mainClubId={mainClubId}
              clubColorMap={clubColorMap}
              setClubColorMap={setClubColorMap}
            />
          </div>
        
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <DebtsSection
              data={chartData.debts}
              selectedClubs={chartComparisons.debts}
              setSelectedClubs={(updater) =>
                setChartComparisons((prev) => ({
                  ...prev,
                  debts:
                    typeof updater === "function"
                      ? updater(prev.debts)
                      : updater
                }))
              }
              clubMap={clubMap}
              setClubMap={setClubMap}
              mainClubId={mainClubId}
            />

          

              <NetResultTableSection
                data={chartData.netResult}
                selectedClubs={chartComparisons.netResult}
                setSelectedClubs={(updater) =>
                  setChartComparisons((prev) => ({
                    ...prev,
                    netResult:
                      typeof updater === "function"
                        ? updater(prev.netResult)
                        : updater
                  }))
                }
                clubMap={clubMap}
                setClubMap={setClubMap}
                mainClubId={mainClubId}
                clubColorMap={clubColorMap}
                setClubColorMap={setClubColorMap}
              />


          </div>
      </div>
    </div>
  );
}
