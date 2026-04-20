import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { ChevronLeft, ChevronRight, Search, X, Heart } from "lucide-react";
import { useFavorites } from "../../../hooks/useFavorites";
import { useTranslation } from "../../../context/TranslationContext";

const PAGE_SIZE = 24;

// ─── Paginação ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;

  const buildPages = () => {
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    const pages = [1];
    if (left > 2) pages.push("…");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("…");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-10">
      <p className="text-xs text-gray-400">
        {((page - 1) * PAGE_SIZE + 1).toLocaleString("pt-BR")}–
        {Math.min(page * PAGE_SIZE, total).toLocaleString("pt-BR")} de{" "}
        {total.toLocaleString("pt-BR")}
      </p>

      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#7F33D9] hover:text-[#7F33D9] transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={15} />
        </button>

        {buildPages().map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition ${p === page
                  ? "bg-[#7F33D9] text-white"
                  : "border border-gray-200 text-gray-600 hover:border-[#7F33D9] hover:text-[#7F33D9]"
                }`}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#7F33D9] hover:text-[#7F33D9] transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

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

// ─── Card de clube ────────────────────────────────────────────────────────────

function ClubCard({ club, isFavorited, toggleFavorite }) {
  const initials = (club.name || "?").substring(0, 3).toUpperCase();

  return (
    <Link to={`/dashboard/clubs/${club.id_club}`} className="block group">
      <div className="h-full rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

        {/* Topo colorido */}
        <div
          className="h-36 flex items-center justify-center relative"
          style={{ backgroundColor: club.primary_color || "#7F33D9" }}
        >
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(club.id_club, "club"); }}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40  transition"
            aria-label="Favoritar"
          >
            <Heart
              size={13}
              strokeWidth={2}
              className="text-white"
              fill={isFavorited(club.id_club, "club") ? "white" : "transparent"}
            />
          </button>

          <div className="w-20 h-20 bg-white/10  rounded-2xl flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform duration-300">
            {club.crest_url
              ? <img src={club.crest_url} alt={club.name} className="w-14 h-14 object-contain drop-shadow-lg" />
              : <span className="text-white font-black text-xl italic">{initials}</span>
            }
          </div>
        </div>

        {/* Info */}
        <div className="px-3 py-3 text-center">
          <p className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#7F33D9] transition-colors">
            {club.name}
          </p>
          {club.flag_url && (
            <div className="mt-1.5 flex items-center justify-center gap-1.5">
              <img src={club.flag_url} className="w-4 h-2.5 object-cover rounded-sm" alt="" />
              <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{club.country_name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Card de país ─────────────────────────────────────────────────────────────

function CountryCard({ country, count, onClick }) {
  const { t } = useTranslation();
  return (
    <button onClick={onClick} className="group text-left w-full">
      <div className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 hover:border-[#7F33D9]/40 hover:shadow-sm transition-all duration-200">
        {country.flag_url
          ? <img src={country.flag_url} className="w-10 h-[26px] object-cover rounded-md shadow-sm flex-shrink-0" alt="" />
          : <div className="w-10 h-[26px] bg-gray-100 rounded-md flex-shrink-0" />
        }
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#7F33D9] transition-colors leading-tight">
            {country.name}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {Number(count).toLocaleString("pt-BR")} {count === 1 ? t("clubs.singular", "clube") : t("clubs.plural", "clubes")}
          </p>
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-[#7F33D9] transition-colors flex-shrink-0" />
      </div>
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DashClubs() {
  const { isFavorited, toggleFavorite } = useFavorites();
  const { t } = useTranslation();

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  const [clubs, setClubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);

  const debounceRef = useRef(null);

  // ── Carrega países (uma vez) ────────────────────────────────────────────
  useEffect(() => {
    api.get("/dashboard/countries")
      .then(({ data }) => setCountries(data.countries || []))
      .catch(console.error)
      .finally(() => setCountriesLoading(false));
  }, []);

  // ── Debounce do campo de busca ──────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // ── Busca clubes sempre que filtros ou página mudam ─────────────────────
  const inResultsView = debouncedSearch || selectedCountry;

  useEffect(() => {
    if (!debouncedSearch && !selectedCountry) {
      setClubs([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    api.post(
      `/dashboard/clubs/search?page=${page}&limit=${PAGE_SIZE}`,
      { name: debouncedSearch || null, country: selectedCountry?.id || null },
      { signal: controller.signal }
    )
      .then(({ data }) => {
        setClubs(data.clubs || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch((err) => { if (err.name !== "AbortError") console.error(err); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedSearch, selectedCountry, page]);

  // ── Helpers ────────────────────────────────────────────────────────────
  function handleCountryClick(country) {
    setSelectedCountry(country);
    setPage(1);
  }

  function handleClearAll() {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCountry(null);
    setPage(1);
    setClubs([]);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const clubCountries = countries.filter(c => Number(c.clubs_count) > 0);

  return (
    <div className="w-full pb-20 space-y-5">

      {/* ── Barra de busca ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2.5">

          {/* Input de busca */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("clubs.search_placeholder", "Buscar clube…")}
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-full bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#7F33D9]/20 focus:border-[#7F33D9] transition"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtro de país */}
          <select
            value={selectedCountry?.id || ""}
            onChange={(e) => {
              if (!e.target.value) { setSelectedCountry(null); setPage(1); return; }
              const found = countries.find(c => String(c.id) === e.target.value);
              if (found) handleCountryClick(found);
            }}
            className="sm:w-52 px-4 py-2.5 text-sm border border-gray-200 rounded-full bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#7F33D9]/20 focus:border-[#7F33D9] transition"
          >
            <option value="">{t("ui.all_countries", "Todos os países")}</option>
            {clubCountries.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Filtros ativos */}
        {(searchInput || selectedCountry) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {selectedCountry && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#7F33D9]/10 text-[#7F33D9] text-xs rounded-full font-medium">
                {selectedCountry.flag_url && (
                  <img src={selectedCountry.flag_url} className="w-4 h-2.5 object-cover rounded-sm" alt="" />
                )}
                {selectedCountry.name}
                <button onClick={() => { setSelectedCountry(null); setPage(1); }}>
                  <X size={11} />
                </button>
              </span>
            )}
            <button onClick={handleClearAll} className="text-xs text-gray-400 hover:text-gray-600 ml-auto underline underline-offset-2">
              {t("ui.clear_all", "Limpar tudo")}
            </button>
          </div>
        )}
      </div>

      {/* ── View: países ────────────────────────────────────────────────── */}
      {!inResultsView && (
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3 px-1">
            {t("ui.explore_by_country", "Explorar por país")}
          </p>

          {countriesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-[58px] bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {clubCountries.map(c => (
                <CountryCard
                  key={c.id}
                  country={c}
                  count={Number(c.clubs_count)}
                  onClick={() => handleCountryClick(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── View: resultados ────────────────────────────────────────────── */}
      {inResultsView && (
        <div>
          {/* Cabeçalho dos resultados */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#7F33D9] transition font-medium"
              >
                <ChevronLeft size={16} />
                {t("ui.back", "Voltar")}
              </button>
              <div className="w-px h-4 bg-gray-200" />
              {selectedCountry && (
                <div className="flex items-center gap-1.5">
                  {selectedCountry.flag_url && (
                    <img src={selectedCountry.flag_url} className="w-5 h-3.5 object-cover rounded-sm" alt="" />
                  )}
                  <span className="text-sm font-medium text-gray-700">{selectedCountry.name}</span>
                </div>
              )}
              {!loading && (
                <span className="text-sm text-gray-400">
                  {total.toLocaleString("pt-BR")} {total === 1 ? t("clubs.singular", "clube") : t("clubs.plural", "clubes")}
                </span>
              )}
            </div>
          </div>

          {/* Grid de clubes */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : clubs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <p className="text-2xl mb-3 opacity-30">🏟️</p>
              <p className="text-gray-500 text-sm font-medium mb-1">{t("clubs.not_found", "Nenhum clube encontrado")}</p>
              <p className="text-gray-400 text-xs mb-5">{t("clubs.try_other_terms", "Tente outros termos ou limpe os filtros")}</p>
              <button
                onClick={handleClearAll}
                className="px-5 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-[#7F33D9] hover:text-[#7F33D9] transition"
              >
                {t("ui.clear_filters", "Limpar filtros")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {clubs.map(club => (
                <ClubCard
                  key={club.id_club}
                  club={club}
                  isFavorited={isFavorited}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} total={total} onChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}
