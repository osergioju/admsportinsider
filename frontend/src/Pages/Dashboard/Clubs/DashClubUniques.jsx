import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";
import { Landmark } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";

// Sections
import RevenueSection from "./components/revenue/RevenueSection";
import RevenueBreakdownSection from "./components/revenueBreak/RevenueBreakdownSection";
import PayrollSection from "./components/payroll/PayrollSection";
import CostsSection from "./components/costs/CostsSection";
import NetResultTableSection from "./components/netResult/NetResultTableSection";
import NetResultSection from "./components/netResult/NetResultSection";
import DebtsSection from "./components/debts/DebtsSection";

import { AuthContext } from "../../../context/AuthContext"
import PlanUpgradePrompt from "../Clubs/components/blockplan/PlanUpgradePrompt";

export default function DashClubUniques() {
  function hexToRgb(hex) {
    if (!hex) return null;
    const cleaned = hex.replace("#", "");
    const full = cleaned.length === 3
      ? cleaned.split("").map(c => c + c).join("")
      : cleaned;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  const { t } = useTranslation();
  const { id } = useParams();
  const mainClubId = Number(id);

  // Usuário & plano
  const { user } = useContext(AuthContext);
  const planID = user?.plan_id ?? 1;

  // Cria vários níveis de acesso de acordo com o gráfico
  const chartPermissions = {
    revenue: [1, 2, 3],
    payroll: [1, 2, 3],
    costs: [1, 2, 3],
    netResult: [1, 2, 3],
    netEvolution: [1, 2, 3],
    debts: [1, 2, 3],
    revenueBreakdown: [1, 2, 3]
  };

  // Não-logados veem tudo. Logados: verificar plano.
  const hasAccess = (chartKey, planID) => {
    return chartPermissions[chartKey]?.includes(planID);
  };

  const [loading, setLoading] = useState(true);
  const [theClub, setTheClub] = useState(null);

  /**
   * apa id → nome do clube (global, reaproveitado)
   */
  const [clubMap, setClubMap] = useState({});
  const [clubColorMap, setClubColorMap] = useState({});

  const defaultCurrency = user?.currency_code ?? "BRL";
  const [chartCurrencies, setChartCurrencies] = useState({
    revenue: defaultCurrency,
    payroll: defaultCurrency,
    costs: defaultCurrency,
    netResult: defaultCurrency,
    netEvolution: defaultCurrency,
    debts: defaultCurrency,
    revenueBreakdown: defaultCurrency,
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
    netEvolution: {},
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
          api.get(`/dashboard/clubs/${id}/info`),
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
        `/dashboard/clubs/${clubId}/financials/revenues?to=${chartCurrencies.revenue}`,
      true
    );
  }, [chartComparisons.revenue, mainClubId, chartCurrencies.revenue]);

  // ✅ ADICIONAR filtros de ano - evolução temporal
  useEffect(() => {
    fetchChartData(
      "payroll",
      (clubId) =>
        `/dashboard/clubs/${clubId}/financials/costs/payroll?to=${chartCurrencies.payroll}`,
      true
    );
  }, [chartComparisons.payroll, mainClubId, chartCurrencies.payroll]);

  // ❌ NÃO adicionar - breakdown do último ano apenas
  useEffect(() => {
    fetchChartData(
      "costs",
      (clubId) =>
        `/dashboard/clubs/${clubId}/financials/costs/breakdown?to=${chartCurrencies.costs}`,
      true
    );
  }, [chartComparisons.costs, mainClubId, chartCurrencies.costs]);

  // ✅ ADICIONAR filtros de ano - evolução temporal (últimos 3 anos, 12 registros)
  useEffect(() => {
    fetchChartData(
      "netResult",
      (clubId) =>
        `/dashboard/clubs/${clubId}/financials/net-result?to=${chartCurrencies.netResult}`,
      true
    );
  }, [chartComparisons.netResult, mainClubId, chartCurrencies.netResult]);

  // ✅ ADICIONAR filtros de ano - evolução temporal
  useEffect(() => {
    fetchChartData(
      "netEvolution",
      (clubId) =>
        `/dashboard/clubs/${clubId}/financials/net-result/evolution?to=${chartCurrencies.netEvolution}`,
      true
    );
  }, [chartComparisons.netEvolution, mainClubId, chartCurrencies.netEvolution]);

  // ❌ NÃO adicionar - breakdown do último ano apenas
  useEffect(() => {
    fetchChartData(
      "debts",
      (clubId) =>
        `/dashboard/clubs/${clubId}/financials/debts/breakdown?to=${chartCurrencies.debts}`,
      true
    );
  }, [chartComparisons.debts, mainClubId, chartCurrencies.debts]);

  // ❌ NÃO adicionar - breakdown do último ano apenas
  useEffect(() => {
    fetchChartData(
      "revenueBreakdown",
      (clubId) =>
        `/dashboard/clubs/${clubId}/financials/revenues/breakdown?to=${chartCurrencies.revenueBreakdown}`,
      true
    );
  }, [chartComparisons.revenueBreakdown, mainClubId, chartCurrencies.revenueBreakdown]);

  if (loading || !theClub) {
    return <p className="text-sm text-gray-500">{t("ui.loading_dashboard", "Carregando dashboard…")}</p>;
  }

  const foundedAt = theClub?.club?.founded_at
    ? theClub.club.founded_at
      .split("T")[0]
      .split("-")
      .reverse()
      .join("/")
    : "—";


  // Cores 
  function resolveColors(primary, secondary, tertiary) {
    const c1 = primary || "#1a1a2e";
    const c2 = secondary || c1;
    const c3 = tertiary || c2;
    return [c1, c2, c3];
  }

  const [c1, c2, c3] = resolveColors(theClub.club.primary_color, theClub.club.secondary_color, theClub.club.tertiary_color);

  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const glowPrimary = rgb1
    ? `radial-gradient(circle, rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.45) 0%, transparent 70%)`
    : "rgba(0,0,0,0.2)";

  const glowSecondary = rgb2
    ? `radial-gradient(circle, rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.35) 0%, transparent 70%)`
    : glowPrimary;

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
        {/* Overlay escuro para legibilidade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        {/* Glow decorativo canto inferior direito */}
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none blur-3xl"
          style={{
            background: glowPrimary
          }}
        />
        {/* Glow decorativo canto superior esquerdo */}
        <div
          className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none blur-3xl"
          style={{
            background: glowSecondary
          }}
        />

        <div className="relative z-10 p-6 sm:p-8">

          {/* ── Header ──────────────────────────────────────── */}
          <div className="flex items-start gap-5">

            {/* Crest flutuante com glow */}
            <div
              className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center p-2.5"
            >
              <img
                src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + theClub.club.crest_url + `.webp`}
                alt={theClub.club.name}
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>

            {/* Nome + short_name */}
            <div className="flex-1 justify-center min-w-0 items-center">
              <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold drop-shadow-md truncate">
                {theClub.club.name}
              </h1>
              {theClub.club.description && (
                <span className="inline-block mt-1.5 text-white/70 text-sm font-semibold bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                  {theClub.club.description}
                </span>
              )}
            </div>

            {/* Bandeira */}
            {theClub.club.flag_url && (
              <div
                className="shrink-0 w-9 h-9 rounded-full overflow-hidden shadow-lg"
                style={{ border: "2px solid rgba(255,255,255,0.28)" }}
                title={theClub.club.country_name}
              >
                <img
                  src={theClub.club.flag_url}
                  alt={theClub.club.country_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="max-w-full w-full overflow-hidden relative ">
        <div className="max-w-full w-full grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("revenue", planID) ? (
            <PlanUpgradePrompt
              title="Gráfico de receitas por ano disponível apenas para os planos Pro e Premium"
            ></PlanUpgradePrompt>
          ) : (
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
          )
          }

          {!hasAccess("revenueBreakdown", planID) ? (
            <PlanUpgradePrompt
              title="Gráfico de receitas por origem disponível apenas para os planos Pro e Premium"
            ></PlanUpgradePrompt>
          ) : (
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
          )
          }

        </div>

        <div className="w-full grid lg:grid-cols-1 gap-4 mb-4">
          {!hasAccess("payroll", planID) ? (
            <PlanUpgradePrompt
              title="Gráfico de folha salarial disponível apenas para os planos Pro e Premium"
            ></PlanUpgradePrompt>
          ) : (
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
          )
          }

        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("costs", planID) ? (
            <PlanUpgradePrompt
              title="Gráfico de custos disponível apenas para os planos Pro e Premium"
            ></PlanUpgradePrompt>
          ) : (
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
              clubColorMap={clubColorMap}
              setClubColorMap={setClubColorMap}
              currency={chartCurrencies.costs}
              setCurrency={(value) =>
                setChartCurrencies((prev) => ({
                  ...prev,
                  costs: value
                }))
              }
            />
          )
          }


          {!hasAccess("netResult", planID) ? (
            <PlanUpgradePrompt
              title="Gráfico de resultado líquido disponível apenas para os planos Pro e Premium"
            ></PlanUpgradePrompt>
          ) : (
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
          )
          }

        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {!hasAccess("debts", planID) ? (
            <PlanUpgradePrompt
              title="Gráfico de dívidas disponível apenas para os planos Pro e Premium"
            ></PlanUpgradePrompt>
          ) : (
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
          )
          }

          {!hasAccess("netResult", planID) ? (
            <PlanUpgradePrompt
              title="Gráfico de resultado financeiro disponível apenas para os planos Pro e Premium"
            ></PlanUpgradePrompt>
          ) : (
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
          )
          }



        </div>
      </div>
    </div>
  );
}
