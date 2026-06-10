import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Trash2, Loader2, Check, Plus, Search, X, Globe, Pencil } from "lucide-react";
import _paises from "world-countries";

// Nações do Reino Unido que competem separadamente no futebol mas não
// existem como países soberanos no world-countries
const UK_NATIONS = [
    { cca2: "gb-eng", name: { common: "Inglaterra" } },
    { cca2: "gb-sct", name: { common: "Escócia" } },
    { cca2: "gb-wls", name: { common: "País de Gales" } },
    { cca2: "gb-nir", name: { common: "Irlanda do Norte" } },
];

const paises = [..._paises, ...UK_NATIONS];
import CountryCombobox from "../../components/uxui/CountryCombobox";

export default function GestaoPaises() {
    const [countries, setCountries] = useState([]);
    // modalMode: null | "create" | "edit" | "delete"
    const [modalMode, setModalMode] = useState(null);
    const [paisSelecionado, setPaisSelecionado] = useState(null);
    // createMode: "list" (world-countries) | "manual" (nome livre, ex: Sérvia e Montenegro)
    const [createMode, setCreateMode] = useState("list");
    const [manualForm, setManualForm] = useState({ name: "", flag_url: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [currentCountry, setCurrentCountry] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", flag_url: "", translations: {} });
    const [activeRegions, setActiveRegions] = useState([]);
    const [loadingTranslations, setLoadingTranslations] = useState(false);

    // --- BUSCA CLIENT-SIDE ---
    const [searchTerm, setSearchTerm] = useState("");

    async function loadCountries() {
        try {
            const { data } = await api.get("/admin/countries?limit=1000");
            setCountries(data.countries);
        } catch (err) {
            console.error("Erro ao carregar países:", err);
        }
    }

    useEffect(() => { loadCountries(); }, []);

    const filteredCountries = countries.filter((country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- HANDLERS ---
    const handleOpenCreateModal = () => {
        setPaisSelecionado(null);
        setCreateMode("list");
        setManualForm({ name: "", flag_url: "" });
        setModalMode("create");
    };

    const handleOpenEditModal = async (country) => {
        setCurrentCountry(country);
        setEditForm({ name: country.name, flag_url: country.flag_url || "", translations: {} });
        setModalMode("edit");
        setLoadingTranslations(true);
        try {
            const [regionsRes, countryRes] = await Promise.all([
                api.get("/admin/regions"),
                api.get(`/admin/countries/${country.id_country}`),
            ]);
            const regions = (regionsRes.data?.regions || regionsRes.data || []).filter(r => r.active);
            setActiveRegions(regions.filter(r => r.code !== "pt-BR"));
            const translations = countryRes.data?.country?.translations || {};
            setEditForm({ name: country.name, flag_url: country.flag_url || "", translations });
        } catch (err) {
            console.error("Erro ao carregar traduções:", err);
        } finally {
            setLoadingTranslations(false);
        }
    };

    const handleOpenDeleteModal = (country) => {
        setCurrentCountry(country);
        setModalMode("delete");
    };

    const closeModal = () => { setModalMode(null); setSuccess(false); setLoading(false); };

    const handleSelectCountry = (country) => {
        setPaisSelecionado(country);
    };

    const sendCountry = async () => {
        // Monta o payload conforme o modo: lista global ou cadastro manual
        const payload = createMode === "manual"
            ? { codigo: null, flag: manualForm.flag_url.trim() || null, value: manualForm.name.trim() }
            : paisSelecionado;
        if (!payload?.value) return;
        if (countries.some((c) => c.name.toLowerCase() === payload.value.toLowerCase())) {
            return alert(`"${payload.value}" já está cadastrado.`);
        }
        setLoading(true);
        try {
            const res = await api.post("/admin/send-countries", payload);
            if (res.status === 201) {
                setSuccess(true);
                setTimeout(() => { closeModal(); loadCountries(); }, 1000);
            } else { setLoading(false); alert("Erro ao cadastrar."); }
        } catch (error) { setLoading(false); alert("Erro ao cadastrar."); }
    };

    const updateCountry = async () => {
        if (!editForm.name.trim()) return;
        setLoading(true);
        try {
            await api.put(`/admin/countries/${currentCountry.id_country}/update`, {
                name: editForm.name,
                flag_url: editForm.flag_url,
                translations: editForm.translations,
            });
            setSuccess(true);
            setTimeout(() => { closeModal(); loadCountries(); }, 700);
        } catch (error) { setLoading(false); alert("Erro ao atualizar país."); }
    };

    const deleteCountry = async () => {
        setLoading(true);
        try {
            await api.delete(`/admin/disable-country/${currentCountry.id_country}`);
            closeModal();
            loadCountries();
        } catch (error) { setLoading(false); alert("Erro ao realizar operação."); }
    };

    // Estilos
    const btnPrimary = "flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20";
    const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
    const btnDanger = "px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-full text-sm font-bold hover:bg-red-100 transition-colors";
    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

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
                    <button onClick={handleOpenCreateModal} className={btnPrimary}><Plus size={18} /><span className="whitespace-nowrap">Novo País</span></button>
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
                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 flex gap-2">
                                    <button onClick={() => handleOpenEditModal(country)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"><Pencil size={12} /> Editar</button>
                                    <button onClick={() => handleOpenDeleteModal(country)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"><Trash2 size={12} /> Remover</button>
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

            {/* Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={closeModal}>
                    <div className="absolute inset-0 bg-black/40 " />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-lg text-gray-900">
                                {modalMode === "create" && "Adicionar Novo País"}
                                {modalMode === "edit" && "Editar País"}
                                {modalMode === "delete" && "Desativar País"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">

                            {/* CRIAR */}
                            {modalMode === "create" && (
                                <div className="space-y-6">
                                    {/* Toggle Lista global / Manual */}
                                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setCreateMode("list")}
                                            className={`flex-1 py-2 text-sm font-medium transition-colors ${createMode === "list" ? "bg-[#7F33D9] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            Lista global
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCreateMode("manual")}
                                            className={`flex-1 py-2 text-sm font-medium transition-colors ${createMode === "manual" ? "bg-[#7F33D9] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            Manual
                                        </button>
                                    </div>

                                    {createMode === "list" ? (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 ml-1">Selecione na lista global</label>
                                                <CountryCombobox
                                                    options={paises}
                                                    value={paisSelecionado}
                                                    onChange={handleSelectCountry}
                                                    placeholder="Buscar país..."
                                                />
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[120px] flex flex-col items-center justify-center text-center">
                                                {paisSelecionado ? (
                                                    success ? <div className="text-green-600 font-bold"><Check size={24} className="mx-auto mb-2" />Cadastrado!</div> :
                                                        loading ? <Loader2 size={32} className="animate-spin text-[#7F33D9]" /> :
                                                            <div><img src={paisSelecionado.flag} className="w-16 h-auto shadow-sm rounded mb-3 mx-auto" /> <span className="text-lg font-bold block">{paisSelecionado.value}</span></div>
                                                ) : <div className="text-gray-400"><Globe size={32} className="mb-2 opacity-50 mx-auto" /><span className="text-xs">Nenhum país selecionado</span></div>}
                                            </div>
                                            <button onClick={sendCountry} disabled={!paisSelecionado || loading || success} className={`${btnPrimary} w-full justify-center py-3`}>Confirmar Cadastro</button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xs text-gray-400 -mt-2">
                                                Para países/seleções que não existem na lista global — ex: <strong>Sérvia e Montenegro</strong>, Iugoslávia, União Soviética.
                                            </p>
                                            <div>
                                                <label className={labelClass}>Nome</label>
                                                <input
                                                    type="text"
                                                    className={inputClass}
                                                    placeholder="Ex: Sérvia e Montenegro"
                                                    value={manualForm.name}
                                                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>URL da Bandeira <span className="font-normal text-gray-400 normal-case">(opcional)</span></label>
                                                <div className="flex items-center gap-2">
                                                    {manualForm.flag_url.trim() && (
                                                        <img src={manualForm.flag_url} alt="preview" className="w-10 h-7 object-cover rounded shadow-sm border border-gray-100 shrink-0" onError={(e) => { e.target.style.display = "none"; }} />
                                                    )}
                                                    <input
                                                        type="text"
                                                        className={inputClass}
                                                        placeholder="https://..."
                                                        value={manualForm.flag_url}
                                                        onChange={(e) => setManualForm({ ...manualForm, flag_url: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            {success ? (
                                                <div className="text-green-600 font-bold text-center py-2"><Check size={24} className="mx-auto mb-1" />Cadastrado!</div>
                                            ) : (
                                                <button onClick={sendCountry} disabled={!manualForm.name.trim() || loading} className={`${btnPrimary} w-full justify-center py-3`}>
                                                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirmar Cadastro"}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* EDITAR */}
                            {modalMode === "edit" && (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4 mb-2">
                                        {editForm.flag_url && <img src={editForm.flag_url} className="w-14 h-auto rounded shadow-sm border border-gray-100" alt="" />}
                                        <span className="text-sm text-gray-400">Pré-visualização da bandeira</span>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Nome <span className="font-normal text-gray-400 normal-case">(pt-BR)</span></label>
                                        <input type="text" className={inputClass} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                    </div>

                                    {/* Traduções por idioma ativo */}
                                    {loadingTranslations ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Loader2 size={14} className="animate-spin" /> Carregando idiomas...
                                        </div>
                                    ) : activeRegions.length > 0 && (
                                        <div className="border-t border-gray-100 pt-4 space-y-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Traduções</p>
                                            {activeRegions.map((region) => (
                                                <div key={region.id}>
                                                    <label className={labelClass}>
                                                        {region.name} <span className="font-normal text-gray-400 normal-case">({region.code})</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={inputClass}
                                                        placeholder={`Nome em ${region.name}...`}
                                                        value={editForm.translations[region.code] || ""}
                                                        onChange={(e) => setEditForm((prev) => ({
                                                            ...prev,
                                                            translations: { ...prev.translations, [region.code]: e.target.value },
                                                        }))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelClass}>URL da Bandeira</label>
                                        <input type="text" className={inputClass} placeholder="https://flagcdn.com/w40/br.png" value={editForm.flag_url} onChange={(e) => setEditForm({ ...editForm, flag_url: e.target.value })} />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
                                        <button onClick={updateCountry} disabled={!editForm.name.trim() || loading || success} className={`${btnPrimary} flex-1 justify-center`}>
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : success ? <><Check size={16} /> Salvo!</> : "Salvar alterações"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* DELETAR */}
                            {modalMode === "delete" && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Tem certeza?</h4>
                                    <p className="text-sm text-gray-500 mb-6">Desativar <strong>{currentCountry?.name}</strong> afetará clubes e ligas.</p>
                                    <div className="flex gap-3 justify-center">
                                        <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
                                        <button onClick={deleteCountry} className={btnDanger} disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" /> : "Sim, desativar"}</button>
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