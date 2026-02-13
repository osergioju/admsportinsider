import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2, CheckCircle2, UserPlus, AlertCircle, Mail, Lock, Shield, CreditCard, User } from "lucide-react";

export default function NovoUsuario() {

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
        plan_id: ""
    });

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Feedback System
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

    // Buscar planos
    useEffect(() => {
        async function loadPlans() {
            try {
                const { data } = await api.get("/admin/plans");
                setPlans(data.plans);
            } catch (err) {
                console.error("Erro ao carregar planos:", err);
            }
        }
        loadPlans();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback(null);
        setLoading(true);

        // Validação básica front-end
        if (form.password.length < 6) {
            setLoading(false);
            return setFeedback({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
        }

        try {
            await api.post("/admin/create-user", form);

            setFeedback({ type: 'success', text: 'Usuário criado com sucesso!' });
            
            // Reset do formulário após sucesso
            setForm({
                name: "",
                email: "",
                password: "",
                role: "user",
                plan_id: ""
            });

            // Limpa mensagem após 4s
            setTimeout(() => setFeedback(null), 4000);

        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erro ao criar usuário. Verifique os dados.";
            setFeedback({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    // Componente de Feedback Visual
    const FeedbackMessage = ({ msg }) => {
        if (!msg) return null;
        const isSuccess = msg.type === 'success';
        return (
            <div className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {isSuccess ? <CheckCircle2 size={18} className="text-green-600 shrink-0"/> : <AlertCircle size={18} className="text-red-600 shrink-0"/>}
                <span>{msg.text}</span>
            </div>
        );
    };

    // Estilos
    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400 pl-10";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
    const btnPrimary = "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 w-full sm:w-auto min-w-[200px]";

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#111] tracking-tight flex items-center gap-2">
                    <UserPlus className="text-[#7F33D9]" size={28}/> Criar Novo Usuário
                </h1>
                <p className="text-gray-500 text-sm mt-1 ml-9">Preencha os dados abaixo para cadastrar manualmente um usuário na plataforma.</p>
            </div>

            {/* Card Principal */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden p-8">
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Linha 1: Nome e Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Nome Completo</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"/>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className={inputClass}
                                    placeholder="Ex: João Silva"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Email de Acesso</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"/>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className={inputClass}
                                    placeholder="Ex: joao@email.com"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 2: Senha */}
                    <div>
                        <label className={labelClass}>Senha Inicial</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"/>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className={inputClass}
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-1">O usuário poderá alterar esta senha posteriormente.</p>
                    </div>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Linha 3: Função e Plano */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Função do Sistema</label>
                            <div className="relative">
                                <Shield size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"/>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="user">Usuário Comum</option>
                                    <option value="admin">Administrador</option>
                                    <option value="admin_master">Admin Master</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Plano de Assinatura</label>
                            <div className="relative">
                                <CreditCard size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"/>
                                <select
                                    value={form.plan_id}
                                    onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Sem plano (Gratuito)</option>
                                    {plans.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Mensagem de Feedback Inline */}
                    <FeedbackMessage msg={feedback} />

                    {/* Botão de Ação */}
                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={btnPrimary}
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Criar Usuário"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}