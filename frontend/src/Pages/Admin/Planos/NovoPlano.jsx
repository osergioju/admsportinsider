import { useState } from "react";
import { api } from "../../../services/api";
import { useNavigate, Link } from "react-router-dom";
import { 
    ArrowLeft, 
    Plus, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    CreditCard, 
    ListChecks, 
    Tag, 
    Code 
} from "lucide-react";

export default function NovoPlano() {
  const [form, setForm] = useState({
    name: "",
    price_display: "",
    benefits: "",
    pagarme_plan_id: ""
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      await api.post("/admin/plans", form);
      setFeedback({ type: 'success', text: "Plano criado com sucesso!" });
      
      // Pequeno delay para o usuário ler o sucesso antes de voltar para a lista
      setTimeout(() => {
        navigate("/admin/gestao-planos");
      }, 1500);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', text: "Erro ao criar o plano. Verifique os campos." });
      setLoading(false);
    }
  }

  // Componente de Feedback Inline Padrão
  const FeedbackMessage = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.type === 'success';
    return (
        <div className={`mb-6 w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className={`p-1 rounded-full ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isSuccess ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            </div>
            <span>{msg.text}</span>
        </div>
    );
  };

  // Estilos padrão
  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400 pl-10";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 relative">
      
      {/* Header com Seta de Voltar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
            <Link
                to="/admin/gestao-planos"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform"/>
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-[#111] flex items-center gap-2">
                    Criar Novo Plano
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Defina um novo modelo de assinatura para seus usuários.
                </p>
            </div>
        </div>

        <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {loading ? "Criando..." : "Criar Plano"}
        </button>
      </div>

      {/* Feedback Inline */}
      <FeedbackMessage msg={feedback} />

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 sm:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome do Plano */}
                <div>
                    <label className={labelClass}>Nome do Plano</label>
                    <div className="relative">
                        <Tag size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                            className={inputClass}
                            type="text"
                            placeholder="Ex: Plano Trimestral"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {/* Preço de Exibição */}
                <div>
                    <label className={labelClass}>Preço de Exibição (R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">R$</span>
                        <input
                            className={`${inputClass} !pl-10`}
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={form.price_display}
                            onChange={(e) => setForm({ ...form, price_display: e.target.value })}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Benefícios */}
            <div>
                <label className={labelClass}>Benefícios (um por linha)</label>
                <div className="relative">
                    <ListChecks size={18} className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                        className={`${inputClass} !pl-10 min-h-[150px] resize-none`}
                        rows="5"
                        placeholder="Ex: Acesso total ao conteúdo&#10;Relatórios mensais&#10;Suporte VIP"
                        value={form.benefits}
                        onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                        required
                    ></textarea>
                </div>
            </div>

            {/* ID Pagar.me */}
            <div>
                <label className={labelClass}>ID do Plano Pagar.me (opcional)</label>
                <div className="relative">
                    <Code size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                        className={inputClass}
                        type="text"
                        placeholder="plan_xxxxxxxxxxxx"
                        value={form.pagarme_plan_id}
                        onChange={(e) => setForm({ ...form, pagarme_plan_id: e.target.value })}
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 ml-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Deixe em branco se for um plano gratuito ou controlado manualmente.
                </p>
            </div>

            {/* Botão Mobile Full Width */}
            <div className="sm:hidden pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-xl font-bold"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Criar Plano"}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}