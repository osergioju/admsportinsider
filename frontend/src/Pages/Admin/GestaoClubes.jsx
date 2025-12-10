import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Trash2, Loader, Check } from "lucide-react";

export default function GestaoClubes() {
    
    const [clubs, setClubs] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [attributeKeys, setAttributeKeys] = useState([]);

    const [modal, setModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [currentClub, setCurrentClub] = useState(null);
    const [newClub, setNewClub] = useState({
        id_league: "",
        name: "",
        description: "",
        crest_url: "",
        founded_at: "",
        stadium_name: "",
        stadium_capacity: "",
        ownership_model: ""
    });
    const [attributes, setAttributes] = useState([]);


    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // ============================
    // CARREGA LIGAS + CLUBES
    // ============================
    async function loadData() {
        try {
            const clubsResp = await api.get(`/admin/clubs?page=${page}&limit=6`);
            setClubs(clubsResp.data.clubs);
            setPagination(clubsResp.data.pagination);

            const leaguesResp = await api.get(`/admin/leagues?onlyActive=true`);
            setLeagues(leaguesResp.data.leagues);

        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    }

    async function loadAttributeKeys() {
        const res = await api.get("/admin/attribute-keys");
        setAttributeKeys(res.data.keys);
    }

    useEffect(() => {
        loadAttributeKeys();
    }, []);

    const uploadLogo = async () => {
        if (!file) {
            alert("Selecione uma imagem primeiro.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/admin/upload-club-logo", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // A URL FINAL DA IMAGEM
            const url = res.data.url;

            setNewClub(prev => ({
                ...prev,
                crest_url: url
            }));

            alert("Logo enviada com sucesso!");

        } catch (err) {
            alert("Erro ao enviar logo.");
            console.error(err);
        }

        setUploading(false);
    };


    useEffect(() => { loadData(); }, []);
    useEffect(() => { loadData(); }, [page]);

    // ============================
    // ABRIR MODAL (CRIAR)
    // ============================
    const openCreateModal = () => {
        setNewClub({
            id_league: "",
            name: "",
            description: "",
            crest_url: "",
            founded_at: "",
            stadium_name: "",
            stadium_capacity: "",
            ownership_model: ""
        });
        setIsEditing(false);
        setModal(true);
    };

    // ============================
    // ABRIR MODAL (EDITAR)
    // ============================
    const openEditModal = async (id) => {
        try {
            const { data } = await api.get(`/admin/clubs/${id}`);
            var clube_foundation = "";
            if(data.club.founded_at !== null){
                clube_foundation = data.club.founded_at.split("T")[0];
            } else { 
                clube_foundation = "";
            }
            
            setCurrentClub(data.club);
            
            setNewClub({
                id_league: data.club.id_league,
                name: data.club.name,
                description: data.club.description,
                crest_url: data.club.crest_url,
                founded_at: clube_foundation,
                stadium_name: data.club.stadium_name,
                stadium_capacity: data.club.stadium_capacity,
                ownership_model: data.club.ownership_model
            });

            setAttributes(data.attributes || []);

            setIsEditing(true);
            setModal(true);

        } catch (err) {
            console.error("Erro ao carregar clube:", err);
        }
    };

    // ============================
    // CADASTRAR CLUBE
    // ============================
    const sendClub = async (payload) => {
        setLoading(true);
        
        try {
            const res = await api.post("/admin/send-club", payload);

            if (res.status === 201) {
                setSuccess(true);

                // atualiza listagem sem reload
                await loadData();

                setTimeout(() => {
                    setModal(false);
                    setSuccess(false);
                }, 800);
            }

        } catch (err) {
            console.error(err);
            alert("Erro ao cadastrar clube");

        } finally {
            setLoading(false);
        }
    };


    // ============================
    // ATUALIZAR CLUBE
    // ============================
    const updateClub = async (payload) => {
        setLoading(true);

        try {
            await api.put(`/admin/clubs/${currentClub.id_club}/update`, payload);

            setSuccess(true);

            // Atualiza lista
            await loadData();

            setTimeout(() => {
                setModal(false);
                setSuccess(false);
            }, 800);

        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar clube");
        } finally {
            setLoading(false);
        }
    };


    // ============================
    // DESATIVAR CLUBE
    // ============================
    const disableClub = async (id) => {
        if (!window.confirm("Deseja realmente desativar este clube?")) return;

        try {
            await api.delete(`/admin/disable-club/${id}`);
            alert("Clube desativado com sucesso!");
            window.location.reload();
        } catch (err) {
            alert("Erro ao desativar clube");
        }
    };

    return (
        <div>

            <div className="pb-2 mb-4 border-b border-gray-200 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Clubes</h1>
                <button 
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                >
                    Cadastrar Clube
                </button>
            </div>

            <div className="p-4 bg-white rounded-3xl">
                {clubs.length > 0 ? (
                    <ul>
                        {clubs.map((club) => (
                            <div 
                                key={club.id_club}
                                onClick={() => openEditModal(club.id_club)}
                                className="cursor-pointer hover:bg-gray-100 p-3 rounded-xl flex justify-between items-center mb-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-50 h-16 bg-black rounded-lg overflow-hidden">
                                      <img src={club.crest_url} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">{club.name}</span>
                                        <span className="text-sm text-gray-500">
                                            {club.league_name}
                                        </span>
                                    </div>
                                </div>

                                <Trash2 
                                    className="text-gray-700 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        disableClub(club.id_club);
                                    }}
                                />
                            </div>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center py-6">Nenhum clube cadastrado</p>
                )}
            </div>

            {pagination && (
                <div className="flex justify-center gap-2 mt-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Anterior
                    </button>

                    <span className="px-3 py-1">
                        Página {page} de {pagination.totalPages}
                    </span>

                    <button
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            )}

            {/* MODAL */}
            {modal && (
                <div 
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => setModal(false)}
                >
                    <div 
                        className="bg-white w-full max-w-2xl p-6 rounded-2xl overflow-y-auto max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-4">
                            {isEditing ? "Editar Clube" : "Cadastrar Clube"}
                        </h2>

                        {/* LIGA */}
                        <label className="block text-sm text-gray-600 mb-1">Liga</label>
                        <select
                            value={newClub.id_league}
                            onChange={(e) =>
                                setNewClub({ ...newClub, id_league: e.target.value })
                            }
                            className="w-full border px-3 py-2 rounded mb-3"
                        >
                            <option value="">Selecione uma liga</option>
                            {leagues.map((l) => (
                                <option key={l.id_league} value={l.id_league}>
                                    {l.name}
                                </option>
                            ))}
                        </select>

                        {/* NOME */}
                        <label className="block text-sm text-gray-600 mb-1">Nome do Clube</label>
                        <input
                            type="text"
                            className="w-full border px-3 py-2 rounded mb-3"
                            value={newClub.name}
                            onChange={(e) =>
                                setNewClub({ ...newClub, name: e.target.value })
                            }
                        />

                        {/* DESCRIÇÃO */}
                        <label className="block text-sm text-gray-600 mb-1">Descrição</label>
                        <textarea
                            className="w-full border px-3 py-2 rounded mb-3"
                            value={newClub.description}
                            onChange={(e) =>
                                setNewClub({ ...newClub, description: e.target.value })
                            }
                        />

                        {/* CAMPOS FIXOS */}
                        <div className="grid grid-cols-2 gap-4 mb-4">

                            {/* Fundação */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Fundação</label>
                                <input
                                    type="date"
                                    className="w-full border px-3 py-2 rounded"
                                    value={newClub.founded_at || ""}
                                    onChange={(e) =>
                                        setNewClub({ ...newClub, founded_at: e.target.value })
                                    }
                                />
                            </div>

                            {/* Estrutura societária */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Modelo societário</label>
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={newClub.ownership_model || ""}
                                    onChange={(e) =>
                                        setNewClub({ ...newClub, ownership_model: e.target.value })
                                    }
                                >
                                    <option value="">Selecione</option>
                                    <option value="SAF">SAF</option>
                                    <option value="Associativo">Associativo</option>
                                    <option value="Empresa">Empresa</option>
                                </select>
                            </div>

                            {/* Estádio */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Nome do Estádio</label>
                                <input
                                    type="text"
                                    className="w-full border px-3 py-2 rounded"
                                    value={newClub.stadium_name || ""}
                                    onChange={(e) =>
                                        setNewClub({ ...newClub, stadium_name: e.target.value })
                                    }
                                />
                            </div>

                            {/* Capacidade */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Capacidade do Estádio</label>
                                <input
                                    type="number"
                                    className="w-full border px-3 py-2 rounded"
                                    value={newClub.stadium_capacity || ""}
                                    onChange={(e) =>
                                        setNewClub({ ...newClub, stadium_capacity: e.target.value })
                                    }
                                />
                            </div>

                        </div>

                        {/* LOGO */}
                        <label className="block text-sm text-gray-600 mb-1">Escudo do Clube</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="mb-2"
                            onChange={(e) => setFile(e.target.files[0])}
                        />

                        <button
                            onClick={uploadLogo}
                            disabled={uploading}
                            className="bg-purple-600 text-white px-3 py-1 rounded mb-3 hover:bg-purple-700 disabled:opacity-40"
                        >
                            {uploading ? "Enviando..." : "Enviar Logo"}
                        </button>

                        {newClub.crest_url && (
                            <div className="w-24 h-24 border rounded-lg overflow-hidden mb-4">
                                <img src={newClub.crest_url} className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* ATRIBUTOS DINÂMICOS */}
                        <hr className="my-4" />
                        <h3 className="text-lg font-semibold mb-2">Atributos adicionais</h3>

                        {attributes.map((attr, index) => (
                            <div key={index} className="grid grid-cols-4 gap-2 mb-2">

                                {/* key */}
                                <input
                                    list="attributeKeys"
                                    className="border px-2 py-1 rounded"
                                    value={attr.key}
                                    onChange={(e) => {
                                        const updated = [...attributes];
                                        updated[index].key = e.target.value;
                                        setAttributes(updated);
                                    }}
                                />

                                <datalist id="attributeKeys">
                                    {attributeKeys.map((k) => (
                                        <option key={k} value={k} />
                                    ))}
                                </datalist>

                                {/* value */}
                                <input
                                    type="text"
                                    placeholder="Valor"
                                    className="border px-2 py-1 rounded"
                                    value={attr.value}
                                    onChange={(e) => {
                                        const updated = [...attributes];
                                        updated[index].value = e.target.value;
                                        setAttributes(updated);
                                    }}
                                />

                                {/* tipo */}
                                <select
                                    className="border px-2 py-1 rounded"
                                    value={attr.type}
                                    onChange={(e) => {
                                        const updated = [...attributes];
                                        updated[index].type = e.target.value;
                                        setAttributes(updated);
                                    }}
                                >
                                    <option value="string">Texto</option>
                                    <option value="number">Número</option>
                                    <option value="date">Data</option>
                                    <option value="boolean">Booleano</option>
                                    <option value="json">JSON</option>
                                </select>

                                {/* remover */}
                                <button
                                    className="text-red-600"
                                    onClick={() => {
                                        const updated = attributes.filter((_, i) => i !== index);
                                        setAttributes(updated);
                                    }}
                                >
                                    Remover
                                </button>
                            </div>
                        ))}

                        {/* Adicionar atributo */}
                        <button
                            className="bg-gray-200 px-3 py-1 rounded mb-4"
                            onClick={() =>
                                setAttributes([...attributes, { key: "", value: "", type: "string" }])
                            }
                        >
                            + Adicionar atributo
                        </button>

                        {/* BOTÕES FINAIS */}
                        <div className="flex justify-between items-center mt-4">
                            
                            <button
                                onClick={async () => {
                                    const payload = { ...newClub, attributes };
                                    isEditing ? updateClub(payload) : sendClub(payload);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                {isEditing ? "Salvar alterações" : "Cadastrar"}
                            </button>

                            {isEditing && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("Tem certeza que deseja desativar este clube?")) {
                                            disableClub(currentClub.id_club);
                                        }
                                    }}
                                    className="text-red-600 hover:text-red-800 underline"
                                >
                                    Desativar Clube
                                </button>
                            )}

                        </div>

                    </div>
                </div>
            )}


        </div>
    );
}
