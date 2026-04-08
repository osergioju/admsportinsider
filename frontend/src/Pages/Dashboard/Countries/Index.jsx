import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { Search, Globe, X } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-7 bg-gray-100 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
        <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
      </div>
    </div>
  );
}

export default function DashCountries() {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/dashboard/countries")
      .then(({ data }) => {
        setCountries(data.countries);
        setFiltered(data.countries);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q ? countries.filter(c => c.name.toLowerCase().includes(q)) : countries);
  }, [search, countries]);

  return (
    <div className="w-full max-w-5xl mx-auto pb-16 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Países</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? "Carregando..." : `${countries.length} países com ligas ou clubes cadastrados`}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar país..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 shadow-sm placeholder:text-gray-400 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Globe size={28} className="text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Nenhum país encontrado</h3>
          <p className="text-sm text-gray-500">Tente ajustar a busca.</p>
          {search && (
            <button onClick={() => setSearch("")} className="mt-4 text-sm text-violet-600 font-medium hover:underline">
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(country => (
            <button
              key={country.id}
              onClick={() => navigate(`/dashboard/countries/${country.id}`)}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 hover:-translate-y-0.5 transition-all duration-200 p-5 flex items-center gap-4 text-left w-full"
            >
              {/* Flag */}
              <div className="w-12 h-8 rounded-md overflow-hidden border border-gray-100 shrink-0 bg-gray-50 flex items-center justify-center">
                {country.flag_url
                  ? <img src={country.flag_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  : <Globe size={16} className="text-gray-300" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-violet-700 transition-colors">
                  {country.name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-600">{country.leagues_count}</span> liga{country.leagues_count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-600">{country.clubs_count}</span> clube{country.clubs_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <svg className="w-4 h-4 text-gray-300 group-hover:text-violet-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
