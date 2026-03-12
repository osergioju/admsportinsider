import { useState, useEffect, useMemo, useCallback } from "react";
import { Heart } from "lucide-react";
import { api } from "../../../../../services/api";
import { Range } from "react-range";

// ─── Styles ────────────────────────────────────────────────────────────────

const HEART_STYLES = `
  @keyframes cf-burst {
    0%   { transform: translate(-50%, -50%) translateY(0px) scale(0); opacity: 1; }
    60%  { transform: translate(-50%, -50%) translateY(-16px) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) translateY(-20px) scale(0); opacity: 0; }
  }
  @keyframes cf-heartPop {
    0%   { transform: scale(1); }
    30%  { transform: scale(1.45); }
    60%  { transform: scale(0.87); }
    100% { transform: scale(1); }
  }
  @keyframes cf-heartUnpop {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.72); }
    100% { transform: scale(1); }
  }
  @keyframes cf-ripple {
    0%   { transform: scale(0.5); opacity: 0.55; }
    100% { transform: scale(2.6); opacity: 0; }
  }

  .cf-heart-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.18s ease;
    outline: none;
  }
  .cf-heart-btn:hover  { background: rgba(255, 77, 109, 0.08); }
  .cf-heart-btn:active { background: rgba(255, 77, 109, 0.15); }

  .cf-heart-icon {
    transition: color 0.22s ease, fill 0.22s ease, filter 0.22s ease;
    position: relative;
    z-index: 2;
    display: block;
    width: 20px;
    height: 20px;
  }
  .cf-heart-icon.fav {
    color: #FF4D6D;
    fill: #FF4D6D;
    filter: drop-shadow(0 0 4px rgba(255, 77, 109, 0.48));
  }
  .cf-heart-icon.unfav {
    color: #C8C8C8;
    fill: transparent;
  }
  .cf-heart-icon.animating.fav   { animation: cf-heartPop   0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards; }
  .cf-heart-icon.animating.unfav { animation: cf-heartUnpop  0.3s ease-out forwards; }

  .cf-ripple {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid #FF4D6D;
    animation: cf-ripple 0.48s ease-out forwards;
    pointer-events: none;
    z-index: 1;
  }

  .cf-heart-tooltip {
    position: absolute;
    bottom: calc(100% + 7px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background: #1a1a1a;
    color: #fff;
    font-size: 11px;
    white-space: nowrap;
    padding: 3px 8px;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.14s ease, transform 0.14s ease;
    z-index: 30;
  }
  .cf-heart-btn:hover .cf-heart-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`;

// ─── Hook ──────────────────────────────────────────────────────────────────

