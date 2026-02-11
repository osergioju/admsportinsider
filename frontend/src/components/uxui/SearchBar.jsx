import { useState, useRef, useEffect } from "react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
// Troca por chamada à API real futuramente
const MOCK_DATA = {
  ligas: [
    { id: "l1", name: "Brasileirão Série A", country: "Brasil", flag: "🇧🇷", logo: "⚽" },
    { id: "l2", name: "Brasileirão Série B", country: "Brasil", flag: "🇧🇷", logo: "⚽" },
    { id: "l3", name: "Liga Argentina", country: "Argentina", flag: "🇦🇷", logo: "⚽" },
    { id: "l4", name: "Premier League", country: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "⚽" },
    { id: "l5", name: "La Liga", country: "Espanha", flag: "🇪🇸", logo: "⚽" },
    { id: "l6", name: "Bundesliga", country: "Alemanha", flag: "🇩🇪", logo: "⚽" },
    { id: "l7", name: "Serie A", country: "Itália", flag: "🇮🇹", logo: "⚽" },
    { id: "l8", name: "Ligue 1", country: "França", flag: "🇫🇷", logo: "⚽" },
  ],
  clubes: [
    { id: "c1", name: "Arminia Bielefeld", country: "Alemanha", flag: "🇩🇪", initials: "AB" },
    { id: "c2", name: "Aston Villa", country: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", initials: "AV" },
    { id: "c3", name: "Atlético Mineiro", country: "Brasil", flag: "🇧🇷", initials: "AT" },
    { id: "c4", name: "Ajax", country: "Holanda", flag: "🇳🇱", initials: "AJ" },
    { id: "c5", name: "Arsenal", country: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", initials: "AR" },
    { id: "c6", name: "Athletico Paranaense", country: "Brasil", flag: "🇧🇷", initials: "AP" },
    { id: "c7", name: "América Mineiro", country: "Brasil", flag: "🇧🇷", initials: "AM" },
    { id: "c8", name: "Bayer Leverkusen", country: "Alemanha", flag: "🇩🇪", initials: "BL" },
    { id: "c9", name: "Barcelona", country: "Espanha", flag: "🇪🇸", initials: "FC" },
    { id: "c10", name: "Borussia Dortmund", country: "Alemanha", flag: "🇩🇪", initials: "BD" },
    { id: "c11", name: "Cruzeiro", country: "Brasil", flag: "🇧🇷", initials: "CR" },
    { id: "c12", name: "Corinthians", country: "Brasil", flag: "🇧🇷", initials: "CO" },
    { id: "c13", name: "Chelsea", country: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", initials: "CH" },
  ],
};

// ─── Search Function (swap with API call) ────────────────────────────────────
function searchData(query) {
  if (!query.trim()) return null;
  const q = query.toLowerCase();
  const ligas = MOCK_DATA.ligas.filter(
    (l) => l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
  );
  const clubes = MOCK_DATA.clubes.filter(
    (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  );
  return { ligas, clubes };
}

// ─── Avatar Component ────────────────────────────────────────────────────────
function ClubAvatar({ initials }) {
  const colors = [
    ["#7F33D9", "#5A1FA3"],
    ["#E8433A", "#A82D26"],
    ["#2D7DD2", "#1A5AA0"],
    ["#2EAA6A", "#1B7A4A"],
    ["#E8943A", "#B56A20"],
  ];
  const idx = initials.charCodeAt(0) % colors.length;
  const [from, to] = colors[idx];
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        width: 34,
        height: 34,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        fontFamily: "'DM Mono', monospace",
        letterSpacing: 0.5,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Liga Avatar ─────────────────────────────────────────────────────────────
function LigaAvatar({ flag }) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "linear-gradient(135deg, #1a1a2e, #2d2d4e)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        flexShrink: 0,
        border: "1px solid rgba(127, 51, 217, 0.3)",
      }}
    >
      {flag}
    </div>
  );
}

// ─── Result Item ─────────────────────────────────────────────────────────────
function ResultItem({ item, type, onSelect, isHighlighted }) {
  return (
    <button
      onClick={() => onSelect(item)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 14px",
        background: isHighlighted ? "rgba(127, 51, 217, 0.08)" : "transparent",
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
      {type === "clube" ? (
        <ClubAvatar initials={item.initials} />
      ) : (
        <LigaAvatar flag={item.flag} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#1a1a2e",
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "#888",
            fontFamily: "'DM Sans', sans-serif",
            marginTop: 1,
          }}
        >
          {item.country}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: type === "clube" ? "#7F33D9" : "#2D7DD2",
          background: type === "clube" ? "rgba(127, 51, 217, 0.1)" : "rgba(45, 125, 210, 0.1)",
          padding: "3px 7px",
          borderRadius: 20,
          fontFamily: "'DM Mono', monospace",
          flexShrink: 0,
        }}
      >
        {type === "clube" ? "Clube" : "Liga"}
      </div>
    </button>
  );
}

