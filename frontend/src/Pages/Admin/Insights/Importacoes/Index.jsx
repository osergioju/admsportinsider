import Box from '@mui/material/Box';
import { BarChart, PieChart } from '@mui/x-charts';
import { useImportacoesInsights } from '../../../../hooks/useImportacoesInsights';

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
    <div className="w-full flex items-center justify-center text-gray-400 text-sm py-10">
      Sem dados suficientes
    </div>
  );
}

const LEVEL_LABEL = {
  club: 'Clube',
  league: 'Liga',
};

export default function InsightImportacoes() {
  const { data, isLoading } = useImportacoesInsights();

  if (isLoading) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  const { kpis, charts } = data ?? {};

  const clubYearLabels = (charts?.club_financials_by_year ?? []).map(r => String(r.year));
  const clubYearValues = (charts?.club_financials_by_year ?? []).map(r => Number(r.records));

  const leagueYearLabels = (charts?.league_financials_by_year ?? []).map(r => String(r.year));
  const leagueYearValues = (charts?.league_financials_by_year ?? []).map(r => Number(r.records));

  const levelPie = (charts?.indicators_by_level ?? []).map((r, i) => ({
    id: i,
    value: Number(r.total),
    label: LEVEL_LABEL[r.level] ?? r.level,
  }));

  const topClubLabels = (charts?.top_clubs_by_records ?? []).map(r => r.name);
  const topClubValues = (charts?.top_clubs_by_records ?? []).map(r => Number(r.records_count));

  return (
    <div className="space-y-10">

      {/* KPIs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Visão Geral — Dados Importados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <KpiCard label="Registros Financeiros" value={kpis?.total_financial_records?.toLocaleString('pt-BR')} sub="Clubes + Ligas" />
          <KpiCard label="Financeiros de Clubes" value={kpis?.total_club_financials?.toLocaleString('pt-BR')} />
          <KpiCard label="Financeiros de Ligas" value={kpis?.total_league_financials?.toLocaleString('pt-BR')} />
          <KpiCard label="Jogadores" value={kpis?.total_players?.toLocaleString('pt-BR')} />
          <KpiCard label="Partidas" value={kpis?.total_matches?.toLocaleString('pt-BR')} />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Volume de Dados</h2>
        <div className="space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Registros de clubes por ano */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Registros Financeiros de Clubes por Ano</h3>
              {clubYearLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 280 }}>
                  <BarChart
                    xAxis={[{ data: clubYearLabels, scaleType: 'band' }]}
                    series={[{ data: clubYearValues, label: 'Registros', color: '#7c3aed' }]}
                    yAxis={[{ width: 60 }]}
                    grid={{ horizontal: true }}
                  />
                </Box>
              )}
            </div>

            {/* Registros de ligas por ano */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Registros Financeiros de Ligas por Ano</h3>
              {leagueYearLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 280 }}>
                  <BarChart
                    xAxis={[{ data: leagueYearLabels, scaleType: 'band' }]}
                    series={[{ data: leagueYearValues, label: 'Registros', color: '#a78bfa' }]}
                    yAxis={[{ width: 60 }]}
                    grid={{ horizontal: true }}
                  />
                </Box>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Indicadores por nível */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Indicadores Financeiros por Nível</h3>
              {levelPie.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 280 }}>
                  <PieChart
                    series={[{ data: levelPie, innerRadius: 50 }]}
                    colors={['#7c3aed', '#a78bfa']}
                  />
                </Box>
              )}
            </div>

            {/* Top clubes com mais registros */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Clubes com Mais Registros Financeiros</h3>
              {topClubLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 280 }}>
                  <BarChart
                    layout="horizontal"
                    yAxis={[{ data: topClubLabels, scaleType: 'band', width: 130 }]}
                    series={[{ data: topClubValues, label: 'Registros', color: '#6d28d9' }]}
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
