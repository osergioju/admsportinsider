import { useContext } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Zap, 
  Crown, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  FileText, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export default function Subscriptions() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return null;

  // Se o plano for free, que é de id 1 do plan_id, o is paid é false
  const isPaid = user.plan_id !== 1;
  
  const isFree = !isPaid;

  // --- CLASSES CSS PADRÃO ---
  const btnPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-medium hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 w-full sm:w-auto";
  const btnSecondaryClass = "flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-all w-full sm:w-auto";
  const cardClass = "border border-gray-200 rounded-xl p-6 bg-white shadow-sm";

  // Função auxiliar para renderizar nome do plano
  const getPlanName = () => {
      if (user.plan_id == 1) return "Grátis";
      if (user.plan_id == 2) return "Premium";
      return "Business";
  };

  // Função auxiliar para renderizar badge de status
  const renderStatusBadge = () => {
      const status = user.subscription_status;
      let colorClass = "bg-gray-100 text-gray-600";
      let label = "Desconhecido";

      if (status === 'active') {
          colorClass = "bg-green-50 text-green-700 border border-green-200";
          label = "Ativo";
      } else if (status === 'canceled') {
          colorClass = "bg-red-50 text-red-700 border border-red-200";
          label = "Cancelado";
      } else if (status === 'trialing') {
          colorClass = "bg-yellow-50 text-yellow-700 border border-yellow-200";
          label = "Período de Teste";
      } else {
          label = "Pendente";
      }

      return (
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${colorClass}`}>
              {label}
          </span>
      );
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111]">Minha Assinatura</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie seu plano e veja o histórico de pagamentos.
        </p>
      </div>

      {/* ================= FREE PLAN ================= */}
      {isFree && (
        <div className={cardClass}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <Zap size={20} fill="currentColor" className="text-gray-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-[#111]">Plano Básico</h2>
                    <p className="text-sm text-gray-500">Gratuito</p>
                </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
                Atual
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
             <p className="text-sm text-gray-600 mb-3">
               Você está utilizando a versão gratuita. Atualize para liberar todo o potencial.
             </p>
             <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 size={16} className="text-gray-400" /> Acesso limitado aos dados
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 size={16} className="text-gray-400" /> Sem histórico avançado
                </li>
             </ul>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => navigate("/pricing")}
              className={btnPrimaryClass}
            >
              <Crown size={16} />
              Fazer Upgrade Agora
            </button>
          </div>
        </div>
      )}

      {/* ================= PAID PLAN ================= */}
      {isPaid && (
        <div className="space-y-6">
            
            {/* Cartão Principal do Plano */}
            <div className={cardClass}>
                
                {/* Header do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#7F33D9]/10 flex items-center justify-center text-[#7F33D9]">
                            <Crown size={24} fill="currentColor" className="opacity-80" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#111]">Plano {getPlanName()}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                {renderStatusBadge()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detalhes do Plano */}
                <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Data de Renovação */}
                    {user.subscription_current_period_end && (
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <Calendar size={18} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Próxima renovação</p>
                                <p className="text-sm font-semibold text-[#111] mt-0.5">
                                    {new Date(user.subscription_current_period_end).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Método (Simulado visualmente) */}
                    <div className="flex items-start gap-3">
                         <div className="mt-1">
                                <CreditCard size={18} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Método de pagamento</p>
                                <p className="text-sm font-semibold text-[#111] mt-0.5">
                                    Gerenciado via Stripe
                                </p>
                            </div>
                    </div>
                </div>

                {/* Aviso de Cancelamento */}
                {user.cancel_at_period_end && (
                    <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 flex items-start gap-3">
                         <AlertTriangle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
                         <div className="text-sm text-yellow-700">
                            <span className="font-semibold block mb-1">Cancelamento Agendado</span>
                            Sua assinatura permanecerá ativa até o final do período atual, mas não será renovada automaticamente.
                         </div>
                    </div>
                )}

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        onClick={() => navigate("/me/financial")}
                        className={btnSecondaryClass}
                    >
                        <FileText size={16} />
                        Ver Faturas e Histórico
                    </button>
                    
                    {/* Botão opcional para gerenciar no Stripe se você tiver o link */}
                    {/* <button className={btnSecondaryClass}>Gerenciar Pagamento</button> */}
                </div>
            </div>

            {/* Banner Promocional (Opcional, se quiser upsell) */}
            {user.plan_id == 2 && (
                <div className="rounded-xl p-1 bg-gradient-to-r from-purple-500 to-indigo-600">
                    <div className="bg-white rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Zap size={20} />
                             </div>
                             <div>
                                 <h3 className="font-semibold text-gray-900">Faça upgrade para Business</h3>
                                 <p className="text-xs text-gray-500">Desbloqueie recursos exclusivos.</p>
                             </div>
                        </div>
                        <button onClick={() => navigate("/pricing")} className="text-sm font-medium text-[#7F33D9] flex items-center gap-1 hover:gap-2 transition-all">
                            Ver planos <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
}