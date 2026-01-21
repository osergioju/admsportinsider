import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";
import { CalendarDays, Castle, Handshake } from "lucide-react";

// Sections
import RevenueSection from "./components/revenue/RevenueSection";

// Outros gráficos
import RevenueBreakdownBarChart from "./components/revenueBreak/RevenueBreakdownBarChart";
import PayrollLineChart from "./components/payroll/PayrollLineChart";
import CostsPieChart from "./components/costs/CostsPieChart";
import NetResultTable from "./components/netResult/NetResultTable";
import NetResultLineChart from "./components/netResult/NetResultLineChart";
import DebtsBreakdownBarChart from "./components/debts/DebtsBreakdownBarChart";

export default function DashClubUniques() {
  const { id } = useParams();
  const mainClubId = Number(id);

  const [loading, setLoading] = useState(true);
  const [theClub, setTheClub] = useState(null);

  /**
   * clubes adicionados para comparação (NÃO inclui o principal)
   */
  const [clubesSelecionados, setClubesSelecionados] = useState([]);

  /**
   * receitas por clube
   * { [clubId]: [] }
   */
  const [revenues, setRevenues] = useState({});

  /**
   * 🔑 mapa id → nome do clube
   */
  const [clubMap, setClubMap] = useState({});

  // outros dados (mantidos)
  const [revenuesBreakdown, setRevenuesBreakdown] = useState(null);
  const [payrollCosts, setPayrollCosts] = useState(null);
  const [costsBreakdown, setCostsBreakdown] = useState(null);
  const [netResult, setNetResult] = useState(null);
  const [netResultEvolution, setNetResultEvolution] = useState(null);
  const [debtsBreakdown, setDebtsBreakdown] = useState(null);
  const [debtsEvolution, setDebtsEvolution] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [availableYears, setAvailableYears] = useState(null);

  /**
   * lista FINAL de clubes para comparação
   */
  const clubesParaComparar = useMemo(() => {
    return [
      mainClubId,
      ...clubesSelecionados.filter(
        (clubId) => Number(clubId) !== mainClubId
      )
    ];
  }, [mainClubId, clubesSelecionados]);

  /**
   * Load inicial (dados fixos do clube)
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

        // registra nome do clube principal
        setClubMap({
          [mainClubId]: theclubData.data.club.name
        });

        setRevenuesBreakdown(revenuesBreakdownRes.data);
        setPayrollCosts(payrollCostsRes.data);
        setCostsBreakdown(costsBreakdownRes.data);
        setNetResult(netResultRes.data);
        setNetResultEvolution(netResultEvolutionRes.data);
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

  useEffect(() => {
    console.log("clubMap atualizado:", clubMap);
  }, [clubMap]);

  /**
   * Busca receitas para todos os clubes da comparação
   */
  useEffect(() => {
    async function fetchRevenues() {
      const clubesParaBuscar = clubesParaComparar.filter(
        (clubId) => !revenues[clubId]
      );

      if (clubesParaBuscar.length === 0) return;

      try {
        const responses = await Promise.all(
          clubesParaBuscar.map((clubId) =>
            api.get(`/dashboard/clubs/${clubId}/financials/revenues`)
          )
        );

        const novosDados = {};
        responses.forEach((res, index) => {
          novosDados[clubesParaBuscar[index]] = res.data.data;
        });

        setRevenues((prev) => ({
          ...prev,
          ...novosDados
        }));
      } catch (err) {
        console.error("Erro ao buscar receitas:", err);
      }
    }

    fetchRevenues();
  }, [clubesParaComparar, revenues]);

  if (loading || !theClub) {
    return <p className="text-sm text-gray-500">Carregando dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER DO CLUBE */}
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

        <img
          src={theClub.club.crest_url}
          className="w-20 lg:w-36"
          alt=""
        />

        <div className="ml-4 lg:ml-10 border-b border-white pb-4 lg:pb-6">
          <h3 className="text-white text-2xl mb-3 lg:text-3xl font-light">
            {theClub.club.name}
          </h3>

          <ul className="flex items-center gap-4">
            <li className="text-white text-sm flex items-center gap-2">
              <CalendarDays className="w-4" />
              Fundação:{" "}
              <strong>
                {theClub.club.founded_at
                  .split("T")[0]
                  .split("-")
                  .reverse()
                  .join("/")}
              </strong>
            </li>

            <li className="text-white text-sm flex items-center gap-2">
              <Castle className="w-4" />
              {theClub.club.stadium_name}
            </li>

            <li className="text-white text-sm flex items-center gap-2">
              <Handshake className="w-4" />
              {theClub.club.ownership_model}
            </li>
          </ul>
        </div>
      </div>

      {/* GRID DE GRÁFICOS */}
      <div className="w-full grid lg:grid-cols-1 gap-4">
        <RevenueSection
          data={revenues}
          clubesSelecionados={clubesSelecionados}
          setClubesSelecionados={setClubesSelecionados}
          clubMap={clubMap}
        />

        <RevenueBreakdownBarChart data={revenuesBreakdown} />
        <PayrollLineChart data={payrollCosts} />
        <CostsPieChart data={costsBreakdown} />
        <NetResultTable data={netResult} />
        <NetResultLineChart data={netResultEvolution} />
        <DebtsBreakdownBarChart data={debtsBreakdown} />
      </div>
    </div>
  );
}
