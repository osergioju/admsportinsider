import Box from '@mui/material/Box';
import { BarChart, PieChart } from '@mui/x-charts';
import { useLeaguesInsights } from '../../../../hooks/useLeaguesInsights';

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

const FORMAT_LABEL = {
  pontos_corridos: 'Pontos Corridos',
  mata_mata: 'Mata-Mata',
  grupos: 'Grupos + Mata-Mata',
  nao_definido: 'Não definido',
};

export default function InsightLigas() {
  const { data, isLoading } = useLeaguesInsights();

  if (isLoading) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  const { kpis, charts } = data ?? {};

  const formatPie = (charts?.format_distribution ?? []).map((r, i) => ({
    id: i,
    value: Number(r.total),
    label: FORMAT_LABEL[r.format] ?? r.format,
  }));

  const countryLabels = (charts?.leagues_by_country ?? []).map(r => r.country);
  const countryValues = (charts?.leagues_by_country ?? []).map(r => Number(r.total));

  const yearLabels = (charts?.financials_by_year ?? []).map(r => String(r.year));
  const yearValues = (charts?.financials_by_year ?? []).map(r => Number(r.leagues_count));

  const clubCountLabels = (charts?.leagues_club_count ?? []).map(r => r.name);
  const clubCountValues = (charts?.leagues_club_count ?? []).map(r => Number(r.clubs_count));

  const favLabels = (charts?.top_favorited ?? []).map(r => r.name);
  const favValues = (charts?.top_favorited ?? []).map(r => Number(r.total));

  return (
    <div className="space-y-10">

      {/* KPIs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Visão Geral — Competições</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard label="Total de Competições" value={kpis?.total_leagues?.toLocaleString('pt-BR')} />
          <KpiCard label="Com Dados Financeiros" value={kpis?.leagues_with_financials?.toLocaleString('pt-BR')} />
          <KpiCard
            label="Cobertura Financeira"
            value={`${kpis?.coverage_pct ?? 0}%`}
            sub="Competições com ao menos 1 registro financeiro"
          />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Distribuição</h2>
        <div className="space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Formato das competições */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Formato das Competições</h3>
              {formatPie.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <PieChart
                    series={[{ data: formatPie, innerRadius: 50 }]}
                    colors={['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe']}
                  />
                </Box>
              )}
            </div>

            {/* Ligas mais favoritadas */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Competições Mais Favoritadas</h3>
              {favLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <BarChart
                    layout="horizontal"
                    yAxis={[{ data: favLabels, scaleType: 'band', width: 140 }]}
                    series={[{ data: favValues, label: 'Favoritos', color: '#7c3aed' }]}
                    xAxis={[{ width: 50 }]}
                    grid={{ vertical: true }}
                  />
                </Box>
              )}
            </div>

          </div>

          {/* Ligas por país */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Competições por País (Top 10)</h3>
            {countryLabels.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  xAxis={[{ data: countryLabels, scaleType: 'band' }]}
                  series={[{ data: countryValues, label: 'Ligas', color: '#6d28d9' }]}
                  yAxis={[{ width: 50 }]}
                  grid={{ horizontal: true }}
                />
              </Box>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Dados financeiros por ano */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Competições com Dados Financeiros por Ano</h3>
              {yearLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 280 }}>
                  <BarChart
                    xAxis={[{ data: yearLabels, scaleType: 'band' }]}
                    series={[{ data: yearValues, label: 'Ligas', color: '#8b5cf6' }]}
                    yAxis={[{ width: 50 }]}
                    grid={{ horizontal: true }}
                  />
                </Box>
              )}
            </div>

            {/* Clubes por liga */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Clubes por Liga (Top 10)</h3>
              {clubCountLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 280 }}>
                  <BarChart
                    layout="horizontal"
                    yAxis={[{ data: clubCountLabels, scaleType: 'band', width: 140 }]}
                    series={[{ data: clubCountValues, label: 'Clubes', color: '#a78bfa' }]}
                    xAxis={[{ width: 50 }]}
                    grid={{ vertical: true }}
                  />
                </Box>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
