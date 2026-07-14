import Box from '@mui/material/Box';
import { BarChart, PieChart } from '@mui/x-charts';
import { useClubsInsights } from '../../../../hooks/useClubsInsights';
import { clubLogo, handleCrestRetry } from '../../../../utils/clubUrl';

function KpiCard({ label, value, sub }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value ?? '-'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm py-10">
      Sem dados suficientes
    </div>
  );
}

export default function InsightClubes() {
  const { data, isLoading } = useClubsInsights();

  if (isLoading) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  const { kpis, charts, tables } = data ?? {};

  // BarChart: clubes por país
  const countryLabels = (charts?.clubs_by_country ?? []).map(r => r.country);
  const countryValues = (charts?.clubs_by_country ?? []).map(r => Number(r.total));

  // BarChart: registros financeiros por ano
  const yearLabels = (charts?.financials_by_year ?? []).map(r => String(r.year));
  const yearValues = (charts?.financials_by_year ?? []).map(r => Number(r.clubs_count));

  // BarChart: top clubes favoritados
  const favLabels = (charts?.top_favorited ?? []).map(r => r.name);
  const favValues = (charts?.top_favorited ?? []).map(r => Number(r.total));

  return (
    <div className="space-y-10">

      {/* KPIs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Visão Geral — Clubes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard label="Total de Clubes" value={kpis?.total_clubs?.toLocaleString('pt-BR')} />
          <KpiCard label="Com Dados Financeiros" value={kpis?.clubs_with_financials?.toLocaleString('pt-BR')} />
          <KpiCard label="Com Dados Esportivos" value={kpis?.clubs_with_sports?.toLocaleString('pt-BR')} />
          <KpiCard
            label="Cobertura Financeira"
            value={`${kpis?.coverage_pct ?? 0}%`}
            sub="Clubes com ao menos 1 registro financeiro"
          />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Distribuição</h2>
        <div className="space-y-8">

          {/* Clubes por país */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Clubes por País (Top 10)</h3>
            {countryLabels.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  xAxis={[{ data: countryLabels, scaleType: 'band' }]}
                  series={[{ data: countryValues, label: 'Clubes', color: '#7c3aed' }]}
                  yAxis={[{ width: 50 }]}
                  grid={{ horizontal: true }}
                />
              </Box>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Top favoritados */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Clubes Mais Favoritados</h3>
              {favLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <BarChart
                    layout="horizontal"
                    yAxis={[{ data: favLabels, scaleType: 'band', width: 130 }]}
                    series={[{ data: favValues, label: 'Favoritos', color: '#a78bfa' }]}
                    xAxis={[{ width: 50 }]}
                    grid={{ vertical: true }}
                  />
                </Box>
              )}
            </div>

            {/* Dados financeiros por ano */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Clubes com Dados por Ano</h3>
              {yearLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <BarChart
                    xAxis={[{ data: yearLabels, scaleType: 'band' }]}
                    series={[{ data: yearValues, label: 'Clubes', color: '#6d28d9' }]}
                    yAxis={[{ width: 50 }]}
                    grid={{ horizontal: true }}
                  />
                </Box>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Tabela */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Últimos Clubes Cadastrados</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clube</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">País</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cadastrado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(tables?.recent_clubs ?? []).map((club, i) => (
                <tr key={club.id_club ?? i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {club.crest_url && <img src={clubLogo(club.crest_url)} onError={handleCrestRetry} alt="" className="w-5 h-5 object-contain" />}
                      {club.name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{club.country ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {club.created_at ? new Date(club.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
              {(tables?.recent_clubs ?? []).length === 0 && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">Nenhum clube encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
