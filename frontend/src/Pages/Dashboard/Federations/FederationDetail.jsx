import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Heart, Shield, Trophy, ChevronLeft, ChevronRight, Globe, Search, X } from "lucide-react";
import { api } from "../../../services/api";
import { useFavorites } from "../../../hooks/useFavorites";
import { useTranslation } from "../../../context/TranslationContext";

// ─── Card compacto de competição (mesmo estilo ContinentalLeagueCard) ─────────

function LeagueCard({ league, isFavorited, toggleFavorite }) {
  return (
    <Link to={`/dashboard/competitions/${league.id_league}`} className="group block">
      <div className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 hover:border-[#7F33D9]/40 hover:shadow-sm transition-all duration-200">
        {league.slug
          ? <img src={`https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${league.slug}.webp`} className="w-10 h-10 object-contain flex-shrink-0" alt={league.name} />
          : <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy size={15} className="text-[#7F33D9]" />
            </div>
        }
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#7F33D9] transition-colors leading-tight">
            {league.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {league.flag_url
              ? <img src={league.flag_url} className="w-3.5 h-2.5 object-cover rounded-sm flex-shrink-0" alt="" />
              : <Globe size={10} className="text-gray-400 flex-shrink-0" />
            }
            <span className="text-[11px] text-gray-400 truncate">
              {league.country_name || league.continent_name || "Internacional"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(league.id_league, "league"); }}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-purple-50 transition"
            aria-label="Favoritar"
          >
            <Heart
              size={12}
              strokeWidth={2}
              className="transition-colors"
              style={{ color: isFavorited(league.id_league, "league") ? "#7F33D9" : "#d1d5db" }}
              fill={isFavorited(league.id_league, "league") ? "#7F33D9" : "transparent"}
            />
          </button>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-[#7F33D9] transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="h-[66px] bg-white rounded-2xl border border-gray-100 animate-pulse" />
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function FederationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { t } = useTranslation();

  const [federation, setFederation] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/federations/${slug}`)
      .then(({ data }) => {
        setFederation(data.federation);
        setLeagues(data.leagues || []);
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else console.error(err);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (notFound) {
    return (
      <div className="w-full pb-20 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <Shield size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm font-medium mb-1">Federação não encontrada</p>
          <button onClick={() => navigate("/dashboard/federations")} className="mt-4 text-sm text-[#7F33D9] font-bold hover:underline">
            Voltar para federações
          </button>
        </div>
      </div>
    );
  }

  const favFed = federation && isFavorited(federation.id_federation, "federation");

  const filtered = leagues.filter(l =>
    !searchInput || l.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="w-full pb-20 space-y-5">

      {/* ── Header card (barra superior) ──────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2.5">

          {/* Busca inline */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Filtrar competições…"
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-full bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#7F33D9]/20 focus:border-[#7F33D9] transition"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Favoritar federação */}
          {token && federation && (
            <button
              onClick={() => toggleFavorite(federation.id_federation, "federation")}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-semibold transition-all ${
                favFed
                  ? "bg-[#7F33D9] border-[#7F33D9] text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-[#7F33D9] hover:text-[#7F33D9]"
              }`}
            >
              <Heart size={12} fill={favFed ? "white" : "transparent"} strokeWidth={2} />
              {favFed ? "Favoritada" : "Favoritar"}
            </button>
          )}
        </div>
      </div>

      {/* ── Cabeçalho da federação (estilo continente) ────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/federations")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#7F33D9] transition font-medium"
        >
          <ChevronLeft size={16} />
          {t("ui.back", "Voltar")}
        </button>
        <div className="w-px h-4 bg-gray-200" />
        {loading ? (
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        ) : federation && (
          <div className="flex items-center gap-2">
            {federation.logo_url
              ? <img src={federation.logo_url} className="w-6 h-6 object-contain" alt={federation.acronym} />
              : <Shield size={14} className="text-[#7F33D9]" />
            }
            <span className="text-sm font-medium text-gray-700">{federation.acronym}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{federation.name}</span>
          </div>
        )}
        {!loading && (
          <span className="text-sm text-gray-400 ml-auto">
            {filtered.length} {filtered.length === 1 ? "competição" : "competições"}
          </span>
        )}
      </div>

      {/* ── Grid de competições ───────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-2xl mb-3 opacity-30">🏆</p>
          {searchInput
            ? <>
                <p className="text-gray-500 text-sm font-medium mb-1">Nenhuma competição encontrada</p>
                <p className="text-gray-400 text-xs">Tente outros termos ou limpe o filtro</p>
              </>
            : <>
                <p className="text-gray-500 text-sm font-medium mb-1">Nenhuma competição vinculada</p>
                <p className="text-gray-400 text-xs">
                  Edite uma competição no admin e vincule a <strong>{federation?.acronym}</strong>.
                </p>
              </>
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(league => (
            <LeagueCard
              key={league.id_league}
              league={league}
              isFavorited={isFavorited}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
