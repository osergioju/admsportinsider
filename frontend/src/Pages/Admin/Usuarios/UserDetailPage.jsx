import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { api } from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import { groupedAdminPages } from "../../../constants/adminPages";
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    Mail,
    Shield,
    CreditCard,
    Lock,
    AlertTriangle,
    CheckCircle2,
    Ban,
    Send,
    X,
    AlertCircle,
    ShieldCheck
} from "lucide-react";

export default function UserDetailPage() {
    const { user: currentUser } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [theUser, setUser] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados de Loading Individuais
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingSecurity, setSavingSecurity] = useState(false);
    const [savingPlan, setSavingPlan] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);

    // Mensagens de Feedback Inline
    const [profileMsg, setProfileMsg] = useState(null);
    const [securityMsg, setSecurityMsg] = useState(null);
    const [planMsg, setPlanMsg] = useState(null);
    const [modalMsg, setModalMsg] = useState(null);

    // Modais
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(null);

    // Forms
    const [form, setForm] = useState({ name: "", email: "", role: "", plan_id: "", admin_permissions: [] });
    const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });

    // CARREGAMENTO
    useEffect(() => {
        async function loadData() {
            try {
                const plansRes = await api.get("/admin/plans");
                setPlans(plansRes.data.plans);

                const userRes = await api.post("/admin/users/" + id);
                const u = userRes.data.user[0];

                setUser(u);
                setForm({
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    plan_id: u.plan_id,
                    admin_permissions: u.admin_permissions ?? [],
                });
            } catch (err) {
                console.error("Erro ao carregar:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    // HELPER DE MENSAGEM
    const handleFeedback = (setter, type, text) => {
        setter({ type, text });
        if (type === 'success') {
            setTimeout(() => setter(null), 4000);
        }
    };

    const refreshData = async () => {
        try {
            const userRes = await api.post("/admin/users/" + id);
            const u = userRes.data.user[0];
            setUser(u);
        } catch (e) { console.error(e); }
    };

    //COMPONENTE VISUAL DE MENSAGEM 
    const FeedbackMessage = ({ msg }) => {
        if (!msg) return null;
        const isSuccess = msg.type === 'success';

        return (
            <div className={`
                mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2
                ${isSuccess
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }
            `}>
                {isSuccess ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
                <span>{msg.text}</span>
            </div>
        );
    };

    // ACTIONS

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg(null);

        try {
            await api.put(`/admin/users/${id}/update`, form);
            handleFeedback(setProfileMsg, 'success', 'Perfil atualizado com sucesso!');
            await refreshData();
        } catch (error) {
            handleFeedback(setProfileMsg, 'error', 'Erro ao atualizar. Verifique os campos.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setSecurityMsg(null);

        if (passwordForm.password.length < 6) {
            return handleFeedback(setSecurityMsg, 'error', 'Mínimo de 6 caracteres.');
        }
        if (passwordForm.password !== passwordForm.confirmPassword) {
            return handleFeedback(setSecurityMsg, 'error', 'As senhas não conferem.');
        }

        setSavingSecurity(true);
        try {
            await api.put(`/admin/users/${id}/update-password`, { password: passwordForm.password });
            handleFeedback(setSecurityMsg, 'success', 'Senha alterada com sucesso!');
            setPasswordForm({ password: "", confirmPassword: "" });
        } catch (err) {
            handleFeedback(setSecurityMsg, 'error', 'Erro ao alterar senha.');
        } finally {
            setSavingSecurity(false);
        }
    };

    const handleChangePlan = async () => {
        setSavingPlan(true);
        setPlanMsg(null);
        try {
            await api.post(`/admin/users/${id}/change-plan`, { plan_id: form.plan_id });

            handleFeedback(setPlanMsg, 'success', 'Plano alterado com sucesso!');
            await refreshData();

            setTimeout(() => {
                setShowPlanModal(false);
                setPlanMsg(null);
            }, 1500);

        } catch (error) {
            handleFeedback(setPlanMsg, 'error', 'Não foi possível alterar o plano.');
        } finally {
            setSavingPlan(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!showConfirmModal) return;
        setProcessingAction(true);
        setModalMsg(null);

        try {
            await showConfirmModal.action();
            handleFeedback(setModalMsg, 'success', 'Operação realizada com sucesso!');
            await refreshData();

            setTimeout(() => {
                setShowConfirmModal(null);
                setModalMsg(null);
            }, 1500);

        } catch (error) {
            handleFeedback(setModalMsg, 'error', 'Erro ao realizar operação.');
        } finally {
            setProcessingAction(false);
        }
    };

    const actionDisable = async () => await api.post(`/admin/users/${id}/disable`);
    const actionEnable = async () => await api.post(`/admin/users/${id}/enable`);
    const actionResend = async () => await api.post(`/admin/users/${id}/resend-confirmation`);

    // ── Helpers de permissão ──────────────────────────────
    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setForm((prev) => ({
            ...prev,
            role: newRole,
            // Se sair de admin, limpa as permissões
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

    const clearAll = () => setForm((prev) => ({ ...prev, admin_permissions: [] }));

    const grouped = groupedAdminPages();
    const showPermissions = currentUser?.role === "admin_master" && form.role === "admin";

    // ESTILOS
    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
    const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 w-full sm:w-auto";

    if (loading) return <div className="flex h-screen items-center justify-center text-[#7F33D9]"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 relative">

            {/* HEADER COM BOTÃO DE VOLTAR (Igual Regions) */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    to="/admin/usuarios"
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>

                <div>
                    <h1 className="text-2xl font-bold text-[#111]">{theUser.name}</h1>
                    <p className="text-sm text-gray-500">
                        Gerenciar detalhes e permissões do usuário
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA: FORMULÁRIOS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* CARD PERFIL */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <User className="text-[#7F33D9]" size={20} /> Dados do Perfil
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${theUser.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {theUser.active ? "Ativo" : "Inativo"}
                            </span>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Nome</label>
                                    <input type="text" className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input type="email" className={`${inputClass} pl-10`} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Função do Sistema</label>
                                <div className="relative">
                                    <Shield size={16} className="absolute left-3 top-3 text-gray-400" />
                                    <select
                                        className={`${inputClass} pl-10 ${theUser.id === currentUser.id ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                        value={form.role}
                                        onChange={handleRoleChange}
                                        disabled={theUser.id === currentUser.id}
                                    >
                                        <option value="user">Usuário Comum</option>
                                        <option value="admin">Administrador</option>
                                        {currentUser?.role === "admin_master" && (
                                            <option value="admin_master">Admin Master</option>
                                        )}
                                    </select>
                                </div>
                                {theUser.id === currentUser.id && <p className="text-xs text-orange-500 mt-1">Você não pode alterar sua própria função.</p>}
                            </div>

                            {/* ── Permissões de acesso (admin_master editando um admin) ── */}
                            {showPermissions && (
                                <div className="pt-2">
                                    <div className="border-t border-gray-100 mb-5" />
                                    <div className="flex items-center gap-3 mb-4">
                                        <ShieldCheck size={20} className="text-[#7F33D9]" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Permissões de Acesso</p>
                                            <p className="text-xs text-gray-400">Defina quais seções do painel este administrador poderá acessar.</p>
                                        </div>
                                        <div className="ml-auto flex gap-2">
                                            <button type="button" onClick={selectAll} className="text-xs text-violet-600 hover:underline font-medium">
                                                Selecionar tudo
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button type="button" onClick={clearAll} className="text-xs text-gray-400 hover:underline font-medium">
                                                Limpar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {Object.entries(grouped).map(([groupName, pages]) => {
                                            const groupKeys = pages.map((p) => p.key);
                                            const allGroupSelected = groupKeys.every((k) => form.admin_permissions.includes(k));
                                            const someGroupSelected = groupKeys.some((k) => form.admin_permissions.includes(k));

                                            return (
                                                <div key={groupName} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={allGroupSelected}
                                                            ref={(el) => {
                                                                if (el) el.indeterminate = someGroupSelected && !allGroupSelected;
                                                            }}
                                                            onChange={() => toggleGroup(groupKeys)}
                                                            className="w-4 h-4 rounded border-gray-300 accent-violet-600"
                                                        />
                                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{groupName}</span>
                                                    </label>
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

                                    <p className="text-xs text-gray-400 mt-3">
                                        {form.admin_permissions.length === 0
                                            ? "Nenhuma permissão selecionada — o admin só verá a tela inicial."
                                            : `${form.admin_permissions.length} permissão(ões) selecionada(s).`}
                                    </p>
                                </div>
                            )}

                            <div className="pt-2 flex flex-col items-end">
                                <button type="submit" disabled={savingProfile} className={btnPrimary}>
                                    {savingProfile ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar Alterações</>}
                                </button>
                                {/* MENSAGEM PERFIL */}
                                <FeedbackMessage msg={profileMsg} />
                            </div>
                        </form>
                    </div>

                    {/* CARD SEGURANÇA */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <Lock className="text-orange-500" size={20} /> Segurança
                        </h2>

                        <form onSubmit={handleUpdatePassword} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Nova Senha</label>
                                    <input type="password" className={inputClass} value={passwordForm.password} onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                                </div>
                                <div>
                                    <label className={labelClass}>Confirmar Senha</label>
                                    <input type="password" className={inputClass} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Repita a senha" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <button type="submit" disabled={savingSecurity} className="px-4 py-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full text-sm font-bold hover:bg-orange-100 transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {savingSecurity ? <Loader2 size={16} className="animate-spin" /> : null}
                                    Atualizar Senha
                                </button>
                                {/* MENSAGEM SENHA */}
                                <FeedbackMessage msg={securityMsg} />
                            </div>
                        </form>
                    </div>
                </div>

                {/* COLUNA DIREITA: PLANO & AÇÕES */}
                <div className="space-y-6">

                    {/* CARD PLANO */}
                    <div className="bg-purple-50 border border-purple-100 rounded-3xl p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-purple-900 font-bold flex items-center gap-2 mb-1">
                                <CreditCard size={18} /> Plano Atual
                            </h3>
                            <p className="text-2xl font-bold text-[#7F33D9] mb-4">
                                {theUser.plan_name || "Sem Plano"}
                            </p>
                            <button
                                onClick={() => setShowPlanModal(true)}
                                className="w-full py-2 bg-white text-[#7F33D9] font-bold text-sm rounded-lg shadow-sm border border-purple-100 hover:bg-purple-50 transition-colors"
                            >
                                Alterar Plano
                            </button>
                        </div>
                        <div className="absolute -right-6 -bottom-6 text-purple-200 opacity-50 transform rotate-12">
                            <CreditCard size={120} />
                        </div>
                    </div>

                    {/* CARD AÇÕES ADMIN */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Ações Administrativas</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowConfirmModal({
                                    type: 'resend',
                                    title: 'Reenviar confirmação?',
                                    text: 'Um novo email de validação será enviado para o usuário.',
                                    action: actionResend
                                })}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Send size={16} /></div>
                                Reenviar Confirmação
                            </button>

                            {theUser.active ? (
                                <button
                                    onClick={() => {
                                        if (theUser.id === currentUser.id) return handleFeedback(setProfileMsg, 'error', "Você não pode se inativar.");
                                        setShowConfirmModal({
                                            type: 'disable',
                                            title: 'Inativar Usuário?',
                                            text: 'O usuário perderá acesso imediato à plataforma.',
                                            action: actionDisable
                                        })
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-50 hover:bg-red-50 text-red-700 text-sm font-medium transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Ban size={16} /></div>
                                    Inativar Usuário
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowConfirmModal({
                                        type: 'enable',
                                        title: 'Reativar Usuário?',
                                        text: 'O acesso do usuário será restabelecido imediatamente.',
                                        action: actionEnable
                                    })}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-green-50 hover:bg-green-50 text-green-700 text-sm font-medium transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={16} /></div>
                                    Reativar Usuário
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL PLANO */}
            {showPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="absolute inset-0 bg-black/40 " onClick={() => setShowPlanModal(false)} />
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Trocar Plano</h3>
                            <button onClick={() => setShowPlanModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <select
                            className={inputClass}
                            value={form.plan_id}
                            onChange={e => setForm({ ...form, plan_id: e.target.value })}
                        >
                            <option value="">Selecione um plano</option>
                            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>

                        {/* Mensagem Inline do Modal */}
                        <FeedbackMessage msg={planMsg} />

                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setShowPlanModal(false)} className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-50 rounded-lg">Cancelar</button>
                            <button
                                onClick={handleChangePlan}
                                disabled={savingPlan}
                                className="px-4 py-2 bg-[#7F33D9] text-white rounded-lg text-sm font-bold shadow hover:bg-[#6025A8] disabled:opacity-70 flex items-center gap-2"
                            >
                                {savingPlan ? <Loader2 size={14} className="animate-spin" /> : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAÇÃO */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="absolute inset-0 bg-black/40 " onClick={() => !processingAction && setShowConfirmModal(null)} />
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6 text-center">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${showConfirmModal.type === 'disable' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                            {showConfirmModal.type === 'disable' ? <AlertTriangle size={28} /> : <AlertCircle size={28} />}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{showConfirmModal.title}</h3>
                        <p className="text-sm text-gray-500 mb-6">{showConfirmModal.text}</p>

                        {/* Mensagem Inline do Modal */}
                        <FeedbackMessage msg={modalMsg} />

                        {!modalMsg && (
                            <div className="flex gap-3 justify-center mt-4">
                                <button
                                    onClick={() => setShowConfirmModal(null)}
                                    disabled={processingAction}
                                    className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={processingAction}
                                    className={`px-4 py-2 text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-2 ${showConfirmModal.type === 'disable' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'} disabled:opacity-70`}
                                >
                                    {processingAction ? <Loader2 size={16} className="animate-spin" /> : "Confirmar"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}