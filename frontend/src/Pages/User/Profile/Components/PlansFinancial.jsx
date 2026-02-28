import { Link } from "react-router-dom";
import { 
    ArrowLeft, 
    ChevronRight,
    CircleCheck,
    Check,
    ShieldCheck
} from "lucide-react";
import IconInsider from "../../../../assets/svg/brand-icon.svg";

export default function PlansFinancial() {
    
    const staticPlans = [
        { id: 1, name: "Básico", description: "Para quem usa de forma casual", price: "0,00", buttonText: "Acessar" },
        { id: 2, name: "Premium", description: "Para quem trabalha com o futebol", price: "49,90", buttonText: "Contratar plano" },
        { id: 3, name: "Business", description: "Para empresas que trabalham com futebol", price: "129,90", buttonText: "Contratar plano" }
    ];

    const features = [
        { name: "Acesso à base de dados", desc: "Histórico completo de ligas" },
        { name: "Filtros de estatísticas", desc: "Cruzamento avançado de dados" },
        { name: "Alertas em tempo real", desc: "Telegram e app" },
        { name: "Exportação para Excel", desc: "Planilhas ilimitadas" },
        { name: "Analytics de jogadores", desc: "Scout por posição" },
        { name: "Suporte VIP WhatsApp", desc: "Direto com analistas" }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 sm:p-10 animate-in fade-in duration-700">
            
            {/* --- HEADER --- */}
            <div className="flex items-center gap-6 mb-16">
                <Link
                    to="/me/financial"
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm group shrink-0"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300"/>
                </Link>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Planos e preços</h1>
                    <p className="text-gray-400 text-[10px] font-bold mt-0.5">Gestão de assinatura</p>
                </div>
            </div>

            {/* --- GRID DE CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-28">
                {staticPlans.map((plan) => (
                    <div 
                        key={plan.id}
                        className="group rounded-[2.5rem] bg-white border border-gray-200/60 flex flex-col p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:border-purple-200"
                    >
                        <div className="mb-6">
                            <div className="w-11 h-11 rounded-2xl bg-[#F5F3FF] flex items-center justify-center mb-5">
                                <img src={IconInsider} alt="Logo" className="w-6 h-auto" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 mb-1">{plan.name}</h2>
                            <p className="text-gray-400 text-[10px] font-semibold">{plan.description}</p>
                        </div>

                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-gray-300 font-bold text-lg">R$</span>
                            <span className="text-4xl font-bold text-gray-900 tracking-tight">{plan.price}</span>
                        </div>

                        <button className="w-full py-3 rounded-xl bg-[#7F33D9] text-white font-semibold text-sm transition-all hover:bg-[#6025A8] active:scale-[0.98] flex items-center justify-center gap-2 mb-8">
                            {plan.buttonText} <ChevronRight size={14} />
                        </button>

                        <div className="space-y-4">
                            <p className="text-[9px] font-bold text-gray-400 border-b border-gray-50 pb-2">Principais recursos</p>
                            <ul className="space-y-3">
                                {[1, 2, 3].map((_, i) => (
                                    <li key={i} className="flex items-center gap-3 text-xs font-medium text-gray-500">
                                        <CircleCheck size={14} className="text-[#7F33D9]/70" />
                                        Recurso incluso no plano
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- SEÇÃO DA TABELA --- */}
            <div className="space-y-10">
                 <div className="bg-white rounded-[2.5rem] border border-gray-200/50 shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/40">
                                    <th className="py-6 px-10">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                            <img src={IconInsider} alt="Logo" className="w-4 h-auto opacity-80" />
                                        </div>
                                    </th>
                                    {staticPlans.map(p => (
                                        <th key={p.id} className="py-6 px-4 text-center text-[10px] font-bold text-[#6025A8]">
                                            {p.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {features.map((feature, fIdx) => (
                                    <tr key={fIdx} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-5 px-10">
                                            <p className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{feature.name}</p>
                                            <p className="text-[10px] text-gray-400 font-normal mt-0.5">{feature.desc}</p>
                                        </td>
                                        {staticPlans.map((p) => (
                                            <td key={p.id} className="py-5 px-4 text-center">
                                                <div className="flex justify-center">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110">
                                                        <Check size={14} className="text-[#7F33D9]" strokeWidth={3} />
                                                    </div>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="mt-20 flex flex-col items-center opacity-20">
                <ShieldCheck size={20} className="text-gray-400 mb-2" />
                <span className="text-[8px] font-bold text-gray-500">
                    Secure ssl payment system
                </span>
            </div>
        </div>
    );
}