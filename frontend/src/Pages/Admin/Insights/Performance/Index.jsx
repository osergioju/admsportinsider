import Box from '@mui/material/Box';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import { usePerformanceInsights } from '../../../../hooks/usePerformanceInsights';

function KpiCard({ label, value, sub, color }) {
  const colors = {
    violet: 'bg-violet-600 border-violet-600 text-white',
    default: 'bg-white border-gray-100 text-gray-900',
  };
  const isHighlight = color === 'violet';
  return (
    <div className={`p-6 rounded-xl shadow-sm border ${isHighlight ? colors.violet : colors.default}`}>
      <p className={`text-sm mb-1 ${isHighlight ? 'text-violet-200' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-3xl font-bold ${isHighlight ? 'text-white' : 'text-gray-900'}`}>{value ?? '-'}</p>
      {sub && <p className={`text-xs mt-1 ${isHighlight ? 'text-violet-200' : 'text-gray-400'}`}>{sub}</p>}
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

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function InsightPerformance() {
  const { data, isLoading } = usePerformanceInsights();

  if (isLoading) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  const { kpis, charts } = data ?? {};

  const loginDayLabels = (charts?.logins_by_day ?? []).map(r =>
    new Date(r.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  );
  const loginDayValues = (charts?.logins_by_day ?? []).map(r => Number(r.logins));

  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);
  const hourMap = Object.fromEntries((charts?.logins_by_hour ?? []).map(r => [Number(r.hour), Number(r.total)]));
  const hourValues = hourLabels.map((_, i) => hourMap[i] ?? 0);

  const weekdayLabels = WEEKDAYS;
  const weekdayMap = Object.fromEntries((charts?.logins_by_weekday ?? []).map(r => [Number(r.weekday), Number(r.total)]));
  const weekdayValues = WEEKDAYS.map((_, i) => weekdayMap[i] ?? 0);

  const segmentPie = (charts?.user_segments ?? []).map((r, i) => ({
    id: i,
    value: Number(r.total),
    label: r.segment,
  }));

  return (
    <div className="space-y-10">

      {/* KPIs de retenção */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Retenção de Usuários</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard label="Ativos hoje" value={kpis?.active_last_1d?.toLocaleString('pt-BR')} sub="Login nas últimas 24h" color="violet" />
          <KpiCard label="Ativos 7 dias" value={kpis?.active_last_7d?.toLocaleString('pt-BR')} sub="Login na última semana" />
          <KpiCard label="Ativos 30 dias" value={kpis?.active_last_30d?.toLocaleString('pt-BR')} sub="Login no último mês" />
          <KpiCard label="Ativos 90 dias" value={kpis?.active_last_90d?.toLocaleString('pt-BR')} sub="Login nos últimos 3 meses" />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Padrões de Acesso</h2>
        <div className="space-y-8">

          {/* Logins diários - 30 dias */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Usuários Ativos por Dia (últimos 30 dias)</h3>
            {loginDayLabels.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 280 }}>
                <LineChart
                  xAxis={[{ data: loginDayLabels, scaleType: 'band' }]}
                  series={[{ data: loginDayValues, label: 'Acessos', color: '#7c3aed' }]}
                  yAxis={[{ width: 50 }]}
                  grid={{ horizontal: true }}
                />
              </Box>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Hora do dia */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Acessos por Hora do Dia</h3>
              <Box sx={{ width: '100%', height: 280 }}>
                <BarChart
                  xAxis={[{ data: hourLabels, scaleType: 'band' }]}
                  series={[{ data: hourValues, label: 'Usuários', color: '#8b5cf6' }]}
                  yAxis={[{ width: 50 }]}
                  grid={{ horizontal: true }}
                />
              </Box>
            </div>

            {/* Dia da semana */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Acessos por Dia da Semana</h3>
              <Box sx={{ width: '100%', height: 280 }}>
                <BarChart
                  xAxis={[{ data: weekdayLabels, scaleType: 'band' }]}
                  series={[{ data: weekdayValues, label: 'Usuários', color: '#a78bfa' }]}
                  yAxis={[{ width: 50 }]}
                  grid={{ horizontal: true }}
                />
              </Box>
            </div>

          </div>

          {/* Segmentação de usuários */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Segmentação por Última Atividade</h3>
            {segmentPie.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 300 }}>
                <PieChart
                  series={[{ data: segmentPie, innerRadius: 50 }]}
                  colors={['#7c3aed', '#a78bfa', '#fb923c', '#9ca3af']}
                />
              </Box>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}
