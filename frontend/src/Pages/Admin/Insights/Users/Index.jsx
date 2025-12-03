import GraficoCrescimentoUsuarios from "../../../../components/charts/Admin/Insights/Usuarios/GraficoCrescimentoUsuarios"
import GraficoUsuariosPorPais from "../../../../components/charts/Admin/Insights/Usuarios/GraficoUsuariosPorPais"
import GraficoRolesPizza from "../../../../components/charts/Admin/Insights/Usuarios/GraficoRolesPizza"
import GraficoNovosPorDia from "../../../../components/charts/Admin/Insights/Usuarios/GraficoNovosPorDia"
import GraficoHeatmapAcessos from "../../../../components/charts/Admin/Insights/Usuarios/GraficoHeatmapAcessos"
import GraficoAtividadeSemanal from "../../../../components/charts/Admin/Insights/Usuarios/GraficoAtividadeSemanal"
import TabelaUltimosUsuarios from "../../../../components/charts/Admin/Insights/Usuarios/TabelaUltimosUsuarios"
import TabelaUsuariosAtivos from "../../../../components/charts/Admin/Insights/Usuarios/TabelaUsuariosAtivos"

import { useUsersInsights } from "../../../../hooks/useUsersInsights";

export default function InsightUsuarios() {
    const { data, isLoading } = useUsersInsights();

    if (isLoading) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="space-y-10">

            {/* ==============================
                SECTION: KPIs
            =============================== */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Visão Geral</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-sm text-gray-500 mb-2">Usuários Totais</h3>
                        <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            <span className="text-2xl">{data?.kpis?.total_users ?? "-"}</span>
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-sm text-gray-500 mb-2">Usuários Ativos</h3>
                        <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            <span className="text-2xl">{data?.kpis?.active_users ?? "-"}</span>
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-sm text-gray-500 mb-2">Novos no Mês</h3>
                        <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            <span className="text-2xl">{data?.kpis?.new_month ?? "-"}</span>
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-sm text-gray-500 mb-2">Crescimento</h3>
                        <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            <span className="text-2xl">{data?.kpis?.growth_rate !== undefined
                            ? `${data.kpis.growth_rate}%`
                            : "-"}</span>
                        </div>
                    </div>

                </div>
            </section>


            {/* ==============================
                SECTION: GRÁFICOS PRINCIPAIS
            =============================== */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Gráficos de Usuários</h2>

                <div className="space-y-8">

                    {/* Crescimento dos usuários */}
                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-sm text-gray-500 mb-4">Crescimento de Usuários</h3>
                        <div className="h-72 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            <GraficoCrescimentoUsuarios data={data.charts.growth_daily} />
                        </div>
                    </div>

                    {/* Distribuição por role */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        <div className="p-6 bg-white rounded-lg shadow-sm">
                            <h3 className="text-sm text-gray-500 mb-4">Distribuição por Permissão</h3>
                            <div className="h-72 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                                <GraficoRolesPizza data={data?.charts?.roles_distribution || []} />
                            </div>
                        </div>

                        <div className="p-6 bg-white rounded-lg shadow-sm">
                            <h3 className="text-sm text-gray-500 mb-4">Distribuição Geográfica</h3>
                            <div className="h-72 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                                <GraficoUsuariosPorPais data={data?.charts?.country_distribution || []} />
                            </div>
                        </div>

                    </div>

                    {/* Novos usuários por dia */}
                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-sm text-gray-500 mb-4">Novos Usuários por Dia</h3>
                        <div className="h-72 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            <GraficoNovosPorDia data={data?.charts?.new_users_daily || []} />
                        </div>
                    </div>

                    {/* Horário de acesso + atividade semanal */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        <div className="p-6 bg-white rounded-lg shadow-sm">
                            <h3 className="text-sm text-gray-500 mb-4">Horário de Maior Acesso</h3>
                            <div className="h-72 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                                <GraficoHeatmapAcessos data={data?.charts?.heatmap || []} />
                            </div>
                        </div>

                        <div className="p-6 bg-white rounded-lg shadow-sm">
                            <h3 className="text-sm text-gray-500 mb-4">Usuários Ativos por Dia da Semana</h3>
                            <div className="h-72 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                                <GraficoAtividadeSemanal data={data?.charts?.weekly_active || []} />
                            </div>
                        </div>

                    </div>

                </div>

            </section>


            {/* ==============================
                SECTION: TABELAS / LISTAS
            =============================== */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Listas e Atividade dos Usuários</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-sm text-gray-500 mb-4">Últimos Usuários Cadastrados</h3>
                        <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            <TabelaUltimosUsuarios data={data?.tables?.recent_users || []} />
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-sm text-gray-500 mb-4">Usuários Mais Ativos</h3>
                        <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            <TabelaUsuariosAtivos data={data?.tables?.active_users || []} />
                        </div>
                    </div>

                </div>
            </section>

        </div>
    );
}
