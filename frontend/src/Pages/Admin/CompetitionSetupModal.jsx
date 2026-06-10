import { Fragment, useState, useRef } from "react";
import { api } from "../../services/api";
import {
  X, ChevronRight, ChevronLeft, Check, Loader2,
  Trophy, AlertTriangle, Plus, Trash2, Info, Calendar, Pencil, Copy, GripVertical
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const COMPETITION_TYPES = [
  { value: "pontos_corridos",           label: "Pontos Corridos",        desc: "Todos jogam contra todos — ida e volta" },
  { value: "pontos_corridos_turno_unico", label: "Pontos Corridos (turno)", desc: "Todos jogam contra todos — uma vez" },
  { value: "mata_mata",                 label: "Mata-Mata",              desc: "Eliminação direta por fases" },
  { value: "grupos",                    label: "Grupos",                 desc: "Fase de grupos pura" },
  { value: "grupos_mata_mata",          label: "Grupos + Mata-Mata",     desc: "Grupos seguidos de eliminatória" },
  { value: "misto",                     label: "Misto",                  desc: "Combinação personalizada de fases" },
  { value: "apertura_clausura",         label: "Apertura / Clausura",    desc: "Dois torneios na mesma temporada" },
  { value: "personalizado",             label: "Personalizado",          desc: "Formato livre configurado manualmente" },
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
    { nome: "Fase de Grupos", tipo: "grupo",    formato: "ida_volta",   grupos: 4, times_por_grupo: 4, classificados_por_grupo: 2 },
    { nome: "Oitavas",        tipo: "mata_mata", formato: "ida_volta",  desempate: "gol_fora" },
    { nome: "Quartas",        tipo: "mata_mata", formato: "ida_volta",  desempate: "gol_fora" },
    { nome: "Semifinal",      tipo: "mata_mata", formato: "ida_volta",  desempate: "gol_fora" },
    { nome: "Final",          tipo: "mata_mata", formato: "turno_unico",desempate: "penalties" },
  ],
};

