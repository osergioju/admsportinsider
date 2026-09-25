import { Link } from 'react-router-dom'
import { useUsersInsights } from '../../hooks/useUsersInsights'
import { useFinanceiroInsights } from '../../hooks/useFinanceiroInsights'
import { usePlanosInsights } from '../../hooks/usePlanosInsights'
import { mrrSummary } from '../../utils/planBilling'

function KpiCard({ label, value, sub, highlight, loading }) {
  return (
    <div className={`p-6 rounded-xl shadow-sm border ${highlight ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-100'}`}>
      <p className={`text-sm mb-1 ${highlight ? 'text-violet-200' : 'text-gray-500'}`}>{label}</p>
      {loading ? (
        <div className="h-9 w-24 bg-gray-200 animate-pulse rounded mt-1" />
      ) : (
        <p className={`text-3xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value ?? '-'}</p>
      )}
      {sub && <p className={`text-xs mt-1 ${highlight ? 'text-violet-200' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  )
}

const INSIGHT_LINKS = [
  { label: 'Usuários', to: '/admin/insights/usuarios', icon: '👥', desc: 'Crescimento, acessos e distribuição geográfica' },
  { label: 'Financeiro', to: '/admin/insights/financeiro', icon: '💰', desc: 'MRR, assinaturas e receita por plano' },
  { label: 'Planos', to: '/admin/insights/planos', icon: '📋', desc: 'Conversão, churn e distribuição de planos' },
  { label: 'Clubes', to: '/admin/insights/clubes', icon: '🏟️', desc: 'Ligas, clubes e dados financeiros' },
  { label: 'Ligas', to: '/admin/insights/ligas', icon: '🏆', desc: 'Visão geral das competições' },
  { label: 'Importações', to: '/admin/insights/importacoes', icon: '📥', desc: 'Status e histórico de importações' },
  { label: 'Uso', to: '/admin/insights/uso', icon: '📊', desc: 'Engajamento e funcionalidades mais usadas' },
  { label: 'Performance', to: '/admin/insights/performance', icon: '⚡', desc: 'Velocidade e saúde da plataforma' },
]

export default function Admin() {
  const { data: usersData, isLoading: usersLoading } = useUsersInsights()
  const { data: finData, isLoading: finLoading } = useFinanceiroInsights()
  const { data: planosData, isLoading: planosLoading } = usePlanosInsights()

  const mrr = mrrSummary(finData?.kpis)

  const growthRate = usersData?.kpis?.growth_rate != null
    ? `${usersData.kpis.growth_rate}%`
    : '-'

  return (
    <div className="space-y-10">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-sm text-gray-500 mt-1">Resumo da plataforma em tempo real</p>
      </div>

      {/* ======== KPIs de usuários ======== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Usuários</h2>
          <Link to="/admin/insights/usuarios" className="text-sm text-violet-600 hover:underline">
            Ver detalhes →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Total de Usuários"
            value={usersData?.kpis?.total_users?.toLocaleString('pt-BR')}
            loading={usersLoading}
          />
          <KpiCard
            label="Usuários Ativos"
            value={usersData?.kpis?.active_users?.toLocaleString('pt-BR')}
            loading={usersLoading}
          />
          <KpiCard
            label="Novos este Mês"
            value={usersData?.kpis?.new_month?.toLocaleString('pt-BR')}
            loading={usersLoading}
          />
          <KpiCard
            label="Crescimento"
            value={growthRate}
            sub="comparado ao mês anterior"
            loading={usersLoading}
          />
        </div>
      </section>

      {/* ======== KPIs financeiros ======== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Financeiro</h2>
          <Link to="/admin/insights/financeiro" className="text-sm text-violet-600 hover:underline">
            Ver detalhes →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="MRR Estimado"
            value={mrr.value}
            sub={mrr.sub}
            highlight
            loading={finLoading}
          />
          <KpiCard
            label="Assinaturas Ativas"
            value={finData?.kpis?.total_active_subscriptions?.toLocaleString('pt-BR')}
            loading={finLoading}
          />
          <KpiCard
            label="Usuários Pagos"
            value={finData?.kpis?.total_paid?.toLocaleString('pt-BR')}
            loading={finLoading}
          />
          <KpiCard
            label="Taxa de Conversão"
            value={`${planosData?.kpis?.conversion_rate ?? '-'}%`}
            sub="usuários em plano pago"
            loading={planosLoading}
          />
        </div>
      </section>

      {/* ======== Atalhos para insights ======== */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Relatórios e Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INSIGHT_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-violet-300 hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-3">{link.icon}</div>
              <p className="font-semibold text-gray-800 group-hover:text-violet-700 text-sm">{link.label}</p>
              <p className="text-xs text-gray-400 mt-1">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
