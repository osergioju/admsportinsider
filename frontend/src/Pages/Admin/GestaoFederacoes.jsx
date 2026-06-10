import { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { Trash2, Loader2, Check, Plus, Search, X, Shield, Pencil, Crown, UploadCloud } from "lucide-react";
import { federationLogo } from "../../utils/federationUrl";
import SearchableSelect from "../../components/uxui/SearchableSelect";

const FIFA_ACRONYM = "FIFA";

export default function GestaoFederacoes() {
    const [federations, setFederations] = useState([]);
    const [countries, setCountries] = useState([]);
    const [modalMode, setModalMode] = useState(null); // null | "create" | "edit" | "delete"
    const [current, setCurrent] = useState(null);
    const [form, setForm] = useState({ name: "", acronym: "", logo_url: "", sort_order: 99, full_name: "", city_name: "", founded_at: "", id_country: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    async function load() {
        try {
            const { data } = await api.get("/admin/federations");
            setFederations(data.federations);
        } catch (err) {
            console.error("Erro ao carregar federações:", err);
        }
        try {
            const { data } = await api.get("/admin/countries?limit=1000");
            setCountries((data.countries ?? []).map(c => ({ value: String(c.id_country), label: c.name, image: c.flag_url })));
        } catch (err) {
            console.error("Erro ao carregar países:", err);
        }
    }

    useEffect(() => { load(); }, []);

    const filtered = federations.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.acronym.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openCreate = () => {
        setForm({ name: "", acronym: "", logo_url: "", sort_order: 99, full_name: "", city_name: "", founded_at: "", id_country: "" });
        setError("");
        setModalMode("create");
    };

    const openEdit = (f) => {
        setCurrent(f);
        setForm({ name: f.name, acronym: f.acronym, logo_url: f.logo_url || "", sort_order: f.sort_order, full_name: f.full_name || "", city_name: f.city_name || "", founded_at: f.founded_at || "", id_country: f.id_country ? String(f.id_country) : "" });
        setError("");
        setModalMode("edit");
    };

    const openDelete = (f) => {
        setCurrent(f);
        setModalMode("delete");
    };

    const closeModal = () => {
        setModalMode(null);
        setSuccess(false);
        setLoading(false);
        setError("");
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Slug para nomear o arquivo: usa current.slug (edição) ou acronym em lowercase (criação)
        const slug = current?.slug || form.acronym.toLowerCase().replace(/[^a-z0-9]/g, "-");
        if (!slug) { setError("Defina a sigla antes de fazer upload."); return; }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("slug", slug);
            await api.post("/admin/federations/upload-logo", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            // URL derivada do slug — não precisa guardar no form
        } catch {
            setError("Erro ao fazer upload da imagem.");
        } finally {
            setUploading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.name.trim() || !form.acronym.trim()) return;
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/admin/federations", form);
            if (res.status === 201) {
                setSuccess(true);
                setTimeout(() => { closeModal(); load(); }, 700);
            }
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || "Erro ao criar federação.");
        }
    };

    const handleEdit = async () => {
        if (!form.name.trim() || !form.acronym.trim()) return;
        setLoading(true);
        setError("");
        try {
            await api.put(`/admin/federations/${current.id_federation}`, form);
            setSuccess(true);
            setTimeout(() => { closeModal(); load(); }, 700);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || "Erro ao atualizar federação.");
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await api.delete(`/admin/federations/${current.id_federation}`);
            closeModal(); load();
        } catch { setLoading(false); }
    };

    const isFifa = (f) => f.acronym === FIFA_ACRONYM;
    const fedLogoUrl = (f) => federationLogo(f.slug, "medium");

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
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Gestão de Federações</h1>
                    <p className="text-gray-500 text-sm mt-1">FIFA, UEFA, CONMEBOL e demais confederações internacionais.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Filtrar federação..."
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
                        <Plus size={18} /><span className="whitespace-nowrap">Nova Federação</span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:gap-px bg-white border-b border-gray-100">
                        {filtered.map((f) => (
                            <div key={f.id_federation} className="group relative bg-white p-6 hover:z-10 transition-all duration-300 flex flex-col items-center text-center gap-3 hover:shadow-lg">
                                {isFifa(f) && (
                                    <div className="absolute top-3 right-3">
                                        <Crown size={14} className="text-amber-400" />
                                    </div>
                                )}
                                <div className="relative w-16 h-16 rounded-full border-4 border-gray-50 shadow-sm overflow-hidden group-hover:scale-110 transition-transform duration-300 bg-gray-50 flex items-center justify-center">
                                    {fedLogoUrl(f)
                                        ? <img className="w-full h-full object-contain p-1" src={fedLogoUrl(f)} alt={f.name} onError={e => e.currentTarget.style.display='none'} />
                                        : <Shield size={28} className="text-gray-300" />
                                    }
                                </div>
                                <div>
                                    <span className="font-bold text-gray-900 text-lg group-hover:text-[#7F33D9] transition-colors block leading-tight">{f.acronym}</span>
                                    <span className="text-xs text-gray-400">{f.name}</span>
                                    {f.country_name && (
                                        <span className="flex items-center justify-center gap-1 mt-1 text-[10px] font-bold text-gray-500">
                                            {f.country_flag_url && <img src={f.country_flag_url} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                                            {f.country_name}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 flex gap-2">
                                    <button onClick={() => openEdit(f)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors">
                                        <Pencil size={12} /> Editar
                                    </button>
                                    {!isFifa(f) && (
                                        <button onClick={() => openDelete(f)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                                            <Trash2 size={12} /> Remover
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <Shield size={32} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">Nenhuma federação encontrada</h3>
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
                                {modalMode === "create" && "Nova Federação"}
                                {modalMode === "edit" && "Editar Federação"}
                                {modalMode === "delete" && "Desativar Federação"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            {(modalMode === "create" || modalMode === "edit") && (
                                <div className="space-y-4">
                                    {/* Escudo */}
                                    <div>
                                        <label className={labelClass}>Escudo / Logo</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                                                {uploading
                                                    ? <Loader2 size={20} className="animate-spin text-[#7F33D9]" />
                                                    : (current?.slug || form.acronym)
                                                        ? <img
                                                            src={federationLogo(current?.slug || form.acronym.toLowerCase().replace(/[^a-z0-9]/g,'-'), "medium")}
                                                            className="w-full h-full object-contain p-1"
                                                            alt="Logo"
                                                            onError={e => e.currentTarget.style.display='none'}
                                                          />
                                                        : <Shield size={24} className="text-gray-300" />
                                                }
                                            </div>
                                            <label className="flex-1 flex flex-col items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all">
                                                <UploadCloud size={20} className="text-gray-400" />
                                                <span className="text-xs text-gray-500 text-center">
                                                    {uploading ? "Enviando..." : "Clique para selecionar imagem"}
                                                </span>
                                                <input
                                                    ref={fileRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    disabled={uploading}
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Sigla <span className="text-red-400">*</span></label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                placeholder="ex: UEFA"
                                                value={form.acronym}
                                                onChange={(e) => setForm({ ...form, acronym: e.target.value.toUpperCase() })}
                                                maxLength={20}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Nome curto <span className="text-red-400">*</span></label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                placeholder="ex: UEFA"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>País <span className="text-gray-300 normal-case font-normal tracking-normal">(federações nacionais — ex: CBF → Brasil)</span></label>
                                        <SearchableSelect
                                            options={countries}
                                            value={form.id_country}
                                            onChange={(val) => setForm({ ...form, id_country: val })}
                                            placeholder="Sem país (continental/global)..."
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Nome completo</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            placeholder="ex: Fédération Internationale de Football Association"
                                            value={form.full_name}
                                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Cidade-sede</label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                placeholder="ex: Zurique"
                                                value={form.city_name}
                                                onChange={(e) => setForm({ ...form, city_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Data de fundação</label>
                                            <input
                                                type="date"
                                                className={inputClass}
                                                value={form.founded_at}
                                                onChange={(e) => setForm({ ...form, founded_at: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Ordem de exibição <span className="text-gray-300 normal-case font-normal tracking-normal">(0 = primeiro)</span></label>
                                        <input
                                            type="number"
                                            min={0}
                                            className={inputClass}
                                            value={form.sort_order}
                                            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 99 })}
                                        />
                                    </div>

                                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
                                        <button
                                            onClick={modalMode === "create" ? handleCreate : handleEdit}
                                            disabled={!form.name.trim() || !form.acronym.trim() || loading || success || uploading}
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
                                        Desativar <strong>{current?.name}</strong> ({current?.acronym}) afetará competições vinculadas a esta federação.
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
