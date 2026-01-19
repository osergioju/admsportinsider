import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";

// Gráficos
import RevenueLineChart from "./components/revenue/RevenueLineChart";
import RevenueTableChart from "./components/revenue/RevenueTableChart";
import RevenueBreakdownBarChart from "./components/revenueBreak/RevenueBreakdownBarChart";
import PayrollLineChart from "./components/payroll/PayrollLineChart";
import CostsPieChart from "./components/costs/CostsPieChart";
import NetResultTable from "./components/netResult/NetResultTable";
import NetResultLineChart from "./components/netResult/NetResultLineChart";
import DebtsBreakdownBarChart from "./components/debts/DebtsBreakdownBarChart";

export default function DashLeagueUniques() {
    const { id } = useParams();

    const [loading, setLoading] = useState(true);

    const [theLeague, setTheLeague] = useState(null);
    const [revenues, setRevenues] = useState(null);
    const [revenuesBreakdown, setRevenuesBreakdown] = useState(null);
    const [payrollCosts, setPayrollCosts] = useState(null);
    const [costsBreakdown, setCostsBreakdown] = useState(null);
    const [netResult, setNetResult] = useState(null);
    const [netResultEvolution, setNetResultEvolution] = useState(null);
    const [debtsBreakdown, setDebtsBreakdown] = useState(null);
    const [debtsEvolution, setDebtsEvolution] = useState(null);
    const [indicators, setIndicators] = useState(null);
    const [availableYears, setAvailableYears] = useState(null);

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);

                const [
                    leagueRes,
                    revenuesRes,
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
                    api.get(`/admin/leagues/${id}`),

                    api.get(`/dashboard/leagues/${id}/financials/revenues`),
                    api.get(`/dashboard/leagues/${id}/financials/revenues/breakdown`),

                    api.get(`/dashboard/leagues/${id}/financials/costs/payroll`),
                    api.get(`/dashboard/leagues/${id}/financials/costs/breakdown`),

                    api.get(`/dashboard/leagues/${id}/financials/net-result`),
                    api.get(`/dashboard/leagues/${id}/financials/net-result/evolution`),

                    api.get(`/dashboard/leagues/${id}/financials/debts/breakdown`),
                    api.get(`/dashboard/leagues/${id}/financials/debts/evolution`),

                    api.get(`/dashboard/leagues/${id}/financials/indicators`),
                    api.get(`/dashboard/leagues/${id}/financials/available-years`)
                ]);

                setTheLeague(leagueRes.data);
                setRevenues(revenuesRes.data);
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
                console.error("Erro ao carregar dashboard da liga:", err);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [id]);

    if (loading) {
        return <p className="text-sm text-gray-500">Carregando dashboard…</p>;
    }

    return (
        <div className="space-y-6">

            {/* HEADER DA LIGA */}
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
            <div className="grid lg:grid-cols-2 gap-4">

                <Card>
                    <h2>Receitas</h2>
                    <RevenueLineChart data={revenues} />
                    <RevenueTableChart data={revenues} />
                </Card>

                <Card>
                    <h2>Receitas — Breakdown</h2>
                    <RevenueBreakdownBarChart data={revenuesBreakdown} />
                </Card>

                <Card>
                    <h2>Folha salarial</h2>
                    <PayrollLineChart data={payrollCosts} />
                </Card>

                <Card>
                    <h2>Custos</h2>
                    <CostsPieChart data={costsBreakdown} />
                </Card>

                <Card>
                    <h2>Resultado líquido</h2>
                    <NetResultTable data={netResult} />
                </Card>

                <Card>
                    <h2>Evolução do resultado</h2>
                    <NetResultLineChart data={netResultEvolution} />
                </Card>

                <Card>
                    <h2>Dívidas — Breakdown</h2>
                    <DebtsBreakdownBarChart data={debtsBreakdown} />
                </Card>

            </div>
        </div>
    );
}

/* 🔹 COMPONENTES AUXILIARES */

function Card({ children }) {
    return (
        <div className="w-full bg-white border p-6 rounded-xl space-y-4">
            {children}
        </div>
    );
}