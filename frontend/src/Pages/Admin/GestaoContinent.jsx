import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Trash2, Loader2, Check, Plus, Search, X, Globe, Pencil } from "lucide-react";

export default function GestaoContinent() {
    const [continents, setContinents] = useState([]);
    const [modalMode, setModalMode] = useState(null); // null | "create" | "edit" | "delete"
    const [current, setCurrent] = useState(null);
    const [form, setForm] = useState({ name: "", logo_url: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    async function load() {
        try {
            const { data } = await api.get("/admin/continents");
            setContinents(data.continents);
        } catch (err) {
            console.error("Erro ao carregar continentes:", err);
        }
    }

    useEffect(() => { load(); }, []);

    const filtered = continents.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openCreate = () => {
        setForm({ name: "", logo_url: "" });
        setModalMode("create");
    };

    const openEdit = (c) => {
        setCurrent(c);
        setForm({ name: c.name, logo_url: c.logo_url || "" });
        setModalMode("edit");
    };

    const openDelete = (c) => {
        setCurrent(c);
        setModalMode("delete");
    };

    const closeModal = () => { setModalMode(null); setSuccess(false); setLoading(false); };

    const handleCreate = async () => {
        if (!form.name.trim()) return;
        setLoading(true);
        try {
            const res = await api.post("/admin/continents", form);
            if (res.status === 201) {
                setSuccess(true);
                setTimeout(() => { closeModal(); load(); }, 700);
            } else { setLoading(false); alert("Erro ao criar."); }
        } catch { setLoading(false); alert("Erro ao criar."); }
    };

    const handleEdit = async () => {
        if (!form.name.trim()) return;
        setLoading(true);
        try {
            await api.put(`/admin/continents/${current.id_continent}`, form);
            setSuccess(true);
            setTimeout(() => { closeModal(); load(); }, 700);
        } catch { setLoading(false); alert("Erro ao atualizar."); }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await api.delete(`/admin/continents/${current.id_continent}`);
            closeModal(); load();
        } catch { setLoading(false); alert("Erro ao desativar."); }
    };

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
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Gestão de Continentes / Regiões</h1>
                    <p className="text-gray-500 text-sm mt-1">Crie regiões para ligas continentais e mundiais.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Filtrar região..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button onClick={openCreate} className={btnPrimary}>
                        <Plus size={18} /><span className="whitespace-nowrap">Nova Região</span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:gap-px bg-white border-b border-gray-100">
                        {filtered.map((c) => (
                            <div key={c.id_continent} className="group relative bg-white p-6 hover:z-10 transition-all duration-300 flex flex-col items-center text-center gap-4 hover:shadow-lg">
                                <div className="relative w-16 h-16 rounded-full border-4 border-gray-50 shadow-sm overflow-hidden group-hover:scale-110 transition-transform duration-300 bg-gray-50 flex items-center justify-center">
                                    {c.logo_url
                                        ? <img className="w-full h-full object-cover" src={c.logo_url} alt={c.name} />
                                        : <Globe size={28} className="text-gray-300" />
                                    }
                                </div>
                                <span className="font-bold text-gray-900 text-lg group-hover:text-[#7F33D9] transition-colors">{c.name}</span>
                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 flex gap-2">
                                    <button onClick={() => openEdit(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors">
                                        <Pencil size={12} /> Editar
                                    </button>
                                    <button onClick={() => openDelete(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                                        <Trash2 size={12} /> Remover
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <Globe size={32} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">Nenhuma região encontrada</h3>
                        {searchTerm
                            ? <p className="text-sm text-gray-500">Sem resultados para "{searchTerm}"</p>
                            : <button onClick={openCreate} className={`mt-4 ${btnPrimary}`}>Adicionar</button>
                        }
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={closeModal}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-lg text-gray-900">
                                {modalMode === "create" && "Nova Região / Continente"}
                                {modalMode === "edit" && "Editar Região"}
                                {modalMode === "delete" && "Desativar Região"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">

                            {(modalMode === "create" || modalMode === "edit") && (
                                <div className="space-y-5">
                                    {/* Preview */}
                                    {form.logo_url && (
                                        <div className="flex items-center gap-4">
                                            <img src={form.logo_url} className="w-14 h-14 rounded-full object-cover border border-gray-100 shadow-sm" alt="" />
                                            <span className="text-sm text-gray-400">Pré-visualização</span>
                                        </div>
                                    )}
                                    <div>
                                        <label className={labelClass}>Nome</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            placeholder="ex: América do Sul, Europa, Mundial..."
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>URL da imagem / logo <span className="text-gray-300 normal-case font-normal tracking-normal">(opcional)</span></label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            placeholder="https://..."
                                            value={form.logo_url}
                                            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
                                        <button
                                            onClick={modalMode === "create" ? handleCreate : handleEdit}
                                            disabled={!form.name.trim() || loading || success}
                                            className={`${btnPrimary} flex-1 justify-center`}
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : success ? <><Check size={16} /> Salvo!</> : "Salvar"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modalMode === "delete" && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trash2 size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Tem certeza?</h4>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Desativar <strong>{current?.name}</strong> afetará ligas vinculadas a esta região.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
                                        <button onClick={handleDelete} className={btnDanger} disabled={loading}>
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : "Sim, desativar"}
                                        </button>
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
