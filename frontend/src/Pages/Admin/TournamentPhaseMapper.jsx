import { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  X, Loader2, Check, AlertTriangle, ArrowRight,
  Calendar, ChevronDown, ChevronUp, Info, Zap
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "2-digit" })
  : "—";

const COLORS = [
  { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  { bg: "bg-blue-50 border-blue-200",     text: "text-blue-700",   badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-400"   },
  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700",  badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-400"  },
  { bg: "bg-rose-50 border-rose-200",     text: "text-rose-700",   badge: "bg-rose-100 text-rose-700",   dot: "bg-rose-400"   },
  { bg: "bg-teal-50 border-teal-200",     text: "text-teal-700",   badge: "bg-teal-100 text-teal-700",   dot: "bg-teal-400"   },
];

const color = (i) => COLORS[i % COLORS.length];

// ─── ClusterCard ─────────────────────────────────────────────────────────────

function ClusterCard({ cluster, assignedKey, configuredFases, onChange, colorIdx }) {
  const [open, setOpen] = useState(false);
  const c = color(colorIdx);
  const assignedFase = configuredFases.find(f => f.key === assignedKey);

  return (
    <div className={`border rounded-xl overflow-hidden ${c.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-700">
            Bloco {cluster.clusterId + 1}
            <span className="ml-2 font-normal text-gray-400">
              {cluster.matchCount} partida{cluster.matchCount !== 1 ? "s" : ""}
            </span>
            {/* Aviso: chave legada no banco que não bate com as fases configuradas */}
            {cluster.legacyPhaseKey && (
              <span className="ml-2 text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                era: {cluster.legacyPhaseKey}
              </span>
            )}
          </p>
          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
            <Calendar size={10} />
            {fmtDate(cluster.dateStart)} → {fmtDate(cluster.dateEnd)}
          </p>
        </div>
        <button onClick={() => setOpen(v => !v)} className="text-gray-400 hover:text-gray-600">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Seletor de fase */}
      <div className="px-4 pb-3">
        <select
          value={assignedKey ?? ""}
          onChange={e => onChange(cluster.clusterId, e.target.value || null)}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
        >
          <option value="">— Não atribuir —</option>
          {configuredFases.map(f => (
            <option key={f.key} value={f.key}>{f.nome}</option>
          ))}
        </select>
        {assignedFase && (
          <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
            <Check size={9} /> {assignedFase.nome}
          </span>
        )}
      </div>

      {/* Lista de partidas (colapsável) */}
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50 max-h-48 overflow-y-auto">
          {cluster.matches.map(m => (
            <div key={m.id} className="flex items-center gap-2 px-4 py-1.5 text-[11px] text-gray-600">
              <span className="text-gray-300 shrink-0 tabular-nums w-14">{fmtDate(m.date)}</span>
              <span className="flex-1 font-medium truncate">{m.home}</span>
              <span className="text-gray-300">×</span>
              <span className="flex-1 font-medium truncate text-right">{m.away}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function TournamentPhaseMapper({ league, year: yearProp, onClose, onSaved }) {
  const availableYears = Object.keys(league.structure_json ?? {})
    .filter(k => /^\d{4}$/.test(k) && (league.structure_json[k]?.fases?.length ?? 0) > 0)
    .sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(yearProp ?? availableYears[0] ?? null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);

  // clusterId → phaseKey (null = não atribuir)
  const [mapping, setMapping] = useState({});

  useEffect(() => { if (selectedYear) load(); }, [selectedYear]);

  async function load() {
    setLoading(true);
    setData(null);
    setMapping({});
    try {
      const { data: res } = await api.get(
        `/admin/leagues/${league.id_league}/seasons/${selectedYear}/tournament-suggestions`
      );
      setData(res);

      // Pré-preenche com a fase válida já gravada no banco (currentPhaseKey)
      // Se não tiver, usa a sugestão posicional (suggestedPhaseKey)
      const initial = {};
      for (const cluster of res.clusters ?? []) {
        initial[cluster.clusterId] = cluster.currentPhaseKey ?? cluster.suggestedPhaseKey ?? null;
      }
      setMapping(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(clusterId, phaseKey) {
    setMapping(prev => ({ ...prev, [clusterId]: phaseKey }));
  }

  // "Auto-sugerir": aplica sugestão posicional (cluster 0 → fase 0, etc.)
  function applyAutoSuggestions() {
    const next = {};
    for (const cluster of data?.clusters ?? []) {
      next[cluster.clusterId] = cluster.suggestedPhaseKey ?? null;
    }
    setMapping(next);
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      const assignments = data.clusters.map(cluster => ({
        phaseKey: mapping[cluster.clusterId] ?? null,
        matchIds: cluster.matches.map(m => m.id),
      }));

      await api.post(
        `/admin/leagues/${league.id_league}/seasons/${selectedYear}/assign-phases`,
        { assignments }
      );

      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar mapeamento");
    } finally {
      setSaving(false);
    }
  }

  const total = data?.clusters?.length ?? 0;
  const canSave = total > 0;

  // Contagem de partidas que serão atualizadas (com fase atribuída)
  const assignedMatches = (data?.clusters ?? [])
    .filter(c => mapping[c.clusterId])
    .reduce((acc, c) => acc + c.matchCount, 0);

  // Clusters com chave legada que precisam de atenção
  const legacyCount = (data?.clusters ?? []).filter(c => c.legacyPhaseKey).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Mapear Torneios / Fases</h2>
            <p className="text-xs text-gray-400 mt-0.5">{league.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {availableYears.length > 1 ? (
              <select
                value={selectedYear ?? ""}
                onChange={e => setSelectedYear(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Sem ano configurado */}
          {!selectedYear && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Esta liga não possui nenhuma edição com fases configuradas. Configure a estrutura primeiro.</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Analisando partidas...</span>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Aviso de chaves legadas */}
              {legacyCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>{legacyCount} bloco{legacyCount > 1 ? "s" : ""}</strong> com fase antiga que não bate com a estrutura configurada
                    (indicado como <em>"era: …"</em>). Confirme o mapeamento abaixo para corrigir.
                  </span>
                </div>
              )}

              {/* Sem fases configuradas */}
              {data.configuredFases.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>Esta competição não tem fases configuradas. Configure a estrutura primeiro.</span>
                </div>
              )}

              {/* Fases configuradas + contadores */}
              {data.configuredFases.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Fases configuradas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.configuredFases.map((f, i) => {
                      const c = color(i);
                      const matchCount = (data.clusters ?? [])
                        .filter(cl => mapping[cl.clusterId] === f.key)
                        .reduce((acc, cl) => acc + cl.matchCount, 0);
                      return (
                        <div key={f.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${c.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                          <span className={`text-xs font-bold ${c.text}`}>{f.nome}</span>
                          {matchCount > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.badge}`}>
                              {matchCount}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cabeçalho dos clusters + Auto-sugerir */}
              {data.clusters?.length > 0 && data.configuredFases.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Blocos temporais ({data.clusters.length})
                  </p>
                  <button
                    onClick={applyAutoSuggestions}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-full hover:bg-violet-100 transition-colors"
                  >
                    <Zap size={11} /> Auto-sugerir
                  </button>
                </div>
              )}

              {/* Info */}
              {data.clusters?.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  <span>
                    Partidas agrupadas por blocos temporais (pausas {">"} 14 dias).
                    Atribua cada bloco à fase correta e confirme.
                  </span>
                </div>
              )}

              {/* Sem partidas na liga */}
              {data.clusters?.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  Nenhuma partida com data encontrada nesta edição.
                </div>
              )}

              {/* Clusters */}
              <div className="space-y-3">
                {(data.clusters ?? []).map((cluster) => (
                  <ClusterCard
                    key={cluster.clusterId}
                    cluster={cluster}
                    assignedKey={mapping[cluster.clusterId] ?? null}
                    configuredFases={data.configuredFases}
                    onChange={handleChange}
                    colorIdx={cluster.clusterId}
                  />
                ))}
              </div>

              {/* Resumo antes de salvar */}
              {assignedMatches > 0 && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 space-y-1">
                  <p className="font-bold text-gray-800">Resumo do mapeamento</p>
                  {(data.clusters ?? []).map(c => {
                    const ph = mapping[c.clusterId];
                    const fase = data.configuredFases.find(f => f.key === ph);
                    return (
                      <div key={c.clusterId} className="flex items-center gap-2">
                        <span className="text-gray-400">Bloco {c.clusterId + 1}</span>
                        <ArrowRight size={10} className="text-gray-300" />
                        {fase ? (
                          <span className="font-semibold text-violet-700">{fase.nome}</span>
                        ) : (
                          <span className="text-gray-400 italic">sem fase</span>
                        )}
                        <span className="text-gray-400">({c.matchCount} partidas)</span>
                      </div>
                    );
                  })}
                  <p className="text-gray-400 pt-1">
                    <strong className="text-gray-700">{assignedMatches}</strong> partidas serão atribuídas.
                  </p>
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
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "Salvando..." : "Confirmar mapeamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
