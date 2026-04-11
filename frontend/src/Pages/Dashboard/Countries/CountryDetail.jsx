import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../../services/api";
import { ChevronLeft, Globe, Trophy, Users } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";

const FORMAT_LABEL = {
  pontos_corridos: "Pontos Corridos",
  mata_mata: "Mata-Mata",
  grupos: "Grupos + Mata-Mata",
};

function SkeletonBlock({ lines = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded-full w-2/3" />
            <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CountryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("leagues"); // "leagues" | "clubs"
  const [clubSearch, setClubSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/countries/${id}`)
      .then(({ data }) => setData(data))
      .catch(() => navigate("/dashboard/countries"))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredClubs = (data?.clubs ?? []).filter(c =>
    c.name.toLowerCase().includes(clubSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-16 space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/countries")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors font-medium"
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
                <span className="font-semibold text-gray-700">{data.leagues.length}</span> {data.leagues.length !== 1 ? t("leagues.plural", "ligas") : t("leagues.singular", "liga")}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{data.clubs.length}</span> {data.clubs.length !== 1 ? t("clubs.plural", "clubes") : t("clubs.singular", "clube")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "leagues", label: t("menu.leagues", "Ligas"), icon: Trophy },
          { key: "clubs",   label: t("menu.clubs", "Clubes"), icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              tab === key
                ? "bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-200"
                : "bg-white border-gray-200 text-gray-600 hover:border-violet-200 hover:text-violet-600"
            }`}
          >
            <Icon size={14} />
            {label}
            {!loading && data && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                {key === "leagues" ? data.leagues.length : data.clubs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonBlock lines={5} />
      ) : tab === "leagues" ? (

        /* ── LIGAS ── */
        data.leagues.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">{t("leagues.none_registered", "Nenhuma liga cadastrada para este país.")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.leagues.map(league => (
              <Link
                key={league.id}
                to={`/dashboard/league/${league.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 hover:-translate-y-0.5 transition-all duration-200 p-5 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {league.logo_url
                    ? <img src={league.logo_url} alt="" loading="lazy" className="w-full h-full object-contain p-1" />
                    : <Trophy size={18} className="text-gray-300" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-violet-700 transition-colors">
                    {league.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {league.format && (
                      <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-md">
                        {FORMAT_LABEL[league.format] ?? league.format}
                      </span>
                    )}
                    {league.clubs_count > 0 && (
                      <span className="text-[11px] text-gray-400">
                        {league.clubs_count} {league.clubs_count !== 1 ? t("clubs.plural", "clubes") : t("clubs.singular", "clube")}
                      </span>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-violet-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )

      ) : (

        /* ── CLUBES ── */
        <>
          {data.clubs.length > 8 && (
            <div className="relative max-w-sm">
              <input
                type="text"
                value={clubSearch}
                onChange={e => setClubSearch(e.target.value)}
                placeholder={t("countries.filter_club", "Filtrar clube...")}
                className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 shadow-sm placeholder:text-gray-400 transition-all"
              />
            </div>
          )}

          {filteredClubs.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">{t("clubs.not_found_period", "Nenhum clube encontrado.")}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClubs.map(club => (
                <Link
                  key={club.id}
                  to={`/dashboard/clubs/${club.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 hover:-translate-y-0.5 transition-all duration-200 p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {club.crest_url
                      ? <img src={club.crest_url} alt="" loading="lazy" className="w-full h-full object-contain p-1" />
                      : <Users size={16} className="text-gray-300" />
                    }
                  </div>
                  <p className="flex-1 text-sm font-bold text-gray-900 truncate group-hover:text-violet-700 transition-colors">
                    {club.name}
                  </p>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-violet-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
