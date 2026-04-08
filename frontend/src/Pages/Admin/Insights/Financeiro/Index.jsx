import Box from '@mui/material/Box';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import { useFinanceiroInsights } from '../../../../hooks/useFinanceiroInsights';

function KpiCard({ label, value, sub, highlight }) {
  return (
    <div className={`p-6 rounded-xl shadow-sm border ${highlight ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-100'}`}>
      <p className={`text-sm mb-1 ${highlight ? 'text-violet-200' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-3xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value ?? '-'}</p>
      {sub && <p className={`text-xs mt-1 ${highlight ? 'text-violet-200' : 'text-gray-400'}`}>{sub}</p>}
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

const STATUS_LABEL = {
  active: 'Ativo',
  trialing: 'Trial',
  canceled: 'Cancelado',
  past_due: 'Em atraso',
  free: 'Gratuito',
};

const STATUS_COLOR = {
  active: '#7c3aed',
  trialing: '#a78bfa',
  canceled: '#f87171',
  past_due: '#fb923c',
  free: '#d1d5db',
};

export default function InsightFinanceiro() {
  const { data, isLoading } = useFinanceiroInsights();

  if (isLoading) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  const { kpis, charts } = data ?? {};

  const statusPie = (charts?.status_breakdown ?? []).map((r, i) => ({
    id: i,
    value: Number(r.total),
    label: STATUS_LABEL[r.status] ?? r.status,
    color: STATUS_COLOR[r.status] ?? '#9ca3af',
  }));

  const planLabels = (charts?.plan_revenue ?? []).map(r => r.plan);
  const planMrr = (charts?.plan_revenue ?? []).map(r => Number(r.estimated_mrr));
  const planUsers = (charts?.plan_revenue ?? []).map(r => Number(r.users_count));

  const monthLabels = (charts?.paid_users_per_month ?? []).map(r =>
    new Date(r.month).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  );
  const monthValues = (charts?.paid_users_per_month ?? []).map(r => Number(r.paid_count));

  const mrrFormatted = kpis?.mrr != null
    ? kpis.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '-';

  return (
    <div className="space-y-10">

      {/* KPIs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Visão Geral — Financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard label="MRR Estimado" value={mrrFormatted} sub="Receita recorrente mensal" highlight />
          <KpiCard label="Assinaturas Ativas" value={kpis?.total_active_subscriptions?.toLocaleString('pt-BR')} />
          <KpiCard label="Usuários Pagos" value={kpis?.total_paid?.toLocaleString('pt-BR')} />
          <KpiCard label="Usuários Gratuitos" value={kpis?.total_free?.toLocaleString('pt-BR')} />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Receita e Assinaturas</h2>
        <div className="space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Status de assinaturas */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">Status das Assinaturas</h3>
              {statusPie.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <PieChart
                    series={[{ data: statusPie, innerRadius: 50 }]}
                  />
                </Box>
              )}
            </div>

            {/* MRR por plano */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm text-gray-500 mb-4">MRR Estimado por Plano</h3>
              {planLabels.length === 0 ? <EmptyState /> : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <BarChart
                    xAxis={[{ data: planLabels, scaleType: 'band' }]}
                    series={[
                      { data: planMrr, label: 'MRR (R$)', color: '#7c3aed' },
                      { data: planUsers, label: 'Usuários', color: '#c4b5fd' },
                    ]}
                    yAxis={[{ width: 70 }]}
                    grid={{ horizontal: true }}
                  />
                </Box>
              )}
            </div>

          </div>

          {/* Usuários pagos por mês */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Evolução de Usuários Pagos (12 meses)</h3>
            {monthLabels.length === 0 ? <EmptyState /> : (
              <Box sx={{ width: '100%', height: 300 }}>
                <LineChart
                  xAxis={[{ data: monthLabels, scaleType: 'band' }]}
                  series={[{ data: monthValues, label: 'Pagos', color: '#7c3aed' }]}
                  yAxis={[{ width: 50 }]}
                  grid={{ horizontal: true }}
                />
              </Box>
            )}
          </div>

          {/* Tabela por plano */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4">Detalhe por Plano</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Plano</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Usuários</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">MRR Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(charts?.plan_revenue ?? []).map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{r.plan}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{Number(r.users_count).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-2 text-right font-semibold text-violet-700">
                      {Number(r.estimated_mrr).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
                {(charts?.plan_revenue ?? []).length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </section>

    </div>
  );
}
