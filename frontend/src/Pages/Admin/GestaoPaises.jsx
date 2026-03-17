import { useState, useEffect } from "react";
import { api } from "../../services/api"; 
import { Trash2, Loader2, Check, Plus, Search, X, Globe } from "lucide-react";
import paises from "world-countries";
import Select from "../../components/uxui/Select";

export default function GestaoPaises() {
    const [countries, setCountries] = useState([]);
    const [modal, setModal] = useState(false);
    const [paisSelecionado, setPaisSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [editCountryId, setEditCountryId] = useState(null); 
    const [currentCountry, setCurrentCountry] = useState(null);
    
    // --- BUSCA CLIENT-SIDE ---
    const [searchTerm, setSearchTerm] = useState("");

    // Carregar TODOS os dados de uma vez
    async function loadCountries() {
        try {
            // limit=1000 garante que traga tudo para filtrarmos aqui
            const { data } = await api.get("/admin/countries?limit=1000"); 
            setCountries(data.countries);
        } catch (err) {
            console.error("Erro ao carregar países:", err);
        }
    }

    useEffect(() => { loadCountries(); }, []);

    // Filtro
    const filteredCountries = countries.filter((country) => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- HANDLERS ---
    const handleOpenDeleteModal = async (countryId) =>  {
        setEditCountryId(countryId);
        setModal(true);
        setPaisSelecionado(null); 
        try {
            // Busca dados específicos apenas se precisar confirmar algo que não veio na lista
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
                    setLoading(false); setSuccess(false); setModal(false);
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
                setLoading(false); setModal(false);
                loadCountries();
            } else { setLoading(false); alert("Erro ao deletar."); }
        } catch (error) { setLoading(false); alert("Erro ao realizar operação."); }
    };

    // Estilos
    const btnPrimary = "flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20";
    const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
    const btnDanger = "px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-full text-sm font-bold hover:bg-red-100 transition-colors";

    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Gestão de Países</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie os países disponíveis.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors"><Search size={18} /></div>
                        <input type="text" placeholder="Filtrar país..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"><X size={14} /></button>}
                    </div>
                    <button onClick={handleOpenCreateModal} className={btnPrimary}><Plus size={18} /> <span className="whitespace-nowrap">Novo País</span></button>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                {filteredCountries.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:gap-px bg-white border-b border-gray-100">
                        {filteredCountries.map((country) => (
                            <div key={country.id_country} className="group relative bg-white p-6 hover:z-10 transition-all duration-300 flex flex-col items-center text-center gap-4 hover:shadow-lg">
                                <div className="relative w-16 h-16 rounded-full border-4 border-gray-50 shadow-sm overflow-hidden group-hover:scale-110 transition-transform duration-300">
                                    <img className="w-full h-full object-cover" src={country.flag_url || "https://flagcdn.com/w40/xx.png"} alt={country.name} />
                                </div>
                                <span className="font-bold text-gray-900 text-lg group-hover:text-[#7F33D9] transition-colors">{country.name}</span>
                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                    <button onClick={() => handleOpenDeleteModal(country.id_country)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"><Trash2 size={14} /> Remover</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <Globe size={32} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">Nenhum país encontrado</h3>
                        {searchTerm ? <p className="text-sm text-gray-500">Sem resultados para "{searchTerm}"</p> : <button onClick={handleOpenCreateModal} className={`mt-4 ${btnPrimary}`}>Adicionar</button>}
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
                                    <p className="text-sm text-gray-500 mb-6">Desativar <strong>{currentCountry?.name}</strong> afetará clubes e ligas.</p>
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
                                            <div><img src={paisSelecionado.flag} className="w-16 h-auto shadow-sm rounded mb-3 mx-auto"/> <span className="text-lg font-bold block">{paisSelecionado.value}</span></div>
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