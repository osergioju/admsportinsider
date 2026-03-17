import { useState, useEffect, useMemo, useCallback } from "react";
import { Heart } from "lucide-react";
import { api } from "../../../services/api";

/* ───────────── Constantes ───────────── */

const LIMITE_LIGAS = 4;

const CURRENCIES = [
  { value: "BRL", label: "R$", full: "Real (BRL)" },
  { value: "USD", label: "US$", full: "Dólar (USD)" },
  { value: "EUR", label: "€", full: "Euro (EUR)" },
  { value: "RUB", label: "₽", full: "Rublo (RUB)" },
];

/* ───────────── Hook Favorito ───────────── */

function useFavorite(initialState = false) {
  const [isFavorited, setIsFavorited] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const toggle = useCallback(() => {
    const willFavorite = !isFavorited;

    setIsFavorited(willFavorite);
    setIsAnimating(true);

    if (willFavorite) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 650);
    }

    setTimeout(() => setIsAnimating(false), 420);
  }, [isFavorited]);

  return { isFavorited, isAnimating, showBurst, toggle };
}

/* ───────────── Botão favorito ───────────── */

function FavoriteButton() {
  const { isFavorited, toggle } = useFavorite();

  return (
    <button
      className="cf-heart-btn"
      onClick={toggle}
      aria-label={isFavorited ? "Remover favorito" : "Favoritar gráfico"}
    >
      <Heart
        size={17}
        strokeWidth={2}
        className={`cf-heart-icon ${isFavorited ? "fav" : "unfav"}`}
      />
    </button>
  );
}

/* ───────────── ChartFilter ───────────── */

export default function ChartFilter({
  ligasSelecionadas,
  onAddLeague,
  country = null,
  currency,
  onChangeCurrency,
  selectedYear,
  onChangeYear,
  availableYears,
}) {
  const [busca, setBusca] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState([]);

  const atLimite = ligasSelecionadas.length >= LIMITE_LIGAS;

  /* ───────────── Fechar dropdown ao clicar fora ───────────── */

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest("[data-league-search]")) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ───────────── Busca de ligas (com debounce) ───────────── */

  useEffect(() => {
    if (!busca) {
      setLeagues([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoading(true);

        const { data } = await api.post("/admin/leagues/search", {
          name: busca,
          country,
        });

        setLeagues(data.leagues || []);
      } catch (err) {
        console.error("Erro ao buscar ligas:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [busca, country]);

  /* ───────────── Remove ligas já selecionadas ───────────── */

  const ligasFiltradas = useMemo(
    () =>
      leagues.filter(
        (league) => !ligasSelecionadas.includes(league.id_league)
      ),
    [leagues, ligasSelecionadas]
  );

  /* ───────────── Adicionar liga ───────────── */

  function handleAdd(league) {
    if (atLimite) return;

    onAddLeague(league);

    setBusca("");
    setIsOpen(false);
    setLeagues([]);
  }

  /* ───────────── UI ───────────── */

  return (
    <div className="w-full mb-2 z-20">
      <div className="flex flex-wrap items-end justify-between gap-4 lg:gap-6">

        {/* BUSCA DE LIGAS */}
        <div className="grid grid-cols-3 gap-4">

          <div className="relative" data-league-search>
            <span className="text-sm text-[#AFAFB2]">
              Comparar ligas ({ligasSelecionadas.length}/{LIMITE_LIGAS})
            </span>

            <input
              type="text"
              value={busca}
              disabled={atLimite}
              placeholder={
                atLimite
                  ? "Limite atingido"
                  : "Digite o nome da liga"
              }
              onChange={(e) => {
                setBusca(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full border rounded-full px-4 py-3 text-sm"
            />

            {isOpen && busca && (
              <div className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow">

                {loading && (
                  <div className="px-4 py-2 text-sm text-gray-400">
                    Buscando ligas...
                  </div>
                )}

                {!loading && ligasFiltradas.length > 0 && (
                  <ul className="max-h-48 overflow-auto">
                    {ligasFiltradas.map((league) => (
                      <li
                        key={league.id_league}
                        onClick={() => handleAdd(league)}
                        className="px-4 py-2 cursor-pointer hover:bg-[#EDE6F6]"
                      >
                        {league.name}
                      </li>
                    ))}
                  </ul>
                )}

                {!loading && ligasFiltradas.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-400">
                    Nenhuma liga encontrada
                  </div>
                )}

              </div>
            )}
          </div>

          {/* MOEDA */}

          <div>
            <span className="text-sm text-[#AFAFB2]">Moeda</span>

            <select
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value)}
              className="w-full border rounded-full px-4 py-3 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} — {c.full}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-[#AFAFB2]">Ano</span>

            <select
              value={selectedYear}
              onChange={(e) => onChangeYear(Number(e.target.value))}
              className="w-full border rounded-full px-4 py-3 text-sm"
            >
              {availableYears?.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FAVORITO */}

        <div className="flex items-center">
          <FavoriteButton />
        </div>
      </div>
    </div>
  );
}