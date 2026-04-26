import { useTranslation } from "../../../context/TranslationContext";
import { useState, useEffect, useMemo } from "react";
import { api } from "../../../services/api";

const LIMITE_LIGAS = 4;

const CURRENCIES = [
  { value: "BRL", label: "R$", full: "Real (BRL)" },
  { value: "USD", label: "US$", full: "Dólar (USD)" },
  { value: "EUR", label: "€", full: "Euro (EUR)" },
  { value: "RUB", label: "₽", full: "Rublo (RUB)" },
];

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

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest("[data-league-search]")) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!busca) { setLeagues([]); return; }
    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.post("/admin/leagues/search", { name: busca, country });
        setLeagues(data.leagues || []);
      } catch (err) {
        console.error("Erro ao buscar ligas:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [busca, country]);

  const ligasFiltradas = useMemo(
    () => leagues.filter((l) => !ligasSelecionadas.includes(l.id_league)),
    [leagues, ligasSelecionadas]
  );

  function handleAdd(league) {
    if (atLimite) return;
    onAddLeague(league);
    setBusca("");
    setIsOpen(false);
    setLeagues([]);
  }

  const years = availableYears ?? [];

  return (
    <div className="w-full flex flex-wrap items-center gap-2 justify-between mb-2 mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Busca de liga */}
        <div className="relative" data-league-search>
          <input
            type="text"
            value={busca}
            disabled={atLimite}
            onChange={(e) => { setBusca(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder={atLimite ? "Limite atingido" : "Adicionar liga…"}
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
          <span style={{
            position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: "#bbb", fontSize: 14, pointerEvents: "none",
          }}>
            ⌕
          </span>

          {isOpen && busca && (
            <div style={{
              position: "absolute", zIndex: 30, marginTop: 6, width: "100%",
              background: "#fff", border: "1px solid #e8e8e4",
              borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden",
            }}>
              {loading ? (
                <div style={{ padding: "10px 14px", fontSize: 13, color: "#aaa" }}>
                  Buscando ligas...
                </div>
              ) : ligasFiltradas.length > 0 ? (
                <ul style={{ maxHeight: 192, overflowY: "auto", listStyle: "none" }}>
                  {ligasFiltradas.map((l) => (
                    <li
                      key={l.id_league}
                      onClick={() => handleAdd(l)}
                      style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", transition: "background 0.12s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f5f0fc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {l.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ padding: "10px 14px", fontSize: 13, color: "#aaa" }}>
                  Nenhuma liga encontrada
                </div>
              )}
            </div>
          )}
        </div>

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
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label} {c.full}
            </option>
          ))}
        </select>
      </div>

      {/* Pills de ano — seleção única */}
      {years.length > 0 && (
        <div style={{ display: "flex", gap: 4, background: "#f5f4f0", borderRadius: 24, padding: 4 }}>
          {years.map((year) => {
            const active = year === selectedYear;
            return (
              <button
                key={year}
                onClick={() => onChangeYear(year)}
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
      )}
    </div>
  );
}
