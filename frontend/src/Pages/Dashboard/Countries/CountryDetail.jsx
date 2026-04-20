import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../../services/api";
import { ChevronLeft, Globe, Heart, Search, X } from "lucide-react";
import { useFavorites } from "../../../hooks/useFavorites";
import { useTranslation } from "../../../context/TranslationContext";

// ─── Skeleton ────────────────────────────────────────────────────────────────

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

// ─── League Card ─────────────────────────────────────────────────────────────

function LeagueCard({ league, isFavorited, toggleFavorite }) {
  const initials = (league.name || "?").substring(0, 3).toUpperCase();
  return (
    <Link to={`/dashboard/league/${league.id}`} className="block group">
      <div className="h-full rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="h-36 flex items-center justify-center relative" style={{ background: "radial-gradient(circle at 30% 50%, #9b5de5 0%, #7F33D9 60%, #5a1fa0 100%)" }}>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(league.id, "league"); }}
            className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition"
            aria-label="Favoritar"
          >
            <Heart size={13} strokeWidth={2} className="text-white" fill={isFavorited(league.id, "league") ? "white" : "transparent"} />
          </button>
          <div className="relative z-10 w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform duration-300">
            {league.logo_url
              ? <img src={league.logo_url} alt={league.name} className="w-14 h-14 object-contain drop-shadow-lg" />
              : <span className="text-white font-black text-xl italic">{initials}</span>
            }
          </div>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#7F33D9] transition-colors">
            {league.name}
          </p>
          {league.clubs_count > 0 && (
            <p className="text-[10px] text-gray-400 mt-1">{league.clubs_count} clubes</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Club Card ────────────────────────────────────────────────────────────────

function ClubCard({ club, isFavorited, toggleFavorite }) {
  const initials = (club.name || "?").substring(0, 3).toUpperCase();
  return (
    <Link to={`/dashboard/clubs/${club.id}`} className="block group">
      <div className="h-full rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="h-36 flex items-center justify-center relative" style={{ backgroundColor: club.primary_color || "#7F33D9" }}>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(club.id, "club"); }}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition"
            aria-label="Favoritar"
          >
            <Heart size={13} strokeWidth={2} className="text-white" fill={isFavorited(club.id, "club") ? "white" : "transparent"} />
          </button>
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform duration-300">
            {club.crest_url
              ? <img src={club.crest_url} alt={club.name} className="w-14 h-14 object-contain drop-shadow-lg" />
              : <span className="text-white font-black text-xl italic">{initials}</span>
            }
          </div>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#7F33D9] transition-colors">
            {club.name}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CountryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isFavorited, toggleFavorite } = useFavorites();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("leagues");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/countries/${id}`)
      .then(({ data }) => setData(data))
      .catch(() => navigate("/dashboard/countries"))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredLeagues = (data?.leagues ?? []).filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredClubs = (data?.clubs ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const items = tab === "leagues" ? filteredLeagues : filteredClubs;
  const total = tab === "leagues" ? (data?.leagues.length ?? 0) : (data?.clubs.length ?? 0);

  return (
    <div className="w-full mx-auto pb-16 space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/countries")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#7F33D9] transition-colors font-medium"
      >
        <ChevronLeft size={16} />
        {t("ui.all_countries", "Todos os países")}
      </button>

      {/* Hero */}
      {loading ? (
        <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      ) : data?.country && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-11 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-50 flex items-center justify-center">
            {data.country.flag_url
              ? <img src={data.country.flag_url} alt="" className="w-full h-full object-cover" />
              : <Globe size={22} className="text-gray-300" />
            }
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.country.name}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{data.leagues.length}</span>{" "}
                {data.leagues.length !== 1 ? t("leagues.plural", "ligas") : t("leagues.singular", "liga")}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{data.clubs.length}</span>{" "}
                {data.clubs.length !== 1 ? t("clubs.plural", "clubes") : t("clubs.singular", "clube")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs + busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: "leagues", label: t("menu.leagues", "Ligas"), count: data?.leagues.length ?? 0 },
            { key: "clubs", label: t("menu.clubs", "Clubes"), count: data?.clubs.length ?? 0 },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${tab === key
                  ? "bg-[#7F33D9] border-[#7F33D9] text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#7F33D9]/40 hover:text-[#7F33D9]"
                }`}
            >
              {label}
              {!loading && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {!loading && total > 8 && (
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === "leagues" ? t("leagues.search_placeholder", "Buscar liga…") : t("clubs.search_placeholder", "Buscar clube…")}
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-full bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#7F33D9]/20 focus:border-[#7F33D9] transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 text-sm">
            {search
              ? t("ui.no_results", "Nenhum resultado encontrado.")
              : tab === "leagues"
                ? t("leagues.none_registered", "Nenhuma liga cadastrada para este país.")
                : t("clubs.not_found_period", "Nenhum clube encontrado.")}
          </p>
        </div>
      ) : tab === "leagues" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredLeagues.map(league => (
            <LeagueCard key={league.id} league={league} isFavorited={isFavorited} toggleFavorite={toggleFavorite} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredClubs.map(club => (
            <ClubCard key={club.id} club={club} isFavorited={isFavorited} toggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
