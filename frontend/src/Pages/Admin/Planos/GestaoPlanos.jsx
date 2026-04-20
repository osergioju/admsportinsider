import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import {
    Plus,
    ChevronRight,
    CreditCard,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    X,
    AlertTriangle
} from "lucide-react";

export default function GestaoPlanos() {
    const [plans, setPlans] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);

    // Estados para o Modal de Confirmação
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [planToDisable, setPlanToDisable] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

    const navigate = useNavigate();

    async function loadPlans() {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/plans?page=${page}&limit=10`);
            setPlans(data.plans);
            setPagination(data.pagination);
        } catch (err) {
            console.error("Erro ao carregar planos:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPlans();
    }, [page]);

    // Função para abrir modal de confirmação
    function openDisableModal(plan) {
        setPlanToDisable(plan);
        setFeedback(null);
        setDeleteModalOpen(true);
    }

    // Função que executa a desativação após confirmação
    async function handleConfirmDisable() {
        if (!planToDisable) return;
        setProcessing(true);
        setFeedback(null);

        try {
            await api.delete(`/admin/plans/${planToDisable.id}`);
            setFeedback({ type: 'success', text: 'Plano desativado com sucesso!' });

            await loadPlans();

            // Fecha o modal após o feedback
            setTimeout(() => {
                setDeleteModalOpen(false);
                setPlanToDisable(null);
                setFeedback(null);
            }, 1500);

        } catch (error) {
            setFeedback({ type: 'error', text: 'Erro ao desativar o plano.' });
        } finally {
            setProcessing(false);
        }
    }

    // Componente de Feedback Inline Padrão
    const FeedbackMessage = ({ msg }) => {
        if (!msg) return null;
        const isSuccess = msg.type === 'success';
        return (
            <div className={`mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {isSuccess ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
                <span>{msg.text}</span>
            </div>
        );
    };

    const btnPrimary = "flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20";

    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500 relative">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Gestão de Planos</h1>
                    <p className="text-gray-500 text-sm mt-1">Configure os modelos de assinatura disponíveis.</p>
                </div>

                <Link to="/admin/gestao-planos/novo" className={btnPrimary}>
                    <Plus size={18} /> Criar plano
                </Link>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={32} className="animate-spin mb-2 text-[#7F33D9]" />
                        <p className="text-sm">Carregando planos...</p>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                            <CreditCard size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhum plano encontrado</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Comece criando um plano para seus assinantes.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                        <th className="px-6 py-4">Nome do Plano</th>
                                        <th className="px-6 py-4">Preço (Display)</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {plans.map((plan) => (
                                        <tr
                                            key={plan.id}
                                            className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/admin/gestao-planos/${plan.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7F33D9] flex items-center justify-center">
                                                        <CreditCard size={16} />
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 font-medium">
                                                    R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {plan.active ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                        Ativo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                                        Inativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDisableModal(plan);
                                                        }}
                                                        className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Desativar plano"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[#7F33D9] group-hover:translate-x-1 transition-all duration-300" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                                <span className="text-xs font-medium text-gray-500">
                                    Página <span className="text-gray-900">{page}</span> de {pagination.totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                        className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#7F33D9] hover:border-[#7F33D9] disabled:opacity-50 transition-all"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        disabled={page === pagination.totalPages}
                                        onClick={() => setPage(page + 1)}
                                        className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#7F33D9] hover:border-[#7F33D9] disabled:opacity-50 transition-all"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL DE CONFIRMAÇÃO DE DESATIVAÇÃO */}
            {deleteModalOpen && planToDisable && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/40 " onClick={() => !processing && setDeleteModalOpen(false)} />
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl relative z-10 p-6 text-center">
                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Desativar plano?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Você tem certeza que deseja desativar o plano <strong>"{planToDisable.name}"</strong>?
                        </p>

                        <FeedbackMessage msg={feedback} />

                        {!feedback && (
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50"
                                    disabled={processing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmDisable}
                                    className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 flex items-center gap-2"
                                    disabled={processing}
                                >
                                    {processing && <Loader2 size={14} className="animate-spin" />}
                                    Sim, desativar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}