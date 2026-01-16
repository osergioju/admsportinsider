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

export default function DashClubUniques() {
    const { id } = useParams();

    const [loading, setLoading] = useState(true);

    const [theClub, setTheClub] = useState(null);
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
                    theclubData,
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
                    api.get(`/admin/clubs/${id}`),
                    api.get(`/dashboard/clubs/${id}/financials/revenues`),
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
                console.error("Erro ao carregar dashboard:", err);
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

            <div> 
                <div className="w-full"> 
                    <div className="w-full p-4 flex items-center lg:p-10 bg-white rounded-2xl border"> 
                        <div className="flex items-center">
                            <img src={theClub.club.crest_url} className="w-20" alt="" />
                        </div>
                        <div className="ml-4 lg:ml-10">
                            <h3 className="text-2xl mb-3 lg:text-3xl font-light flex items-center gap-2">{theClub.club.name} - {theClub.club.country_name} <img className="w-6" src={theClub.club.flag_url}></img></h3> 
                            <ul className="flex items-center gap-4"> 
                                <li className="border-r pr-6 text-sm">Data de fundação: {theClub.club.founded_at }</li> 
                                <li className="border-r pr-6 text-sm">Estádio: {theClub.club.stadium_name} ({theClub.club.stadium_capacity} lugares)</li> 
                                <li className="text-sm">Estrutura societária: {theClub.club.ownership_model}</li> 
                            </ul> 
                        </div>
                       
                    </div>
                </div> 
                
                <div className="w-full grid lg:grid-cols-2 gap-4 mt-4 lg:mt-8"> 

                    <div className="w-full bg-white border p-6 rounded-xl"> 
                        <h2>Receitas</h2> 
                        <RevenueLineChart data={revenues} />
                        <RevenueTableChart data={revenues} />
                    </div> 

                    <div className="w-full bg-white border p-6 rounded-xl"> 
                        <h2>Gráfico em barras (padrão: mais recente)</h2> 
                        <RevenueBreakdownBarChart data={revenuesBreakdown} />
                        <p> Direito de transmissão Comercial Matchday Outros Atletas </p> 
                    </div> 
                    
                    <div className="w-full bg-white border p-6 rounded-xl"> 
                        <h2>Folha salarial </h2> 
                        <PayrollLineChart data={payrollCosts} />
                        <p> Gráfico em linha e tabela para folha salarial (padrão: 5 anos) Moeda: R$ Período: +- anos Comparação: Outro clube (até quatro) </p> 
                    </div> 
                    
                    <div className="w-full bg-white border p-6 rounded-xl"> 
                        <h2>Custos</h2> 
                        <CostsPieChart data={costsBreakdown} />
                        <p> Folha salarial Outros custos </p> 
                    </div> 
                    
                    <div className="w-full bg-white border p-6 rounded-xl"> 
                        <h2>Resultado líquido</h2> 
                        <NetResultTable data={netResult} />
                        <p> Tabela (padrão: 5 anos) Moeda: R$ Período: +- anos </p> 
                    </div> 
                    
                    <div className="w-full bg-white border p-6 rounded-xl"> 
                        <h2>Dívidas</h2> 
                        <NetResultLineChart data={netResultEvolution} />
                    </div> 
                    
                    <div className="w-full bg-white border p-6 rounded-xl"> 
                        <h2>Gráfico em barras (padrão: mais recente)</h2> 
                        <DebtsBreakdownBarChart data={debtsBreakdown} />
                        <p> Fiscal Trabalhista Bancária Outros </p> 
                    </div> 
                </div> 
            </div>

            {/* DADOS DO CLUBE */}
            <Card title="Dados do clube">
                <pre>{JSON.stringify(theClub, null, 2)}</pre>
            </Card>

            {/* RECEITAS */}
            <Card title="Receitas – evolução">
                <pre>{JSON.stringify(revenues, null, 2)}</pre>
            </Card>

            <Card title="Receitas – breakdown">
                <pre>{JSON.stringify(revenuesBreakdown, null, 2)}</pre>
            </Card>

            {/* CUSTOS */}
            <Card title="Custos – folha salarial">
                <pre>{JSON.stringify(payrollCosts, null, 2)}</pre>
            </Card>

            <Card title="Custos – breakdown">
                <pre>{JSON.stringify(costsBreakdown, null, 2)}</pre>
            </Card>

            {/* RESULTADO */}
            <Card title="Resultado líquido – tabela">
                <pre>{JSON.stringify(netResult, null, 2)}</pre>
            </Card>

            <Card title="Resultado líquido – evolução">
                <pre>{JSON.stringify(netResultEvolution, null, 2)}</pre>
            </Card>

            {/* DÍVIDAS */}
            <Card title="Dívidas – breakdown">
                <pre>{JSON.stringify(debtsBreakdown, null, 2)}</pre>
            </Card>

            <Card title="Dívidas – evolução">
                <pre>{JSON.stringify(debtsEvolution, null, 2)}</pre>
            </Card>

            {/* KPIs */}
            <Card title="Indicadores financeiros">
                <pre>{JSON.stringify(indicators, null, 2)}</pre>
            </Card>

            {/* ANOS */}
            <Card title="Anos disponíveis">
                <pre>{JSON.stringify(availableYears, null, 2)}</pre>
            </Card>

        </div>
    );
}

/* 🔹 Componente visual simples */
function Card({ title, children }) {
    return (
        <div className="w-full bg-white border p-6 rounded-xl">
            <h2 className="text-lg font-medium mb-3">{title}</h2>
            <div className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
                {children}
            </div>
        </div>
    );
}



