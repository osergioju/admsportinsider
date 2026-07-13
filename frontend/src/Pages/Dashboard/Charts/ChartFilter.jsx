import { useTranslation } from "../../../context/TranslationContext";
import { useState, useEffect, useMemo } from "react";
import { api } from "../../../services/api";

const LIMITE_LIGAS = 4;

const CURRENCIES = [
  { value: "USD", label: "US$", full: "Dólar (USD)" },
  { value: "BRL", label: "R$", full: "Real (BRL)" },
  { value: "EUR", label: "€", full: "Euro (EUR)" },
  { value: "GBP", label: "£", full: "Libra (GBP)" },
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
  const { t } = useTranslation();
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
            placeholder={atLimite ? t("dashboard.limit_reached", "Limite atingido") : t("dashboard.add_league", "Adicionar competição…")}
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
                  {t("dashboard.searching_leagues", "Buscando competições...")}
                </div>
              ) : ligasFiltradas.length > 0 ? (
                <ul style={{ maxHeight: 192, overflowY: "auto", listStyle: "none" }}>
                  {ligasFiltradas.map((l) => (
                    <li
                      key={l.id_league}
                      onClick={() => handleAdd(l)}
                      style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", transition: "background 0.12s", display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f5f0fc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {l.logo_url && (
                        <img src={l.logo_url} alt="" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />
                      )}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontWeight: 500, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</span>
                        {l.country_name && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#888", marginTop: 1 }}>
                            {l.flag_url && <img src={l.flag_url} alt="" style={{ width: 13, height: 10, objectFit: "cover", borderRadius: 1 }} />}
                            {l.country_name}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ padding: "10px 14px", fontSize: 13, color: "#aaa" }}>
                  {t("dashboard.no_leagues_found", "Nenhuma liga encontrada")}
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

      {/* Seletor de ano — seleção única */}
      {years.length > 0 && (
        <select
          value={selectedYear ?? ""}
          onChange={(e) => onChangeYear(Number(e.target.value))}
          style={{
            fontFamily: "inherit",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 20,
            border: "1px solid #e0dfd9",
            background: "#fff",
            color: "#333",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      )}
    </div>
  );
}