// ─── Category Label ──────────────────────────────────────────────────────────
function CategoryLabel({ children, count }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px 6px",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#aaa",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
      <span
        style={{
          fontSize: 10,
          color: "#bbb",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {count}
      </span>
    </div>
  );
}

// ─── Search Icon ─────────────────────────────────────────────────────────────
function SearchIcon({ focused }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={focused ? "#7F33D9" : "#aaa"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: "stroke 0.2s", flexShrink: 0 }}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─── X Icon ──────────────────────────────────────────────────────────────────
function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Main SearchBar Component ─────────────────────────────────────────────────
export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const isOpen = focused && query.trim().length > 0;
  const hasResults = results && (results.ligas.length > 0 || results.clubes.length > 0);
  const isEmpty = results && results.ligas.length === 0 && results.clubes.length === 0;

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
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // 🔌 SWAP THIS: await fetch(`/api/search?q=${query}`)
      const data = searchData(query);
      setResults(data);
      setLoading(false);
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(item) {
    console.log("Selecionado:", item);
    setQuery(item.name);
    setFocused(false);
    // 🔌 SWAP THIS: navigate(`/detail/${item.id}`) ou callback prop
  }

  function handleClear() {
    setQuery("");
    setResults(null);
    inputRef.current?.focus();
  }

  const totalResults = results
    ? results.ligas.length + results.clubes.length
    : 0;

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap');

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .search-dot {
          animation: pulse 1.2s ease-in-out infinite;
        }
        .search-dot:nth-child(2) { animation-delay: 0.2s; }
        .search-dot:nth-child(3) { animation-delay: 0.4s; }

        .result-scroll::-webkit-scrollbar { width: 4px; }
        .result-scroll::-webkit-scrollbar-track { background: transparent; }
        .result-scroll::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
      `}</style>

      <div ref={containerRef} style={{ position: "relative", width: "100%", maxWidth: 480, fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Input ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 16px",
            height: 48,
            background: focused ? "#fff" : "#EDEDEF",
            borderRadius: isOpen ? "16px 16px 0 0" : 16,
            border: `1.5px solid ${focused ? "rgba(127, 51, 217, 0.4)" : "transparent"}`,
            boxShadow: focused
              ? "0 0 0 4px rgba(127,51,217,0.08)"
              : "0 1px 3px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease",
          }}
        >
          <SearchIcon focused={focused} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Buscar clubes e ligas…"
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
                  className="search-dot"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#7F33D9",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Clear button */}
          {!loading && query && (
            <button
              onClick={handleClear}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#e8e8ec",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ClearIcon />
            </button>
          )}

          {/* Shortcut hint */}
          {!focused && !query && (
            <kbd
              style={{
                fontSize: 10,
                color: "#bbb",
                background: "#e4e4e8",
                borderRadius: 5,
                padding: "2px 6px",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: 0.3,
                border: "1px solid #d8d8dc",
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
              borderRadius: "0 0 16px 16px",
              border: "1.5px solid rgba(127, 51, 217, 0.4)",
              borderTop: "1px solid #f0f0f4",
              boxShadow: "0 16px 40px rgba(0,0,0,0.12), 0 0 0 4px rgba(127,51,217,0.08)",
              overflow: "hidden",
              zIndex: 1000,
              animation: "slideDown 0.18s ease",
            }}
          >
            {/* Results count bar */}
            {hasResults && (
              <div
                style={{
                  padding: "8px 14px 4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #f5f5f7",
                }}
              >
                <span style={{ fontSize: 11, color: "#bbb", fontFamily: "'DM Mono', monospace" }}>
                  {totalResults} resultado{totalResults !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 10, color: "#ccc", fontFamily: "'DM Mono', monospace" }}>
                  ↵ selecionar
                </span>
              </div>
            )}

            <div
              className="result-scroll"
              style={{ maxHeight: 360, overflowY: "auto", padding: "6px 6px 10px" }}
            >
              {/* Empty state */}
              {isEmpty && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "32px 16px",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 28 }}>🔍</div>
                  <div style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>
                    Nenhum resultado para "{query}"
                  </div>
                  <div style={{ fontSize: 11, color: "#bbb" }}>
                    Tente outro nome de clube ou liga
                  </div>
                </div>
              )}

              {/* Ligas */}
              {results?.ligas.length > 0 && (
                <>
                  <CategoryLabel count={results.ligas.length}>Ligas</CategoryLabel>
                  {results.ligas.map((liga) => (
                    <ResultItem
                      key={liga.id}
                      item={liga}
                      type="liga"
                      onSelect={handleSelect}
                    />
                  ))}
                </>
              )}

              {/* Divisor quando tem os dois */}
              {results?.ligas.length > 0 && results?.clubes.length > 0 && (
                <div style={{ height: 6 }} />
              )}

              {/* Clubes */}
              {results?.clubes.length > 0 && (
                <>
                  <CategoryLabel count={results.clubes.length}>Clubes</CategoryLabel>
                  {results.clubes.map((clube) => (
                    <ResultItem
                      key={clube.id}
                      item={clube}
                      type="clube"
                      onSelect={handleSelect}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "8px 14px",
                borderTop: "1px solid #f5f5f7",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#7F33D9",
                  opacity: 0.5,
                }}
              />
              {/*<span style={{ fontSize: 10, color: "#ccc", fontFamily: "'DM Mono', monospace" }}>
                dados simulados · pronto pra backend
              </span>*/}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
