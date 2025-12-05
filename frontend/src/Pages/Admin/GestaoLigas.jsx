import { useState, useEffect } from "react";
import { api } from "../../services/api"; 
import { Trash2, Loader, Check } from "lucide-react";
import Select from "../../components/uxui/Select";

export default function GestaoLigas() {

    const [leagues, setLeagues] = useState([]);
    const [countries, setCountries] = useState([]);

    const [modal, setModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [currentLeague, setCurrentLeague] = useState(null);
    const [newLeague, setNewLeague] = useState({
        id_country: "",
        name: "",
        description: "",
        logo_url: ""
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    // ============================
    // CARREGA PAÍSES + LIGAS
    // ============================
    async function loadData() {
        try {
            const respLeagues = await api.get(`/admin/leagues?page=${page}&limit=6`);
            setLeagues(respLeagues.data.leagues);
            setPagination(respLeagues.data.pagination);

            const respCountries = await api.get(`/admin/countries?onlyActive=true`);
            setCountries(respCountries.data.countries);

        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    }

    useEffect(() => { loadData(); }, []);
    useEffect(() => { loadData(); }, [page]);

    // ============================
    // ABRIR MODAL
    // ============================
    const openCreateModal = () => {
        setNewLeague({
            id_country: "",
            name: "",
            description: "",
            logo_url: ""
        });
        setIsEditing(false);
        setModal(true);
    };

    const openEditModal = async (id) => {
        try {
            const { data } = await api.get(`/admin/leagues/${id}`);
            setCurrentLeague(data.league);

            setNewLeague({
                id_country: data.league.id_country,
                name: data.league.name,
                description: data.league.description,
                logo_url: data.league.logo_url
            });

            setIsEditing(true);
            setModal(true);

        } catch (err) {
            console.error("Erro ao carregar liga:", err);
        }
    };

    // ============================
    // Cadastrar liga
    // ============================
    const sendLeague = async () => {
        setLoading(true);
        try {
            const res = await api.post("/admin/send-league", newLeague);

            if (res.status === 201) {
                setSuccess(true);
                setTimeout(() => {
                    setModal(false);
                    window.location.reload();
                }, 700);
            }

        } catch (err) {
            alert("Erro ao cadastrar liga");
        } finally {
            setLoading(false);
        }
    };

    // ============================
    // Atualizar liga
    // ============================
    const updateLeague = async () => {
        setLoading(true);
        try {
            await api.put(`/admin/leagues/${currentLeague.id_league}/update`, newLeague);
            setSuccess(true);

            setTimeout(() => {
                setModal(false);
                window.location.reload();
            }, 700);

        } catch (err) {
            alert("Erro ao atualizar liga");
        } finally {
            setLoading(false);
        }
    };

    // ============================
    // Desativar liga
    // ============================
    const disableLeague = async (id) => {
        if (!window.confirm("Deseja realmente desativar esta liga?")) return;

        try {
            await api.delete(`/admin/disable-league/${id}`);
            alert("Liga desativada com sucesso!");
            window.location.reload();
        } catch (err) {
            alert("Erro ao desativar liga");
        }
    };

    return (
        <div>

            <div className="pb-2 mb-4 border-b border-gray-200 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Ligas</h1>
                <button 
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                >
                    Cadastrar Liga
                </button>
            </div>

            <div className="p-4 bg-white rounded-3xl">
                {leagues.length > 0 ? (
                    <ul>
                        {leagues.map((league) => (
                            <div 
                                key={league.id_league}
                                className="cursor-pointer hover:bg-gray-200 p-3 rounded-xl flex justify-between items-center mb-2"
                                onClick={() => openEditModal(league.id_league)}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={league.logo_url} className="w-10 h-10 rounded" />
                                    <div className="flex flex-col">
                                        <span className="font-bold">{league.name}</span>
                                        <span className="text-sm text-gray-500">
                                            {league.country_name}
                                        </span>
                                    </div>
                                </div>
                                <Trash2 
                                    className="text-gray-700 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        disableLeague(league.id_league);
                                    }}
                                />
                            </div>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center py-6">Nenhuma liga cadastrada</p>
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
                            {isEditing ? "Editar Liga" : "Cadastrar Liga"}
                        </h2>

                        {/* País */}
                        <label className="block text-sm text-gray-600 mb-1">País</label>
                        <select
                            value={newLeague.id_country}
                            onChange={(e) =>
                                setNewLeague({ ...newLeague, id_country: e.target.value })
                            }
                            className="w-full border px-3 py-2 rounded mb-3"
                        >
                            <option value="">Selecione um país</option>
                            {countries.map((c) => (
                                <option key={c.id_country} value={c.id_country}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Nome */}
                        <label className="block text-sm text-gray-600 mb-1">Nome da Liga</label>
                        <input
                            type="text"
                            className="w-full border px-3 py-2 rounded mb-3"
                            value={newLeague.name}
                            onChange={(e) =>
                                setNewLeague({ ...newLeague, name: e.target.value })
                            }
                        />

                        {/* Descrição */}
                        <label className="block text-sm text-gray-600 mb-1">Descrição</label>
                        <textarea
                            className="w-full border px-3 py-2 rounded mb-3"
                            value={newLeague.description}
                            onChange={(e) =>
                                setNewLeague({ ...newLeague, description: e.target.value })
                            }
                        />

                        {/* Logo */}
                        <label className="block text-sm text-gray-600 mb-1">URL do Logo</label>
                        <input
                            type="text"
                            className="w-full border px-3 py-2 rounded mb-4"
                            value={newLeague.logo_url}
                            onChange={(e) =>
                                setNewLeague({ ...newLeague, logo_url: e.target.value })
                            }
                        />

                        <div className="flex justify-between items-center mt-4">

                          {/* Botão principal – salvar ou cadastrar */}
                          <button
                              onClick={isEditing ? updateLeague : sendLeague}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                              {isEditing ? "Salvar Alterações" : "Cadastrar"}
                          </button>

                          {/* Botão de DESATIVAR — aparece só quando estiver editando */}
                          {isEditing && (
                              <button
                                  onClick={() => {
                                      if (window.confirm("Tem certeza que deseja desativar esta liga?")) {
                                          disableLeague(currentLeague.id_league);
                                      }
                                  }}
                                  className="text-red-600 hover:text-red-800 underline cursor-pointer"
                              >
                                  Desativar Liga
                              </button>
                          )}
                      </div>
                    </div>
                </div>
            )}

        </div>
    );
}
