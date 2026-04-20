import { useState, useEffect, useContext } from "react";
import { api } from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import { groupedAdminPages } from "../../../constants/adminPages";
import {
    Loader2, CheckCircle2, UserPlus, AlertCircle,
    Mail, Lock, Shield, CreditCard, User, ShieldCheck
} from "lucide-react";

export default function NovoUsuario() {
    const { user: currentUser } = useContext(AuthContext);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
        plan_id: "",
        admin_permissions: [],
    });

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

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

    // Limpa permissões quando role muda para algo diferente de admin
    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setForm((prev) => ({
            ...prev,
            role: newRole,
            admin_permissions: newRole === "admin" ? prev.admin_permissions : [],
        }));
    };

    const togglePermission = (key) => {
        setForm((prev) => {
            const has = prev.admin_permissions.includes(key);
            return {
                ...prev,
                admin_permissions: has
                    ? prev.admin_permissions.filter((k) => k !== key)
                    : [...prev.admin_permissions, key],
            };
        });
    };

    const toggleGroup = (keys) => {
        const allSelected = keys.every((k) => form.admin_permissions.includes(k));
        setForm((prev) => ({
            ...prev,
            admin_permissions: allSelected
                ? prev.admin_permissions.filter((k) => !keys.includes(k))
                : [...new Set([...prev.admin_permissions, ...keys])],
        }));
    };

    const selectAll = () => {
        const allKeys = Object.values(groupedAdminPages()).flat().map((p) => p.key);
        setForm((prev) => ({ ...prev, admin_permissions: allKeys }));
    };

    const clearAll = () => {
        setForm((prev) => ({ ...prev, admin_permissions: [] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback(null);
        setLoading(true);

        if (form.password.length < 6) {
            setLoading(false);
            return setFeedback({ type: "error", text: "A senha deve ter no mínimo 6 caracteres." });
        }

        try {
            const payload = { ...form };
            // Só envia permissions se o role for admin
            if (payload.role !== "admin") payload.admin_permissions = [];

            await api.post("/admin/create-user", payload);

            setFeedback({ type: "success", text: "Usuário criado com sucesso!" });
            setForm({ name: "", email: "", password: "", role: "user", plan_id: "", admin_permissions: [] });
            setTimeout(() => setFeedback(null), 4000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erro ao criar usuário. Verifique os dados.";
            setFeedback({ type: "error", text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    // ── helpers ──────────────────────────────────────────────
    const FeedbackMessage = ({ msg }) => {
        if (!msg) return null;
        const isSuccess = msg.type === "success";
        return (
            <div className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 ${isSuccess ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                {isSuccess
                    ? <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                    : <AlertCircle size={18} className="text-red-600 shrink-0" />}
                <span>{msg.text}</span>
            </div>
        );
    };

    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400 pl-10";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
    const btnPrimary = "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 w-full sm:w-auto min-w-[200px]";

    // Seção de permissões — só visível para admin_master criando um admin
    const showPermissions = currentUser?.role === "admin_master" && form.role === "admin";
    const grouped = groupedAdminPages();

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#111] tracking-tight flex items-center gap-2">
                    <UserPlus className="text-[#7F33D9]" size={28} /> Criar Novo Usuário
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
                                <User size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
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
                                <Mail size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
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
                            <Lock size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
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

                    <div className="border-t border-gray-100 my-6" />

                    {/* Linha 3: Função e Plano */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Função do Sistema</label>
                            <div className="relative">
                                <Shield size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                                <select
                                    value={form.role}
                                    onChange={handleRoleChange}
                                    className={inputClass}
                                >
                                    <option value="user">Usuário Comum</option>
                                    <option value="admin">Administrador</option>
                                    {currentUser?.role === "admin_master" && (
                                        <option value="admin_master">Admin Master</option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Plano de Assinatura</label>
                            <div className="relative">
                                <CreditCard size={18} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
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

                    {/* ── Seletor de Permissões (admin_master criando admin) ── */}
                    {showPermissions && (
                        <div className="mt-2">
                            <div className="border-t border-gray-100 mb-6" />

                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck size={20} className="text-[#7F33D9]" />
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Permissões de Acesso</p>
                                    <p className="text-xs text-gray-400">Defina quais seções do painel este administrador poderá acessar.</p>
                                </div>
                                <div className="ml-auto flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="text-xs text-violet-600 hover:underline font-medium"
                                    >
                                        Selecionar tudo
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="text-xs text-gray-400 hover:underline font-medium"
                                    >
                                        Limpar
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {Object.entries(grouped).map(([groupName, pages]) => {
                                    const groupKeys = pages.map((p) => p.key);
                                    const allGroupSelected = groupKeys.every((k) => form.admin_permissions.includes(k));
                                    const someGroupSelected = groupKeys.some((k) => form.admin_permissions.includes(k));

                                    return (
                                        <div key={groupName} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            {/* Header do grupo */}
                                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={allGroupSelected}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = someGroupSelected && !allGroupSelected;
                                                    }}
                                                    onChange={() => toggleGroup(groupKeys)}
                                                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 accent-violet-600"
                                                />
                                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{groupName}</span>
                                            </label>

                                            {/* Items do grupo */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 pl-6">
                                                {pages.map((page) => (
                                                    <label key={page.key} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={form.admin_permissions.includes(page.key)}
                                                            onChange={() => togglePermission(page.key)}
                                                            className="w-4 h-4 rounded border-gray-300 accent-violet-600"
                                                        />
                                                        <span className="text-sm text-gray-700">{page.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-gray-400 mt-3 ml-1">
                                {form.admin_permissions.length === 0
                                    ? "Nenhuma permissão selecionada — o admin só verá a tela inicial."
                                    : `${form.admin_permissions.length} permissão(ões) selecionada(s).`}
                            </p>
                        </div>
                    )}

                    {/* Feedback */}
                    <FeedbackMessage msg={feedback} />

                    {/* Botão */}
                    <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={loading} className={btnPrimary}>
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Criar Usuário"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