function useFavorite(initialState = false) {
  const [isFavorited, setIsFavorited]   = useState(initialState);
  const [isAnimating, setIsAnimating]   = useState(false);
  const [showBurst,   setShowBurst]     = useState(false);

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

// ─── FavoriteButton ────────────────────────────────────────────────────────

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function FavoriteButton() {
  const { isFavorited, isAnimating, showBurst, toggle } = useFavorite();

  return (
    <>
      <style>{HEART_STYLES}</style>

      <button
        className="cf-heart-btn"
        onClick={toggle}
        aria-label={isFavorited ? "Remover dos favoritos" : "Favoritar gráfico"}
        aria-pressed={isFavorited}
      >
        {/* Ripple */}
        {isAnimating && isFavorited && <span className="cf-ripple" />}

        {/* Burst de partículas */}
        {showBurst && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
            {BURST_ANGLES.map((angle, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  width: 5, height: 5,
                  borderRadius: "50%",
                  backgroundColor: i % 2 === 0 ? "#FF4D6D" : "#FFCCD5",
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-14px) scale(0)`,
                  animation: "cf-burst 0.55s ease-out forwards",
                  animationDelay: `${i * 0.025}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Ícone */}
        <Heart
          size={17}
          strokeWidth={2}
          className={`cf-heart-icon ${isFavorited ? "fav" : "unfav"} ${isAnimating ? "animating" : ""}`}
        />

        {/* Tooltip */}
        <span className="cf-heart-tooltip">
          {isFavorited ? "Remover favorito" : "Favoritar"}
        </span>
      </button>
    </>
  );
}

// ─── Constantes ────────────────────────────────────────────────────────────

const LIMITE_CLUBES = 4;

const CURRENCIES = [
  { value: "BRL", label: "R$", full: "Real (BRL)"      },
  { value: "USD", label: "US$", full: "Dólar (USD)"    },
  { value: "EUR", label: "€",   full: "Euro (EUR)"     },
  { value: "RUB", label: "₽",   full: "Rublo (RUB)"   },
];

// ─── ChartFilter ───────────────────────────────────────────────────────────

export default function ChartFilter({
  clubesSelecionados,
  onAddClub,
  country = null,
  currency,
  onChangeCurrency,
  startYear,
  endYear,
  onChangeStartYear,
  onChangeEndYear,
  availableYears
}) {
  const [busca,   setBusca]   = useState("");
  const [isOpen,  setIsOpen]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [clubs,   setClubs]   = useState([]);
  
  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest("[data-club-search]")) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!busca) {
      setClubs([]);
      return;
    }

    const controller = new AbortController();

    async function search() {
      try {
        setLoading(true);
        const { data } = await api.post(
          "/admin/clubs/search",
          { name: busca, country: country || null },
          { signal: controller.signal }
        );
        setClubs(data.clubs || []);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Erro ao buscar clubes:", err);
      } finally {
        setLoading(false);
      }
    }

    search();
    return () => controller.abort();
  }, [busca, country]);

  const clubesFiltrados = useMemo(
    () => clubs.filter((c) => !clubesSelecionados.includes(c.id_club)),
    [clubs, clubesSelecionados]
  );

  function handleAdd(clube) {
    if (clubesSelecionados.length >= LIMITE_CLUBES) return;
    onAddClub(clube);
    setBusca("");
    setIsOpen(false);
    setClubs([]);
  }

  const atLimite = clubesSelecionados.length >= LIMITE_CLUBES;

  return (
    <div className="w-full mb-2 z-20">
      {/* ── Linha única: busca | moeda | favorito ── */}
      <div className="-mt-12 justify-between flex flex-wrap items-end gap-4 lg:gap-6">
        {/* Período */}
          <div className="flex flex-col w-1/2 ml-auto">
            {availableYears && availableYears.length > 0 && (
              <div className="flex flex-col gap-2">
                {/* Labels dos anos selecionados */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#7f34d9] bg-[#7f34d9]/10 px-2 py-0.5 rounded-full">
                    {startYear}
                  </span>
                  <span className="text-xs font-semibold text-[#7f34d9] bg-[#7f34d9]/10 px-2 py-0.5 rounded-full">
                    {endYear}
                  </span>
                </div>

                {/* Slider */}
                <div className="px-1 py-2">
                  <Range
                    step={1}
                    min={availableYears[0]}
                    max={availableYears[availableYears.length - 1]}
                    values={[
                      startYear ?? availableYears[0],
                      endYear ?? availableYears[availableYears.length - 1],
                    ]}
                    onChange={(values) => {
                      onChangeStartYear(values[0]);
                      onChangeEndYear(values[1]);
                    }}
                    renderTrack={({ props, children }) => (
                      <div
                        {...props}
                        style={{
                          ...props.style,
                          background: `linear-gradient(
                            to right,
                            #e5e7eb ${((( startYear ?? availableYears[0]) - availableYears[0]) / (availableYears[availableYears.length - 1] - availableYears[0])) * 100}%,
                            #7f34d9 ${(((startYear ?? availableYears[0]) - availableYears[0]) / (availableYears[availableYears.length - 1] - availableYears[0])) * 100}%,
                            #7f34d9 ${(((endYear ?? availableYears[availableYears.length - 1]) - availableYears[0]) / (availableYears[availableYears.length - 1] - availableYears[0])) * 100}%,
                            #e5e7eb ${(((endYear ?? availableYears[availableYears.length - 1]) - availableYears[0]) / (availableYears[availableYears.length - 1] - availableYears[0])) * 100}%
                          )`,
                        }}
                        className="h-[3px] w-full rounded-full"
                      >
                        {children}
                      </div>
                    )}
                    renderThumb={({ props, isDragged }) => (
                      <div
                        {...props}
                        style={{ ...props.style }}
                        className="h-4 w-4 cursor-pointer outline-none"
                      >
                        {/* O scale fica no filho, não no thumb raiz */}
                        <div
                          className={`
                            h-4 w-4 rounded-full border-2 border-white
                            transition-all duration-150
                            ${isDragged
                              ? "bg-[#6a26c0] scale-125 shadow-[0_0_0_4px_rgba(127,52,217,0.2)]"
                              : "bg-[#7f34d9] hover:scale-110 hover:shadow-[0_0_0_3px_rgba(127,52,217,0.15)]"
                            }
                          `}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        <div className="grid grid-cols-2 items-end gap-0 lg:gap-6">
          {/* Busca de clube */}
          <div className="relative" data-club-search>
            <span className="inline-block font-light text-[#AFAFB2] text-sm mb-2">
              Comparar clubes{" "}
              <span className="text-xs">
                ({clubesSelecionados.length}/{LIMITE_CLUBES})
              </span>
            </span>

            <input
              type="text"
              value={busca}
              disabled={atLimite}
              onChange={(e) => { setBusca(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              placeholder={atLimite ? "Limite atingido" : "Digite o nome do clube"}
              className={`w-full border rounded-full px-4 py-3 font-light text-sm focus:outline-none focus:ring-2
                ${atLimite
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                  : "focus:ring-[#7f34d9] border-gray-300"
                }`}
            />

            {/* Dropdown */}
            {isOpen && busca && (
              <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {loading ? (
                  <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-[#7f34d9] rounded-full animate-spin" />
                    Buscando clubes...
                  </div>
                ) : clubesFiltrados.length > 0 ? (
                  <ul className="max-h-48 overflow-auto">
                    {clubesFiltrados.map((clube) => (
                      <li
                        key={clube.id_club}
                        onClick={() => handleAdd(clube)}
                        className="px-4 py-2.5 text-sm cursor-pointer hover:bg-[#EDE6F6] transition-colors"
                      >
                        {clube.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400">
                    Nenhum clube encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seletor de moeda */}
          <div className="flex flex-col">
            <span className="font-light text-[#AFAFB2] text-sm mb-2">Moeda</span>
            <select
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-[#7f34d9] bg-white cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} — {c.full}
                </option>
              ))}
            </select>
          </div>

          

        </div>

        {/* Favorito — alinhado à base dos inputs */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-[46px]">
            <FavoriteButton className="w-[46px] h-[46px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
