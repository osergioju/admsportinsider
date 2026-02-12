import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api"; 
import { Trash2, Loader2, Check, Plus, Search, ChevronLeft, ChevronRight, X, Globe } from "lucide-react";
import paises from "world-countries";
import Select from "../../components/uxui/Select";

export default function GestaoPaises() {
    const [countries, setCountries] = useState([]);
    const [modal, setModal] = useState(false);
    const [paisSelecionado, setPaisSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Edição e Deleção
    const [editCountryId, setEditCountryId] = useState(null); 
    const [currentCountry, setCurrentCountry] = useState(null);
    
    // Paginação e Busca
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // Valor do input
    const [debouncedSearch, setDebouncedSearch] = useState(""); // Valor enviado pra API

    // 1. Debounce (Espera parar de digitar)
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1); // Reseta paginação ao buscar
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 2. Carregar Dados
    const loadCountries = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                page: page,
                limit: 8
            });
            if (debouncedSearch) params.append('search', debouncedSearch);

            const { data } = await api.get(`/admin/countries?${params.toString()}`);
            setCountries(data.countries);
            setPagination(data.pagination);
        } catch (err) {
            console.error("Erro ao carregar países:", err);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        loadCountries();
    }, [loadCountries]);

    // --- HANDLERS ---
    const handleOpenDeleteModal = async (countryId) =>  {
        setEditCountryId(countryId);
        setModal(true);
        setPaisSelecionado(null); 
        try {
            const { data } = await api.get("/admin/countries/" + countryId);
            setCurrentCountry(data.countries[0]); 
        } catch (err) { console.error(err); }
    };

    const handleOpenCreateModal = () => {
        setEditCountryId(null);
        setCurrentCountry(null);
        setPaisSelecionado(null);
        setModal(true);
    };

    const handleSelectCountry = (e) => {
        const option = e.target.selectedOptions[0];
        setPaisSelecionado({
            codigo: option.value,
            flag: option.dataset.flag,
            value : option.dataset.name
        });
    };

    const sendCountry = async () => {
        setLoading(true);
        try {
            const res = await api.post("/admin/send-countries", paisSelecionado);
            if (res.status === 201) {
                setSuccess(true);
                setTimeout(() => {
                    setLoading(false);
                    setSuccess(false);
                    setModal(false);
                    loadCountries();
                }, 1000);                
            } else { setLoading(false); alert("Erro ao cadastrar."); }
        } catch (error) { setLoading(false); alert("Erro ao cadastrar."); }
    };

   const deleteCountry = async (countryId) => {
        setLoading(true);
        try {
            const res = await api.delete(`/admin/disable-country/${countryId}`);
            if (res.status === 200) {
                setLoading(false);
                setModal(false);
                loadCountries();
            } else { setLoading(false); alert("Erro ao deletar."); }
        } catch (error) { setLoading(false); alert("Erro ao realizar operação."); }
    };

    // --- ESTILOS ---
    const btnPrimary = "flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20";
    const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
    const btnDanger = "px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-full text-sm font-bold hover:bg-red-100 transition-colors";

    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
            
            {/* Header com Busca */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Gestão de Países</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie os países disponíveis para ligas e clubes.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Barra de Busca */}
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar país..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm("")}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button onClick={handleOpenCreateModal} className={btnPrimary}>
                        <Plus size={18} /> <span className="whitespace-nowrap">Novo País</span>
                    </button>
                </div>
            </div>

            {/* Grid de Países */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-6 min-h-[400px] flex flex-col">
                {countries.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {countries.map((country) => (
                            <div key={country.id_country} className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#7F33D9]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center gap-4">
                                <div className="relative w-16 h-16 rounded-full border-4 border-gray-50 shadow-sm overflow-hidden group-hover:scale-110 transition-transform duration-300">
                                    <img className="w-full h-full object-cover" src={country.flag_url || "https://flagcdn.com/w40/xx.png"} alt={country.name} />
                                </div>
                                <span className="font-bold text-gray-900 text-lg group-hover:text-[#7F33D9] transition-colors">{country.name}</span>
                                <div className="mt-2">
                                    <button onClick={() => handleOpenDeleteModal(country.id_country)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300">
                                        <Trash2 size={14} /> Remover
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Globe size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhum país encontrado</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-1">
                            {searchTerm ? `Não encontramos nada para "${searchTerm}"` : "Comece adicionando países para configurar a base de dados."}
                        </p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="mt-4 text-[#7F33D9] font-bold text-sm hover:underline">Limpar busca</button>
                        )}
                        {!searchTerm && (
                            <button onClick={handleOpenCreateModal} className={`mt-6 ${btnPrimary}`}>Adicionar agora</button>
                        )}
                    </div>
                )}

                {/* Paginação */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Página <span className="text-gray-900">{page}</span> de {pagination.totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#7F33D9] hover:border-[#7F33D9] disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronLeft size={16} /></button>
                            <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#7F33D9] hover:border-[#7F33D9] disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Create/Delete */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setModal(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-lg text-gray-900">{editCountryId ? "Desativar País" : "Adicionar Novo País"}</h3>
                            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            {editCountryId ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Tem certeza?</h4>
                                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">Você está prestes a desativar <strong className="text-gray-900 mx-1">{currentCountry?.name}</strong>. Isso afetará todos os clubes e ligas vinculados.</p>
                                    <div className="flex gap-3 justify-center">
                                        <button onClick={() => setModal(false)} className={btnSecondary}>Cancelar</button>
                                        <button onClick={() => deleteCountry(currentCountry.id_country)} className={btnDanger} disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" /> : "Sim, desativar"}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 ml-1">Selecione na lista global</label>
                                        <Select onChange={handleSelectCountry} label="Buscar país..." labelColor="text-gray-400" variant="light" options={paises} />
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[120px] flex flex-col items-center justify-center text-center">
                                        {paisSelecionado ? (
                                            success ? <div className="text-green-600 font-bold"><Check size={24} className="mx-auto mb-2"/>Cadastrado!</div> : 
                                            loading ? <Loader2 size={32} className="animate-spin text-[#7F33D9]" /> :
                                            <div><img src={paisSelecionado.flag} className="w-16 h-auto shadow-sm rounded mb-3 mx-auto"/> <span className="text-lg font-bold block">{paisSelecionado.value}</span><span className="text-xs text-gray-400 font-mono mt-1">{paisSelecionado.codigo}</span></div>
                                        ) : <div className="text-gray-400"><Globe size={32} className="mb-2 opacity-50 mx-auto"/><span className="text-xs">Nenhum país selecionado</span></div>}
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button onClick={sendCountry} disabled={!paisSelecionado || loading || success} className={`${btnPrimary} w-full justify-center py-3`}>Confirmar Cadastro</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}