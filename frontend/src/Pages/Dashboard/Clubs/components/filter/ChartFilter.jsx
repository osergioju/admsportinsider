import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../../services/api";
import { useTranslation } from "../../../../../context/TranslationContext";

// ─── Constantes ────────────────────────────────────────────────────────────

const LIMITE_CLUBES = 4;

const yearSelectStyle = {
  fontFamily: "inherit",
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 20,
  border: "1px solid #e0dfd9",
  background: "#fff",
  color: "#333",
  cursor: "pointer",
  outline: "none",
};

// ─── ChartFilter ───────────────────────────────────────────────────────────

export default function ChartFilter({
  clubesSelecionados,
  onAddClub,
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
  yearSelectionMode = "multiple", // "single" | "multiple"
}) {
  const { t } = useTranslation();
  const [busca, setBusca] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState([]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest("[data-club-search]")) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Busca de clubes com debounce via AbortController
  useEffect(() => {
    if (!busca) { setClubs([]); return; }
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
        if (err.name !== "AbortError" && err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("Erro ao buscar clubes:", err);
        }
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

  const years = availableYears ?? [];

  const isSingle = yearSelectionMode === "single";

  const selectedYear = selectedYearsProp?.slice(-1)[0] ?? endYear ?? years[years.length - 1];

  function handleSingleYearChange(year) {
    onChangeSelectedYears?.([year]);
    onChangeStartYear?.(year);
    onChangeEndYear?.(year);
  }

  function handleStartYearChange(year) {
    onChangeStartYear?.(Math.min(year, endYear ?? year));
  }

  function handleEndYearChange(year) {
    onChangeEndYear?.(Math.max(year, startYear ?? year));
  }

  return (
    <div className="w-full flex items-start flex-wrap gap-2 justify-between mb-2 z-20 mt-4">
      {/* ── Linha principal ── */}
      <div className="xl:w-1/2w-full flex flex-wrap items-center gap-3">

        {/* Busca + Moeda */}
        <div className="flex items-center gap-2">

          {/* Busca de clube */}
          <div className="relative w-1/2" data-club-search>
            <input
              type="text"
              value={busca}
              disabled={atLimite}
              onChange={(e) => { setBusca(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              className="w-full"
              placeholder={atLimite ? t("clubs.limit_reached", "Limite atingido") : t("clubs.compare_placeholder", "Comparar clube…")}
              style={{
                fontSize: 13,
                padding: "7px 12px 7px 30px",
                borderRadius: 24,
                border: "1px solid #e8e8e4",
                background: atLimite ? "#fafaf8" : "#fafaf8",
                color: atLimite ? "#bbb" : "#333",
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
                    {t("clubs.searching", "Buscando clubes...")}
                  </div>
                ) : clubesFiltrados.length > 0 ? (
                  <ul style={{ maxHeight: 192, overflowY: "auto", listStyle: "none" }}>
                    {clubesFiltrados.map((clube) => (
                      <li
                        key={clube.id_club}
                        onClick={() => handleAdd(clube)}
                        style={{
                          padding: "10px 14px",
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f0fc"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {clube.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: "10px 14px", fontSize: 13, color: "#aaa" }}>
                    {t("clubs.not_found", "Nenhum clube encontrado")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seletor de moeda */}
          <select
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value)}
            className="w-1/2"
            style={{
              fontFamily: "inherit",
              fontSize: 13,
              padding: "7px 12px 7px 30px",
              borderRadius: 24,
              border: "1px solid #e8e8e4",
              background: atLimite ? "#fafaf8" : "#fafaf8",
              color: atLimite ? "#bbb" : "#333",
              outline: "none",
              cursor: atLimite ? "not-allowed" : "text",
            }}
          >
            {currencies.length > 0
              ? currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))
              : <>
                <option value="BRL">R$ BRL</option>
                <option value="USD">US$ USD</option>
                <option value="EUR">€ EUR</option>
              </>
            }
          </select>
        </div>
      </div>

      {/* ── Seletor de ano/intervalo ── */}
      {years.length > 0 && (
        <div className="xl:w-1/2w-full flex items-center flex-wrap gap-2">
          {isSingle ? (
            <select
              value={selectedYear ?? ""}
              onChange={(e) => handleSingleYearChange(Number(e.target.value))}
              style={yearSelectStyle}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          ) : (
            <>
              <span style={{ fontSize: 12, color: "#999" }}>{t("filters.from", "De")}</span>
              <select
                value={startYear ?? years[0]}
                onChange={(e) => handleStartYearChange(Number(e.target.value))}
                style={yearSelectStyle}
              >
                {years.filter((y) => y <= (endYear ?? years[years.length - 1])).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: "#999" }}>{t("filters.to", "até")}</span>
              <select
                value={endYear ?? years[years.length - 1]}
                onChange={(e) => handleEndYearChange(Number(e.target.value))}
                style={yearSelectStyle}
              >
                {years.filter((y) => y >= (startYear ?? years[0])).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {/* spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}