import { Fragment, useState } from "react";
import { api } from "../../services/api";
import {
  X, ChevronRight, ChevronLeft, Check, Loader2,
  Trophy, AlertTriangle, Plus, Trash2, Info, Calendar, Pencil
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const COMPETITION_TYPES = [
  { value: "pontos_corridos",             label: "Pontos Corridos",         desc: "Todos jogam contra todos — ida e volta" },
  { value: "pontos_corridos_turno_unico", label: "Pontos Corridos (turno)", desc: "Todos jogam contra todos — uma vez" },
  { value: "mata_mata",                   label: "Mata-Mata",               desc: "Eliminação direta por fases" },
  { value: "grupos",                      label: "Grupos",                  desc: "Fase de grupos pura" },
  { value: "grupos_mata_mata",            label: "Grupos + Mata-Mata",      desc: "Grupos seguidos de eliminatória" },
  { value: "misto",                       label: "Misto",                   desc: "Combinação personalizada de fases" },
  { value: "apertura_clausura",           label: "Apertura / Clausura",     desc: "Dois torneios na mesma temporada" },
  { value: "personalizado",              label: "Personalizado",            desc: "Formato livre configurado manualmente" },
];

const FASE_DEFAULTS = {
  mata_mata: [
    { nome: "Fase 1",    tipo: "mata_mata", formato: "turno_unico", desempate: "penalties" },
    { nome: "Oitavas",   tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
    { nome: "Quartas",   tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
    { nome: "Semifinal", tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
    { nome: "Final",     tipo: "mata_mata", formato: "turno_unico", desempate: "penalties" },
  ],
  grupos_mata_mata: [
    { nome: "Fase de Grupos", tipo: "grupo",     formato: "ida_volta",   grupos: 4, times_por_grupo: 4, classificados_por_grupo: 2 },
    { nome: "Oitavas",        tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
    { nome: "Quartas",        tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
    { nome: "Semifinal",      tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
    { nome: "Final",          tipo: "mata_mata", formato: "turno_unico", desempate: "penalties" },
  ],
};

const PRESETS = [
  {
    label: "Copa do Brasil",
    tipo: "mata_mata",
    fases: [
      { nome: "1ª Fase",   tipo: "mata_mata", formato: "turno_unico", desempate: "penalties" },
      { nome: "2ª Fase",   tipo: "mata_mata", formato: "turno_unico", desempate: "penalties" },
      { nome: "3ª Fase",   tipo: "mata_mata", formato: "turno_unico", desempate: "penalties" },
      { nome: "Oitavas",   tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
      { nome: "Quartas",   tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
      { nome: "Semifinal", tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
      { nome: "Final",     tipo: "mata_mata", formato: "ida_volta",   desempate: "gol_fora" },
    ],
  },
];

const CURRENT_YEAR = new Date().getFullYear();

const btnPrimary   = "flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed";
const btnSecondary = "flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
const inputClass   = "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all";
const labelClass   = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function faseVazia() {
  return { nome: "", tipo: "mata_mata", formato: "ida_volta", desempate: "gol_fora" };
}

function buildPresetFases(tipoComp) {
  if (tipoComp === "pontos_corridos")
    return [{ nome: "Temporada Regular", tipo: "pontos_corridos", formato: "ida_volta" }];
  if (tipoComp === "pontos_corridos_turno_unico")
    return [{ nome: "Temporada Regular", tipo: "pontos_corridos", formato: "turno_unico" }];
  if (tipoComp === "mata_mata")       return FASE_DEFAULTS.mata_mata.map(f => ({ ...f }));
  if (tipoComp === "grupos_mata_mata") return FASE_DEFAULTS.grupos_mata_mata.map(f => ({ ...f }));
  if (tipoComp === "grupos")
    return [{ nome: "Fase de Grupos", tipo: "grupo", formato: "ida_volta", grupos: 4, times_por_grupo: 4, classificados_por_grupo: 2 }];
  if (tipoComp === "apertura_clausura")
    return [
      { nome: "Apertura", tipo: "pontos_corridos", formato: "turno_unico" },
      { nome: "Clausura", tipo: "pontos_corridos", formato: "turno_unico" },
    ];
  return [faseVazia()];
}

function validarEstrutura(fases) {
  const erros = [];
  if (!fases || fases.length === 0) { erros.push("Adicione ao menos uma fase."); return erros; }
  fases.forEach((f, i) => {
    const id = f.nome?.trim() || `Fase ${i + 1}`;
    if (!f.nome?.trim()) erros.push(`Fase ${i + 1}: nome obrigatório.`);
    if (f.tipo === "grupo") {
      if (!f.grupos || f.grupos < 1)                               erros.push(`${id}: número de grupos inválido.`);
      if (!f.times_por_grupo || f.times_por_grupo < 2)            erros.push(`${id}: times por grupo inválido.`);
      if (!f.classificados_por_grupo || f.classificados_por_grupo < 1) erros.push(`${id}: classificados por grupo inválido.`);
      if (f.classificados_por_grupo >= f.times_por_grupo)         erros.push(`${id}: classificados deve ser menor que times por grupo.`);
    }
  });
  return erros;
}

function tipoLabel(tipo) {
  return COMPETITION_TYPES.find(t => t.value === tipo)?.label ?? tipo;
}

function desempateLabel(d) {
  return { penalties: "Pênaltis", gol_fora: "Gol Fora", tempo_extra: "Tempo Extra", nenhum: "—" }[d] ?? d;
}

// ─────────────────────────────────────────────────────────────────────────────
// ProgressBar
// ─────────────────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Ano / Tipo", "Fases", "Revisão"];

function ProgressBar({ stepIdx }) {
  return (
    <div className="flex items-center px-6 pt-5 pb-2 shrink-0">
      {STEP_LABELS.map((label, i) => (
        <Fragment key={i}>
          {/* Dot + label */}
          <div className="flex flex-col items-center gap-1 shrink-0 w-20">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < stepIdx  ? "bg-[#7F33D9] text-white" :
              i === stepIdx ? "bg-[#7F33D9] text-white ring-4 ring-purple-100" :
              "bg-gray-100 text-gray-400"
            }`}>
              {i < stepIdx ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-[11px] font-medium text-center leading-tight ${
              i === stepIdx ? "text-[#7F33D9]" : "text-gray-400"
            }`}>{label}</span>
          </div>

          {/* Connector — entre os dots, não dentro deles */}
          {i < STEP_LABELS.length - 1 && (
            <div className={`flex-1 h-px mb-4 mx-1 rounded-full transition-colors ${
              i < stepIdx ? "bg-[#7F33D9]" : "bg-gray-200"
            }`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FaseCard
// ─────────────────────────────────────────────────────────────────────────────

function FaseCard({ fase, index, onChange, onRemove, total }) {
  const update = (key, val) => onChange(index, { ...fase, [key]: val });

  const isMata   = fase.tipo === "mata_mata";
  const isGrupo  = fase.tipo === "grupo";

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/60 space-y-3">
      {/* Cabeçalho da fase */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#7F33D9] uppercase tracking-wide">Fase {index + 1}</span>
        {total > 1 && (
          <button onClick={() => onRemove(index)} className="text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Linha 1: Nome (full width) */}
      <div>
        <label className={labelClass}>Nome da fase</label>
        <input
          className={inputClass}
          value={fase.nome}
          onChange={e => update("nome", e.target.value)}
          placeholder="Ex: Oitavas de Final"
        />
      </div>

      {/* Linha 2: Tipo + Formato — sempre cheios */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tipo</label>
          <select className={inputClass} value={fase.tipo} onChange={e => update("tipo", e.target.value)}>
            <option value="mata_mata">Mata-Mata</option>
            <option value="grupo">Grupos</option>
            <option value="pontos_corridos">Pontos Corridos</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Formato</label>
          <select className={inputClass} value={fase.formato} onChange={e => update("formato", e.target.value)}>
            {isMata ? (
              <>
                <option value="ida_volta">Ida e Volta (2 jogos)</option>
                <option value="turno_unico">Jogo Único (1 jogo)</option>
              </>
            ) : (
              <>
                <option value="ida_volta">Ida e Volta</option>
                <option value="turno_unico">Turno Único</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Linha 3 — Mata-mata: desempate (full width para não ficar órfão) */}
      {isMata && (
        <div>
          <label className={labelClass}>Critério de desempate</label>
          <select className={inputClass} value={fase.desempate ?? "penalties"} onChange={e => update("desempate", e.target.value)}>
            <option value="penalties">Pênaltis</option>
            <option value="gol_fora">Gol Fora</option>
            <option value="tempo_extra">Tempo Extra + Pênaltis</option>
            <option value="nenhum">Nenhum</option>
          </select>
        </div>
      )}

      {/* Linhas 3-4 — Grupos: pares alinhados */}
      {isGrupo && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Qtd. de grupos</label>
              <input type="number" min={1} className={inputClass}
                value={fase.grupos ?? 4}
                onChange={e => update("grupos", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Times por grupo</label>
              <input type="number" min={2} className={inputClass}
                value={fase.times_por_grupo ?? 4}
                onChange={e => update("times_por_grupo", Number(e.target.value))} />
            </div>
          </div>
          {/* Classificados sozinho → full width */}
          <div>
            <label className={labelClass}>Classificados por grupo</label>
            <input type="number" min={1} className={inputClass}
              value={fase.classificados_por_grupo ?? 2}
              onChange={e => update("classificados_por_grupo", Number(e.target.value))} />
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────────────────────────────────────

export default function CompetitionSetupModal({ league, onClose, onSaved }) {
  // structure_json armazenado como { "2025": { tipo, fases }, "2024": { tipo, fases } }
  const stored = league.structure_json ?? {};

  // Estado da lista de anos (tela inicial quando já tem histórico)
  const anosExistentes = Object.keys(stored).sort((a, b) => b - a);
  const temHistorico   = anosExistentes.length > 0;

  // Fluxo: "lista" → "tipo" → "fases" → "review"
  const [step, setStep]       = useState(temHistorico ? "lista" : "tipo");
  const [ano, setAno]         = useState(String(CURRENT_YEAR));
  const [tipoComp, setTipoComp] = useState("");
  const [fases, setFases]     = useState([]);
  const [erros, setErros]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);

  // ─── abrir edição de um ano existente ───────────────────────────────────────
  const handleEditAno = (a) => {
    const cfg = stored[a];
    setAno(a);
    setTipoComp(cfg.tipo ?? "");
    setFases((cfg.fases ?? []).map(f => ({ ...f })));
    setErros([]);
    setStep("tipo");
  };

  const handleNovaConfig = () => {
    setAno(String(CURRENT_YEAR));
    setTipoComp("");
    setFases([]);
    setErros([]);
    setStep("tipo");
  };

  // ─── Handlers tipo/fases ────────────────────────────────────────────────────
  const handleSelectTipo = (tipo) => {
    setTipoComp(tipo);
    setFases(buildPresetFases(tipo));
    setErros([]);
  };

  const handleApplyPreset = (preset) => {
    setTipoComp(preset.tipo);
    setFases(preset.fases.map(f => ({ ...f })));
    setErros([]);
  };

  const handleFaseChange  = (index, updated) =>
    setFases(prev => { const c = [...prev]; c[index] = updated; return c; });
  const handleAddFase     = () => setFases(prev => [...prev, faseVazia()]);
  const handleRemoveFase  = (index) => setFases(prev => prev.filter((_, i) => i !== index));

  // ─── Navegação ──────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === "tipo") {
      if (!tipoComp || !ano) return;
      setStep("fases");
    } else if (step === "fases") {
      const e = validarEstrutura(fases);
      if (e.length) { setErros(e); return; }
      setErros([]);
      setStep("review");
    }
  };

  const handleBack = () => {
    if (step === "tipo")   setStep(temHistorico ? "lista" : "tipo");
    if (step === "fases")  setStep("tipo");
    if (step === "review") setStep("fases");
  };

  // ─── Salvar ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const e = validarEstrutura(fases);
    if (e.length) { setErros(e); setStep("fases"); return; }

    // Mescla o ano editado com os demais
    const structure = { ...stored, [ano]: { tipo: tipoComp, fases } };

    setLoading(true);
    try {
      await api.put(`/admin/leagues/${league.id_league}/structure`, { structure });
      setSaved(true);
      setTimeout(() => { onSaved?.(structure); onClose(); }, 700);
    } catch {
      alert("Erro ao salvar estrutura da competição");
    } finally {
      setLoading(false);
    }
  };

  // ─── Índice do step para a progress bar ─────────────────────────────────────
  const stepIdx = { tipo: 0, fases: 1, review: 2 }[step] ?? 0;
  const inFlow  = step !== "lista";

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
           onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7F33D9]/10 flex items-center justify-center">
              <Trophy size={18} className="text-[#7F33D9]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">{league.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Configurar estrutura da competição</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* ── Progress bar (só durante o fluxo) ── */}
        {inFlow && <ProgressBar stepIdx={stepIdx} />}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── LISTA DE ANOS ── */}
          {step === "lista" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">Histórico de configurações por edição:</p>
              <div className="space-y-2">
                {anosExistentes.map(a => {
                  const cfg = stored[a];
                  return (
                    <div key={a}
                         className="flex items-center justify-between p-3.5 border border-gray-200 rounded-xl bg-white hover:border-[#7F33D9]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#7F33D9]/10 flex items-center justify-center">
                          <Calendar size={15} className="text-[#7F33D9]" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-gray-900">{a}</span>
                          <span className="text-xs text-gray-400 ml-2">{tipoLabel(cfg.tipo)}</span>
                          <div className="text-xs text-gray-400">{cfg.fases?.length ?? 0} fase{cfg.fases?.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <button onClick={() => handleEditAno(a)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7F33D9] bg-[#7F33D9]/5 border border-[#7F33D9]/20 rounded-full hover:bg-[#7F33D9]/10 transition-colors">
                        <Pencil size={12} /> Editar
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={handleNovaConfig}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#7F33D9] hover:text-[#7F33D9] transition-colors mt-1">
                <Plus size={16} /> Nova configuração
              </button>
            </div>
          )}

          {/* ── STEP 1: Ano + Tipo ── */}
          {step === "tipo" && (
            <div className="space-y-4">
              {/* Ano */}
              <div>
                <label className={labelClass}>Edição / Ano</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  className={inputClass}
                  value={ano}
                  onChange={e => setAno(e.target.value)}
                  placeholder={String(CURRENT_YEAR)}
                />
                {stored[ano] && (
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={11} /> Já existe configuração para {ano}. Salvar irá substituí-la.
                  </p>
                )}
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => handleApplyPreset(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700 rounded-full hover:bg-amber-100 transition-colors">
                    <Info size={11} /> Usar padrão: {p.label}
                  </button>
                ))}
              </div>

              {/* Tipo */}
              <div>
                <label className={labelClass}>Formato da competição</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {COMPETITION_TYPES.map(t => (
                    <button key={t.value} onClick={() => handleSelectTipo(t.value)}
                            className={`text-left p-3.5 rounded-xl border transition-all ${
                              tipoComp === t.value
                                ? "border-[#7F33D9] bg-[#7F33D9]/5 text-[#7F33D9]"
                                : "border-gray-200 bg-white hover:border-[#7F33D9]/40 text-gray-700"
                            }`}>
                      <div className="font-semibold text-sm">{t.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Fases ── */}
          {step === "fases" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-500">
                  Configure as fases · <strong className="text-gray-700">{tipoLabel(tipoComp)}</strong>
                  <span className="ml-2 text-gray-400">({ano})</span>
                </p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {fases.length} fase{fases.length !== 1 ? "s" : ""}
                </span>
              </div>

              {erros.length > 0 && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <ul className="space-y-0.5">{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}

              <div className="space-y-3">
                {fases.map((fase, i) => (
                  <FaseCard key={i} fase={fase} index={i}
                    onChange={handleFaseChange} onRemove={handleRemoveFase} total={fases.length} />
                ))}
              </div>

              <button onClick={handleAddFase}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#7F33D9] hover:text-[#7F33D9] transition-colors">
                <Plus size={16} /> Adicionar fase
              </button>
            </div>
          )}

          {/* ── STEP 3: Revisão ── */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={15} className="text-[#7F33D9]" />
                  <span className="font-bold text-sm text-gray-900">{league.name}</span>
                  <span className="ml-auto text-xs font-semibold text-[#7F33D9] bg-[#7F33D9]/10 px-2 py-0.5 rounded-full">{ano}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Formato: <span className="font-semibold text-gray-700">{tipoLabel(tipoComp)}</span>
                </p>
                <div className="space-y-2">
                  {fases.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-[#7F33D9]/10 text-[#7F33D9] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{f.nome || `Fase ${i + 1}`}</span>
                        <span className="text-gray-400 ml-1.5">
                          {f.tipo === "grupo" ? "Grupos" : f.tipo === "pontos_corridos" ? "Pontos Corridos" : "Mata-Mata"}
                          {" · "}
                          {f.formato === "ida_volta" ? "Ida e Volta" : "Jogo Único"}
                          {f.tipo === "mata_mata" && f.desempate && f.desempate !== "nenhum"
                            ? ` · ${desempateLabel(f.desempate)}` : ""}
                          {f.tipo === "grupo"
                            ? ` · ${f.grupos} grupos × ${f.times_por_grupo} times (${f.classificados_por_grupo} avançam)` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">Ver JSON</summary>
                <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-xl overflow-auto text-[11px] leading-relaxed max-h-48">
                  {JSON.stringify({ [ano]: { tipo: tipoComp, fases } }, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div>
            {step === "lista" ? (
              <button onClick={onClose} className={btnSecondary}>Fechar</button>
            ) : (
              <button onClick={handleBack} className={btnSecondary}>
                <ChevronLeft size={16} /> Voltar
              </button>
            )}
          </div>
          <div>
            {step === "lista" && (
              <button onClick={handleNovaConfig} className={btnPrimary}>
                <Plus size={16} /> Nova configuração
              </button>
            )}
            {(step === "tipo" || step === "fases") && (
              <button onClick={handleNext}
                      disabled={step === "tipo" && (!tipoComp || !ano)}
                      className={btnPrimary}>
                Continuar <ChevronRight size={16} />
              </button>
            )}
            {step === "review" && (
              <button onClick={handleSave} disabled={loading || saved} className={btnPrimary}>
                {loading ? <Loader2 size={16} className="animate-spin" /> :
                 saved   ? <><Check size={16} /> Salvo!</> :
                 "Salvar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
