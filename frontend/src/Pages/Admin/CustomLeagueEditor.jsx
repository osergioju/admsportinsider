import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../services/api";
import {
  X, Loader2, Check, Plus, Trash2, Settings2, Zap,
  GripVertical, AlertTriangle, Save, RefreshCw,
  Calendar, ChevronRight, Search, UserPlus,
} from "lucide-react";

// ─── Estilos ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-4 py-2 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const btnSecondary =
  "flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";

function groupClubsByGroup(assignments, phaseKey) {
  const result = {};
  for (const a of assignments) {
    if (a.phase_key !== phaseKey) continue;
    const key = a.group_key ?? "__none__";
    if (!result[key]) result[key] = [];
    result[key].push(a.id_club);
  }
  return result;
}

function unassignedClubs(allSeasonClubs, assignments, phaseKey) {
  const assigned = new Set(
    assignments.filter(a => a.phase_key === phaseKey).map(a => a.id_club)
  );
  return allSeasonClubs.filter(c => !assigned.has(c.id_club));
}

// ─── ClubChip ─────────────────────────────────────────────────────────────────

function ClubChip({ club, onRemove, draggable, onDragStart }) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-sm select-none ${draggable ? "cursor-grab active:cursor-grabbing hover:border-[#7F33D9]/40" : ""}`}
    >
      {draggable && <GripVertical size={11} className="text-gray-300 shrink-0" />}
      {club.crest_url
        ? <img src={club.crest_url} className="w-4 h-4 object-contain shrink-0" alt="" />
        : <div className="w-4 h-4 rounded-full bg-gray-100 shrink-0" />}
      <span className="truncate max-w-[130px]">{club.name}</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 text-gray-300 hover:text-red-400 transition-colors shrink-0">
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// ─── GroupSlot ────────────────────────────────────────────────────────────────

function GroupSlot({ groupKey, clubIds, seasonClubs, onDrop, onRemoveClub, onRenameGroup, onRemoveGroup }) {
  const [over, setOver] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(groupKey === "__none__" ? "" : groupKey);

  const label = groupKey === "__none__" ? "Times da fase" : `Grupo ${groupKey}`;
  const clubs = clubIds.map(id => seasonClubs.find(c => c.id_club === id)).filter(Boolean);

  return (
    <div
      className={`border rounded-xl p-3 transition-all ${over ? "border-[#7F33D9] bg-[#7F33D9]/5" : "border-gray-200 bg-gray-50/40"}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(groupKey, e.dataTransfer.getData("club_id")); }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        {editingName ? (
          <input
            autoFocus
            className="text-xs font-bold text-[#7F33D9] bg-transparent border-b border-[#7F33D9] outline-none w-24"
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={() => {
              setEditingName(false);
              if (nameVal.trim() && nameVal.trim() !== groupKey) onRenameGroup(groupKey, nameVal.trim());
            }}
            onKeyDown={e => e.key === "Enter" && e.target.blur()}
          />
        ) : (
          <button
            onClick={() => groupKey !== "__none__" && setEditingName(true)}
            className={`text-xs font-bold text-gray-700 truncate ${groupKey !== "__none__" ? "hover:text-[#7F33D9] cursor-pointer" : "cursor-default"}`}
          >
            {label}
          </button>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded-full">
            {clubs.length}
          </span>
          {groupKey !== "__none__" && (
            <button onClick={() => onRemoveGroup(groupKey)} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {clubs.map(club => (
          <ClubChip key={club.id_club} club={club}
            onRemove={() => onRemoveClub(groupKey, club.id_club)} />
        ))}
        {clubs.length === 0 && (
          <p className="text-[11px] text-gray-300 italic py-1">Arraste times aqui</p>
        )}
      </div>
    </div>
  );
}

// ─── AddClubPanel ─────────────────────────────────────────────────────────────
// Busca em todos os clubes do sistema e adiciona à temporada

function AddClubPanel({ league, year, seasonClubs, allClubs, onAdded, onClose }) {
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(null);

  const enrolled = new Set(seasonClubs.map(c => c.id_club));

  const filtered = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.toLowerCase();
    return allClubs
      .filter(c => !enrolled.has(c.id_club) && c.name.toLowerCase().includes(term))
      .slice(0, 30);
  }, [q, allClubs, enrolled]);

  async function handleAdd(club) {
    setAdding(club.id_club);
    try {
      const { data } = await api.post(
        `/admin/leagues/${league.id_league}/seasons/${year}/clubs`,
        { id_club: club.id_club }
      );
      onAdded(data.club);
      setQ("");
    } catch {
      alert("Erro ao adicionar clube");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="bg-white border border-[#7F33D9]/20 rounded-xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">Adicionar clube à temporada</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9]"
          placeholder="Buscar clube por nome..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      {q.trim() && filtered.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">Nenhum clube encontrado</p>
      )}
      {filtered.length > 0 && (
        <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
          {filtered.map(club => (
            <div key={club.id_club}
              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                {club.crest_url
                  ? <img src={club.crest_url} className="w-5 h-5 object-contain shrink-0" alt="" />
                  : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{club.name}</p>
                  {club.country_name && <p className="text-[10px] text-gray-400">{club.country_name}</p>}
                </div>
              </div>
              <button
                onClick={() => handleAdd(club)}
                disabled={adding === club.id_club}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-[#7F33D9]/10 text-[#7F33D9] rounded-full text-[11px] font-bold hover:bg-[#7F33D9]/20 transition-colors disabled:opacity-50"
              >
                {adding === club.id_club ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                Adicionar
              </button>
            </div>
          ))}
        </div>
      )}
      {!q.trim() && (
        <p className="text-xs text-gray-400 text-center py-1">Digite o nome do clube para buscar</p>
      )}
    </div>
  );
}

// ─── TeamsTab ─────────────────────────────────────────────────────────────────

function TeamsTab({ league, year, structure, seasonClubs, allClubs, assignments, onAssignmentsChange, onClubAdded, onClubRemoved }) {
  const fases = structure?.fases ?? [];
  const [activePhase, setActivePhase] = useState(fases[0]?.nome ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [removingClub, setRemovingClub] = useState(null);

  const activeFase = fases.find(f => f.nome === activePhase);
  const hasGroups  = activeFase?.tipo === "grupo";
  const pool       = unassignedClubs(seasonClubs, assignments, activePhase);
  const grouped    = groupClubsByGroup(assignments, activePhase);

  const realGroupKeys = hasGroups
    ? [...new Set(assignments.filter(a => a.phase_key === activePhase && a.group_key).map(a => a.group_key))].sort()
    : ["__none__"];

  // ─── Handlers de grupo ───────────────────────────────────────────────────────

  function handleDrop(targetGroup, clubIdStr) {
    const id_club = Number(clubIdStr);
    if (!id_club) return;
    const without = assignments.filter(a => !(a.phase_key === activePhase && a.id_club === id_club));
    without.push({
      phase_key: activePhase,
      group_key: targetGroup === "__none__" ? null : targetGroup,
      id_club,
      slot_order: (grouped[targetGroup]?.length ?? 0),
    });
    onAssignmentsChange(without);
  }

  function handleRemoveClub(groupKey, id_club) {
    onAssignmentsChange(assignments.filter(
      a => !(a.phase_key === activePhase && a.id_club === id_club)
    ));
  }

  function handleAddGroup() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const used = new Set(realGroupKeys);
    const next = letters.split("").find(l => !used.has(l)) ?? `G${realGroupKeys.length + 1}`;
    // Adiciona um placeholder temporário para o grupo aparecer no UI
    onAssignmentsChange([...assignments, { phase_key: activePhase, group_key: next, id_club: -1, slot_order: 0 }]);
  }

  function handleRenameGroup(oldKey, newKey) {
    onAssignmentsChange(assignments.map(a =>
      a.phase_key === activePhase && a.group_key === oldKey ? { ...a, group_key: newKey } : a
    ));
  }

  function handleRemoveGroup(groupKey) {
    onAssignmentsChange(assignments.filter(
      a => !(a.phase_key === activePhase && a.group_key === groupKey)
    ));
  }

  // ─── Salvar distribuição ────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const clean = assignments.filter(a => a.id_club !== -1);
      await api.put(`/admin/leagues/${league.id_league}/seasons/${year}/groups`, { assignments: clean });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // ─── Remover clube da temporada ─────────────────────────────────────────────

  async function handleRemoveFromSeason(id_club) {
    if (!window.confirm("Remover este clube da temporada? As partidas em que ele participa não serão removidas.")) return;
    setRemovingClub(id_club);
    try {
      await api.delete(`/admin/leagues/${league.id_league}/seasons/${year}/clubs/${id_club}`);
      onClubRemoved(id_club);
      onAssignmentsChange(assignments.filter(a => a.id_club !== id_club));
    } catch {
      alert("Erro ao remover clube");
    } finally {
      setRemovingClub(null);
    }
  }

  return (
    <div className="space-y-4">

      {/* Seletor de fase */}
      {fases.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {fases.map(f => (
            <button key={f.nome} onClick={() => setActivePhase(f.nome)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activePhase === f.nome
                ? "bg-[#7F33D9] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#7F33D9]/40"}`}>
              {f.nome}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Pool: clubes não alocados + gerenciar clube da temporada */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className={labelClass}>
                Não alocados
                <span className="text-gray-300 normal-case font-normal ml-1">({pool.length})</span>
              </p>
              <button
                onClick={() => setShowAddPanel(v => !v)}
                className="flex items-center gap-1 text-xs text-[#7F33D9] font-semibold hover:underline"
              >
                <UserPlus size={12} /> Adicionar
              </button>
            </div>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
              {pool.length === 0 && (
                <p className="text-[11px] text-gray-300 italic py-3 text-center">Todos alocados</p>
              )}
              {pool.map(club => (
                <div key={club.id_club}
                  className="flex items-center gap-1"
                  draggable
                  onDragStart={e => e.dataTransfer.setData("club_id", String(club.id_club))}
                >
                  <div className="flex-1 cursor-grab">
                    <ClubChip club={club} draggable={false} />
                  </div>
                  <button
                    onClick={() => handleRemoveFromSeason(club.id_club)}
                    disabled={removingClub === club.id_club}
                    title="Remover da temporada"
                    className="w-5 h-5 flex items-center justify-center text-gray-200 hover:text-red-400 transition-colors shrink-0"
                  >
                    {removingClub === club.id_club ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Painel de adição de clube */}
          {showAddPanel && (
            <AddClubPanel
              league={league} year={year}
              seasonClubs={seasonClubs} allClubs={allClubs}
              onAdded={club => { onClubAdded(club); }}
              onClose={() => setShowAddPanel(false)}
            />
          )}

          {/* Lista completa de times na temporada */}
          <div className="bg-white border border-gray-100 rounded-xl p-3">
            <p className={labelClass}>Na temporada <span className="text-gray-300 normal-case font-normal">({seasonClubs.length})</span></p>
            <div className="flex flex-col gap-1 mt-1.5 max-h-40 overflow-y-auto">
              {seasonClubs.map(c => (
                <div key={c.id_club} className="flex items-center gap-1.5 text-xs text-gray-600 py-0.5">
                  {c.crest_url
                    ? <img src={c.crest_url} className="w-3.5 h-3.5 object-contain shrink-0" alt="" />
                    : <div className="w-3.5 h-3.5 rounded-full bg-gray-100 shrink-0" />}
                  <span className="truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grupos da fase */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className={labelClass}>{hasGroups ? "Grupos" : "Alocação"}</p>
            {hasGroups && (
              <button onClick={handleAddGroup}
                className="flex items-center gap-1 text-xs text-[#7F33D9] font-semibold hover:underline">
                <Plus size={12} /> Novo grupo
              </button>
            )}
          </div>

          {realGroupKeys.map(gk => (
            <GroupSlot
              key={gk} groupKey={gk}
              clubIds={(grouped[gk] ?? []).filter(id => id !== -1)}
              seasonClubs={seasonClubs}
              onDrop={handleDrop}
              onRemoveClub={handleRemoveClub}
              onRenameGroup={handleRenameGroup}
              onRemoveGroup={handleRemoveGroup}
            />
          ))}

          {realGroupKeys.length === 0 && (
            <GroupSlot groupKey="__none__" clubIds={[]} seasonClubs={seasonClubs}
              onDrop={handleDrop} onRemoveClub={handleRemoveClub}
              onRenameGroup={() => {}} onRemoveGroup={() => {}} />
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button onClick={handleSave} disabled={saving || saved} className={btnPrimary}>
          {saving ? <Loader2 size={14} className="animate-spin" />
            : saved ? <><Check size={14} /> Salvo</>
            : <><Save size={14} /> Salvar distribuição</>}
        </button>
      </div>
    </div>
  );
}

// ─── MatchForm ────────────────────────────────────────────────────────────────

function MatchForm({ league, year, seasonClubs, structure, onCreated, onClose }) {
  const fases = structure?.fases ?? [];
  const [form, setForm] = useState({
    home_club_id: "", away_club_id: "",
    match_date: "", phase_key: fases[0]?.nome ?? "",
    group_key: "", game_week: "",
  });
  const [saving, setSaving] = useState(false);
  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const activeFase = fases.find(f => f.nome === form.phase_key);
  const hasGroups  = activeFase?.tipo === "grupo";

  async function handleCreate() {
    if (!form.home_club_id || !form.away_club_id) return alert("Selecione os dois times");
    if (form.home_club_id === form.away_club_id) return alert("Times iguais");
    setSaving(true);
    try {
      const { data } = await api.post(
        `/admin/leagues/${league.id_league}/seasons/${year}/matches`,
        {
          home_club_id: Number(form.home_club_id),
          away_club_id: Number(form.away_club_id),
          match_date:   form.match_date || null,
          phase_key:    form.phase_key  || null,
          group_key:    form.group_key  || null,
          game_week:    form.game_week  ? Number(form.game_week) : null,
        }
      );
      onCreated(data.match);
      onClose();
    } catch {
      alert("Erro ao criar partida");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-gray-700">Nova partida</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Mandante</label>
          <select className={inputClass} value={form.home_club_id} onChange={e => up("home_club_id", e.target.value)}>
            <option value="">Selecione</option>
            {seasonClubs.map(c => <option key={c.id_club} value={c.id_club}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Visitante</label>
          <select className={inputClass} value={form.away_club_id} onChange={e => up("away_club_id", e.target.value)}>
            <option value="">Selecione</option>
            {seasonClubs.map(c => <option key={c.id_club} value={c.id_club}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Fase</label>
          <select className={inputClass} value={form.phase_key} onChange={e => up("phase_key", e.target.value)}>
            <option value="">—</option>
            {fases.map(f => <option key={f.nome} value={f.nome}>{f.nome}</option>)}
          </select>
        </div>
        {hasGroups && (
          <div>
            <label className={labelClass}>Grupo / Zona</label>
            <input className={inputClass} placeholder="A, B, Interzonal..." value={form.group_key} onChange={e => up("group_key", e.target.value)} />
          </div>
        )}
        <div>
          <label className={labelClass}>Data</label>
          <input type="date" className={inputClass} value={form.match_date} onChange={e => up("match_date", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Rodada</label>
          <input type="number" min={1} className={inputClass} placeholder="1" value={form.game_week} onChange={e => up("game_week", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className={btnSecondary}>Cancelar</button>
        <button onClick={handleCreate} disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Criar</>}
        </button>
      </div>
    </div>
  );
}

// ─── MatchRow ─────────────────────────────────────────────────────────────────

function MatchRow({ match, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    match_date: match.match_date?.slice(0, 10) ?? "",
    home_goals: match.home_goals ?? "",
    away_goals: match.away_goals ?? "",
    status:     match.status ?? "scheduled",
    phase_key:  match.phase_key ?? "",
    group_key:  match.group_key ?? "",
    game_week:  match.game_week ?? "",
  });
  const [saving, setSaving] = useState(false);
  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/admin/matches/${match.id_match}`, {
        match_date: form.match_date || null,
        home_goals: form.home_goals !== "" ? Number(form.home_goals) : null,
        away_goals: form.away_goals !== "" ? Number(form.away_goals) : null,
        status:     form.status,
        phase_key:  form.phase_key  || null,
        group_key:  form.group_key  || null,
        game_week:  form.game_week  ? Number(form.game_week) : null,
      });
      onUpdate({ ...match, ...form,
        home_goals: form.home_goals !== "" ? Number(form.home_goals) : null,
        away_goals: form.away_goals !== "" ? Number(form.away_goals) : null,
      });
      setEditing(false);
    } catch {
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Excluir esta partida?")) return;
    await api.delete(`/admin/matches/${match.id_match}`);
    onDelete(match.id_match);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 text-sm font-semibold text-gray-800 min-w-0">
          {match.home_crest && <img src={match.home_crest} className="w-5 h-5 object-contain shrink-0" alt="" />}
          <span className="truncate">{match.home_name}</span>
        </div>
        <div className="shrink-0 text-center min-w-[64px]">
          {match.home_goals != null && match.away_goals != null
            ? <span className="text-sm font-bold text-gray-900">{match.home_goals}–{match.away_goals}</span>
            : <span className="text-[10px] text-gray-400 leading-tight">{fmtDate(match.match_date)}</span>}
        </div>
        <div className="flex-1 flex items-center gap-2 text-sm font-semibold text-gray-800 justify-end min-w-0">
          <span className="truncate text-right">{match.away_name}</span>
          {match.away_crest && <img src={match.away_crest} className="w-5 h-5 object-contain shrink-0" alt="" />}
        </div>
        <div className="flex items-center gap-1 ml-1 shrink-0">
          <button onClick={() => setEditing(v => !v)} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#7F33D9] hover:bg-[#7F33D9]/5 transition-colors">
            <Settings2 size={13} />
          </button>
          <button onClick={handleDelete} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {match.phase_key && <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium">{match.phase_key}</span>}
        {match.group_key && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">{match.group_key}</span>}
        {match.game_week && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">R{match.game_week}</span>}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
          match.status === "finished" ? "bg-green-50 text-green-600"
          : match.status === "live"   ? "bg-red-50 text-red-500"
          : "bg-amber-50 text-amber-600"}`}>
          {match.status === "finished" ? "Encerrada" : match.status === "live" ? "Ao vivo" : "Agendada"}
        </span>
      </div>

      {/* Edição inline */}
      {editing && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div>
            <label className={labelClass}>Data</label>
            <input type="date" className={inputClass} value={form.match_date} onChange={e => up("match_date", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={e => up("status", e.target.value)}>
              <option value="scheduled">Agendada</option>
              <option value="live">Ao vivo</option>
              <option value="finished">Encerrada</option>
              <option value="postponed">Adiada</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Fase</label>
            <input className={inputClass} value={form.phase_key} onChange={e => up("phase_key", e.target.value)} placeholder="Fase..." />
          </div>
          <div>
            <label className={labelClass}>Grupo / Zona</label>
            <input className={inputClass} value={form.group_key} onChange={e => up("group_key", e.target.value)} placeholder="A, B, Interzonal..." />
          </div>
          <div>
            <label className={labelClass}>Gols Casa</label>
            <input type="number" min={0} className={inputClass} value={form.home_goals} onChange={e => up("home_goals", e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className={labelClass}>Gols Fora</label>
            <input type="number" min={0} className={inputClass} value={form.away_goals} onChange={e => up("away_goals", e.target.value)} placeholder="—" />
          </div>
          <div className="col-span-2 sm:col-span-3 flex gap-2 justify-end pt-1">
            <button onClick={() => setEditing(false)} className={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <><Check size={13} /> Salvar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MatchesTab ───────────────────────────────────────────────────────────────

function MatchesTab({ league, year, structure, seasonClubs, matches, onChange }) {
  const fases = structure?.fases ?? [];
  const [showForm, setShowForm] = useState(false);
  const [filterPhase, setFilterPhase] = useState("__all__");
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [genPhase, setGenPhase] = useState(fases[0]?.nome ?? "");
  const [genFormato, setGenFormato] = useState("ida_volta");
  const [generating, setGenerating] = useState(false);

  const filtered = filterPhase === "__all__"
    ? matches
    : matches.filter(m => m.phase_key === filterPhase);

  function handleCreated(m) { onChange([...matches, m]); }
  function handleUpdate(u)  { onChange(matches.map(m => m.id_match === u.id_match ? u : m)); }
  function handleDelete(id) { onChange(matches.filter(m => m.id_match !== id)); }

  async function handleGenerate() {
    if (!genPhase) return alert("Selecione uma fase");
    if (!window.confirm(`Gerar partidas (todos contra todos) para "${genPhase}"?`)) return;
    setGenerating(true);
    try {
      const { data } = await api.post(
        `/admin/leagues/${league.id_league}/seasons/${year}/matches/generate`,
        { phase_key: genPhase, formato: genFormato, overwrite: false }
      );
      alert(`${data.created} partida(s) criada(s).`);
      onChange(null); // reload
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao gerar");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="px-3 py-2 border border-gray-200 rounded-full text-xs font-medium bg-white focus:outline-none focus:border-[#7F33D9]"
          value={filterPhase} onChange={e => setFilterPhase(e.target.value)}
        >
          <option value="__all__">Todas as fases ({matches.length})</option>
          {fases.map(f => {
            const n = matches.filter(m => m.phase_key === f.nome).length;
            return <option key={f.nome} value={f.nome}>{f.nome} ({n})</option>;
          })}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setShowGenPanel(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${showGenPanel ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"}`}
        >
          <Zap size={13} /> Gerar automaticamente
        </button>
        <button onClick={() => setShowForm(v => !v)} className={btnPrimary}>
          <Plus size={14} /> Nova partida
        </button>
      </div>

      {/* Painel geração assistida */}
      {showGenPanel && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Gera todos contra todos dentro de cada grupo da fase, baseado na distribuição de times salva.
              Não remove partidas existentes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fase</label>
              <select className={inputClass} value={genPhase} onChange={e => setGenPhase(e.target.value)}>
                {fases.map(f => <option key={f.nome} value={f.nome}>{f.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Formato</label>
              <select className={inputClass} value={genFormato} onChange={e => setGenFormato(e.target.value)}>
                <option value="turno_unico">Turno Único (1 jogo)</option>
                <option value="ida_volta">Ida e Volta (2 jogos)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleGenerate} disabled={generating} className={btnPrimary}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <><RefreshCw size={14} /> Gerar</>}
            </button>
          </div>
        </div>
      )}

      {/* Form nova partida */}
      {showForm && (
        <MatchForm
          league={league} year={year} seasonClubs={seasonClubs} structure={structure}
          onCreated={handleCreated} onClose={() => setShowForm(false)}
        />
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhuma partida {filterPhase !== "__all__" ? `em "${filterPhase}"` : "cadastrada"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <MatchRow key={m.id_match} match={m} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── YearSelector — tela inicial do editor ────────────────────────────────────

function YearSelector({ league, onSelect }) {
  const structure = league.structure_json ?? {};
  const anos = Object.keys(structure).filter(k => /^\d{4}$/.test(k)).sort((a, b) => b - a);
  const personalizados = anos.filter(a => structure[a]?.tipo === "personalizado");
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-gray-500">Selecione ou crie uma edição para gerenciar:</p>

      {personalizados.length > 0 && (
        <div className="space-y-2">
          {personalizados.map(a => (
            <button key={a} onClick={() => onSelect(a)}
              className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#7F33D9]/40 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <Calendar size={16} className="text-violet-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-sm">{a}</p>
                  <p className="text-xs text-gray-400">
                    {structure[a]?.fases?.length ?? 0} fase{structure[a]?.fases?.length !== 1 ? "s" : ""} configurada{structure[a]?.fases?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#7F33D9] transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Nova edição */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <input
          type="number" min={1900} max={2100}
          className={`${inputClass} flex-1`}
          value={newYear}
          onChange={e => setNewYear(e.target.value)}
          placeholder="Ano..."
        />
        <button
          onClick={() => newYear && onSelect(newYear)}
          className={btnPrimary}
        >
          <Plus size={14} /> Abrir
        </button>
      </div>
      {newYear && structure[newYear] && structure[newYear].tipo !== "personalizado" && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle size={11} /> A edição {newYear} existe mas não é do tipo "Personalizado".
        </p>
      )}
      {newYear && !structure[newYear] && (
        <p className="text-xs text-gray-400">
          A edição {newYear} não tem estrutura configurada ainda. Será criada ao adicionar clubes ou partidas.
        </p>
      )}
    </div>
  );
}

// ─── Modal principal ───────────────────────────────────────────────────────────

export default function CustomLeagueEditor({ league, onClose }) {
  const [selectedYear, setSelectedYear] = useState(null);
  const [tab, setTab] = useState("teams");
  const [loading, setLoading] = useState(false);
  const [seasonClubs, setSeasonClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [matches, setMatches] = useState([]);

  const structure = selectedYear ? (league.structure_json?.[selectedYear] ?? null) : null;
  const fases = structure?.fases ?? [];

  const load = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/leagues/${league.id_league}/seasons/${selectedYear}/editor`);
      setSeasonClubs(data.clubs);
      setAllClubs(data.allClubs);
      setAssignments(data.groups);
      setMatches(data.matches);
    } catch {
      alert("Erro ao carregar editor");
    } finally {
      setLoading(false);
    }
  }, [league.id_league, selectedYear]);

  useEffect(() => { load(); }, [load]);

  function handleMatchesChange(updated) {
    if (updated === null) { load(); return; }
    setMatches(updated);
  }

  function handleClubAdded(club) {
    setSeasonClubs(prev => [...prev, club].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleClubRemoved(id_club) {
    setSeasonClubs(prev => prev.filter(c => c.id_club !== id_club));
  }

  const tabs = [
    { key: "teams",   label: "Times",    count: seasonClubs.length },
    { key: "matches", label: "Partidas", count: matches.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {selectedYear && (
              <button onClick={() => setSelectedYear(null)}
                className="text-gray-400 hover:text-gray-600 mr-1">
                <ChevronRight size={18} className="rotate-180" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900">{league.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedYear ? `Editor personalizado · ${selectedYear}` : "Editor personalizado — selecione uma edição"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Tabs (só quando ano selecionado) */}
        {selectedYear && (
          <div className="flex border-b border-gray-100 px-6 shrink-0">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === t.key
                  ? "border-[#7F33D9] text-[#7F33D9]"
                  : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t.label}
                {t.count > 0 && <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{t.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Seletor de ano */}
          {!selectedYear && (
            <YearSelector league={league} onSelect={y => { setSelectedYear(y); setTab("teams"); }} />
          )}

          {/* Editor do ano selecionado */}
          {selectedYear && loading && (
            <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
              <Loader2 className="animate-spin w-5 h-5" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {selectedYear && !loading && fases.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle size={30} className="text-amber-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700">Estrutura não configurada</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Configure as fases da competição em "Estrutura" antes de usar o editor.
                Você ainda pode adicionar clubes e partidas sem estrutura definida.
              </p>
            </div>
          )}

          {selectedYear && !loading && tab === "teams" && (
            <TeamsTab
              league={league} year={selectedYear} structure={structure}
              seasonClubs={seasonClubs} allClubs={allClubs}
              assignments={assignments} onAssignmentsChange={setAssignments}
              onClubAdded={handleClubAdded} onClubRemoved={handleClubRemoved}
            />
          )}

          {selectedYear && !loading && tab === "matches" && (
            <MatchesTab
              league={league} year={selectedYear} structure={structure}
              seasonClubs={seasonClubs} matches={matches} onChange={handleMatchesChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
