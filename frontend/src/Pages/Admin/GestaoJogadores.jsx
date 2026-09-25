import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../services/api";
import {
    Loader2, Search, Wand2, CheckCircle2, AlertCircle,
    ChevronLeft, ChevronRight, User
} from "lucide-react";

const ITEMS_PER_PAGE = 30;

// ── Linha de jogador ────────────────────────────────────────────────────────
function PlayerRow({ player, onFetch, fetchStatus }) {
    return (
        <tr className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
            {/* Avatar */}
            <td className="px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                    {player.photo_url
                        ? <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover object-top" />
                        : <User size={18} className="text-gray-300" />
                    }
                </div>
            </td>

            {/* Nome */}
            <td className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{player.full_name}</p>
                <p className="text-xs text-gray-400">{player.position ?? "—"}</p>
            </td>

            {/* Nacionalidade */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    {player.flag_url && <img src={player.flag_url} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />}
                    <span className="text-xs text-gray-600">{player.nationality ?? "—"}</span>
                </div>
            </td>

            {/* Status foto */}
            <td className="px-4 py-3 text-center">
                {player.photo_url
                    ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Tem foto" />
                    : <span className="inline-block w-2 h-2 rounded-full bg-gray-200" title="Sem foto" />
                }
            </td>

            {/* Ação */}
            <td className="px-4 py-3 text-right">
                <button
                    onClick={() => onFetch(player)}
                    disabled={fetchStatus === "loading"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50
                        bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
                >
                    {fetchStatus === "loading" ? (
                        <Loader2 size={11} className="animate-spin" />
                    ) : fetchStatus === "found" ? (
                        <CheckCircle2 size={11} className="text-emerald-500" />
                    ) : fetchStatus === "notfound" ? (
                        <AlertCircle size={11} className="text-red-400" />
                    ) : (
                        <Wand2 size={11} />
                    )}
                    {fetchStatus === "found" ? "Encontrado!" : fetchStatus === "notfound" ? "Não achado" : "Buscar foto"}
                </button>
            </td>
        </tr>
    );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function GestaoJogadores() {
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [page, setPage]         = useState(1);
    const [fetchStatuses, setFetchStatuses] = useState({}); // id → status

    // busca em massa
    const [bulkState, setBulkState] = useState(null);
    const bulkAbort = useRef(false);

    const load = useCallback(async (s, p) => {
        setLoading(true);
        try {
            const { data: res } = await api.get(`/admin/players?search=${encodeURIComponent(s)}&page=${p}`);
            setData(res);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(search, page); }, [search, page]);

    // debounce no search
    const searchTimeout = useRef(null);
    const handleSearch = (v) => {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => { setPage(1); setSearch(v); }, 400);
    };

    // busca individual
    const fetchOne = async (player) => {
        setFetchStatuses(p => ({ ...p, [player.id_player]: "loading" }));
        try {
            const { data: res } = await api.get(`/admin/thesportsdb/player?name=${encodeURIComponent(player.full_name)}`);
            if (res.found && res.photo_url) {
                await api.put(`/admin/players/${player.id_player}/photo`, { photo_url: res.photo_url });
                setData(prev => ({
                    ...prev,
                    players: prev.players.map(p =>
                        p.id_player === player.id_player ? { ...p, photo_url: res.photo_url } : p
                    )
                }));
                setFetchStatuses(p => ({ ...p, [player.id_player]: "found" }));
            } else {
                setFetchStatuses(p => ({ ...p, [player.id_player]: "notfound" }));
            }
        } catch {
            setFetchStatuses(p => ({ ...p, [player.id_player]: "notfound" }));
        }
        setTimeout(() => setFetchStatuses(p => { const c = { ...p }; delete c[player.id_player]; return c; }), 3000);
    };

    // busca em massa (apenas jogadores sem foto)
    const handleBulkFetch = async () => {
        const semFoto = (data?.players ?? []).filter(p => !p.photo_url);
        if (!semFoto.length) { alert("Todos os jogadores desta página já têm foto."); return; }
        if (!window.confirm(`Buscar fotos para ${semFoto.length} jogadores sem foto nesta página?`)) return;

        bulkAbort.current = false;
        setBulkState({ total: semFoto.length, done: 0, found: 0 });

        for (const player of semFoto) {
            if (bulkAbort.current) break;
            try {
                const { data: res } = await api.get(`/admin/thesportsdb/player?name=${encodeURIComponent(player.full_name)}`);
                if (res.found && res.photo_url) {
                    await api.put(`/admin/players/${player.id_player}/photo`, { photo_url: res.photo_url });
                    setData(prev => ({
                        ...prev,
                        players: prev.players.map(p =>
                            p.id_player === player.id_player ? { ...p, photo_url: res.photo_url } : p
                        )
                    }));
                    setBulkState(p => ({ ...p, done: p.done + 1, found: p.found + 1 }));
                } else {
                    setBulkState(p => ({ ...p, done: p.done + 1 }));
                }
            } catch {
                setBulkState(p => ({ ...p, done: p.done + 1 }));
            }
            await new Promise(r => setTimeout(r, 400));
        }

        setTimeout(() => setBulkState(null), 4000);
    };

    const players    = data?.players    ?? [];
    const totalPages = data?.totalPages ?? 1;
    const total      = data?.total      ?? 0;
    const semFotoCount = players.filter(p => !p.photo_url).length;

    return (
        <div className="w-full max-w-5xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Jogadores</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {total.toLocaleString("pt-BR")} jogadores cadastrados
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar jogador..."
                            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all w-56"
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>

                    {/* Busca em massa */}
                    <button
                        onClick={handleBulkFetch}
                        disabled={!!bulkState || semFotoCount === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {bulkState ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
                        Buscar Fotos
                        {!bulkState && semFotoCount > 0 && (
                            <span className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                                {semFotoCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Barra de progresso bulk */}
            {bulkState && (
                <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4 flex items-center gap-4 mb-4">
                    <Loader2 size={18} className="animate-spin text-violet-500 shrink-0" />
                    <div className="flex-1">
                        <div className="flex justify-between text-xs font-semibold text-violet-700 mb-1.5">
                            <span>Buscando fotos... {bulkState.done}/{bulkState.total}</span>
                            <span className="text-emerald-600">{bulkState.found} encontradas</span>
                        </div>
                        <div className="w-full bg-violet-100 rounded-full h-1.5">
                            <div
                                className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${(bulkState.done / bulkState.total) * 100}%` }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => { bulkAbort.current = true; }}
                        className="text-xs text-gray-400 hover:text-red-400 font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Tabela */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-14">Foto</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Nome</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Nacionalidade</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-16">Img</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center">
                                    <Loader2 className="animate-spin w-5 h-5 text-gray-400 mx-auto" />
                                </td>
                            </tr>
                        ) : players.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                                    Nenhum jogador encontrado.
                                </td>
                            </tr>
                        ) : players.map(player => (
                            <PlayerRow
                                key={player.id_player}
                                player={player}
                                onFetch={fetchOne}
                                fetchStatus={fetchStatuses[player.id_player] ?? null}
                            />
                        ))}
                    </tbody>
                </table>

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                            Página {page} de {totalPages}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
