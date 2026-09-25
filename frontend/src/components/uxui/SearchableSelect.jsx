import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, X } from "lucide-react";

/**
 * SearchableSelect — select genérico com busca por digitação.
 * O dropdown usa position:fixed via portal para não ser cortado por overflow.
 *
 * Props:
 *   options     – [{ value, label, image? }]
 *   value       – string | number (o value selecionado)
 *   onChange    – (value) => void
 *   placeholder – string
 *   disabled    – boolean
 *   imageClass  – string (classe CSS da imagem na opção e no trigger; default landscape p/ bandeiras)
 *   grouped     – [{ groupLabel, groupImage?, options: [{value, label, image?}] }]
 *                 Se fornecido, ignora `options` e usa grupos.
 */
export default function SearchableSelect({
  options = [],
  grouped,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const triggerRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Calcula posição do dropdown relativo ao trigger
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropHeight = Math.min(320, Math.max(spaceBelow, spaceAbove) - 8);

    const openDown = spaceBelow >= 160 || spaceBelow >= spaceAbove;

    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      maxHeight: dropHeight,
      ...(openDown
        ? { top: rect.bottom + 4 }
        : { bottom: window.innerHeight - rect.top + 4 }),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        !e.target.closest("[data-searchable-dropdown]")
      ) {
        setOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Flatten para busca e navegação por teclado
  const allOptions = grouped ? grouped.flatMap(g => g.options) : options;

  const filterFn = (opt) => opt.label.toLowerCase().includes(query.toLowerCase());

  const filteredFlat = query.trim() ? allOptions.filter(filterFn) : allOptions;

  const filteredGrouped = grouped
    ? grouped
      .map(g => ({ ...g, options: query.trim() ? g.options.filter(filterFn) : g.options }))
      .filter(g => g.options.length > 0)
    : null;

  const selectedOption = allOptions.find(o => String(o.value) === String(value));

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setActiveIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  // Scroll item ativo
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown") handleOpen();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filteredFlat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredFlat[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
  };

  const getImage = (opt) => {
    if (opt.slug) return `https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_${opt.slug}.webp`;
    return opt.image || null;
  };

  let globalIdx = -1;

  const renderOption = (opt) => {
    globalIdx++;
    const idx = globalIdx;
    const isActive = idx === activeIndex;
    const isSelected = String(opt.value) === String(value);
    const imgSrc = getImage(opt);

    return (
      <li
        key={opt.value}
        data-option
        onClick={() => handleSelect(opt)}
        onMouseEnter={() => setActiveIndex(idx)}
        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${isActive ? "bg-purple-50" : "hover:bg-gray-50"
          } ${isSelected ? "text-[#7F33D9] font-semibold" : "text-gray-800"}`}
      >
        {imgSrc && (
          <div>
            {/* 
            <img
              src={imgSrc}
              alt={opt.label}
              className={imageClass}
              loading="lazy"
            />
            */}
          </div>
        )}
        <span className="truncate">{opt.label}</span>
        {isSelected && <span className="ml-auto text-[#7F33D9] flex-shrink-0">✓</span>}
      </li>
    );
  };

  const dropdown = open && (
    <div
      data-searchable-dropdown
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col"
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
            placeholder="Digitar para filtrar..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setActiveIndex(-1); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ul ref={listRef} className="overflow-y-auto flex-1 py-1">
        {filteredFlat.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-gray-400">
            Nenhum resultado encontrado
          </li>
        ) : filteredGrouped ? (
          filteredGrouped.map(group => (
            <li key={group.groupLabel}>
              <div className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-y border-gray-100 sticky top-0 flex items-center gap-2">
                {group.groupImage && (
                  <div>
                    {/* <img src={group.groupImage} alt="" className="w-5 h-3.5 object-cover rounded shadow-sm flex-shrink-0" loading="lazy" /> */}
                  </div>
                )}
                {group.groupLabel}
              </div>
              <ul>{group.options.map(renderOption)}</ul>
            </li>
          ))
        ) : (
          options
            .filter(filterFn)
            .sort((a, b) => a.label.localeCompare(b.label, "pt", { sensitivity: "base" }))
            .map(renderOption)
        )}
      </ul>

      {query && filteredFlat.length > 0 && (
        <div className="px-4 py-1.5 border-t border-gray-100 text-xs text-gray-400 bg-gray-50/50 shrink-0">
          {filteredFlat.length} resultado{filteredFlat.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? () => { setOpen(false); setQuery(""); } : handleOpen}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-4 py-2.5 bg-white border rounded-xl text-sm transition-all focus:outline-none ${disabled
          ? "opacity-50 cursor-not-allowed border-gray-200"
          : open
            ? "border-[#7F33D9] ring-1 ring-[#7F33D9]"
            : "border-gray-200 hover:border-gray-300"
          }`}
      >
        {selectedOption ? (
          <>
            {getImage(selectedOption) && (
              <div>
                {/* 
                <img
                  src={getImage(selectedOption)}
                  alt={selectedOption.label}
                  className={imageClass}
                />
                */}
              </div>
            )}
            <span className="flex-1 text-left font-medium text-gray-900 truncate">
              {selectedOption.label}
            </span>
          </>
        ) : (
          <>
            <Search size={15} className="text-gray-400 flex-shrink-0" />
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
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={15}
            className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown via portal — escapa de qualquer overflow pai */}
      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
