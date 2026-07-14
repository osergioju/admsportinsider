import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { clubUrl, clubLogo } from "../../utils/clubUrl";
import { useTranslation } from "../../context/TranslationContext";


// ─── Avatar Component ──────────────────────────────────────────────────────────
function ClubAvatar({ name, crestUrl }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = [
    ["#7F33D9", "#5A1FA3"],
    ["#E8433A", "#A82D26"],
    ["#2D7DD2", "#1A5AA0"],
    ["#2EAA6A", "#1B7A4A"],
    ["#E8943A", "#B56A20"],
  ];
  const idx = initials.charCodeAt(0) % colors.length;
  const [from, to] = colors[idx];

  if (crestUrl) {
    return (
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          overflow: "hidden",
          flexShrink: 0,
          background: "#f3f3f3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={clubLogo(crestUrl)}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement.style.background = `linear-gradient(135deg, ${from}, ${to})`;
            e.currentTarget.parentElement.innerHTML = `<span style="color:#fff;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif">${initials}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Liga Avatar ───────────────────────────────────────────────────────────────
function LigaAvatar({ logoUrl, name }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (logoUrl) {
    return (
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          overflow: "hidden",
          flexShrink: 0,
          background: "#f3f3f3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={logoUrl.startsWith("http") ? logoUrl : `https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${logoUrl}.webp`}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "linear-gradient(135deg, #f0e6ff, #d4b8f7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#7F33D9",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Player Avatar ─────────────────────────────────────────────────────────────
function PlayerAvatar({ name, photoUrl }) {
  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // 📸 Se tiver foto do jogador
  if (photoUrl) {
    return (
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          background: "#f3f3f3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={photoUrl}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  // 👤 Fallback com iniciais
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #e6f0ff, #b8d4f7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#2D7DD2",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Result Item ───────────────────────────────────────────────────────────────
function ResultItem({ item, type, onSelect, isHighlighted }) {
  // 🧠 Mapeamento de labels
  const typeMap = {
    clube: "Clube",
    liga: "Competição",
    pais: "País",
    jogador: "Jogador",
  };

  const label = typeMap[type] || "";

  // 🔄 Normalização dos dados
  const name = item.name || item.full_name || "";
  const country = item.country_name || item.country || "";
  const crestUrl = item.crest_url || null;
  const flagUrl = item.flag_url || null;
  const logoUrl = item.logo_url || item.slug || null;

  // 🧩 Avatar por tipo
  const avatarMap = {
    clube: <ClubAvatar name={name} crestUrl={crestUrl} />,
    liga: <LigaAvatar name={name} logoUrl={logoUrl} />,
    pais: <LigaAvatar name={name} logoUrl={flagUrl} />,
    jogador: <PlayerAvatar name={name} />, // 👉 você precisa ter esse componente
  };

  return (
    <button
      onClick={() => onSelect(item)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 14px",
        background: isHighlighted
          ? "rgba(127, 51, 217, 0.08)"
          : "transparent",
        border: "none",
        cursor: "pointer",
        borderRadius: 10,
        transition: "background 0.15s",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(127, 51, 217, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isHighlighted
          ? "rgba(127, 51, 217, 0.08)"
          : "transparent";
      }}
    >
      {/* 🎯 Avatar */}
      {avatarMap[type] || null}

      {/* 📄 Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1a1a2e",
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>

        {/* 🌍 País (se existir) */}
        {country && (
          <div
            style={{
              fontSize: 12,
              color: "#888",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 1,
            }}
          >
            {flagUrl && (
              <img
                src={flagUrl}
                alt={country}
                style={{
                  width: 14,
                  height: 10,
                  objectFit: "cover",
                  borderRadius: 2,
                }}
              />
            )}
            {country}
          </div>
        )}
      </div>

      {/* 🏷️ Label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: label ? "#7F33D9" : "#2D7DD2",
          background: label
            ? "rgba(127,51,217,0.08)"
            : "rgba(45,125,210,0.08)",
          padding: "2px 8px",
          borderRadius: 20,
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Category Label ────────────────────────────────────────────────────────────
function CategoryLabel({ children, count }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 14px 4px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#aaa",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {children}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "#ccc",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {count}
      </span>
    </div>
  );
}

// ─── Search Icon ───────────────────────────────────────────────────────────────
function SearchIcon({ focused }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={focused ? "#7F33D9" : "#aaa"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, transition: "stroke 0.2s" }}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─── X Icon ────────────────────────────────────────────────────────────────────
function ClearIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#aaa"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Main SearchBar Component ──────────────────────────────────────────────────
export default function SearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const isOpen = focused && (query || "").trim().length > 0;
  const hasResults =
    results && (results.ligas.length > 0 || results.clubes.length > 0 || results.paises.length > 0 || results.jogadores.length > 0);
  const isEmpty =
    results && results.ligas.length === 0 && results.clubes.length === 0 && results.paises.length === 0 && results.jogadores.length === 0;

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce + busca
  useEffect(() => {
    if (!query || !query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        // Busca paralela: clubes + ligas + países (apenas itens ativos;
        // jogadores fora da busca por enquanto)
        const [clubsRes, leaguesRes, countryRes] = await Promise.allSettled([
          api.post("/dashboard/clubs/search?page=1&limit=10", { name: query }),
          api.post("/dashboard/leagues/search?page=1&limit=5", { name: query }),
          api.post("/dashboard/countries/search?page=1&limit=5", { name: query }),
        ]);

        const clubes =
          clubsRes.status === "fulfilled"
            ? clubsRes.value.data.clubs || []
            : [];

        const ligas =
          leaguesRes.status === "fulfilled"
            ? leaguesRes.value.data.leagues || []
            : [];

        const paises =
          countryRes.status === "fulfilled"
            ? countryRes.value.data.countries || []
            : [];

        const jogadores = [];

        setResults({ ligas, clubes, paises, jogadores });
      } catch (error) {
        console.error("Erro na busca:", error);
        setResults({ ligas: [], clubes: [], paises: [], jogadores: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(item) {
    setQuery(item.name);
    setFocused(false);

    if (item.id_league !== undefined) {
      navigate(`/dashboard/competitions/${item.slug || item.id_league}`);
    } else if (item.id_club !== undefined) {
      navigate(clubUrl(item.id_club, item.slug));
    } else if (item.id_country !== undefined) {
      navigate(`/dashboard/countries/${item.id_country}`);
    } else if (item.id_player !== undefined) {
      navigate(`/dashboard/players/${item.id_player}`);
    }
  }

  function handleClear() {
    setQuery("");
    setResults(null);
    inputRef.current?.focus();
  }

  const totalResults = results
    ? results.ligas.length + results.clubes.length + results.paises.length + results.jogadores.length
    : 0;

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        ref={containerRef}
        style={{ position: "relative", width: "100%", maxWidth: 480 }}
      >
        {/* ── Input ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "#fff",
            borderRadius: isOpen ? "14px 14px 0 0" : 14,
            border: `1.5px solid ${focused ? "#7F33D9" : "#e8e8e8"}`,
            boxShadow: focused
              ? "0 0 0 3px rgba(127,51,217,0.10)"
              : "0 1px 4px rgba(0,0,0,0.06)",
            transition: "all 0.2s",
          }}
        >
          <SearchIcon focused={focused} />

          <input
            ref={inputRef}
            value={query || ""}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={t("ui.search_placeholder", "Buscar clubes, competições, jogadores, países...")}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              fontWeight: 500,
              color: "#1a1a2e",
              fontFamily: "'DM Sans', sans-serif",
              caretColor: "#7F33D9",
            }}
          />

          {/* Loading dots */}
          {loading && (
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#7F33D9",
                    opacity: 0.4,
                    animation: `bounce 1s ${i * 0.15}s infinite`,
                  }}
                />
              ))}
              <style>{`@keyframes bounce{0%,80%,100%{transform:scale(1)}40%{transform:scale(1.5);opacity:0.8}}`}</style>
            </div>
          )}

          {/* Clear button */}
          {!loading && query && (
            <button
              onClick={handleClear}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                alignItems: "center",
                borderRadius: 6,
              }}
            >
              <ClearIcon />
            </button>
          )}

          {/* Shortcut hint */}
          {!focused && !query && (
            <kbd
              style={{
                fontSize: 11,
                color: "#bbb",
                background: "#f5f5f5",
                border: "1px solid #e0e0e0",
                borderRadius: 5,
                padding: "1px 6px",
                fontFamily: "monospace",
              }}
            >
              /
            </kbd>
          )}
        </div>

        {/* ── Dropdown ── */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1.5px solid #7F33D9",
              borderTop: "1px solid #f0e6ff",
              borderRadius: "0 0 14px 14px",
              boxShadow: "0 8px 24px rgba(127,51,217,0.12)",
              zIndex: 1000,
              overflow: "hidden",
              maxHeight: 420,
              overflowY: "auto",
            }}
          >
            {/* Results count bar */}
            {hasResults && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 14px 6px",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#888",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {t("search.results_count", "{count} resultados").replace("{count}", totalResults)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#bbb",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  ↵ {t("search.select_hint", "selecionar")}
                </span>
              </div>
            )}

            {/* Empty state */}
            {isEmpty && !loading && (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#333",
                    fontFamily: "'DM Sans', sans-serif",
                    marginBottom: 4,
                  }}
                >
                  Nenhum resultado para &ldquo;{query}&rdquo;
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#aaa",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Tente outro nome de clube ou competição
                </div>
              </div>
            )}

            {/* Ligas */}
            {results?.ligas.length > 0 && (
              <>
                <CategoryLabel count={results.ligas.length}>Competições</CategoryLabel>
                {results.ligas.map((liga) => (
                  <ResultItem
                    key={`liga-${liga.id_league}`}
                    item={liga}
                    type="liga"
                    onSelect={handleSelect}
                    isHighlighted={false}
                  />
                ))}
              </>
            )}

            {/* Divider */}
            {results?.ligas.length > 0 && results?.clubes.length > 0 && (
              <div
                style={{
                  height: 1,
                  background: "#f5f5f5",
                  margin: "4px 14px",
                }}
              />
            )}

            {/* Clubes */}
            {results?.clubes.length > 0 && (
              <>
                <CategoryLabel count={results.clubes.length}>Clubes</CategoryLabel>
                {results.clubes.map((clube) => (
                  <ResultItem
                    key={`clube-${clube.id_club}`}
                    item={clube}
                    type="clube"
                    onSelect={handleSelect}
                    isHighlighted={false}
                  />
                ))}
              </>
            )}

            {/* Divider */}
            {results?.clubes.length > 0 && results?.clubes.length > 0 && (
              <div
                style={{
                  height: 1,
                  background: "#f5f5f5",
                  margin: "4px 14px",
                }}
              />
            )}

            {/* Países */}
            {results?.paises.length > 0 && (
              <>
                <CategoryLabel count={results.paises.length}>Países</CategoryLabel>
                {results.paises.map((pais) => (
                  <ResultItem
                    key={`country-${pais.id_country}`}
                    item={pais}
                    type="pais"
                    onSelect={handleSelect}
                    isHighlighted={false}
                  />
                ))}
              </>
            )}

            {/* Divider */}
            {results?.paises.length > 0 && results?.paises.length > 0 && (
              <div
                style={{
                  height: 1,
                  background: "#f5f5f5",
                  margin: "4px 14px",
                }}
              />
            )}

            {/* Jogadores */}
            {results?.jogadores.length > 0 && (
              <>
                <CategoryLabel count={results.jogadores.length}>Jogadores</CategoryLabel>
                {results.jogadores.map((jogador) => (
                  <ResultItem
                    key={`jogador-${jogador.id_player}`}
                    item={jogador}
                    type="jogador"
                    onSelect={handleSelect}
                    isHighlighted={false}
                  />
                ))}
              </>
            )}



            {/* Footer */}
            <div
              style={{
                padding: "8px 14px",
                borderTop: "1px solid #f5f5f5",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#ccc",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                pro · sportinsider
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
