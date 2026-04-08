import Box from '@mui/material/Box';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import { useUsoInsights } from '../../../../hooks/useUsoInsights';

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

const TYPE_LABEL = { club: 'Clubes', league: 'Ligas', player: 'Jogadores' };

export default function InsightUso() {
  const { data, isLoading } = useUsoInsights();

  if (isLoading) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  const { kpis, charts } = data ?? {};

  // Sports per season — line chart
  const sportsSeasonLabels = (charts?.sports_per_season ?? []).map(r => String(r.year));
  const sportsSeasonValues = (charts?.sports_per_season ?? []).map(r => Number(r.records));

  // Financials per season — bar chart
  const finSeasonLabels = (charts?.financials_per_season ?? []).map(r => String(r.year));
  const finSeasonValues = (charts?.financials_per_season ?? []).map(r => Number(r.records));

  // Top clubs by matches
  const topClubLabels = (charts?.top_clubs_by_matches ?? []).map(r => r.name);
  const topClubValues = (charts?.top_clubs_by_matches ?? []).map(r => Number(r.matches_count));

  // Top leagues by clubs
  const topLeagueLabels = (charts?.top_leagues_by_clubs ?? []).map(r => r.name);
  const topLeagueValues = (charts?.top_leagues_by_clubs ?? []).map(r => Number(r.clubs_count));

  // Favorites by type
  const typePie = (charts?.favorites_by_type ?? []).map((r, i) => ({
    id: i,
    value: Number(r.total),
    label: TYPE_LABEL[r.entity_type] ?? r.entity_type,
  }));

  // Top favorited
  const topFavClubLabels = (charts?.top_favorited_clubs ?? []).map(r => r.name);
  const topFavClubValues = (charts?.top_favorited_clubs ?? []).map(r => Number(r.favorites_count));
  const topFavLeagueLabels = (charts?.top_favorited_leagues ?? []).map(r => r.name);
  const topFavLeagueValues = (charts?.top_favorited_leagues ?? []).map(r => Number(r.favorites_count));

  return (
    <div className="space-y-10">

      {/* KPIs — cobertura de dados */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Cobertura de Dados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <KpiCard label="Clubes Cadastrados" value={kpis?.total_clubs?.toLocaleString('pt-BR')} />
          <KpiCard label="Clubes c/ Dados Esportivos" value={kpis?.clubs_with_sports?.toLocaleString('pt-BR')} />
          <KpiCard label="Clubes c/ Dados Financeiros" value={kpis?.clubs_with_financials?.toLocaleString('pt-BR')} />
          <KpiCard label="Total de Jogadores" value={kpis?.total_players?.toLocaleString('pt-BR')} />
          <KpiCard label="Total de Ligas" value={kpis?.total_leagues?.toLocaleString('pt-BR')} />
          <KpiCard label="Ligas c/ Dados Financeiros" value={kpis?.leagues_with_financials?.toLocaleString('pt-BR')} />
          <KpiCard label="Total de Partidas" value={kpis?.total_matches?.toLocaleString('pt-BR')} />
          <KpiCard label="Total de Favoritos" value={kpis?.total_favorites?.toLocaleString('pt-BR')} sub="Itens favoritados pelos usuários" />
        </div>
      </section>

      {/* Evolução por temporada */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Dados por Temporada</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Registros Esportivos por Ano</h3>
            {sportsSeasonLabels.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 280 }}>
                <LineChart
                  xAxis={[{ data: sportsSeasonLabels, scaleType: 'band' }]}
                  series={[{ data: sportsSeasonValues, label: 'Registros', color: '#7c3aed' }]}
                  yAxis={[{ width: 50 }]}
                  grid={{ horizontal: true }}
                />
              </Box>
            )}
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Registros Financeiros (Clubes) por Ano</h3>
            {finSeasonLabels.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 280 }}>
                <BarChart
                  xAxis={[{ data: finSeasonLabels, scaleType: 'band' }]}
                  series={[{ data: finSeasonValues, label: 'Registros', color: '#a78bfa' }]}
                  yAxis={[{ width: 50 }]}
                  grid={{ horizontal: true }}
                />
              </Box>
            )}
          </div>

        </div>
      </section>

      {/* Top clubes e ligas */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Clubes e Ligas com Mais Dados</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Clubes com Mais Partidas (Top 10)</h3>
            {topClubLabels.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  layout="horizontal"
                  yAxis={[{ data: topClubLabels, scaleType: 'band', width: 130 }]}
                  series={[{ data: topClubValues, label: 'Partidas', color: '#7c3aed' }]}
                  xAxis={[{ width: 50 }]}
                  grid={{ vertical: true }}
                />
              </Box>
            )}
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Ligas com Mais Clubes (Top 10)</h3>
            {topLeagueLabels.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  layout="horizontal"
                  yAxis={[{ data: topLeagueLabels, scaleType: 'band', width: 140 }]}
                  series={[{ data: topLeagueValues, label: 'Clubes', color: '#a78bfa' }]}
                  xAxis={[{ width: 50 }]}
                  grid={{ vertical: true }}
                />
              </Box>
            )}
          </div>

        </div>
      </section>

      {/* Favoritos */}
      {(typePie.length > 0 || topFavClubLabels.length > 0 || topFavLeagueLabels.length > 0) && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Favoritos dos Usuários</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Por Tipo</h3>
              {typePie.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 240 }}>
                  <PieChart
                    series={[{ data: typePie, innerRadius: 50 }]}
                    colors={['#7c3aed', '#a78bfa', '#c4b5fd']}
                  />
                </Box>
              )}
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Clubes Mais Favoritados</h3>
              {topFavClubLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 240 }}>
                  <BarChart
                    layout="horizontal"
                    yAxis={[{ data: topFavClubLabels, scaleType: 'band', width: 110 }]}
                    series={[{ data: topFavClubValues, label: 'Favoritos', color: '#6d28d9' }]}
                    xAxis={[{ width: 40 }]}
                    grid={{ vertical: true }}
                  />
                </Box>
              )}
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Ligas Mais Favoritadas</h3>
              {topFavLeagueLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 240 }}>
                  <BarChart
                    layout="horizontal"
                    yAxis={[{ data: topFavLeagueLabels, scaleType: 'band', width: 120 }]}
                    series={[{ data: topFavLeagueValues, label: 'Favoritos', color: '#8b5cf6' }]}
                    xAxis={[{ width: 40 }]}
                    grid={{ vertical: true }}
                  />
                </Box>
              )}
            </div>

          </div>
        </section>
      )}

    </div>
  );
}
