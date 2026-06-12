import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../../services/api";
import { useTranslation } from "../../../../../context/TranslationContext";

// ─── Constantes ────────────────────────────────────────────────────────────

const LIMITE_LIGAS = 4;

const FALLBACK_CURRENCIES = [
  { code: "USD", symbol: "US$", name: "Dólar (USD)" },
  { code: "BRL", symbol: "R$", name: "Real (BRL)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "GBP", symbol: "£", name: "Libra (GBP)" },
];

// ─── ChartFilter ───────────────────────────────────────────────────────────

export default function ChartFilter({
  ligasSelecionadas,
  onAddLeague,
  country = null,
  currency,
  onChangeCurrency,
  currencies = [],
  startYear,
  endYear,
  onChangeStartYear,
  onChangeEndYear,
  availableYears,
  selectedYears: selectedYearsProp,
  onChangeSelectedYears,
  yearSelectionMode = "multiple",
  showCompare = true,
}) {
  const { t } = useTranslation();
  const currencyList = currencies.length > 0 ? currencies : FALLBACK_CURRENCIES;
  const [busca, setBusca] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState([]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest("[data-league-search]")) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca de ligas com AbortController
  useEffect(() => {
    if (!busca) { setLeagues([]); return; }
    const controller = new AbortController();
    async function search() {
      try {
        setLoading(true);
        const { data } = await api.post(
          "/admin/leagues/search",
          { name: busca, country: country || null },
          { signal: controller.signal }
        );
        setLeagues(data.leagues || []);
      } catch (err) {
        if (err.name !== "AbortError" && err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("Erro ao buscar ligas:", err);
        }
      } finally {
        setLoading(false);
      }
    }
    search();
    return () => controller.abort();
  }, [busca, country]);

  const ligasFiltradas = useMemo(
    () => leagues.filter((l) => !ligasSelecionadas.includes(l.id_league)),
    [leagues, ligasSelecionadas]
  );

  function handleAdd(liga) {
    if (ligasSelecionadas.length >= LIMITE_LIGAS) return;
    onAddLeague(liga);
    setBusca("");
    setIsOpen(false);
    setLeagues([]);
  }

  const atLimite = ligasSelecionadas.length >= LIMITE_LIGAS;

  const years = availableYears ?? [];

  const isSingle = yearSelectionMode === "single";

  const selectedYears = isSingle
    ? (selectedYearsProp?.slice(-1) || [])
    : (
      selectedYearsProp && selectedYearsProp.length > 0
        ? selectedYearsProp
        : years.filter((y) => y >= startYear && y <= endYear)
    );

  function toggleYear(year) {
    if (yearSelectionMode === "single") {
      onChangeSelectedYears?.([year]);
      onChangeStartYear?.(year);
      onChangeEndYear?.(year);
      return;
    }

    if (selectedYears.length <= 2 && selectedYears.includes(year)) return;

    const next = selectedYears.includes(year)
      ? selectedYears.filter((y) => y !== year)
      : [...selectedYears, year].sort((a, b) => a - b);

    onChangeSelectedYears?.(next);
    onChangeStartYear?.(Math.min(...next));
    onChangeEndYear?.(Math.max(...next));
  }

  return (
    <div className="w-full flex items-start flex-wrap gap-2 justify-between mb-2 z-20 mt-4">

      {/* ── Linha principal ── */}
      <div className="xl:w-1/2 w-full flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">

          {/* Busca de liga */}
          {showCompare && (
          <div className="relative" data-league-search>
            <input
              type="text"
              value={busca}
              disabled={atLimite}
              onChange={(e) => { setBusca(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              placeholder={atLimite ? t("leagues.limit_reached", "Limite atingido") : t("leagues.compare_placeholder", "Comparar liga…")}
              style={{
                fontFamily: "inherit",
                fontSize: 13,
                padding: "7px 12px 7px 30px",
                borderRadius: 24,
                border: "1px solid #e8e8e4",
                background: "#fafaf8",
                color: atLimite ? "#bbb" : "#333",
                width: 175,
                outline: "none",
                cursor: atLimite ? "not-allowed" : "text",
              }}
            />
            {/* ícone lupa */}
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#bbb",
                fontSize: 14,
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>

            {/* Dropdown */}
            {isOpen && busca && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 30,
                  marginTop: 6,
                  width: "100%",
                  background: "#fff",
                  border: "1px solid #e8e8e4",
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                }}
              >
                {loading ? (
                  <div style={{ padding: "10px 14px", fontSize: 13, color: "#aaa", display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        border: "2px solid #ddd",
                        borderTopColor: "#7f34d9",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                    {t("leagues.searching", "Buscando ligas...")}
                  </div>
                ) : ligasFiltradas.length > 0 ? (
                  <ul style={{ maxHeight: 192, overflowY: "auto", listStyle: "none" }}>
                    {ligasFiltradas.map((liga) => (
                      <li
                        key={liga.id_league}
                        onClick={() => handleAdd(liga)}
                        style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", transition: "background 0.12s", display: "flex", alignItems: "center", gap: 8 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f0fc"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {liga.logo_url && (
                          <img src={liga.logo_url} alt="" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />
                        )}
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontWeight: 500, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{liga.name}</span>
                          {liga.country_name && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#888", marginTop: 1 }}>
                              {liga.flag_url && <img src={liga.flag_url} alt="" style={{ width: 13, height: 10, objectFit: "cover", borderRadius: 1 }} />}
                              {liga.country_name}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: "10px 14px", fontSize: 13, color: "#aaa" }}>
                    {t("leagues.not_found", "Nenhuma liga encontrada")}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Seletor de moeda */}
          <select
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value)}
            style={{
              fontFamily: "inherit",
              fontSize: 13,
              padding: "7px 10px",
              borderRadius: 24,
              border: "1px solid #e8e8e4",
              background: "#fafaf8",
              color: "#666",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {currencyList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Pills de ano ── */}
      {years.length > 0 && (
        <div className="xl:w-1/2 w-full flex items-center flex-wrap">
          <div />

          <div
            style={{
              display: "flex",
              gap: 4,
              background: "#f5f4f0",
              borderRadius: 24,
              padding: 4,
            }}
          >
            {years.map((year) => {
              const active = selectedYears.includes(year);
              return (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: active ? 500 : 400,
                    padding: "4px 13px",
                    borderRadius: 20,
                    border: active ? "1px solid #e0dfd9" : "none",
                    cursor: "pointer",
                    background: active ? "#fff" : "transparent",
                    color: active ? "#111" : "#999",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}