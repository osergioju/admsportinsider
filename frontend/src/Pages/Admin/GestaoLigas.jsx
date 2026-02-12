import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api"; 
import { Trash2, Loader2, Check, Plus, Search, ChevronLeft, ChevronRight, X, Trophy } from "lucide-react";

export default function GestaoLigas() {
    const [leagues, setLeagues] = useState([]);
    const [countries, setCountries] = useState([]);
    
    // Modal
    const [modal, setModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Dados
    const [currentLeague, setCurrentLeague] = useState(null);
    const [newLeague, setNewLeague] = useState({ id_country: "", name: "", description: "", logo_url: "" });
    
    // Estados UI
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    
    // Busca
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // 1. Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 2. Data Loading
    const loadData = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                page: page,
                limit: 8
            });
            if (debouncedSearch) params.append('search', debouncedSearch);

            const respLeagues = await api.get(`/admin/leagues?${params.toString()}`);
            setLeagues(respLeagues.data.leagues);
            setPagination(respLeagues.data.pagination);

            // Carrega lista de países para o select apenas se ainda não tiver carregado
            if (countries.length === 0) {
                const respCountries = await api.get(`/admin/countries?onlyActive=true`);
                const countryOptions = respCountries.data.countries.map(c => ({
                    value: c.id_country,
                    label: c.name
                }));
                setCountries(countryOptions);
            }

        } catch (err) {
            console.error("Erro dados:", err);
        }
    }, [page, debouncedSearch]); // Dependências

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers Modal
    const openCreateModal = () => {
        setNewLeague({ id_country: "", name: "", description: "", logo_url: "" });
        setIsEditing(false);
        setModal(true);
    };

    const openEditModal = async (id) => {
        try {
            const { data } = await api.get(`/admin/leagues/${id}`);
            setCurrentLeague(data.league);
            setNewLeague({ ...data.league });
            setIsEditing(true);
            setModal(true);
        } catch (err) { console.error(err); }
    };

    const sendLeague = async () => {
        setLoading(true);
        try {
            const res = await api.post("/admin/send-league", newLeague);
            if (res.status === 201) {
                setSuccess(true);
                setTimeout(() => { setModal(false); setSuccess(false); setLoading(false); loadData(); }, 700);
            } else { setLoading(false); alert("Erro inesperado."); }
        } catch (err) { alert("Erro ao cadastrar"); setLoading(false); }
    };

    const updateLeague = async () => {
        setLoading(true);
        try {
            await api.put(`/admin/leagues/${currentLeague.id_league}/update`, newLeague);
            setSuccess(true);
            setTimeout(() => { setModal(false); setSuccess(false); setLoading(false); loadData(); }, 700);
        } catch (err) { alert("Erro ao atualizar"); setLoading(false); } 
    };

    const disableLeague = async (id) => {
        if (!window.confirm("Desativar esta liga?")) return;
        setLoading(true);
        try {
            await api.delete(`/admin/disable-league/${id}`);
            setModal(false); setLoading(false); loadData();
        } catch (err) { alert("Erro ao desativar"); setLoading(false); }
    };

    // Estilos
    const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
    const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
            {/* Header com Busca */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Ligas</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie os campeonatos e torneios.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Input Busca */}
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors"><Search size={18} /></div>
                        <input 
                            type="text" 
                            placeholder="Buscar liga..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                        {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"><X size={14} /></button>}
                    </div>
                    <button onClick={openCreateModal} className={btnPrimary}><Plus size={18} /> Nova Liga</button>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-6 min-h-[400px] flex flex-col">
                {leagues.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {leagues.map((league) => (
                            <div key={league.id_league} onClick={() => openEditModal(league.id_league)} className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#7F33D9]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center gap-4 cursor-pointer">
                                <div className="relative w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center p-3 border border-gray-100 group-hover:bg-white transition-colors">
                                    {league.logo_url ? <img src={league.logo_url} className="w-full h-full object-contain drop-shadow-sm" alt={league.name} /> : <Trophy size={32} className="text-gray-300" />}
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <span className="font-bold text-gray-900 text-base group-hover:text-[#7F33D9] transition-colors truncate w-full">{league.name}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{league.country_name || "Internacional"}</span>
                                </div>
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-[#7F33D9]"><Search size={12} /></div></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Trophy size={32} className="text-gray-300" /></div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhuma liga encontrada</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-1">{searchTerm ? `Sem resultados para "${searchTerm}"` : "Comece cadastrando."}</p>
                        {searchTerm && <button onClick={() => setSearchTerm("")} className="mt-4 text-[#7F33D9] font-bold text-sm hover:underline">Limpar busca</button>}
                    </div>
                )}
                
                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Página {page} de {pagination.totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50"><ChevronLeft size={16} /></button>
                            <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - Renderização igual ao anterior */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setModal(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">{isEditing ? "Editar Liga" : "Nova Liga"}</h2>
                            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div>
                                <label className={labelClass}>País</label>
                                <select value={newLeague.id_country} onChange={(e) => setNewLeague({ ...newLeague, id_country: e.target.value })} className={inputClass}>
                                    <option value="">Selecione...</option>
                                    {countries.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Nome</label>
                                <input type="text" className={inputClass} value={newLeague.name} onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Descrição</label>
                                <textarea className={inputClass} rows={3} value={newLeague.description} onChange={(e) => setNewLeague({ ...newLeague, description: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Logo URL</label>
                                <input type="text" className={inputClass} value={newLeague.logo_url} onChange={(e) => setNewLeague({ ...newLeague, logo_url: e.target.value })} />
                            </div>
                            <div className="pt-4 flex items-center justify-between gap-4">
                                {isEditing && <button onClick={() => disableLeague(currentLeague.id_league)} className="text-red-500 text-xs font-bold uppercase tracking-wide hover:bg-red-50 px-3 py-2 rounded-lg"><Trash2 size={14} className="inline mr-1" /> Desativar</button>}
                                <div className="flex gap-3 ml-auto">
                                    <button onClick={() => setModal(false)} className={btnSecondary}>Cancelar</button>
                                    <button onClick={isEditing ? updateLeague : sendLeague} disabled={loading || success} className={btnPrimary}>{loading ? <Loader2 size={18} className="animate-spin" /> : success ? <Check size={18} /> : "Salvar"}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}