import Box from '@mui/material/Box';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import { usePlanosInsights } from '../../../../hooks/usePlanosInsights';

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

export default function InsightPlanos() {
  const { data, isLoading } = usePlanosInsights();

  if (isLoading) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  const { kpis, charts } = data ?? {};

  const planPie = (charts?.plan_distribution ?? []).map((r, i) => ({
    id: i,
    value: Number(r.total),
    label: r.plan ?? 'Sem plano',
  }));

  const churnLabels = (charts?.churn_monthly ?? []).map(r =>
    new Date(r.month).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  );
  const churnValues = (charts?.churn_monthly ?? []).map(r => Number(r.canceled));

  return (
    <div className="space-y-10">

      {/* KPIs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Visão Geral — Planos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard label="Planos Cadastrados" value={kpis?.total_plans} />
          <KpiCard label="Taxa de Conversão" value={`${kpis?.conversion_rate ?? 0}%`} sub="Usuários em plano pago / total" />
          <KpiCard label="Total de Usuários Pagos" value={kpis?.total_paid_users?.toLocaleString('pt-BR')} />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Distribuição de Planos</h2>
        <div className="space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Pizza de planos */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Usuários por Plano</h3>
              {planPie.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <PieChart
                    series={[{ data: planPie, innerRadius: 50 }]}
                    colors={['#d1d5db', '#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe']}
                  />
                </Box>
              )}
            </div>

            {/* Churn mensal */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Cancelamentos por Mês (12 meses)</h3>
              {churnLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <LineChart
                    xAxis={[{ data: churnLabels, scaleType: 'band' }]}
                    series={[{ data: churnValues, label: 'Cancelamentos', color: '#f87171' }]}
                    yAxis={[{ width: 50 }]}
                    grid={{ horizontal: true }}
                  />
                </Box>
              )}
            </div>

          </div>

          {/* Tabela detalhada por plano */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Detalhes por Plano</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Plano</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Ativos</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Cancelados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(charts?.plan_details ?? []).map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {Number(r.price) > 0
                        ? Number(r.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : 'Gratuito'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{Number(r.total_users).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right text-violet-700 font-semibold">{Number(r.active_users).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right text-red-500">{Number(r.canceled_users).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
                {(charts?.plan_details ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </section>

    </div>
  );
}
