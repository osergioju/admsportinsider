import { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
    Trash2, Loader2, Plus, Search, ChevronLeft, ChevronRight,
    X, Shield, UploadCloud, FileSpreadsheet
} from "lucide-react";
import ImportModal from "./ImportModal";

// ---------------------------------------------------------------------------
// Estilos reutilizáveis
// ---------------------------------------------------------------------------
const btnPrimary =
    "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const btnSecondary =
    "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
const inputClass =
    "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
const labelClass =
    "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

const ITEMS_PER_PAGE = 8;

// ---------------------------------------------------------------------------
// Estado inicial do formulário de clube
// ---------------------------------------------------------------------------
const EMPTY_CLUB = {
    id_country: "", name: "", description: "", crest_url: "",
    founded_at: "", stadium_name: "", ownership_model: "",
    primary_color: "#000000", secondary_color: "#ffffff", tertiary_color: "#ffffff", location: "",
};


// ---------------------------------------------------------------------------
// Sub-componente: Modal de Criar / Editar Clube
// ---------------------------------------------------------------------------
function ClubModal({ countries, attributeKeys, isEditing, initialClub, initialAttributes, onClose, onSave, onDisable }) {
    const [newClub, setNewClub] = useState(initialClub);
    const [attributes, setAttributes] = useState(initialAttributes);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const set = (field) => (e) => setNewClub((p) => ({ ...p, [field]: e.target.value }));

    const uploadLogo = async () => {
        if (!file) return alert("Selecione uma imagem");
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await api.post("/admin/upload-club-logo", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setNewClub((p) => ({ ...p, crest_url: res.data.url }));
        } catch {
            alert("Erro ao fazer upload da logo");
        } finally {
            setUploading(false);
        }
    };

    const addAttribute = () =>
        setAttributes((prev) => [...prev, { key: "", value: "", type: "string" }]);

    const removeAttribute = (index) =>
        setAttributes((prev) => prev.filter((_, i) => i !== index));

    const updateAttribute = (index, field, value) =>
        setAttributes((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({ ...newClub, attributes });
            setSuccess(true);
            setTimeout(() => { onClose(); }, 700);
        } catch {
            alert("Erro ao salvar clube");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? "Editar Clube" : "Novo Clube"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Coluna esquerda */}
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Nome</label>
                                <input type="text" className={inputClass} value={newClub.name} onChange={set("name")} />
                            </div>
                            <div>
                                <label className={labelClass}>País</label>
                                <select className={inputClass} value={newClub.id_country} onChange={set("id_country")}>
                                    <option value="">Selecione...</option>
                                    {countries.map((c) => (
                                        <option key={c.id_country} value={c.id_country}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Fundação</label>
                                    <input type="date" className={inputClass} value={newClub.founded_at} onChange={set("founded_at")} />
                                </div>
                                <div>
                                    <label className={labelClass}>Modelo</label>
                                    <select className={inputClass} value={newClub.ownership_model} onChange={set("ownership_model")}>
                                        <option value="">Selecione</option>
                                        <option value="SAF">SAF</option>
                                        <option value="Associativo">Associativo</option>
                                        <option value="Empresa">Empresa</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Estádio</label>
                                <input type="text" className={inputClass} value={newClub.stadium_name} onChange={set("stadium_name")} />
                            </div>
                            <div>
                                <label className={labelClass}>Localização</label>
                                <input type="text" className={inputClass} value={newClub.location} onChange={set("location")} />
                            </div>
                        </div>

                        {/* Coluna direita */}
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Logo</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                    />
                                    <button
                                        onClick={uploadLogo}
                                        disabled={uploading || !file}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={16} />}
                                    </button>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                                        {newClub.crest_url
                                            ? <img src={newClub.crest_url} className="w-full h-full object-cover" alt="Logo" />
                                            : <Shield size={24} className="text-gray-300" />}
                                    </div>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        placeholder="URL da Logo"
                                        value={newClub.crest_url}
                                        onChange={set("crest_url")}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[["primary_color", "Cor 1"], ["secondary_color", "Cor 2"], ["tertiary_color", "Cor 3"]].map(([field, label]) => (
                                    <div key={field}>
                                        <label className={labelClass}>{label}</label>
                                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                                            <input
                                                type="color"
                                                className="w-8 h-8 rounded border-none cursor-pointer"
                                                value={newClub[field]}
                                                onChange={set(field)}
                                            />
                                            <span className="text-xs font-mono text-gray-500">{newClub[field]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className={labelClass}>Descrição</label>
                                <textarea className={inputClass} rows={3} value={newClub.description} onChange={set("description")} />
                            </div>
                        </div>
                    </div>

                    {/* Atributos */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Atributos</h3>
                            <button onClick={addAttribute} className="text-xs font-bold text-[#7F33D9] hover:bg-purple-50 px-3 py-1.5 rounded-lg">
                                + Campo
                            </button>
                        </div>
                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {attributes.map((attr, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input
                                        list="attr-keys"
                                        className={`${inputClass} !py-1.5 !text-xs`}
                                        value={attr.key}
                                        onChange={(e) => updateAttribute(i, "key", e.target.value)}
                                        placeholder="Chave"
                                    />
                                    <input
                                        className={`${inputClass} !py-1.5 !text-xs`}
                                        value={attr.value}
                                        onChange={(e) => updateAttribute(i, "value", e.target.value)}
                                        placeholder="Valor"
                                    />
                                    <button onClick={() => removeAttribute(i)} className="text-red-400 p-1">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <datalist id="attr-keys">
                                {attributeKeys.map((k) => <option key={k} value={k} />)}
                            </datalist>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-0 py-5 mt-4 border-t border-gray-100 flex justify-between items-center">
                        {isEditing ? (
                            <button
                                onClick={onDisable}
                                className="text-red-500 text-xs font-bold uppercase tracking-wide hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1"
                            >
                                <Trash2 size={14} /> Desativar
                            </button>
                        ) : <div />}
                        <div className="flex gap-3">
                            <button onClick={onClose} className={btnSecondary}>Cancelar</button>
                            <button onClick={handleSave} disabled={loading || success} className={btnPrimary}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : success ? "✓ Salvo!" : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function GestaoClubes() {
    const [allClubs, setAllClubs] = useState([]);
    const [countries, setCountries] = useState([]);
    const [attributeKeys, setAttributeKeys] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [clubModal, setClubModal] = useState(null); // null | { isEditing, club, attributes }
    const [importModalOpen, setImportModalOpen] = useState(false);

    // --- Data fetching ---
    const loadData = async () => {
        try {
            const [clubsResp, countriesResp] = await Promise.all([
                api.get("/admin/clubs?limit=2000"),
                api.get("/admin/countries?onlyActive=true"),
            ]);
            setAllClubs(clubsResp.data.clubs);
            setCountries(countriesResp.data.countries);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    };

    const loadAttributeKeys = async () => {
        try {
            const res = await api.get("/admin/attribute-keys");
            setAttributeKeys(res.data.keys);
        } catch (err) {
            console.error("Erro ao carregar atributos:", err);
        }
    };

    useEffect(() => {
        loadData();
        loadAttributeKeys();
    }, []);

    // Resetar página ao pesquisar
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // --- Filtragem e paginação ---
    const filteredClubs = allClubs.filter((club) =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.country_name && club.country_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const totalPages = Math.ceil(filteredClubs.length / ITEMS_PER_PAGE);
    const currentClubs = filteredClubs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // --- Handlers do modal de clube ---
    const openCreateModal = () =>
        setClubModal({ isEditing: false, club: EMPTY_CLUB, attributes: [] });

    const openEditModal = async (id) => {
        try {
            const { data } = await api.get(`/admin/clubs/${id}`);
            const clubData = data.club;
            setClubModal({
                isEditing: true,
                club: { ...clubData, founded_at: clubData.founded_at?.split("T")[0] ?? "" },
                attributes: data.attributes || [],
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveClub = async (payload) => {
        if (clubModal.isEditing) {
            await api.put(`/admin/clubs/${clubModal.club.id_club}/update`, payload);
        } else {
            await api.post("/admin/send-club", payload);
        }
        loadData();
    };

    const handleDisableClub = async () => {
        if (!window.confirm("Desativar clube?")) return;
        try {
            await api.delete(`/admin/disable-club/${clubModal.club.id_club}`);
            setClubModal(null);
            loadData();
        } catch {
            alert("Erro ao desativar clube");
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Clubes</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie os times de futebol.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Busca */}
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Filtrar na lista..."
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
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <FileSpreadsheet size={18} className="text-green-600" />
                        <span className="hidden lg:inline">Importar</span>
                    </button>
                    <button onClick={openCreateModal} className={btnPrimary}>
                        <Plus size={18} /> Novo Clube
                    </button>
                </div>
            </div>

            {/* Grid de clubes */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-6 min-h-[400px] flex flex-col">
                {currentClubs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {currentClubs.map((club) => (
                            <div
                                key={club.id_club}
                                onClick={() => openEditModal(club.id_club)}
                                className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#7F33D9]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center gap-4 cursor-pointer"
                            >
                                <div className="relative w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center p-2 border border-gray-100 group-hover:bg-white transition-colors overflow-hidden">
                                    {club.crest_url ? (
                                        <img src={club.crest_url} className="w-full h-full object-contain" alt={club.name} />
                                    ) : (
                                        <div
                                            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs"
                                            style={{ background: `linear-gradient(135deg, ${club.primary_color || "#ccc"}, ${club.secondary_color || "#999"})` }}
                                        >
                                            {club.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <span className="font-bold text-gray-900 text-base group-hover:text-[#7F33D9] transition-colors truncate w-full">{club.name}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate w-full">{club.country_name || "Sem País"}</span>
                                </div>
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-[#7F33D9]">
                                        <Search size={12} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Shield size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhum resultado</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-1">
                            {searchTerm ? `Nada encontrado para "${searchTerm}"` : "Lista vazia."}
                        </p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="mt-4 text-[#7F33D9] font-bold text-sm hover:underline">
                                Limpar busca
                            </button>
                        )}
                    </div>
                )}

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                            Página {currentPage} de {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de clube */}
            {clubModal && (
                <ClubModal
                    countries={countries}
                    attributeKeys={attributeKeys}
                    isEditing={clubModal.isEditing}
                    initialClub={clubModal.club}
                    initialAttributes={clubModal.attributes}
                    onClose={() => setClubModal(null)}
                    onSave={handleSaveClub}
                    onDisable={handleDisableClub}
                />
            )}

            {/* Modal de importação */}
            {importModalOpen && (
                <ImportModal
                    countries={countries}
                    onClose={() => setImportModalOpen(false)}
                    onSuccess={loadData}
                />
            )}
        </div>
    );
}