import { useEffect, useState } from "react";
import { Search, Trash2, Loader2 } from "lucide-react";
import { api } from "../../../services/api";

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";

// Busca de clube por nome (mesmo endpoint do Gerador de Gráficos).
export function ClubSearch({ onPick, scope = "club", placeholder = "Buscar pelo nome..." }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .get("/admin/charts/entities", { params: { scope, q: q.trim() } })
        .then((res) => !cancelled && setResults(res.data.entities || []))
        .catch(() => !cancelled && setResults([]));
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, scope]);

  const shown = q.trim().length < 2 ? [] : results;

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-3.5 text-gray-400" />
      <input
        className={`${inputClass} pl-9`}
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && shown.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {shown.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onPick(c); setQ(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Escolha do escopo do layout da página de clube: padrão (todos) ou layout próprio de um clube.
// `entity` vem de ENTITY_PAGES (clube ou federação): prefixo da zona, escopo da busca e textos.
export default function ClubScopeBar({ entity, zone, exists, overrides, removing, onSelectZone, onRemoveOverride }) {
  const isClubZone = zone.startsWith(entity.zonePrefix);
  const clubId = isClubZone ? Number(zone.slice(entity.zonePrefix.length)) : null;
  const currentName = overrides.find((o) => o.id === clubId)?.name;
  const [choosing, setChoosing] = useState(false); // "Layout próprio" clicado, ainda sem clube escolhido
  const showPicker = isClubZone || choosing;
  const [pickedName, setPickedName] = useState("");

  const seg = (active) =>
    `px-4 py-2 rounded-full text-xs font-bold transition-colors ${active ? "bg-purple-50 text-[#7F33D9] border border-[#7F33D9]" : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"}`;

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => { setChoosing(false); onSelectZone(entity.defaultZone || "default"); }} className={seg(!showPicker)}>
          Padrão para {entity.article === "o" ? "todos os" : "todas as"} {entity.plural}
        </button>
        <button type="button" onClick={() => setChoosing(true)} className={seg(showPicker)}>
          Layout próprio {entity.article === "o" ? "de um" : "de uma"} {entity.singular}
        </button>
      </div>

      {!showPicker ? (
        <p className="text-xs text-gray-500">
          Este layout vale para {entity.article === "o" ? "todos os" : "todas as"} {entity.plural} que não têm layout próprio. Para montar uma página
          diferente para {entity.article === "o" ? "um" : "uma"} {entity.singular} específic{entity.article}, escolha "Layout próprio {entity.article === "o" ? "de um" : "de uma"} {entity.singular}".
        </p>
      ) : null}

      {showPicker && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Escolher {entity.singular}</p>
            <ClubSearch scope={entity.scope} placeholder={`Buscar ${entity.singular} pelo nome...`} onPick={(c) => { setPickedName(c.name); onSelectZone(`${entity.zonePrefix}${c.id}`); }} />
            {isClubZone && (
              <p className="text-xs mt-2 text-gray-600">
                Editando: <b>{currentName || pickedName || `${entity.singular} #${clubId}`}</b> —{" "}
                {exists ? "usando layout próprio." : "ainda usando o padrão (salve para criar o layout próprio; começa como cópia do padrão)."}
              </p>
            )}
            {isClubZone && exists && (
              <button
                type="button"
                onClick={onRemoveOverride}
                disabled={removing}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {removing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Remover layout próprio (volta a usar o padrão)
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              {entity.plural.charAt(0).toUpperCase() + entity.plural.slice(1)} com layout próprio ({overrides.length})
            </p>
            {overrides.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum ainda — {entity.article === "o" ? "todos usam" : "todas usam"} o padrão.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {overrides.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onSelectZone(`${entity.zonePrefix}${o.id}`)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${clubId === o.id ? "bg-purple-50 border-[#7F33D9] text-[#7F33D9]" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