const DEFAULT_TORNEIO_FASES = [
  { nome: "Fase de Grupos", tipo: "grupo", formato: "ida_volta", grupos: 2, times_por_grupo: 15, classificados_por_grupo: 8 },
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

function buildDefaultTorneios() {
  return [
    { key: "apertura", nome: "Apertura", startDate: "", fases: DEFAULT_TORNEIO_FASES.map(f => ({ ...f })) },
    { key: "clausura", nome: "Clausura", startDate: "", fases: DEFAULT_TORNEIO_FASES.map(f => ({ ...f })) },
  ];
}

function buildPresetFases(tipoComp) {
  if (tipoComp === "pontos_corridos")
    return [{ nome: "Temporada Regular", tipo: "pontos_corridos", formato: "ida_volta" }];
  if (tipoComp === "pontos_corridos_turno_unico")
    return [{ nome: "Temporada Regular", tipo: "pontos_corridos", formato: "turno_unico" }];
  if (tipoComp === "mata_mata")        return FASE_DEFAULTS.mata_mata.map(f => ({ ...f }));
  if (tipoComp === "grupos_mata_mata") return FASE_DEFAULTS.grupos_mata_mata.map(f => ({ ...f }));
  if (tipoComp === "grupos")
    return [{ nome: "Fase de Grupos", tipo: "grupo", formato: "ida_volta", grupos: 4, times_por_grupo: 4, classificados_por_grupo: 2 }];
  return [faseVazia()];
}

function validarFases(fases, prefixo = "") {
  const erros = [];
  if (!fases || fases.length === 0) { erros.push(`${prefixo}Adicione ao menos uma fase.`); return erros; }
  fases.forEach((f, i) => {
    const id = `${prefixo}Fase ${i + 1}`;
    if (!f.nome?.trim()) erros.push(`${id}: nome obrigatório.`);
    if (f.tipo === "grupo") {
      if (!f.grupos || f.grupos < 1)                           erros.push(`${id}: número de grupos inválido.`);
      if (!f.times_por_grupo || f.times_por_grupo < 2)         erros.push(`${id}: times por grupo inválido.`);
      if (!f.classificados_por_grupo || f.classificados_por_grupo < 1) erros.push(`${id}: classificados por grupo inválido.`);
      if (f.classificados_por_grupo >= f.times_por_grupo)      erros.push(`${id}: classificados deve ser menor que times por grupo.`);
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
          <div className="flex flex-col items-center gap-1 shrink-0 w-20">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < stepIdx  ? "bg-[#7F33D9] text-white" :
              i === stepIdx ? "bg-[#7F33D9] text-white ring-4 ring-purple-100" :
                              "bg-gray-100 text-gray-400"
            }`}>
              {i < stepIdx ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-[11px] font-medium text-center leading-tight ${i === stepIdx ? "text-[#7F33D9]" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`flex-1 h-px mb-4 mx-1 rounded-full transition-colors ${i < stepIdx ? "bg-[#7F33D9]" : "bg-gray-200"}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FaseCard
// ─────────────────────────────────────────────────────────────────────────────

function FaseCard({ fase, index, onChange, onRemove, total, dragHandleProps, isDragging, isOver }) {
  const update = (key, val) => onChange(index, { ...fase, [key]: val });
  const isMata        = fase.tipo === "mata_mata";
  const isGrupo       = fase.tipo === "grupo";
  const isPontosCorr  = fase.tipo === "pontos_corridos";

  return (
    <div className={`border rounded-xl p-4 bg-gray-50/60 space-y-3 transition-all ${
      isDragging ? "opacity-40" : ""
    } ${isOver ? "border-[#7F33D9] ring-2 ring-[#7F33D9]/20" : "border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {total > 1 && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none">
              <GripVertical size={15} />
            </div>
          )}
          <span className="text-xs font-bold text-[#7F33D9] uppercase tracking-wide">Fase {index + 1}</span>
        </div>
        {total > 1 && (
          <button onClick={() => onRemove(index)} className="text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div>
        <label className={labelClass}>Nome da fase</label>
        <input className={inputClass} value={fase.nome} onChange={e => update("nome", e.target.value)} placeholder="Ex: Oitavas de Final" />
      </div>

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

      {isMata && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Desempate</label>
            <select className={inputClass} value={fase.desempate ?? "penalties"} onChange={e => update("desempate", e.target.value)}>
              <option value="penalties">Pênaltis</option>
              <option value="gol_fora">Gol Fora</option>
              <option value="tempo_extra">Tempo Extra + Pênaltis</option>
              <option value="nenhum">Nenhum</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Confrontos <span className="normal-case font-normal">(0 = auto)</span></label>
            <input type="number" min={0} className={inputClass} value={fase.confrontos ?? 0} onChange={e => update("confrontos", Number(e.target.value))} />
          </div>
        </div>
      )}

      {isGrupo && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Qtd. de grupos</label>
              <input type="number" min={1} className={inputClass} value={fase.grupos ?? 2} onChange={e => update("grupos", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Times por grupo</label>
              <input type="number" min={2} className={inputClass} value={fase.times_por_grupo ?? 15} onChange={e => update("times_por_grupo", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Classificados por grupo</label>
            <input type="number" min={1} className={inputClass} value={fase.classificados_por_grupo ?? 8} onChange={e => update("classificados_por_grupo", Number(e.target.value))} />
          </div>
        </>
      )}

      {isPontosCorr && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Classificados <span className="normal-case font-normal text-gray-400">(avançam)</span></label>
            <input type="number" min={0} className={inputClass} value={fase.classificados ?? 0} onChange={e => update("classificados", Number(e.target.value))} placeholder="0" />
          </div>
          <div>
            <label className={labelClass}>Rebaixados</label>
            <input type="number" min={0} className={inputClass} value={fase.rebaixados ?? 0} onChange={e => update("rebaixados", Number(e.target.value))} placeholder="0" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DraggableFaseList — lista de fases com drag & drop nativo
// ─────────────────────────────────────────────────────────────────────────────

function DraggableFaseList({ fases, onFasesChange, onFaseChange, onAddFase, onRemoveFase }) {
  const dragIdx = useRef(null);
  const [overIdx, setOverIdx] = useState(null);

  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const handleDrop      = (i) => {
    const from = dragIdx.current;
    if (from === null || from === i) { dragIdx.current = null; setOverIdx(null); return; }
    const reordered = [...fases];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(i, 0, moved);
    onFasesChange(reordered);
    dragIdx.current = null;
    setOverIdx(null);
  };
  const handleDragEnd = () => { dragIdx.current = null; setOverIdx(null); };

  return (
    <div className="space-y-3">
      {fases.map((fase, i) => (
        <div
          key={i}
          draggable={fases.length > 1}
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          onDragEnd={handleDragEnd}
        >
          <FaseCard
            fase={fase}
            index={i}
            onChange={onFaseChange}
            onRemove={onRemoveFase}
            total={fases.length}
            isDragging={dragIdx.current === i}
            isOver={overIdx === i && dragIdx.current !== i}
            dragHandleProps={{}}
          />
        </div>
      ))}
      <button onClick={onAddFase}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#7F33D9] hover:text-[#7F33D9] transition-colors">
        <Plus size={16} /> Adicionar fase
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TorneioPanel — painel de fases de um torneio (Apertura ou Clausura)
// ─────────────────────────────────────────────────────────────────────────────

function TorneioPanel({ torneio, color, onChange }) {
  const dragIdx = useRef(null);
  const [overIdx, setOverIdx] = useState(null);

  const updateFase = (i, updated) => {
    const fases = [...torneio.fases]; fases[i] = updated;
    onChange({ ...torneio, fases });
  };
  const removeFase    = (i) => onChange({ ...torneio, fases: torneio.fases.filter((_, idx) => idx !== i) });
  const addFase       = ()   => onChange({ ...torneio, fases: [...torneio.fases, faseVazia()] });
  const reorderFases  = (reordered) => onChange({ ...torneio, fases: reordered });

  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const handleDrop      = (i) => {
    const from = dragIdx.current;
    if (from === null || from === i) { dragIdx.current = null; setOverIdx(null); return; }
    const reordered = [...torneio.fases];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(i, 0, moved);
    reorderFases(reordered);
    dragIdx.current = null; setOverIdx(null);
  };
  const handleDragEnd = () => { dragIdx.current = null; setOverIdx(null); };

  return (
    <div className={`flex-1 min-w-0 border rounded-2xl p-4 space-y-3 ${color.border} ${color.bg}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color.dot}`} />
        <span className={`text-sm font-bold ${color.text}`}>{torneio.nome}</span>
        <span className="ml-auto text-[11px] text-gray-400">{torneio.fases.length} fase{torneio.fases.length !== 1 ? "s" : ""}</span>
      </div>

      <div>
        <label className={labelClass}>
          Início do torneio <span className="normal-case font-normal text-gray-400">(opcional)</span>
        </label>
        <input
          type="date"
          className={inputClass}
          value={torneio.startDate ?? ""}
          onChange={e => onChange({ ...torneio, startDate: e.target.value || undefined })}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Define a divisão exata entre os torneios — mais preciso que detecção automática.
        </p>
      </div>

      <div className="space-y-3">
        {torneio.fases.map((fase, i) => (
          <div
            key={i}
            draggable={torneio.fases.length > 1}
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
          >
            <FaseCard
              fase={fase}
              index={i}
              onChange={updateFase}
              onRemove={removeFase}
              total={torneio.fases.length}
              isDragging={dragIdx.current === i}
              isOver={overIdx === i && dragIdx.current !== i}
              dragHandleProps={{}}
            />
          </div>
        ))}
      </div>

      <button
        onClick={addFase}
        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-[#7F33D9] hover:text-[#7F33D9] transition-colors"
      >
        <Plus size={14} /> Adicionar fase
      </button>
    </div>
  );
}

const TORNEIO_COLORS = [
  { border: "border-violet-200", bg: "bg-violet-50/40", text: "text-violet-700", dot: "bg-violet-400" },
  { border: "border-blue-200",   bg: "bg-blue-50/40",   text: "text-blue-700",   dot: "bg-blue-400"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// ReviewFases — exibe lista de fases na revisão
// ─────────────────────────────────────────────────────────────────────────────

function ReviewFases({ fases }) {
  return (
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
              {f.tipo === "mata_mata" && f.desempate && f.desempate !== "nenhum" ? ` · ${desempateLabel(f.desempate)}` : ""}
              {f.tipo === "grupo" ? ` · ${f.grupos} grupos × ${f.times_por_grupo} times (${f.classificados_por_grupo} avançam)` : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────────────────────────────────────

export default function CompetitionSetupModal({ league, onClose, onSaved }) {
  const stored = league.structure_json ?? {};
  const anosExistentes = Object.keys(stored).filter(k => /^\d{4}$/.test(k)).sort((a, b) => b - a);
  const temHistorico = anosExistentes.length > 0;

  const [step, setStep] = useState(temHistorico ? "lista" : "tipo");
  const [ano, setAno] = useState(String(CURRENT_YEAR));
  const [tipoComp, setTipoComp] = useState("");

  // Para tipos simples (não apertura_clausura)
  const [fases, setFases] = useState([]);
  // Para apertura_clausura
  const [torneios, setTorneios] = useState(buildDefaultTorneios());

  const [continentalSpots, setContinentalSpots] = useState(0);
  const [relegationSpots, setRelegationSpots] = useState(0);
  // Logo da edição (ex: marca da Copa 2014) — fallback é a logo padrão da liga
  const [editionLogo, setEditionLogo] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [erros, setErros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const isAC = tipoComp === "apertura_clausura";

  // ─── editar ano existente ────────────────────────────────────────────────────
  const handleEditAno = (a) => {
    const cfg = stored[a];
    setAno(a);
    setTipoComp(cfg.tipo ?? "");
    if (cfg.tipo === "apertura_clausura") {
      setTorneios(cfg.torneios ? cfg.torneios.map(t => ({ ...t, fases: t.fases.map(f => ({ ...f })) })) : buildDefaultTorneios());
      setFases([]);
    } else {
      setFases((cfg.fases ?? []).map(f => ({ ...f })));
      setTorneios(buildDefaultTorneios());
    }
    setContinentalSpots(cfg.continental_spots ?? 0);
    setRelegationSpots(cfg.relegation_spots ?? 0);
    setEditionLogo(cfg.edition_logo ?? "");
    setErros([]);
    setStep("tipo");
  };

  const handleRemoveAno = async (a) => {
    if (!window.confirm(`Remover a edição ${a}?`)) return;
    const { [a]: _dropped, ...rest } = stored;
    const cleaned = Object.fromEntries(Object.entries(rest).filter(([k]) => /^\d{4}$/.test(k)));
    setLoading(true);
    try {
      await api.put(`/admin/leagues/${league.id_league}/structure`, { structure: cleaned });
      onSaved?.(cleaned);
      onClose();
    } catch { alert("Erro ao remover edição"); }
    finally { setLoading(false); }
  };

  const handleNovaConfig = () => {
    setAno(String(CURRENT_YEAR));
    setTipoComp("");
    setFases([]);
    setTorneios(buildDefaultTorneios());
    setContinentalSpots(0);
    setRelegationSpots(0);
    setEditionLogo("");
    setErros([]);
    setStep("tipo");
  };

  const handleDuplicarAno = (a) => {
    const cfg = stored[a];
    setAno("");
    setTipoComp(cfg.tipo ?? "");
    if (cfg.tipo === "apertura_clausura") {
      setTorneios(cfg.torneios ? cfg.torneios.map(t => ({ ...t, fases: t.fases.map(f => ({ ...f })) })) : buildDefaultTorneios());
      setFases([]);
    } else {
      setFases((cfg.fases ?? []).map(f => ({ ...f })));
      setTorneios(buildDefaultTorneios());
    }
    setContinentalSpots(cfg.continental_spots ?? 0);
    setRelegationSpots(cfg.relegation_spots ?? 0);
    setEditionLogo(""); // duplicação não copia logo — cada edição tem a sua
    setErros([]);
    setStep("tipo");
  };

  // ─── upload da logo da edição ────────────────────────────────────────────────
  const handleEditionLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !ano) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", `${league.slug || league.id_league}_${ano}`);
      const { data } = await api.post("/admin/editions/upload-logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditionLogo(data.url);
    } catch { alert("Erro ao enviar a logo da edição."); }
    finally { setUploadingLogo(false); }
  };

  // ─── selecionar tipo ─────────────────────────────────────────────────────────
  const handleSelectTipo = (tipo) => {
    setTipoComp(tipo);
    if (tipo === "apertura_clausura") {
      setTorneios(buildDefaultTorneios());
      setFases([]);
    } else {
      setFases(buildPresetFases(tipo));
      setTorneios(buildDefaultTorneios());
    }
    setErros([]);
  };

  // ─── handlers fases (tipos simples) ─────────────────────────────────────────
  const handleFaseChange  = (i, upd) => setFases(prev => { const c = [...prev]; c[i] = upd; return c; });
  const handleAddFase     = ()       => setFases(prev => [...prev, faseVazia()]);
  const handleRemoveFase  = (i)      => setFases(prev => prev.filter((_, idx) => idx !== i));

  // ─── navegação ───────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === "tipo") {
      if (!tipoComp || !ano) return;
      setStep("fases");
    } else if (step === "fases") {
      let e = [];
      if (isAC) {
        torneios.forEach(t => {
          e = [...e, ...validarFases(t.fases, `${t.nome} → `)];
        });
      } else {
        e = validarFases(fases);
      }
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

  // ─── salvar ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    let e = [];
    if (isAC) {
      torneios.forEach(t => { e = [...e, ...validarFases(t.fases, `${t.nome} → `)]; });
    } else {
      e = validarFases(fases);
    }
    if (e.length) { setErros(e); setStep("fases"); return; }

    const anoConfig = isAC
      ? { tipo: tipoComp, torneios, continental_spots: continentalSpots || 0, relegation_spots: relegationSpots || 0 }
      : { tipo: tipoComp, fases,   continental_spots: continentalSpots || 0, relegation_spots: relegationSpots || 0 };
    if (editionLogo.trim()) anoConfig.edition_logo = editionLogo.trim();

    const structure = { ...stored, [ano]: anoConfig };

    setLoading(true);
    try {
      await api.put(`/admin/leagues/${league.id_league}/structure`, { structure });
      setSaved(true);
      setTimeout(() => { onSaved?.(structure); onClose(); }, 700);
    } catch { alert("Erro ao salvar estrutura da competição"); }
    finally { setLoading(false); }
  };

  const stepIdx = { tipo: 0, fases: 1, review: 2 }[step] ?? 0;
  const inFlow  = step !== "lista";

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`bg-white rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] w-full ${
          step === "fases" && isAC ? "max-w-4xl" : "max-w-2xl"
        }`}
        onClick={e => e.stopPropagation()}
      >
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
                  const nFases = cfg.tipo === "apertura_clausura"
                    ? (cfg.torneios ?? []).reduce((acc, t) => acc + (t.fases?.length ?? 0), 0)
                    : (cfg.fases?.length ?? 0);
                  return (
                    <div key={a} className="flex items-center justify-between p-3.5 border border-gray-200 rounded-xl bg-white hover:border-[#7F33D9]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#7F33D9]/10 flex items-center justify-center">
                          <Calendar size={15} className="text-[#7F33D9]" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-gray-900">{a}</span>
                          <span className="text-xs text-gray-400 ml-2">{tipoLabel(cfg.tipo)}</span>
                          <div className="flex flex-wrap gap-x-3 mt-0.5">
                            <span className="text-xs text-gray-400">{nFases} fase{nFases !== 1 ? "s" : ""}</span>
                            {cfg.continental_spots > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">{cfg.continental_spots} vaga{cfg.continental_spots !== 1 ? "s" : ""} continental</span>
                            )}
                            {cfg.relegation_spots > 0 && (
                              <span className="text-xs text-red-500 font-medium">{cfg.relegation_spots} rebaixamento{cfg.relegation_spots !== 1 ? "s" : ""}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditAno(a)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7F33D9] bg-[#7F33D9]/5 border border-[#7F33D9]/20 rounded-full hover:bg-[#7F33D9]/10 transition-colors">
                          <Pencil size={12} /> Editar
                        </button>
                        <button onClick={() => handleDuplicarAno(a)} title="Duplicar" className="flex items-center justify-center w-7 h-7 text-gray-400 border border-gray-200 rounded-full hover:text-[#7F33D9] hover:border-[#7F33D9]/30 hover:bg-[#7F33D9]/5 transition-colors">
                          <Copy size={13} />
                        </button>
                        <button onClick={() => handleRemoveAno(a)} className="flex items-center justify-center w-7 h-7 text-gray-300 border border-gray-200 rounded-full hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={handleNovaConfig} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#7F33D9] hover:text-[#7F33D9] transition-colors mt-1">
                <Plus size={16} /> Nova configuração
              </button>
            </div>
          )}

          {/* ── STEP 1: Ano + Tipo ── */}
          {step === "tipo" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Edição / Ano</label>
                <input type="number" min={1900} max={2100} className={inputClass} value={ano}
                  onChange={e => setAno(e.target.value)} placeholder={String(CURRENT_YEAR)} />
                {!ano && (
                  <p className="mt-1 text-xs text-[#7F33D9] flex items-center gap-1">
                    <Info size={11} /> Informe o ano para esta edição.
                  </p>
                )}
                {ano && stored[ano] && (
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={11} /> Já existe configuração para {ano}. Salvar irá substituí-la.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Vagas continentais</label>
                  <input type="number" min={0} className={inputClass} value={continentalSpots}
                    onChange={e => setContinentalSpots(Number(e.target.value))} placeholder="0" />
                </div>
                <div>
                  <label className={labelClass}>Rebaixamentos</label>
                  <input type="number" min={0} className={inputClass} value={relegationSpots}
                    onChange={e => setRelegationSpots(Number(e.target.value))} placeholder="0" />
                </div>
              </div>

              {/* Logo da edição — fallback é a logo padrão da liga */}
              <div>
                <label className={labelClass}>Logo da edição <span className="text-gray-300 normal-case font-normal tracking-normal">(opcional — sem logo, usa a marca padrão da liga)</span></label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                    {uploadingLogo
                      ? <Loader2 size={16} className="animate-spin text-[#7F33D9]" />
                      : editionLogo
                        ? <img src={editionLogo} alt="logo da edição" className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display = "none"; }} />
                        : <Trophy size={18} className="text-gray-300" />}
                  </div>
                  <input type="text" className={inputClass} placeholder="https://... (URL da marca desta edição)"
                    value={editionLogo} onChange={e => setEditionLogo(e.target.value)} />
                  <label className={`shrink-0 px-3 py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${ano ? "border-[#7F33D9]/30 text-[#7F33D9] hover:bg-[#7F33D9]/5" : "border-gray-200 text-gray-300 cursor-not-allowed"}`}>
                    {uploadingLogo ? "Enviando…" : "Upload"}
                    <input type="file" accept="image/*" className="hidden" disabled={!ano || uploadingLogo} onChange={handleEditionLogoUpload} />
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}>Formato da competição</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {COMPETITION_TYPES.map(t => (
                    <button key={t.value} onClick={() => handleSelectTipo(t.value)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${tipoComp === t.value
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
              </div>

              {erros.length > 0 && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <ul className="space-y-0.5">{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}

              {/* Apertura / Clausura: dois painéis lado a lado */}
              {isAC ? (
                <div className="flex gap-4">
                  {torneios.map((t, i) => (
                    <TorneioPanel
                      key={t.key}
                      torneio={t}
                      color={TORNEIO_COLORS[i % TORNEIO_COLORS.length]}
                      onChange={updated => setTorneios(prev => prev.map((x, idx) => idx === i ? updated : x))}
                    />
                  ))}
                </div>
              ) : (
                <DraggableFaseList
                  fases={fases}
                  onFasesChange={setFases}
                  onFaseChange={handleFaseChange}
                  onAddFase={handleAddFase}
                  onRemoveFase={handleRemoveFase}
                />
              )}
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

                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                  <p className="text-xs text-gray-500">
                    Formato: <span className="font-semibold text-gray-700">{tipoLabel(tipoComp)}</span>
                  </p>
                  {continentalSpots > 0 && (
                    <p className="text-xs text-emerald-600 font-medium">{continentalSpots} vaga{continentalSpots !== 1 ? "s" : ""} continental</p>
                  )}
                  {relegationSpots > 0 && (
                    <p className="text-xs text-red-500 font-medium">{relegationSpots} rebaixamento{relegationSpots !== 1 ? "s" : ""}</p>
                  )}
                </div>

                {isAC ? (
                  <div className="flex gap-4">
                    {torneios.map((t, i) => (
                      <div key={t.key} className={`flex-1 p-3 rounded-xl border ${TORNEIO_COLORS[i % TORNEIO_COLORS.length].border} ${TORNEIO_COLORS[i % TORNEIO_COLORS.length].bg}`}>
                        <p className={`text-xs font-bold mb-2 ${TORNEIO_COLORS[i % TORNEIO_COLORS.length].text}`}>{t.nome}</p>
                        <ReviewFases fases={t.fases} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <ReviewFases fases={fases} />
                )}
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">Ver JSON</summary>
                <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-xl overflow-auto text-[11px] leading-relaxed max-h-48">
                  {JSON.stringify({
                    [ano]: isAC
                      ? { tipo: tipoComp, torneios, continental_spots: continentalSpots, relegation_spots: relegationSpots }
                      : { tipo: tipoComp, fases,    continental_spots: continentalSpots, relegation_spots: relegationSpots }
                  }, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div>
            {step === "lista"
              ? <button onClick={onClose} className={btnSecondary}>Fechar</button>
              : <button onClick={handleBack} className={btnSecondary}><ChevronLeft size={16} /> Voltar</button>
            }
          </div>
          <div>
            {step === "lista" && (
              <button onClick={handleNovaConfig} className={btnPrimary}><Plus size={16} /> Nova configuração</button>
            )}
            {(step === "tipo" || step === "fases") && (
              <button onClick={handleNext} disabled={step === "tipo" && (!tipoComp || !ano)} className={btnPrimary}>
                Continuar <ChevronRight size={16} />
              </button>
            )}
            {step === "review" && (
              <button onClick={handleSave} disabled={loading || saved} className={btnPrimary}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : saved ? <><Check size={16} /> Salvo!</> : "Salvar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
