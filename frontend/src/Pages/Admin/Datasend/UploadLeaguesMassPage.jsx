import { useState } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, FileSpreadsheet, ArrowRight,
  CheckCircle2, AlertCircle, XCircle, RefreshCw, Trophy,
} from "lucide-react";

const btnPrimary =
  "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const btnSecondary =
  "flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";

const STATUS_CONFIG = {
  insert: { label: "Novo",      bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200", icon: <CheckCircle2 size={12} /> },
  update: { label: "Atualizar", bg: "bg-blue-50",     text: "text-blue-700",     border: "border-blue-200",    icon: <RefreshCw size={12} />   },
  error:  { label: "Erro",      bg: "bg-red-50",      text: "text-red-700",      border: "border-red-200",     icon: <XCircle size={12} />     },
};

export default function UploadLeaguesMassPage() {
  const [file, setFile]           = useState(null);
  const [step, setStep]           = useState("upload"); // upload | preview | done
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview]     = useState(null);   // { preview: [], summary: {} }
  const [result, setResult]       = useState(null);   // { inserted, updated, skipped, errors, total }

  function reset() {
    setFile(null);
    setStep("upload");
    setPreview(null);
    setResult(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      setAnalyzing(true);
      const { data } = await api.post("/upload/import/leagues/preview", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data);
      setStep("preview");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao analisar o arquivo.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    const ok = window.confirm(
      `Confirmar importação de ${preview.summary.total} competições?\n\n` +
      `• ${preview.summary.insert} novas\n` +
      `• ${preview.summary.update} atualizações\n` +
      `• ${preview.summary.error} com erro (serão ignoradas)`
    );
    if (!ok) return;

    const form = new FormData();
    form.append("file", file);
    try {
      setImporting(true);
      const { data } = await api.post("/upload/import/leagues", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      setStep("done");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro na importação.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <Trophy className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Importação em Massa — Competições</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-lg mx-auto">
          Carregue o CSV de competições (delimitado por ponto-e-vírgula) para inserir ou atualizar ligas em lote.
        </p>
      </div>

      {/* ── STEP 1: UPLOAD ── */}
      {step === "upload" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 text-center animate-in zoom-in-95 duration-300 max-w-xl mx-auto">
          <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
            <input
              type="file"
              accept=".csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                <UploadCloud className="text-gray-400 w-7 h-7 group-hover:text-[#7F33D9]" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-700 group-hover:text-[#7F33D9] transition-colors">
                  {file ? file.name : "Clique para selecionar"}
                </span>
                <p className="text-sm text-gray-400 mt-1">Apenas arquivos .csv (ponto-e-vírgula)</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <button onClick={handleAnalyze} disabled={analyzing || !file} className={`${btnPrimary} min-w-[200px]`}>
              {analyzing ? <><Loader2 className="animate-spin w-5 h-5" /> Analisando...</> : <>Analisar Arquivo <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: PREVIEW ── */}
      {step === "preview" && preview && (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">

          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard label="Total" value={preview.summary.total} color="gray" />
            <SummaryCard label="Novos" value={preview.summary.insert} color="emerald" />
            <SummaryCard label="Atualizações" value={preview.summary.update} color="blue" />
            <SummaryCard label="Erros" value={preview.summary.error} color="red" />
          </div>

          {/* Aviso de erros */}
          {preview.summary.error > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-amber-800 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>
                <strong>{preview.summary.error} linha(s)</strong> com país não encontrado serão <strong>ignoradas</strong> na importação.
                Verifique os nomes na coluna "País" e confirme se estão cadastrados no sistema.
              </span>
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <FileSpreadsheet size={18} className="text-[#7F33D9]" />
              <span className="font-bold text-gray-800 text-sm">{file?.name}</span>
              <span className="ml-auto text-xs text-gray-400">{preview.preview.length} linhas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Status","País","Competição","Nível","Fórmula","Organizador","Slug","Anos Cancelados"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.preview.map((row, i) => {
                    const s = STATUS_CONFIG[row.status];
                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
                            {s.icon}{s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{row.country_name}</span>
                          {!row.id_country && <span className="ml-1 text-red-400 text-xs">(não encontrado)</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 truncate max-w-[180px]" title={row.name}>{row.name}</div>
                          {row.description && <div className="text-xs text-gray-400 truncate max-w-[180px]" title={row.description}>{row.description}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <TierBadge tier={row.tier} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.format || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.organizer || "—"}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">{row.slug || "—"}</td>
                        <td className="px-4 py-3">
                          {row.cancelled_years.length > 0
                            ? <div className="flex flex-wrap gap-1">
                                {row.cancelled_years.map((y) => (
                                  <span key={y} className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-semibold">{y}</span>
                                ))}
                              </div>
                            : <span className="text-gray-300 text-xs">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between items-center pt-2">
            <button onClick={reset} className={btnSecondary}>Cancelar</button>
            <button
              onClick={handleImport}
              disabled={importing || (preview.summary.insert + preview.summary.update) === 0}
              className={btnPrimary}
            >
              {importing
                ? <><Loader2 className="animate-spin w-5 h-5" /> Importando...</>
                : <>Confirmar Importação <ArrowRight size={18} /></>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: RESULTADO ── */}
      {step === "done" && result && (
        <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-300">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-8 py-6 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600 w-6 h-6" />
              <h2 className="text-lg font-bold text-emerald-800">Importação concluída!</h2>
            </div>
            <div className="p-8 space-y-4">
              <ResultLine label="Total processado" value={result.total} />
              <ResultLine label="Inseridas"         value={result.inserted} color="emerald" />
              <ResultLine label="Atualizadas"        value={result.updated}  color="blue" />
              <ResultLine label="Ignoradas (sem país)" value={result.skipped} color="gray" />
              {result.errors?.length > 0 && (
                <div className="mt-4 bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="text-xs font-bold text-red-700 mb-2 uppercase tracking-wide">Erros ({result.errors.length})</p>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600 flex gap-2">
                        <XCircle size={12} className="shrink-0 mt-0.5" />
                        <span><strong>{e.name}</strong> — {e.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pt-4">
                <button onClick={reset} className={`${btnPrimary} w-full`}>Nova Importação</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    gray:    "bg-gray-50   border-gray-200   text-gray-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue:    "bg-blue-50   border-blue-200   text-blue-700",
    red:     "bg-red-50    border-red-200    text-red-700",
  };
  return (
    <div className={`rounded-2xl border p-5 text-center ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wide mt-1 opacity-80">{label}</div>
    </div>
  );
}

function TierBadge({ tier }) {
  if (!tier) return <span className="text-gray-300">—</span>;
  const isCopa = isNaN(Number(tier));
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
      ${isCopa
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-purple-50 text-purple-700 border-purple-200"
      }`}>
      {isCopa ? tier : `Tier ${tier}`}
    </span>
  );
}

function ResultLine({ label, value, color }) {
  const textColor = color === "emerald" ? "text-emerald-600" : color === "blue" ? "text-blue-600" : "text-gray-900";
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-lg font-bold ${textColor}`}>{value}</span>
    </div>
  );
}
