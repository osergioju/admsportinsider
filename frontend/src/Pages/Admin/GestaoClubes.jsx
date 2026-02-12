import { useState, useEffect, useCallback } from "react"; // Adicionado useCallback
import { api } from "../../services/api"; 
import { Trash2, Loader2, Check, Plus, Search, ChevronLeft, ChevronRight, X, Shield, UploadCloud, FileSpreadsheet, AlertCircle } from "lucide-react";

export default function GestaoClubes() {

    // --- ESTADOS GERAIS ---
    const [clubs, setClubs] = useState([]);
    const [countries, setCountries] = useState([]);
    const [attributeKeys, setAttributeKeys] = useState([]);

    // --- MODAIS ---
    const [modal, setModal] = useState(false);
    const [importModal, setImportModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // --- DADOS DO CLUBE ATUAL ---
    const [currentClub, setCurrentClub] = useState(null);
    const [newClub, setNewClub] = useState({
        id_country: "",
        name: "",
        description: "",
        crest_url: "",
        founded_at: "",
        stadium_name: "",
        ownership_model: "",
        primary_color: "#000000",
        secondary_color: "#ffffff",
        location: ""
    });
    const [attributes, setAttributes] = useState([]);

    // --- UPLOAD / IMPORT ---
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importCountry, setImportCountry] = useState("");
    const [importing, setImporting] = useState(false);

    // --- PAGINAÇÃO & FEEDBACK ---
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    
    // --- BUSCA ---
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // 1. Lógica de Debounce (Espera parar de digitar)
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1); // Reseta para pág 1 ao buscar
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ============================
    // 2. CARREGA DADOS (Blindado)
    // ============================
    const loadData = useCallback(async () => {
        try {
            // Construtor de URL seguro
            const params = new URLSearchParams({
                page: page,
                limit: 8
            });

            // Só adiciona a busca se tiver algo escrito
            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }

            console.log("🔍 Buscando na API:", `/admin/clubs?${params.toString()}`); // DEBUG NO CONSOLE

            const clubsResp = await api.get(`/admin/clubs?${params.toString()}`);
            setClubs(clubsResp.data.clubs);
            setPagination(clubsResp.data.pagination);

            // Carrega países apenas se a lista estiver vazia (otimização)
            if (countries.length === 0) {
                const countriesResp = await api.get(`/admin/countries?onlyActive=true`);
                setCountries(countriesResp.data.countries);
            }

        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    }, [page, debouncedSearch]); // Recria a função se página ou busca mudarem

    async function loadAttributeKeys() {
        try {
            const res = await api.get("/admin/attribute-keys");
            setAttributeKeys(res.data.keys);
        } catch (error) {
            console.error("Erro chaves atributos", error);
        }
    }

    // 3. Dispara o carregamento
    useEffect(() => {
        loadData();
        loadAttributeKeys();
    }, [loadData]); // Depende do loadData (que depende de page/search)

    // ... (RESTANTE DOS HANDLERS: UPLOAD, IMPORT, CREATE, EDIT IGUAIS AO ANTERIOR) ...
    // Para economizar espaço, mantive a lógica visual idêntica, foquei na correção acima.
    
    const uploadLogo = async () => {
        if (!file) return alert("Selecione uma imagem.");
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await api.post("/admin/upload-club-logo", formData, { headers: { "Content-Type": "multipart/form-data" } });
            setNewClub(prev => ({ ...prev, crest_url: res.data.url }));
        } catch (err) { alert("Erro ao enviar logo."); } finally { setUploading(false); }
    };

    const handleImportClubs = async () => {
        if (!importFile || !importCountry) return alert("Preencha todos os campos.");
        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("file", importFile);
            formData.append("id_country", importCountry);
            await api.post("/admin/import-clubs-xlsx", formData, { headers: { "Content-Type": "multipart/form-data" } });
            alert("Sucesso!");
            setImportModal(false); setImportFile(null); setImportCountry("");
            loadData();
        } catch (err) { alert("Erro na importação."); } finally { setImporting(false); }
    };

    const openCreateModal = () => {
        setNewClub({ id_country: "", name: "", description: "", crest_url: "", founded_at: "", stadium_name: "", ownership_model: "", primary_color: "#000000", secondary_color: "#ffffff", location: "" });
        setAttributes([]); setFile(null); setIsEditing(false); setModal(true);
    };

    const openEditModal = async (id) => {
        try {
            const { data } = await api.get(`/admin/clubs/${id}`);
            const clubData = data.club;
            const founded = clubData.founded_at ? clubData.founded_at.split("T")[0] : "";
            setCurrentClub(clubData);
            setNewClub({ ...clubData, founded_at: founded });
            setAttributes(data.attributes || []);
            setFile(null); setIsEditing(true); setModal(true);
        } catch (err) { console.error(err); }
    };

    const sendClub = async () => {
        setLoading(true);
        try {
            const res = await api.post("/admin/send-club", { ...newClub, attributes });
            if (res.status === 201) {
                setSuccess(true);
                setTimeout(() => { setModal(false); setSuccess(false); setLoading(false); loadData(); }, 700);
            } else { setLoading(false); alert("Erro inesperado."); }
        } catch (err) { alert("Erro ao cadastrar."); setLoading(false); }
    };

    const updateClub = async () => {
        setLoading(true);
        try {
            await api.put(`/admin/clubs/${currentClub.id_club}/update`, { ...newClub, attributes });
            setSuccess(true);
            setTimeout(() => { setModal(false); setSuccess(false); setLoading(false); loadData(); }, 700);
        } catch (err) { alert("Erro ao atualizar."); setLoading(false); } 
    };

    const disableClub = async (id) => {
        if (!window.confirm("Deseja desativar?")) return;
        try { await api.delete(`/admin/disable-club/${id}`); setModal(false); loadData(); } catch (err) { alert("Erro."); }
    };

    // --- ESTILOS ---
    const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
    const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">

            {/* Header com Busca */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Clubes</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie os times de futebol.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* INPUT DE BUSCA */}
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar clube..." 
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

                    <button onClick={() => setImportModal(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                        <FileSpreadsheet size={18} className="text-green-600" /> <span className="hidden lg:inline">Importar</span>
                    </button>
                    <button onClick={openCreateModal} className={btnPrimary}>
                        <Plus size={18} /> Novo Clube
                    </button>
                </div>
            </div>

            {/* GRID E CONTEÚDO */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-6 min-h-[400px] flex flex-col">
                {clubs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {clubs.map((club) => (
                            <div key={club.id_club} onClick={() => openEditModal(club.id_club)} className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#7F33D9]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center gap-4 cursor-pointer">
                                <div className="relative w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center p-2 border border-gray-100 group-hover:bg-white transition-colors overflow-hidden">
                                    {club.crest_url ? <img src={club.crest_url} className="w-full h-full object-contain" alt={club.name} /> : 
                                    <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: `linear-gradient(135deg, ${club.primary_color || '#ccc'}, ${club.secondary_color || '#999'})` }}>{club.name.substring(0, 2).toUpperCase()}</div>}
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <span className="font-bold text-gray-900 text-base group-hover:text-[#7F33D9] transition-colors truncate w-full">{club.name}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate w-full">{club.country_name || "Sem País"}</span>
                                </div>
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-[#7F33D9]"><Search size={12} /></div></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Shield size={32} className="text-gray-300" /></div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhum resultado</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-1">
                            {searchTerm ? `Não encontramos nada para "${searchTerm}"` : "Comece cadastrando os primeiros times."}
                        </p>
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

            {/* MODAIS (Código Visual mantido igual ao anterior, omitido aqui para focar na lógica de busca, mas deve estar presente no arquivo final) */}
            {/* ... Modal Create/Edit ... */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setModal(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">{isEditing ? "Editar Clube" : "Novo Clube"}</h2>
                            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div><label className={labelClass}>Nome</label><input type="text" className={inputClass} value={newClub.name} onChange={(e)=>setNewClub({...newClub, name:e.target.value})} /></div>
                                    <div><label className={labelClass}>País</label><select className={inputClass} value={newClub.id_country} onChange={(e)=>setNewClub({...newClub, id_country:e.target.value})}>{countries.map(c=><option key={c.id_country} value={c.id_country}>{c.name}</option>)}</select></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Fundação</label><input type="date" className={inputClass} value={newClub.founded_at} onChange={(e)=>setNewClub({...newClub, founded_at:e.target.value})} /></div>
                                        <div><label className={labelClass}>Modelo</label><select className={inputClass} value={newClub.ownership_model} onChange={(e)=>setNewClub({...newClub, ownership_model:e.target.value})}><option value="">Selecione</option><option value="SAF">SAF</option><option value="Associativo">Associativo</option><option value="Empresa">Empresa</option></select></div>
                                    </div>
                                    <div><label className={labelClass}>Estádio</label><input type="text" className={inputClass} value={newClub.stadium_name} onChange={(e)=>setNewClub({...newClub, stadium_name:e.target.value})} /></div>
                                     <div><label className={labelClass}>Localização</label><input type="text" className={inputClass} value={newClub.location} onChange={(e)=>setNewClub({...newClub, location:e.target.value})} /></div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Logo</label>
                                        <div className="flex gap-2 mb-2">
                                             <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files[0])} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                                             <button onClick={uploadLogo} disabled={uploading || !file} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 rounded-lg font-medium transition-colors disabled:opacity-50">{uploading ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={16}/>}</button>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                                                {newClub.crest_url ? <img src={newClub.crest_url} className="w-full h-full object-cover" /> : <Shield size={24} className="text-gray-300"/>}
                                            </div>
                                            <input type="text" className={inputClass} placeholder="URL da Logo" value={newClub.crest_url} onChange={(e)=>setNewClub({...newClub, crest_url:e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Cor 1</label><div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1"><input type="color" className="w-8 h-8 rounded border-none cursor-pointer" value={newClub.primary_color} onChange={(e)=>setNewClub({...newClub, primary_color:e.target.value})} /><span className="text-xs font-mono text-gray-500">{newClub.primary_color}</span></div></div>
                                        <div><label className={labelClass}>Cor 2</label><div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1"><input type="color" className="w-8 h-8 rounded border-none cursor-pointer" value={newClub.secondary_color} onChange={(e)=>setNewClub({...newClub, secondary_color:e.target.value})} /><span className="text-xs font-mono text-gray-500">{newClub.secondary_color}</span></div></div>
                                    </div>
                                    <div><label className={labelClass}>Descrição</label><textarea className={inputClass} rows={3} value={newClub.description} onChange={(e)=>setNewClub({...newClub, description:e.target.value})} /></div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-gray-900">Atributos</h3><button onClick={()=>setAttributes([...attributes, {key:"", value:"", type:"string"}])} className="text-xs font-bold text-[#7F33D9] hover:bg-purple-50 px-3 py-1.5 rounded-lg">+ Campo</button></div>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {attributes.map((attr, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <input list="keys" className={`${inputClass} !py-1.5 !text-xs`} value={attr.key} onChange={(e)=>{const upd=[...attributes]; upd[i].key=e.target.value; setAttributes(upd)}} placeholder="Chave" />
                                            <input className={`${inputClass} !py-1.5 !text-xs`} value={attr.value} onChange={(e)=>{const upd=[...attributes]; upd[i].value=e.target.value; setAttributes(upd)}} placeholder="Valor" />
                                            <button onClick={()=>setAttributes(attributes.filter((_,idx)=>idx!==i))} className="text-red-400 p-1"><X size={16}/></button>
                                        </div>
                                    ))}
                                    <datalist id="keys">{attributeKeys.map(k=><option key={k} value={k}/>)}</datalist>
                                </div>
                            </div>
                            <div className="px-0 py-5 mt-4 border-t border-gray-100 flex justify-between items-center">
                                {isEditing ? <button onClick={()=>disableClub(currentClub.id_club)} className="text-red-500 text-xs font-bold uppercase tracking-wide hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1"><Trash2 size={14}/> Desativar</button> : <div></div>}
                                <div className="flex gap-3">
                                    <button onClick={()=>setModal(false)} className={btnSecondary}>Cancelar</button>
                                    <button onClick={isEditing ? updateClub : sendClub} disabled={loading||success} className={btnPrimary}>{loading ? <Loader2 size={18} className="animate-spin"/> : "Salvar"}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ... Modal Import (Mantido igual) ... */}
            {importModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setImportModal(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FileSpreadsheet className="text-green-600"/> Importar Clubes</h2>
                            <button onClick={() => setImportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-purple-300 transition-colors text-center cursor-pointer relative group">
                                <input type="file" accept=".xlsx" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => setImportFile(e.target.files[0])} />
                                <div className="flex flex-col items-center gap-2 pointer-events-none">
                                    <UploadCloud size={32} className="text-gray-400 group-hover:text-[#7F33D9] transition-colors" />
                                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{importFile ? importFile.name : "Clique para selecionar o arquivo XLSX"}</span>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>País de destino</label>
                                <select value={importCountry} onChange={(e) => setImportCountry(e.target.value)} className={inputClass}>
                                    <option value="">Selecione...</option>
                                    {countries.map(c => <option key={c.id_country} value={c.id_country}>{c.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleImportClubs} disabled={importing} className={`w-full ${btnPrimary} mt-2 justify-center`}>{importing ? <Loader2 size={18} className="animate-spin" /> : "Iniciar Importação"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}