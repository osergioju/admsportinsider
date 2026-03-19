import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, SearchX, Loader2 } from "lucide-react";
import { api } from "../../services/api"
import { useFavorites } from "../../hooks/useFavorites";

const getInitials = (name) => {
  if (!name) return "";
  return name.substring(0, 3).toUpperCase();
};

export default function ClubsFavorites() {
  const { favorites, isFavorited, toggleFavorite, loading: loadingFavs } = useFavorites();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavoritedClubs() {
      const clubFavs = favorites.filter((f) => f.entity_type === "club");

      if (clubFavs.length === 0) {
        setClubs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const responses = await Promise.all(
          clubFavs.map((f) => api.get(`/admin/clubs/${f.entity_id}`))
        );
        setClubs(responses.map((r) => r.data.club || r.data));
      } catch (err) {
        console.error("Erro ao buscar clubes favoritos:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!loadingFavs) fetchFavoritedClubs();
  }, [favorites, loadingFavs]);

  const isReady = !loading && !loadingFavs;

  return (
    <div className="w-full min-h-screen bg-[#F7F5FF] pb-24">

      {/* ── Hero Header ── */}
      <div className="relative w-full overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none">
          {/* Soft blobs */}
          <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[#EDE6F6] opacity-60 blur-3xl" />
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-[#F3EEFF] opacity-50 blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 lg:px-12 py-10 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart size={18} className="text-[#7F33D9]" fill="#7F33D9" />
              <span className="text-xs font-semibold tracking-widest text-[#7F33D9] uppercase">
                Meus favoritos
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#0A0A0A] tracking-tight leading-tight">
              Clubes salvos
            </h1>
            <p className="mt-1 text-sm text-gray-400 font-light">
              {isReady
                ? clubs.length > 0
                  ? `${clubs.length} clube${clubs.length > 1 ? "s" : ""} na sua lista`
                  : "Nenhum clube favoritado ainda"
                : "Carregando..."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-10">

        {/* Loading */}
        {!isReady && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={32} className="animate-spin text-[#7F33D9]" />
            <p className="text-sm text-gray-400 font-light">Carregando clubes favoritos...</p>
          </div>
        )}

        {/* Empty state */}
        {isReady && clubs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-[#EDE6F6] flex items-center justify-center">
              <SearchX size={32} className="text-[#7F33D9] opacity-60" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">Nenhum clube favoritado</p>
              <p className="text-sm text-gray-400 font-light mt-1">
                Explore os clubes e clique no ❤️ para salvá-los aqui.
              </p>
            </div>
            <Link
              to="/dashboard/clubs"
              className="mt-2 px-6 py-2.5 bg-[#7F33D9] text-white text-sm rounded-full font-medium hover:bg-[#6a28b8] transition-all shadow-md shadow-purple-200"
            >
              Explorar clubes
            </Link>
          </div>
        )}

        {/* Grid */}
        {isReady && clubs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {clubs.map((club, i) => (
              <div
                key={club.id_club}
                className="animate-fadein"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
              >
                <Link to={`/dashboard/clubs/${club.id_club}`} className="block group/card h-full">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 h-full">

                    {/* Header colorido */}
                    <div
                      className="h-36 flex items-center justify-center p-5 relative"
                      style={{ backgroundColor: club.primary_color || "#7F33D9" }}
                    >
                      {/* Botão favoritar */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(club.id_club, "club");
                        }}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-all duration-200"
                        aria-label="Remover favorito"
                      >
                        <Heart
                          size={14}
                          strokeWidth={2}
                          className="text-white transition-all duration-200"
                          fill={isFavorited(club.id_club, "club") ? "white" : "transparent"}
                        />
                      </button>

                      {/* Escudo */}
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                        {club.crest_url ? (
                          <img
                            src={club.crest_url}
                            alt={club.name}
                            className="w-14 h-14 object-contain drop-shadow-2xl"
                          />
                        ) : (
                          <span className="text-white font-black text-xl tracking-tighter italic">
                            {getInitials(club.name)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 text-center">
                      <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1 group-hover/card:text-[#7F33D9] transition-colors">
                        {club.name}
                      </p>
                      {club.country && (
                        <p className="mt-1 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                          {club.country}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-center gap-1.5 opacity-60">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Ativo
                        </span>
                      </div>
                    </div>

                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Animação de entrada */}
      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein {
          animation: fadein 0.35s ease both;
        }
      `}</style>

    </div>
  );
}