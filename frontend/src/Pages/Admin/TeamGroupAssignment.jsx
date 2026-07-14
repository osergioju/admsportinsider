import { useState, useEffect, useMemo } from "react";
import { api } from "../../services/api";
import { clubLogo } from "../../utils/clubUrl";
import { X, Loader2, Check, AlertTriangle, Users, Search } from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const GROUP_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function slugify(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function phaseKey(torneioKey, faseNome) {
  return `${torneioKey}_${slugify(faseNome)}`;
}

// Extrai todas as fases do tipo "grupo" de um torneio
function grupoFases(torneio) {
  return (torneio.fases ?? []).filter(f => f.tipo === "grupo");
}

// ─── ClubChip ────────────────────────────────────────────────────────────────

function ClubChip({ club, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 group">
      {club.crest_url
        ? <img src={clubLogo(club.crest_url, club.slug)} className="w-4 h-4 object-contain shrink-0" alt="" />
        : <div className="w-4 h-4 rounded-sm bg-gray-100 shrink-0" />
      }
      <span className="truncate max-w-[120px]">{club.name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

// ─── GroupPanel ───────────────────────────────────────────────────────────────

function GroupPanel({ letter, clubs, allClubs, onAssign, onRemove, color }) {
  return (
    <div className={`flex-1 min-w-0 border rounded-xl p-3 space-y-2 ${color.border} ${color.bg}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${color.text}`}>Grupo {letter}</span>
        <span className="text-[10px] text-gray-400">{clubs.length} time{clubs.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {clubs.map(c => (
          <ClubChip key={c.id_club} club={c} onRemove={() => onRemove(c.id_club)} />
        ))}
        {clubs.length === 0 && (
          <span className="text-[11px] text-gray-300 italic">Nenhum time atribuído</span>
        )}
      </div>
    </div>
  );
}

const GROUP_COLORS = [
  { border: "border-violet-200", bg: "bg-violet-50/60", text: "text-violet-700" },
  { border: "border-blue-200",   bg: "bg-blue-50/60",   text: "text-blue-700"   },
  { border: "border-emerald-200",bg: "bg-emerald-50/60",text: "text-emerald-700" },
  { border: "border-amber-200",  bg: "bg-amber-50/60",  text: "text-amber-700"  },
  { border: "border-rose-200",   bg: "bg-rose-50/60",   text: "text-rose-700"   },
];

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function TeamGroupAssignment({ league, onClose, onSaved }) {
  // Só funciona com ligas que têm torneios configurados
  const availableYears = Object.keys(league.structure_json ?? {})
    .filter(k => /^\d{4}$/.test(k) && (league.structure_json[k]?.torneios?.length ?? 0) > 0)
    .sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? null);
  const [activeTorneioIdx, setActiveTorneioIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState([]);     // todos os clubes da liga/temporada
  const [search, setSearch] = useState("");

  // mapping: phaseKey → { A: [id_club, ...], B: [...], ... }
  const [groupMap, setGroupMap] = useState({});

  const torneios = useMemo(() => {
    if (!selectedYear) return [];
    return league.structure_json[selectedYear]?.torneios ?? [];
  }, [league, selectedYear]);

  const activeTorneio = torneios[activeTorneioIdx] ?? null;

  useEffect(() => {
    if (selectedYear) load();
  }, [selectedYear]);

  useEffect(() => {
    setActiveTorneioIdx(0);
  }, [selectedYear]);

  async function load() {
    setLoading(true);
    setClubs([]);
    setGroupMap({});
    try {
      const { data } = await api.get(
        `/admin/leagues/${league.id_league}/seasons/${selectedYear}/group-clubs`
      );
      setClubs(data.clubs ?? []);

      // Reconstrói groupMap a partir das atribuições existentes
      const map = {};
      for (const a of data.assignments ?? []) {
        if (!map[a.phase_key]) map[a.phase_key] = {};
        if (!map[a.phase_key][a.group_key]) map[a.phase_key][a.group_key] = [];
        map[a.phase_key][a.group_key].push(a.id_club);
      }
      setGroupMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function assignClub(pk, letter, clubId) {
    setGroupMap(prev => {
      const next = { ...prev, [pk]: { ...(prev[pk] ?? {}) } };
      // Remove o clube de qualquer grupo anterior nesta fase
      for (const l of Object.keys(next[pk])) {
        next[pk][l] = (next[pk][l] ?? []).filter(id => id !== clubId);
      }
      // Adiciona no grupo destino
      if (!next[pk][letter]) next[pk][letter] = [];
      next[pk][letter] = [...next[pk][letter], clubId];
      return next;
    });
  }

  function removeClub(pk, letter, clubId) {
    setGroupMap(prev => {
      const next = { ...prev, [pk]: { ...(prev[pk] ?? {}) } };
      next[pk][letter] = (next[pk][letter] ?? []).filter(id => id !== clubId);
      return next;
    });
  }

  function getAssignedInPhase(pk) {
    const groups = groupMap[pk] ?? {};
    return new Set(Object.values(groups).flat());
  }

  async function handleSave() {
    setSaving(true);
    try {
      const assignments = [];
      for (const torneio of torneios) {
        for (const fase of grupoFases(torneio)) {
          const pk = phaseKey(torneio.key, fase.nome);
          const groups = groupMap[pk] ?? {};
          for (const [groupKey, clubIds] of Object.entries(groups)) {
            if (clubIds.length > 0) {
              assignments.push({ phaseKey: pk, groupKey, clubIds });
            }
          }
        }
      }
      await api.post(
        `/admin/leagues/${league.id_league}/seasons/${selectedYear}/group-clubs`,
        { assignments }
      );
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar grupos");
    } finally {
      setSaving(false);
    }
  }

  const filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Atribuir Times aos Grupos</h2>
            <p className="text-xs text-gray-400 mt-0.5">{league.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {availableYears.length > 1 ? (
              <select
                value={selectedYear ?? ""}
                onChange={e => setSelectedYear(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400"
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            ) : (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                {selectedYear ?? "—"}
              </span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {!selectedYear && (
            <div className="m-6 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Nenhuma edição com torneios configurados. Configure a estrutura da liga primeiro.</span>
            </div>
          )}

          {selectedYear && loading && (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Carregando times...</span>
            </div>
          )}

          {selectedYear && !loading && (
            <>
              {/* Tabs de torneios */}
              {torneios.length > 1 && (
                <div className="flex gap-1 px-6 pt-4 shrink-0">
                  {torneios.map((t, i) => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTorneioIdx(i)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        activeTorneioIdx === i
                          ? "bg-[#7F33D9] text-white shadow-lg shadow-purple-500/20"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {t.nome}
                    </button>
                  ))}
                </div>
              )}

              {activeTorneio && grupoFases(activeTorneio).length === 0 && (
                <div className="m-6 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{activeTorneio.nome} não tem nenhuma fase do tipo "Grupos" configurada.</span>
                </div>
              )}

              {activeTorneio && grupoFases(activeTorneio).length > 0 && (
                <div className="flex flex-1 overflow-hidden gap-0">

                  {/* Coluna esquerda: lista de clubes */}
                  <div className="w-56 shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Filtrar times..."
                          className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Times ({clubs.length})
                      </p>
                      {filteredClubs.map(club => {
                        // Verifica se está atribuído em algum grupo desta fase ativa
                        const pk = phaseKey(activeTorneio.key, grupoFases(activeTorneio)[0]?.nome ?? "");
                        const assignedInAnyPhase = grupoFases(activeTorneio).some(f => {
                          const pkey = phaseKey(activeTorneio.key, f.nome);
                          return getAssignedInPhase(pkey).has(club.id_club);
                        });
                        return (
                          <div
                            key={club.id_club}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-default transition-colors ${
                              assignedInAnyPhase
                                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                                : "bg-gray-50 border border-gray-100 text-gray-700 hover:border-gray-200"
                            }`}
                          >
                            {club.crest_url
                              ? <img src={clubLogo(club.crest_url, club.slug)} className="w-4 h-4 object-contain shrink-0" alt="" />
                              : <div className="w-4 h-4 rounded-sm bg-gray-200 shrink-0" />
                            }
                            <span className="truncate flex-1 font-medium">{club.name}</span>
                            {assignedInAnyPhase && <Check size={10} className="shrink-0 text-emerald-500" />}
                          </div>
                        );
                      })}
                      {filteredClubs.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">Nenhum time encontrado</p>
                      )}
                    </div>
                  </div>

                  {/* Coluna direita: fases e grupos */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {grupoFases(activeTorneio).map((fase, fi) => {
                      const pk = phaseKey(activeTorneio.key, fase.nome);
                      const nGrupos = fase.grupos ?? 2;
                      const letters = GROUP_LETTERS.slice(0, nGrupos);
                      const assignedSet = getAssignedInPhase(pk);
                      const unassigned = clubs.filter(c => !assignedSet.has(c.id_club));

                      return (
                        <div key={pk} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-800">{fase.nome}</h3>
                            <span className="text-xs text-gray-400">
                              {fase.grupos} grupos · {fase.times_por_grupo} times/grupo · {fase.classificados_por_grupo} avançam
                            </span>
                          </div>

                          {/* Grupos lado a lado */}
                          <div className="flex gap-3">
                            {letters.map((letter, li) => {
                              const groupClubIds = groupMap[pk]?.[letter] ?? [];
                              const groupClubs = groupClubIds
                                .map(id => clubs.find(c => c.id_club === id))
                                .filter(Boolean);
                              return (
                                <GroupPanel
                                  key={letter}
                                  letter={letter}
                                  clubs={groupClubs}
                                  allClubs={clubs}
                                  onAssign={(clubId) => assignClub(pk, letter, clubId)}
                                  onRemove={(clubId) => removeClub(pk, letter, clubId)}
                                  color={GROUP_COLORS[li % GROUP_COLORS.length]}
                                />
                              );
                            })}
                          </div>

                          {/* Não atribuídos — clicáveis */}
                          {unassigned.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Não atribuídos ({unassigned.length}) — clique para atribuir
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {unassigned.map(club => (
                                  <div key={club.id_club} className="flex items-center gap-1 bg-white border border-dashed border-gray-300 rounded-lg px-2 py-1">
                                    {club.crest_url
                                      ? <img src={clubLogo(club.crest_url, club.slug)} className="w-4 h-4 object-contain" alt="" />
                                      : <div className="w-4 h-4 rounded-sm bg-gray-100" />
                                    }
                                    <span className="text-xs text-gray-600 font-medium">{club.name}</span>
                                    <div className="flex gap-1 ml-1">
                                      {letters.map(letter => (
                                        <button
                                          key={letter}
                                          onClick={() => assignClub(pk, letter, club.id_club)}
                                          className={`w-5 h-5 rounded text-[10px] font-bold transition-colors ${
                                            GROUP_COLORS[letters.indexOf(letter) % GROUP_COLORS.length].text
                                          } ${GROUP_COLORS[letters.indexOf(letter) % GROUP_COLORS.length].bg} border ${
                                            GROUP_COLORS[letters.indexOf(letter) % GROUP_COLORS.length].border
                                          } hover:opacity-80`}
                                        >
                                          {letter}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedYear || saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "Salvando..." : "Salvar grupos"}
          </button>
        </div>
      </div>
    </div>
  );
}
