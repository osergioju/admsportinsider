import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ChevronDown, X } from "lucide-react";

/**
 * CountryCombobox
 *
 * Props:
 *   options   – array de world-countries (cca2, name.common)
 *   value     – { codigo, flag, value } | null
 *   onChange  – (country | null) => void
 *   placeholder – string
 */
export default function CountryCombobox({
  options = [],
  value,
  onChange,
  placeholder = "Buscar país...",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const sorted = [...options].sort((a, b) =>
    a.name.common.localeCompare(b.name.common, "pt", { sensitivity: "base" })
  );

  const filtered = query.trim()
    ? sorted.filter((o) =>
        o.name.common.toLowerCase().includes(query.toLowerCase())
      )
    : sorted;

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setActiveIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = useCallback(
    (option) => {
      onChange({
        codigo: option.cca2,
        flag: `https://flagcdn.com/w640/${option.cca2.toLowerCase()}.png`,
        value: option.name.common,
      });
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
    },
    [onChange]
  );

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
  };

  // Scroll item ativo para a vista
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex];
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown") handleOpen();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      {/* Trigger / selected display */}
      <button
        type="button"
        onClick={open ? () => { setOpen(false); setQuery(""); } : handleOpen}
        className={`w-full flex items-center gap-3 px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none ${
          open
            ? "border-[#7F33D9] ring-1 ring-[#7F33D9]"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {value ? (
          <>
            <img
              src={value.flag}
              alt={value.value}
              className="w-6 h-4 object-cover rounded shadow-sm flex-shrink-0"
            />
            <span className="flex-1 text-left font-medium text-gray-900 truncate">
              {value.value}
            </span>
          </>
        ) : (
          <>
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-left text-gray-400">{placeholder}</span>
          </>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                placeholder="Digitar para filtrar..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setActiveIndex(-1); inputRef.current?.focus(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <ul
            ref={listRef}
            className="max-h-64 overflow-y-auto py-1 divide-y divide-gray-50"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                Nenhum país encontrado
              </li>
            ) : (
              filtered.map((option, idx) => {
                const flagUrl = `https://flagcdn.com/w40/${option.cca2.toLowerCase()}.png`;
                const isActive = idx === activeIndex;
                const isSelected = value?.codigo === option.cca2;
                return (
                  <li
                    key={option.cca2}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-sm ${
                      isActive ? "bg-purple-50" : "hover:bg-gray-50"
                    } ${isSelected ? "text-[#7F33D9] font-semibold" : "text-gray-800"}`}
                  >
                    <img
                      src={flagUrl}
                      alt={option.name.common}
                      className="w-6 h-4 object-cover rounded shadow-sm flex-shrink-0"
                      loading="lazy"
                    />
                    <span className="truncate">{option.name.common}</span>
                    {isSelected && (
                      <span className="ml-auto text-[#7F33D9]">✓</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer count */}
          {query && filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 bg-gray-50/50">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
