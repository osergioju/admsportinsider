import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X, Heart, Shield, Trophy } from "lucide-react";
import { federationLogo } from "../../../utils/federationUrl";
import { api } from "../../../services/api";
import { useFavorites } from "../../../hooks/useFavorites";
import { useTranslation } from "../../../context/TranslationContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fedBg(c1, c2, c3) {
  const a = c1 || "#1e1b4b";
  const b = c2 || a;
  const c = c3 || b;
  return `radial-gradient(circle at 20% 30%, ${a} 0%, transparent 65%),
          radial-gradient(circle at 80% 70%, ${b} 0%, transparent 65%),
          linear-gradient(135deg, ${a}, ${b}, ${c})`;
}

const SPHERE_ORDER = { global: 0, continental: 1, nacional: 2 };
const SPHERE_LABEL = { global: "Global", continental: "Continental", nacional: "Nacional" };
const SPHERE_STYLE = {
  global:      "bg-amber-50 text-amber-700 border border-amber-200",
  continental: "bg-blue-50 text-blue-700 border border-blue-200",
  nacional:    "bg-gray-100 text-gray-500",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white animate-pulse">
      <div className="h-36 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-2 bg-gray-100 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );
}

// ─── Card de federação ────────────────────────────────────────────────────────

function FederationCard({ federation, isFavorited, toggleFavorite }) {
  const favorited = isFavorited(federation.id_federation, "federation");
  const count = parseInt(federation.competition_count) || 0;
  const initials = (federation.acronym || "?").substring(0, 4).toUpperCase();
  const bg = fedBg(federation.primary_color, federation.secondary_color, federation.tertiary_color);

  return (
    <Link to={`/dashboard/federations/${federation.slug}`} className="block group">
      <div className="h-full rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

        <div className="h-36 flex items-center justify-center relative" style={{ background: bg }}>
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(federation.id_federation, "federation"); }}
            className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition"
            aria-label="Favoritar"
          >
            <Heart size={13} strokeWidth={2} className="text-white" fill={favorited ? "white" : "transparent"} />
          </button>

          <div className="bg-white/95 relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            {federation.slug
              ? <img src={federationLogo(federation.slug, "medium")} alt={federation.acronym} className="w-14 h-14 object-contain drop-shadow-sm" onError={e=>e.currentTarget.style.display='none'} />
              : <span className="font-black text-sm tracking-tight" style={{ color: federation.primary_color || "#7F33D9" }}>{initials}</span>
            }
          </div>
        </div>

        <div className="px-3 py-3 text-center">
          <p className="font-bold text-gray-900 text-sm group-hover:text-[#7F33D9] transition-colors line-clamp-1">
            {federation.acronym}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{federation.name}</p>
          {count > 0 && (
            <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-gray-400">
              <Trophy size={10} />
              <span>{count} {count === 1 ? "competição" : "competições"}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DashFederations() {
  const { isFavorited, toggleFavorite, loading: loadingFavs } = useFavorites();
  const { t } = useTranslation();

  const [federations, setFederations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get("tab") === "favs" ? "favs" : "all";
  const setTab = (v) => setSearchParams(v === "favs" ? { tab: "favs" } : {});

  const token = localStorage.getItem("token");

  useEffect(() => {
    api.get("/dashboard/federations")
      .then(({ data }) => setFederations(data.federations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isReady = !loading && !loadingFavs;

  const filtered = federations.filter(f => {
    const matchSearch = !searchInput ||
      f.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      f.acronym.toLowerCase().includes(searchInput.toLowerCase());
    const matchTab = tab === "all" || isFavorited(f.id_federation, "federation");
    return matchSearch && matchTab;
  });

  // Agrupa por esfera
  const grouped = useMemo(() => {
    const map = {};
    for (const f of filtered) {
      const sp = f.sphere || "nacional";
      if (!map[sp]) map[sp] = [];
      map[sp].push(f);
    }
    return Object.entries(map).sort(([a], [b]) => (SPHERE_ORDER[a] ?? 9) - (SPHERE_ORDER[b] ?? 9));
  }, [filtered]);

  return (
    <div className="w-full pb-20 space-y-5">

      {/* ── Barra de busca ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar federação…"
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-full bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#7F33D9]/20 focus:border-[#7F33D9] transition"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {token && (
            <div className="flex gap-1 bg-gray-100 rounded-full p-1 shrink-0">
              <button
                onClick={() => setTab("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${tab === "all" ? "bg-white text-[#7F33D9] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Todas
              </button>
              <button
                onClick={() => setTab("favs")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${tab === "favs" ? "bg-white text-[#7F33D9] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Heart size={11} fill={tab === "favs" ? "#7F33D9" : "transparent"} strokeWidth={2} />
                {t("menu.favorites", "Favoritas")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Conteúdo ────────────────────────────────────────────────────── */}
      {!isReady ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          {tab === "favs" ? (
            <>
              <Heart size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm font-medium mb-1">Nenhuma federação favorita</p>
              <p className="text-gray-400 text-xs">Clique no coração em qualquer federação para salvar.</p>
            </>
          ) : (
            <>
              <Shield size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm font-medium mb-1">Nenhuma federação encontrada</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([sphere, feds]) => (
            <div key={sphere}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  {SPHERE_LABEL[sphere] || sphere}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SPHERE_STYLE[sphere]}`}>
                  {feds.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {feds.map(f => (
                  <FederationCard
                    key={f.id_federation}
                    federation={f}
                    isFavorited={isFavorited}
                    toggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
