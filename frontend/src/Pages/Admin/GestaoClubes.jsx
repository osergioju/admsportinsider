import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Trash2, Loader, Check } from "lucide-react";

export default function GestaoClubes() {

    const [clubs, setClubs] = useState([]);
    const [leagues, setLeagues] = useState([]);

    const [modal, setModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [currentClub, setCurrentClub] = useState(null);
    const [newClub, setNewClub] = useState({
        id_league: "",
        name: "",
        description: "",
        crest_url: ""
    });

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
            crest_url: ""
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
            setCurrentClub(data.club);

            setNewClub({
                id_league: data.club.id_league,
                name: data.club.name,
                description: data.club.description,
                crest_url: data.club.crest_url
            });

            setIsEditing(true);
            setModal(true);

        } catch (err) {
            console.error("Erro ao carregar clube:", err);
        }
    };

    // ============================
    // CADASTRAR CLUBE
    // ============================
    const sendClub = async () => {
        setLoading(true);

        try {
            const res = await api.post("/admin/send-club", newClub);

            if (res.status === 201) {
                setSuccess(true);
                setTimeout(() => {
                    setModal(false);
                    window.location.reload();
                }, 700);
            }

        } catch (err) {
            alert("Erro ao cadastrar clube");
        } finally {
            setLoading(false);
        }
    };

    // ============================
    // ATUALIZAR CLUBE
    // ============================
    const updateClub = async () => {
        setLoading(true);

        try {
            await api.put(`/admin/clubs/${currentClub.id_club}/update`, newClub);
            setSuccess(true);

            setTimeout(() => {
                setModal(false);
                window.location.reload();
            }, 700);

        } catch (err) {
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
                        className="bg-white w-full max-w-xl p-6 rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-4">
                            {isEditing ? "Editar Clube" : "Cadastrar Clube"}
                        </h2>

                        {/* Liga */}
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

                        {/* Nome */}
                        <label className="block text-sm text-gray-600 mb-1">Nome do Clube</label>
                        <input
                            type="text"
                            className="w-full border px-3 py-2 rounded mb-3"
                            value={newClub.name}
                            onChange={(e) =>
                                setNewClub({ ...newClub, name: e.target.value })
                            }
                        />

                        {/* Descrição */}
                        <label className="block text-sm text-gray-600 mb-1">Descrição</label>
                        <textarea
                            className="w-full border px-3 py-2 rounded mb-3"
                            value={newClub.description}
                            onChange={(e) =>
                                setNewClub({ ...newClub, description: e.target.value })
                            }
                        />

                        {/* Logo */}
                        <label className="block text-sm text-gray-600 mb-1">Escudo do Clube</label>

                        {/* INPUT FILE */}
                        <input
                            type="file"
                            accept="image/*"
                            className="mb-3"
                            onChange={(e) => setFile(e.target.files[0])}
                        />

                        {/* BOTÃO UPLOAD */}
                        <button
                            onClick={uploadLogo}
                            disabled={uploading}
                            className="bg-purple-600 text-white px-3 py-1 rounded mb-3 hover:bg-purple-700 disabled:opacity-40"
                        >
                            {uploading ? "Enviando..." : "Enviar Logo"}
                        </button>

                        {/* PREVIEW */}
                        {newClub.crest_url && (
                            <div className="w-24 h-24 border rounded-lg overflow-hidden mb-4">
                                <img 
                                    src={newClub.crest_url} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        )}


                        {/* Ações */}
                        <div className="flex justify-between items-center mt-4">

                            {/* Cadastrar / Atualizar */}
                            <button
                                onClick={isEditing ? updateClub : sendClub}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                {isEditing ? "Salvar Alterações" : "Cadastrar"}
                            </button>

                            {/* Desativar */}
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
