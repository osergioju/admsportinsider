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
  const [toCurrency, setToCurrency] = useState("RUB");

  const [chartCurrencies, setChartCurrencies] = useState({
    revenue: "RUB",
    payroll: "RUB",
    costs: "RUB",
    netResult: "RUB",
    netEvolution: "RUB",
    debts: "RUB",
    revenueBreakdown: "RUB"
  });

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
  async function fetchChartData(chartKey, endpointBuilder, force = false) {
  const clubs = clubsForChart(chartKey);
  const existingData = chartData[chartKey];

  const clubsToFetch = force
    ? clubs
    : clubs.filter((clubId) => !existingData[clubId]);

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
    // ✅ ADICIONAR filtros de ano - evolução temporal
    useEffect(() => {
      fetchChartData(
        "revenue",
        (clubId) =>
          `/dashboard/clubs/${clubId}/financials/revenues?from=RUB&to=${chartCurrencies.revenue}&fromYear=2018&toYear=2024`,
        true
      );
    }, [chartComparisons.revenue, mainClubId, chartCurrencies.revenue]);

    // ✅ ADICIONAR filtros de ano - evolução temporal
    useEffect(() => {
      fetchChartData(
        "payroll",
        (clubId) =>
          `/dashboard/clubs/${clubId}/financials/costs/payroll?from=RUB&to=${chartCurrencies.payroll}&fromYear=2018&toYear=2024`,
        true
      );
    }, [chartComparisons.payroll, mainClubId, chartCurrencies.payroll]);

    // ❌ NÃO adicionar - breakdown do último ano apenas
    useEffect(() => {
      fetchChartData(
        "costs",
        (clubId) =>
          `/dashboard/clubs/${clubId}/financials/costs/breakdown?from=RUB&to=${chartCurrencies.costs}`,
        true
      );
    }, [chartComparisons.costs, mainClubId, chartCurrencies.costs]);

    // ✅ ADICIONAR filtros de ano - evolução temporal (últimos 3 anos, 12 registros)
    useEffect(() => {
      fetchChartData(
        "netResult",
        (clubId) =>
          `/dashboard/clubs/${clubId}/financials/net-result?from=RUB&to=${chartCurrencies.netResult}&fromYear=2021&toYear=2024`,
        true
      );
    }, [chartComparisons.netResult, mainClubId, chartCurrencies.netResult]);

    // ✅ ADICIONAR filtros de ano - evolução temporal
    useEffect(() => {
      fetchChartData(
        "netEvolution",
        (clubId) =>
          `/dashboard/clubs/${clubId}/financials/net-result/evolution?from=RUB&to=${chartCurrencies.netEvolution}&fromYear=2018&toYear=2024`,
        true
      );
    }, [chartComparisons.netEvolution, mainClubId, chartCurrencies.netEvolution]);

    // ❌ NÃO adicionar - breakdown do último ano apenas
    useEffect(() => {
      fetchChartData(
        "debts",
        (clubId) =>
          `/dashboard/clubs/${clubId}/financials/debts/breakdown?from=RUB&to=${chartCurrencies.debts}`,
        true
      );
    }, [chartComparisons.debts, mainClubId, chartCurrencies.debts]);

    // ❌ NÃO adicionar - breakdown do último ano apenas
    useEffect(() => {
      fetchChartData(
        "revenueBreakdown",
        (clubId) =>
          `/dashboard/clubs/${clubId}/financials/revenues/breakdown?from=RUB&to=${chartCurrencies.revenueBreakdown}`,
        true
      );
    }, [chartComparisons.revenueBreakdown, mainClubId, chartCurrencies.revenueBreakdown]);
    
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
        className="relative w-full p-4 lg:py-12 flex items-center lg:px-6 rounded-2xl border"
        style={{
          background: `linear-gradient(
            135deg,
            ${theClub.club.primary_color} 40%,
            ${theClub.club.secondary_color || "#FFF5F5"} 100%
          )`
        }}
      >
        <div className="overflow-hidden absolute bg-black rounded-full w-5 h-5 lg:w-10 lg:h-10 right-4 top-4">
          <img className="h-full" src={theClub.club.flag_url} alt="" />
        </div>

        <div className="w-20 h-20 lg:w-24 lg:h-24 xl:w-34 xl:h-34 bg-contain bg-no-repeat bg-center"
          style={{
            backgroundImage: `url(${theClub.club.crest_url})`,
          }}
        ></div>

        <div className="ml-4 lg:ml-10 border-b border-white pb-4">
          <h3 className="text-white text-2xl mb-3 lg:text-3xl font-light">
            {theClub.club.name}
          </h3>

          <ul className="flex flex-col lg:flex-row lg:items-center gap-0 lg:gap-4">
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

          <div className="flex items-center gap-3 mt-4">
            <span className="text-white text-sm">Moeda</span>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="rounded px-5 py-3 text-sm bg-white rounded-full text-[#4d4d4d]"
            >
              <option value="RUB">Rublo (Rússia)</option>
              <option value="USD">Dólar (EUA)</option>
              <option value="BRL">Real (Brasil)</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="max-w-full w-full overflow-hidden relative ">
        <div className="max-w-full w-full grid lg:grid-cols-2 gap-4 mb-4">
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

              currency={chartCurrencies.revenue}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({
                  ...prev,
                  revenue: value
                }))
              }
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

              currency={chartCurrencies.revenueBreakdown}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({
                  ...prev,
                  revenueBreakdown: value
                }))
              }
            />
        </div>
       
         <div className="w-full grid lg:grid-cols-1 gap-4 mb-4">
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

              currency={chartCurrencies.payroll}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({
                  ...prev,
                  payroll: value
                }))
              }
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

              currency={chartCurrencies.costs}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({
                  ...prev,
                  costs: value
                }))
              }
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

              currency={chartCurrencies.netEvolution}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({
                  ...prev,
                  netEvolution: value
                }))
              }
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

              currency={chartCurrencies.debts}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({
                  ...prev,
                  debts: value
                }))
              }
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

                currency={chartCurrencies.netResult}
                setCurrency={(value) =>
                  setChartCurrencies((prev) => ({
                    ...prev,
                    netResult: value
                  }))
                }
              />


          </div>
      </div>
    </div>
  );
}
