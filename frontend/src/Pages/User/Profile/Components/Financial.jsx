import { useState, useEffect } from "react";
import { 
  CreditCard, CheckCircle2, Download, Clock, 
  AlertCircle, FileText, Zap, Shield, 
  MoreHorizontal, Plus, MessageCircle, ArrowRight,
  X, Building2, MapPin, Hash, User, Lock, Calendar, AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function SubscriptionManagement() {

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  // Novos estados para as funcionalidades solicitadas
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [currentPlan] = useState({
    name: "Plano Premium",
    price: "R$ 49,90",
    interval: "mês",
    status: "active",
    nextBilling: "15 de Março, 2026",
    features: ["Acesso ilimitado", "Suporte prioritário", "Analytics avançado"]
  });

  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, brand: "Mastercard", last4: "8842", expiry: "04/29", isDefault: true },
  ]);

  const [billingInfo, setBillingInfo] = useState({
    name: "David Silva",
    company: "Sport Insider Ltda.",
    address: "Av. Paulista, 1000 - Bela Vista",
    city: "São Paulo, SP - 01310-100",
    cnpj: "00.000.000/0001-00"
  });

  // Dados para a visualização resumida
  const [invoices] = useState([
    { id: "INV-2024-001", date: "15 Fev 2026", amount: "R$ 97,00", status: "paid" },
    { id: "INV-2024-002", date: "15 Jan 2026", amount: "R$ 97,00", status: "paid" },
    { id: "INV-2023-012", date: "15 Dez 2025", amount: "R$ 97,00", status: "paid" },
    { id: "INV-2023-011", date: "15 Nov 2025", amount: "R$ 97,00", status: "failed" },
  ]);

  // Mock de dados completo para o modal de histórico
  const fullHistoryInvoices = [
    ...invoices,
    { id: "INV-2023-010", date: "15 Out 2025", amount: "R$ 97,00", status: "paid" },
    { id: "INV-2023-009", date: "15 Set 2025", amount: "R$ 97,00", status: "paid" },
    { id: "INV-2023-008", date: "15 Ago 2025", amount: "R$ 97,00", status: "paid" },
    { id: "INV-2023-007", date: "15 Jul 2025", amount: "R$ 97,00", status: "paid" },
    { id: "INV-2023-006", date: "15 Jun 2025", amount: "R$ 97,00", status: "paid" },
    { id: "INV-2023-005", date: "15 Mai 2025", amount: "R$ 97,00", status: "paid" },
  ];


  const StatusBadge = ({ status }) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      paid: "bg-green-50 text-green-700 border-green-100",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
      failed: "bg-red-50 text-red-700 border-red-100",
      canceled: "bg-gray-100 text-gray-600 border-gray-200",
    };
    
    const labels = { active: "Ativo", paid: "Pago", pending: "Pendente", failed: "Falhou", canceled: "Cancelado" };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.active} flex items-center gap-1 w-fit`}>
        {status === 'active' || status === 'paid' ? <CheckCircle2 size={12} /> : null}
        {status === 'failed' ? <AlertCircle size={12} /> : null}
        {labels[status]}
      </span>
    );
  };

  // Componente Reutilizável de Input para os Modals
  const ModalInput = ({ label, icon: Icon, placeholder, value, onChange, type = "text", className }) => (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
          <Icon size={18} />
        </div>
        <input 
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#7F33D9] focus:ring-4 focus:ring-[#7F33D9]/10 transition-all"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Assinatura e Cobrança</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seu plano, métodos de pagamento e notas fiscais.</p>
        </div>
        
        {/* Upgrade mantido como botão pois geralmente é uma ação de modal ou checkout direto, mas link para pricing também funcionaria aqui se desejado */}
        <Link 
            to="/pricing" 
            className="px-6 py-2.5 bg-[#7F33D9] text-white text-sm font-bold rounded-xl hover:bg-[#6025A8] hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center gap-2"
        >
            <Zap size={16} /> Fazer Upgrade
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- COLUNA ESQUERDA (2/3) --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card do Plano Atual */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">{currentPlan.name}</h2>
                        <StatusBadge status={currentPlan.status} />
                    </div>
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-bold text-[#7F33D9]">{currentPlan.price}</span>
                        <span className="text-gray-500 text-sm">/{currentPlan.interval}</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 flex items-center gap-2">
                        <Clock size={16} /> Próxima renovação em <span className="font-semibold text-gray-700">{currentPlan.nextBilling}</span>
                    </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#7F33D9]/10 flex items-center justify-center text-[#7F33D9]">
                    <Shield size={32} />
                </div>
            </div>
            <div className="pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {currentPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7F33D9]"></div>
                        {feature}
                    </div>
                ))}
            </div>
            <div className="mt-8 flex gap-3">
                {/* FUNCIONALIDADE: Link para /pricing */}
                <Link 
                    to="/pricing"
                    className="text-sm font-semibold text-[#7F33D9] hover:text-[#6025A8] transition-colors"
                >
                    Alterar Plano
                </Link>
                <span className="text-gray-300">|</span>
                {/* FUNCIONALIDADE: Modal de confirmação de cancelamento */}
                <button 
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
                >
                    Cancelar Assinatura
                </button>
            </div>
          </div>

          {/* Histórico de Faturas */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" /> Histórico de Faturas
                </h3>
                {/* FUNCIONALIDADE: Botão para ver todo o histórico */}
                <button 
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="text-xs font-bold text-[#7F33D9] hover:underline"
                >
                    Ver todas
                </button>
             </div>
             <div className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                    <div key={inv.id} className="px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${inv.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {inv.status === 'paid' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{inv.amount}</p>
                                <p className="text-xs text-gray-500">{inv.date} • {inv.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                            <StatusBadge status={inv.status} />
                            <button className="p-2 text-gray-400 hover:text-[#7F33D9] hover:bg-[#7F33D9]/10 rounded-lg transition-all"><Download size={18} /></button>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* --- COLUNA DIREITA (1/3) --- */}
        <div className="space-y-6">
            
            {/* Método de Pagamento */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCard size={18} className="text-gray-400" /> Método de Pagamento
                </h3>
                <div className="space-y-4">
                    {paymentMethods.map((method) => (
                        <div key={method.id} className="relative group p-4 rounded-2xl border border-gray-200 hover:border-[#7F33D9] transition-all duration-300 bg-gray-50/50 hover:bg-white">
                             <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute left-2 w-4 h-4 rounded-full bg-[#EB001B] opacity-90 mix-blend-multiply"></div>
                                        <div className="absolute right-2 w-4 h-4 rounded-full bg-[#F79E1B] opacity-90 mix-blend-multiply"></div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{method.brand}</span>
                                </div>
                                {method.isDefault && (
                                    <span className="text-[10px] font-bold uppercase text-[#7F33D9] bg-[#7F33D9]/10 px-2 py-0.5 rounded-full">Padrão</span>
                                )}
                             </div>
                             <div className="flex justify-between items-end">
                                <span className="text-xs text-gray-500 font-medium">•••• {method.last4} <span className="mx-1 text-gray-300">|</span> Expira em {method.expiry}</span>
                                <button className="text-gray-400 hover:text-[#7F33D9]"><MoreHorizontal size={18} /></button>
                             </div>
                        </div>
                    ))}
                    {/* BOTÃO ADICIONAR CARTÃO */}
                    <button 
                        onClick={() => setIsCardModalOpen(true)}
                        className="w-full py-3 border border-dashed border-gray-300 rounded-2xl text-sm font-medium text-gray-500 hover:border-[#7F33D9] hover:text-[#7F33D9] hover:bg-[#7F33D9]/5 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Adicionar novo cartão
                    </button>
                </div>
            </div>

            {/* Dados de Faturamento */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Dados de Faturamento</h3>
                    {/* BOTÃO EDITAR FATURAMENTO */}
                    <button 
                        onClick={() => setIsBillingModalOpen(true)}
                        className="text-xs font-bold text-[#7F33D9] hover:underline"
                    >
                        Editar
                    </button>
                 </div>
                 <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">{billingInfo.name}</p>
                    <p>{billingInfo.company}</p>
                    <p>{billingInfo.address}</p>
                    <p>{billingInfo.city}</p>
                    <p className="mt-2 text-xs text-gray-400">CPF/CNPJ: {billingInfo.cnpj}</p>
                 </div>
            </div>

            {/* Card Suporte */}
            <div className="bg-gradient-to-br from-[#7F33D9] to-[#6025A8] rounded-3xl p-5 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] -mr-10 -mt-10 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm group-hover:bg-white/30 transition-colors border border-white/10">
                         <MessageCircle size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm text-white mb-0.5">Suporte Financeiro</h3>
                        <p className="text-purple-100 text-[11px] mb-1.5 leading-tight opacity-90">Dúvidas sobre faturas ou mudança de plano?</p>
                        <div className="flex items-center gap-1 text-xs font-bold text-white group-hover:gap-2 transition-all">Falar com suporte <ArrowRight size={12} /></div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* EDITAR FATURAMENTO */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsBillingModalOpen(false)}
            ></div>

            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Building2 size={20} className="text-[#7F33D9]" /> Dados da Empresa
                    </h3>
                    <button 
                        onClick={() => setIsBillingModalOpen(false)} 
                        className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <ModalInput 
                        label="Nome do Responsável" icon={User} 
                        value={billingInfo.name} onChange={(e) => setBillingInfo({...billingInfo, name: e.target.value})} 
                    />
                    <ModalInput 
                        label="Razão Social / Nome da Empresa" icon={Building2} 
                        value={billingInfo.company} onChange={(e) => setBillingInfo({...billingInfo, company: e.target.value})} 
                    />
                    <div className="grid grid-cols-2 gap-5">
                         <ModalInput 
                            label="CPF/CNPJ" icon={Hash} 
                            value={billingInfo.cnpj} onChange={(e) => setBillingInfo({...billingInfo, cnpj: e.target.value})} 
                        />
                         <ModalInput 
                            label="CEP" icon={MapPin} 
                            placeholder="00000-000" 
                            value={billingInfo.city.split('-')[1]?.trim()} 
                            onChange={() => {}} 
                        />
                    </div>
                    <ModalInput 
                        label="Endereço Completo" icon={MapPin} 
                        value={billingInfo.address} onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})} 
                    />

                    <div className="pt-4 flex gap-3">
                        <button 
                            onClick={() => setIsBillingModalOpen(false)}
                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={() => setIsBillingModalOpen(false)}
                            className="flex-1 py-3 rounded-xl bg-[#111] text-white font-bold text-sm hover:bg-[#7F33D9] transition-all shadow-lg shadow-gray-200"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* NOVO CARTÃO */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsCardModalOpen(false)}
            ></div>

            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard size={20} className="text-[#7F33D9]" /> Adicionar Cartão
                    </h3>
                    <button onClick={() => setIsCardModalOpen(false)} className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"><X size={18} /></button>
                </div>

                <div className="p-8 space-y-5">
                    <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-[#1e1e1e] to-[#3a3a3a] p-6 relative overflow-hidden shadow-lg mb-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[50px] opacity-10 -mr-10 -mt-10"></div>
                        <div className="flex justify-between items-start mb-8">
                             <div className="w-10 h-6 bg-white/20 rounded-md backdrop-blur-sm"></div>
                             <span className="text-white/50 text-xs font-mono">DEBIT/CREDIT</span>
                        </div>
                        <div className="space-y-4">
                            <div className="w-full h-4 bg-white/10 rounded"></div>
                            <div className="flex justify-between">
                                <div className="w-20 h-3 bg-white/10 rounded"></div>
                                <div className="w-10 h-3 bg-white/10 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <ModalInput label="Número do Cartão" icon={CreditCard} placeholder="0000 0000 0000 0000" />
                    
                    <div className="grid grid-cols-2 gap-5">
                        <ModalInput label="Validade" icon={Calendar} placeholder="MM/AA" />
                        <ModalInput label="CVV" icon={Lock} placeholder="123" />
                    </div>

                    <ModalInput label="Nome no Cartão" icon={User} placeholder="COMO NO CARTÃO" />

                    <div className="pt-4">
                        <button 
                            onClick={() => setIsCardModalOpen(false)}
                            className="w-full py-3.5 rounded-xl bg-[#7F33D9] text-white font-bold text-sm hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                        >
                            <Lock size={16} /> Adicionar com Segurança
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                            <Lock size={10} /> Seus dados são criptografados com segurança SSL.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- NOVO: MODAL DE CONFIRMAÇÃO DE CANCELAMENTO --- */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsCancelModalOpen(false)}
            ></div>

            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cancelar Assinatura?</h3>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        Tem certeza que deseja cancelar? Você perderá acesso a todos os recursos premium, incluindo analytics e suporte prioritário, ao final do ciclo atual.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => setIsCancelModalOpen(false)}
                            className="w-full py-3.5 rounded-xl bg-[#111] text-white font-bold text-sm hover:bg-[#333] transition-all shadow-lg shadow-gray-200"
                        >
                            Não, manter meu plano
                        </button>
                        <button 
                            onClick={() => {
                                console.log("Assinatura cancelada");
                                setIsCancelModalOpen(false);
                            }}
                            className="w-full py-3.5 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                        >
                            Sim, quero cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- NOVO: MODAL DE HISTÓRICO DE FATURAS COMPLETO --- */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsHistoryModalOpen(false)}
            ></div>

            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={20} className="text-[#7F33D9]" /> Histórico Completo
                    </h3>
                    <button onClick={() => setIsHistoryModalOpen(false)} className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"><X size={18} /></button>
                </div>

                <div className="overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <div className="divide-y divide-gray-100">
                        {fullHistoryInvoices.map((inv) => (
                            <div key={inv.id} className="px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${inv.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {inv.status === 'paid' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{inv.amount}</p>
                                        <p className="text-xs text-gray-500">{inv.date} • {inv.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 self-end sm:self-auto">
                                    <StatusBadge status={inv.status} />
                                    <button className="p-2 text-gray-400 hover:text-[#7F33D9] hover:bg-[#7F33D9]/10 rounded-lg transition-all"><Download size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 text-center shrink-0">
                    <button 
                        onClick={() => setIsHistoryModalOpen(false)}
                        className="text-sm font-bold text-[#7F33D9] hover:underline"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}