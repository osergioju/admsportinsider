import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { Search, X, Users, ChevronRight } from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const POSITIONS = ["Goleiro", "Zagueiro", "Lateral", "Meio-campista", "Atacante"];

const POSITION_STYLE = {
  "Goleiro":       { bg: "bg-blue-50   border-blue-200",   text: "text-blue-700"   },
  "Zagueiro":      { bg: "bg-green-50  border-green-200",  text: "text-green-700"  },
  "Lateral":       { bg: "bg-teal-50   border-teal-200",   text: "text-teal-700"   },
  "Meio-campista": { bg: "bg-violet-50 border-violet-200", text: "text-violet-700" },
  "Atacante":      { bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
};

function formatMV(value) {
  if (!value) return null;
  const n = Number(value);
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n}`;
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full w-2/3" />
      <div className="flex gap-2 mt-1">
        <div className="h-6 w-12 bg-gray-100 rounded-lg" />
        <div className="h-6 w-12 bg-gray-100 rounded-lg" />
        <div className="h-6 w-12 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Player card ───────────────────────────────────────────────────────────────

function PlayerCard({ player, onClick }) {
  const pos = POSITION_STYLE[player.position] ?? POSITION_STYLE["Meio-campista"];
  const mv  = formatMV(player.market_value);

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-3 text-left w-full"
    >
      {/* Header: avatar + nome + posição */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=f3f4f6&color=6b7280&size=88`}
            alt={player.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-violet-700 transition-colors leading-tight">
            {player.name}
          </p>
          <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${pos.bg} ${pos.text}`}>
            {player.position}
          </span>
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-violet-400 transition-colors shrink-0 mt-1" />
      </div>

      {/* Clube + Nacionalidade */}
      <div className="space-y-1.5">
        {player.club_name && (
          <div className="flex items-center gap-2">
            {player.crest_url
              ? <img src={player.crest_url} alt="" loading="lazy" className="w-4 h-4 object-contain shrink-0" />
              : <div className="w-4 h-4 rounded bg-gray-100 shrink-0" />
            }
            <span className="text-xs text-gray-600 truncate font-medium">{player.club_name}</span>
          </div>
        )}
        {player.nationality && player.nationality !== "—" && (
          <div className="flex items-center gap-2">
            {player.flag_url && (
              <img src={player.flag_url} alt="" loading="lazy" className="w-4 h-3 object-cover rounded-sm shrink-0" />
            )}
            <span className="text-xs text-gray-400 truncate">{player.nationality}</span>
          </div>
        )}
      </div>

      {/* Stats + Valor de mercado */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3">
          {player.goals !== null && (
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">{player.goals}</p>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Gols</p>
            </div>
          )}
          {player.assists !== null && (
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">{player.assists}</p>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Assist.</p>
            </div>
          )}
          {player.rating !== null && (
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">{player.rating}</p>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Rating</p>
            </div>
          )}
        </div>
        {mv && (
          <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
            {mv}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function PlayersList() {
  const navigate = useNavigate();

  const [players, setPlayers]       = useState([]);
  const [total, setTotal]           = useState(null);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const [loading, setLoading]       = useState(true);   // primeira carga
  const [loadingMore, setLoadingMore] = useState(false); // carga incremental

  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [position, setPosition]     = useState("");

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const searchTimeout = useRef(null);

  // Debounce da busca: 350ms após parar de digitar
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  // Reset ao mudar filtros
  useEffect(() => {
    setPlayers([]);
    setPage(1);
    setHasMore(false);
    fetchPlayers(1, debouncedSearch, position, true);
  }, [debouncedSearch, position]);

  // Busca da página
  async function fetchPlayers(p, s, pos, reset = false) {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (s)   params.set("search", s);
      if (pos) params.set("position", pos);

      const { data } = await api.get(`/dashboard/players?${params}`);

      setPlayers(prev => reset ? data.players : [...prev, ...data.players]);
      setTotal(data.total);
      setPage(p);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("[PlayersList]", err);
    } finally {
      if (reset) setLoading(false); else setLoadingMore(false);
    }
  }

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchPlayers(page + 1, debouncedSearch, position);
  }, [hasMore, loadingMore, loading, page, debouncedSearch, position]);

  // IntersectionObserver — dispara loadMore quando sentinel entra na tela
  useEffect(() => {
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  function clearSearch() {
    setSearch("");
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto pb-16 space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Jogadores</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total !== null
            ? `${total.toLocaleString("pt-BR")} jogador${total !== 1 ? "es" : ""} encontrado${total !== 1 ? "s" : ""}`
            : "Carregando..."}
        </p>
      </div>

      {/* ── Search + Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-all shadow-sm placeholder:text-gray-400"
          />
          {search && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Posição pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPosition("")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              position === ""
                ? "bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-200"
                : "bg-white border-gray-200 text-gray-600 hover:border-violet-200 hover:text-violet-600"
            }`}
          >
            Todos
          </button>
          {POSITIONS.map(pos => (
            <button
              key={pos}
              onClick={() => setPosition(pos === position ? "" : pos)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                position === pos
                  ? "bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-200"
                  : "bg-white border-gray-200 text-gray-600 hover:border-violet-200 hover:text-violet-600"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid de cards ── */}
      {loading ? (
        // Skeleton inicial
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : players.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Users size={28} className="text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Nenhum jogador encontrado</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            {search || position
              ? "Tente ajustar os filtros ou o nome buscado."
              : "Ainda não há jogadores cadastrados."}
          </p>
          {(search || position) && (
            <button
              onClick={() => { setSearch(""); setPosition(""); }}
              className="mt-4 text-sm text-violet-600 font-medium hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => navigate(`/dashboard/players/${player.id}`)}
              />
            ))}

            {/* Skeleton das próximas linhas enquanto carrega mais */}
            {loadingMore && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={`more-${i}`} />)}
          </div>

          {/* Sentinel — dispara o IntersectionObserver */}
          <div ref={sentinelRef} className="h-4" />

          {/* Fim da lista */}
          {!hasMore && players.length > 0 && (
            <p className="text-center text-xs text-gray-400 pt-2">
              Todos os {total?.toLocaleString("pt-BR")} jogadores carregados
            </p>
          )}
        </>
      )}
    </div>
  );
}
