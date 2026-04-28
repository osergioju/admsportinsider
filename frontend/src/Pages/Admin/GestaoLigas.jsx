import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Trash2, Loader2, Check, Plus, Search, ChevronLeft, ChevronRight, X, Trophy, Settings2, FileSpreadsheet, AlertTriangle, Shuffle } from "lucide-react";
import SearchableSelect from "../../components/uxui/SearchableSelect";
import CompetitionSetupModal from "./CompetitionSetupModal";
import ImportLeaguesModal from "./ImportLeaguesModal";
import CustomLeagueEditor from "./CustomLeagueEditor";
import TeamGroupAssignment from "./TeamGroupAssignment";

export default function GestaoLigas() {
    const [leagues, setLeagues] = useState([]);
    const [countries, setCountries] = useState([]);
    const [continents, setContinents] = useState([]);
    const [modal, setModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLeague, setCurrentLeague] = useState(null);
    const [leagueScope, setLeagueScope] = useState("country"); // "country" | "continent"
    const [newLeague, setNewLeague] = useState({ id_country: "", id_continent: "", name: "", description: "", logo_url: "", format: "", primary_color: "", secondary_color: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [setupLeague, setSetupLeague] = useState(null); // liga sendo configurada
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [customEditor, setCustomEditor] = useState(null); // { league, year }
    const [phaseMapper, setPhaseMapper] = useState(null); // { league }

    // --- BUSCA ---
    const [searchTerm, setSearchTerm] = useState("");

    async function loadData() {
        try {
            const [respLeagues, respCountries, respContinents] = await Promise.all([
                api.get(`/admin/leagues?limit=1000`),
                api.get(`/admin/countries?onlyActive=true&limit=1000`),
                api.get(`/admin/continents`),
            ]);
            setLeagues(respLeagues.data.leagues);
            setCountries(respCountries.data.countries.map(c => ({ value: c.id_country, label: c.name, image: c.flag_url })));
            setContinents(respContinents.data.continents.map(c => ({ value: c.id_continent, label: c.name, image: c.logo_url })));
        } catch (err) { console.error("Erro dados:", err); }
    }

    useEffect(() => { loadData(); }, []);

    // FILTRO NO FRONT
    const filteredLeagues = leagues.filter(league =>
        league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (league.country_name && league.country_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Handlers Modal
    const openCreateModal = () => {
        setNewLeague({ id_country: "", id_continent: "", name: "", description: "", logo_url: "", format: "", primary_color: "", secondary_color: "" });
        setLeagueScope("country");
        setIsEditing(false); setModal(true);
    };

    const openEditModal = async (id) => {
        try {
            const { data } = await api.get(`/admin/leagues/${id}`);
            setCurrentLeague(data.league);
            setNewLeague({ ...data.league });
            setLeagueScope(data.league.id_continent ? "continent" : "country");
            setIsEditing(true); setModal(true);
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
        if (!window.confirm("Desativar esta competição?")) return;
        setLoading(true);
        try { await api.delete(`/admin/disable-league/${id}`); setModal(false); setLoading(false); loadData(); } catch (err) { alert("Erro"); setLoading(false); }
    };

    // Estilos
    const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
    const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Competições</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie os campeonatos.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors"><Search size={18} /></div>
                        <input type="text" placeholder="Filtrar competições..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"><X size={14} /></button>}
                    </div>
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <FileSpreadsheet size={18} className="text-green-600" />
                        <span className="hidden lg:inline">Importar</span>
                    </button>
                    <button onClick={openCreateModal} className={btnPrimary}><Plus size={18} /> Nova Competição</button>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-6 min-h-[400px] flex flex-col">
                {filteredLeagues.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredLeagues.map((league) => (
                            <div key={league.id_league} className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#7F33D9]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center gap-4">
                                <div
                                    className="relative w-20 h-20 flex items-center justify-center overflow-hidden group-hover:bg-white transition-colors cursor-pointer"
                                    onClick={() => openEditModal(league.id_league)}
                                >
                                    {(league.logo_url || league.slug) ? (
                                        <img
                                            src={`https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${league.slug}.webp`}
                                            className="w-full h-full object-contain drop-shadow-sm"
                                            alt={league.name} Só o
                                            onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling?.classList.remove("hidden"); }}
                                        />
                                    ) : null}
                                    {(!league.logo_url && !league.slug) && <Trophy size={32} className="text-gray-300" />}
                                </div>
                                <div className="flex flex-col gap-1 w-full cursor-pointer" onClick={() => openEditModal(league.id_league)}>
                                    <span className="font-bold text-gray-900 text-base group-hover:text-[#7F33D9] transition-colors truncate w-full">{league.name}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {league.continent_name ? `🌍 ${league.continent_name}` : (league.country_name || "Internacional")}
                                    </span>
                                </div>
                                {/* Botão configurar estrutura */}
                                <button
                                    onClick={() => setSetupLeague(league)}
                                    title="Configurar estrutura da competição"
                                    className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-[#7F33D9]/10 hover:text-[#7F33D9] hover:border-[#7F33D9]/30 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Settings2 size={13} />
                                </button>
                                {/* Botões inferiores esquerda */}
                                {(() => {
                                    const anos = Object.keys(league.structure_json ?? {}).filter(k => /^\d{4}$/.test(k));
                                    const isPersonalizado = anos.some(a => league.structure_json[a]?.tipo === "personalizado");
                                    // Botão âmbar: só para ligas com torneios que têm fases de grupo
                                    const hasGrupos = anos.some(a => {
                                        const cfg = league.structure_json[a];
                                        return (cfg?.torneios ?? []).some(t =>
                                            (t.fases ?? []).some(f => f.tipo === "grupo")
                                        );
                                    });
                                    if (!isPersonalizado && !hasGrupos) return null;
                                    return (
                                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            {isPersonalizado && (
                                                <button
                                                    onClick={() => setCustomEditor({ league })}
                                                    title="Editor personalizado"
                                                    className="w-7 h-7 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-500 hover:bg-violet-100 transition-all"
                                                >
                                                    <FileSpreadsheet size={13} />
                                                </button>
                                            )}
                                            {hasGrupos && (
                                                <button
                                                    onClick={() => setPhaseMapper({ league })}
                                                    title="Atribuir times aos grupos"
                                                    className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 hover:bg-amber-100 transition-all"
                                                >
                                                    <Shuffle size={13} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                                {/* Indicador de estrutura configurada */}
                                {league.structure_json && Object.keys(league.structure_json).length > 0 && (
                                    <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-emerald-400"
                                        title={`Estrutura configurada (${Object.keys(league.structure_json).sort((a, b) => b - a).join(", ")})`} />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Trophy size={32} className="text-gray-300" /></div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhuma competição encontrada</h3>
                        {searchTerm && <p className="text-sm text-gray-500 mt-1">Sem resultados para "{searchTerm}"</p>}
                    </div>
                )}
            </div>

            {/* Modal - Configurar Estrutura */}
            {setupLeague && (
                <CompetitionSetupModal
                    league={setupLeague}
                    onClose={() => setSetupLeague(null)}
                    onSaved={() => { setSetupLeague(null); loadData(); }}
                />
            )}

            {/* Modal - Importação em massa */}
            {importModalOpen && (
                <ImportLeaguesModal
                    onClose={() => setImportModalOpen(false)}
                    onSuccess={loadData}
                />
            )}

            {/* Modal - Editor personalizado */}
            {customEditor && (
                <CustomLeagueEditor
                    league={customEditor.league}
                    onClose={() => setCustomEditor(null)}
                />
            )}

            {/* Modal - Atribuir times aos grupos */}
            {phaseMapper && (
                <TeamGroupAssignment
                    league={phaseMapper.league}
                    onClose={() => setPhaseMapper(null)}
                    onSaved={() => setPhaseMapper(null)}
                />
            )}

            {/* Modal - Renderização */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setModal(false)}>
                    <div className="absolute inset-0 bg-black/40 " />
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">{isEditing ? "Editar Competição" : "Nova Competição"}</h2>
                            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-5">
                            {/* Toggle País / Continente */}
                            <div>
                                <label className={labelClass}>Tipo de competição</label>
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => { setLeagueScope("country"); setNewLeague({ ...newLeague, id_continent: "" }); }}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors ${leagueScope === "country" ? "bg-[#7F33D9] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                                    >
                                        Nacional / País
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setLeagueScope("continent"); setNewLeague({ ...newLeague, id_country: "" }); }}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors ${leagueScope === "continent" ? "bg-[#7F33D9] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                                    >
                                        Continental / Mundial
                                    </button>
                                </div>
                            </div>

                            {leagueScope === "country" ? (
                                <div>
                                    <label className={labelClass}>País</label>
                                    <SearchableSelect
                                        options={countries}
                                        value={newLeague.id_country}
                                        onChange={(val) => setNewLeague({ ...newLeague, id_country: val })}
                                        placeholder="Buscar país..."
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className={labelClass}>Continente / Região</label>
                                    <SearchableSelect
                                        options={continents}
                                        value={newLeague.id_continent}
                                        onChange={(val) => setNewLeague({ ...newLeague, id_continent: val })}
                                        placeholder="Selecionar região..."
                                    />
                                </div>
                            )}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Cor Primária</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" value={newLeague.primary_color || "#7F33D9"} onChange={(e) => setNewLeague({ ...newLeague, primary_color: e.target.value })} />
                                        <input type="text" className={inputClass} placeholder="#000000" value={newLeague.primary_color} onChange={(e) => setNewLeague({ ...newLeague, primary_color: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Cor Secundária</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" value={newLeague.secondary_color || "#ffffff"} onChange={(e) => setNewLeague({ ...newLeague, secondary_color: e.target.value })} />
                                        <input type="text" className={inputClass} placeholder="#ffffff" value={newLeague.secondary_color} onChange={(e) => setNewLeague({ ...newLeague, secondary_color: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Formato <span className="text-gray-300 normal-case font-normal tracking-normal">(padrão global)</span></label>
                                <select className={inputClass} value={newLeague.format} onChange={(e) => setNewLeague({ ...newLeague, format: e.target.value })}>
                                    <option value="">Não definido</option>
                                    <option value="pontos_corridos">Pontos Corridos</option>
                                    <option value="mata_mata">Mata-Mata</option>
                                    <option value="grupos">Grupos + Mata-Mata</option>
                                </select>
                                <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1.5">
                                    <AlertTriangle size={11} className="shrink-0" />
                                    O formato configurado em <strong>Estrutura</strong> (por edição) tem prioridade sobre este campo.
                                </p>
                            </div>
                            <div className="pt-4 flex items-center justify-between gap-4">
                                {isEditing && <button onClick={() => disableLeague(currentLeague.id_league)} className="text-red-500 text-xs font-bold uppercase tracking-wide hover:bg-red-50 px-3 py-2 rounded-lg"><Trash2 size={14} className="inline mr-1" /> Desativar</button>}
                                <div className="flex gap-3 ml-auto">
                                    {isEditing && (
                                        <button
                                            onClick={() => { setModal(false); setSetupLeague(currentLeague); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                                        >
                                            <Settings2 size={15} /> Estrutura
                                        </button>
                                    )}
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