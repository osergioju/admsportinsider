import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, FileSpreadsheet, CheckCircle2,
  AlertCircle, Trophy, Globe, ArrowRight,
} from "lucide-react";

const btnPrimary   = "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const btnSecondary = "flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
const inputClass   = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all text-gray-700";
const labelClass   = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

const SPHERE_LABEL = { global: "Global", continental: "Continental", nacional: "Nacional" };

export default function UploadFederationFinancialPage() {
  const [file, setFile]       = useState(null);
  const [step, setStep]       = useState("upload"); // upload | preview | done
  const [sheet, setSheet]     = useState("Fifa");
  const [leagueId, setLeagueId] = useState("");
  const [leagues, setLeagues] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState(null);

  useEffect(() => {
    api.get("/admin/leagues?limit=1000").then(({ data }) => {
      // Só ligas sem país (continentais/globais)
      const filtered = (data.leagues || []).filter(l => !l.id_country);
      setLeagues(filtered);
    }).catch(console.error);
  }, []);

  const reset = () => {
    setFile(null); setStep("upload"); setPreview(null);
    setError(""); setResult(null); setLeagueId("");
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sheet", sheet);
      if (leagueId) fd.append("id_league", leagueId);
      const { data } = await api.post("/admin/federation-financial/preview", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao processar arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sheet", sheet);
      if (leagueId) fd.append("id_league", leagueId);
      const { data } = await api.post("/admin/federation-financial/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao importar.");
    } finally {
      setLoading(false);
    }
  };

  const selectedLeague = leagues.find(l => String(l.id_league) === String(leagueId));

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-400">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe size={18} className="text-[#7F33D9]" />
          <span className="text-xs font-semibold text-[#7F33D9] uppercase tracking-widest">Upload Financeiro</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Copa do Mundo / Competições de Federação</h1>
        <p className="text-gray-500 text-sm mt-1">
          Importa dados financeiros por edição (Copa 2006, Copa 2014…). Mesmo formato da Copa do Mundo serve para Euro e Copa América.
        </p>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">

          {/* Arquivo */}
          <div>
            <label className={labelClass}>Arquivo Excel (.xlsx)</label>
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl py-10 cursor-pointer hover:border-[#7F33D9] hover:bg-purple-50/20 transition-all">
              {file
                ? <><FileSpreadsheet size={28} className="text-[#7F33D9]" /><span className="text-sm font-medium text-gray-700">{file.name}</span></>
                : <><UploadCloud size={28} className="text-gray-400" /><span className="text-sm text-gray-400">Clique ou arraste o arquivo aqui</span></>
              }
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {/* Sheet name */}
          <div>
            <label className={labelClass}>Nome da sheet</label>
            <input
              type="text"
              className={inputClass}
              value={sheet}
              onChange={e => setSheet(e.target.value)}
              placeholder="ex: Fifa, Euro, Copa América"
            />
            <p className="text-xs text-gray-400 mt-1">Nome exato da aba do Excel com os dados financeiros. Se o arquivo tiver uma única aba, ela é usada automaticamente.</p>
          </div>

          {/* Liga vinculada (opcional) */}
          <div>
            <label className={labelClass}>Competição no sistema <span className="text-gray-300 normal-case font-normal tracking-normal">(opcional — vincula edições)</span></label>
            <select
              className={inputClass}
              value={leagueId}
              onChange={e => setLeagueId(e.target.value)}
            >
              <option value="">Sem vínculo</option>
              {leagues.map(l => (
                <option key={l.id_league} value={l.id_league}>
                  {l.name} {l.continent_name ? `· ${l.continent_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500 font-medium flex items-center gap-2"><AlertCircle size={14}/>{error}</p>}

          <button onClick={handlePreview} disabled={!file || loading} className={btnPrimary}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Analisando…</> : <><ArrowRight size={16} /> Analisar arquivo</>}
          </button>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && preview && (
        <div className="space-y-5">
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Pré-visualização</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sheet <strong>{preview.sheetName}</strong> · {preview.totalIndicators} indicadores · {preview.editions.length} edições
                  {selectedLeague && <> · vinculado a <strong>{selectedLeague.name}</strong></>}
                </p>
              </div>
              <button onClick={reset} className={btnSecondary}>Trocar arquivo</button>
            </div>

            {/* Editions table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Edição</th>
                    <th className="text-left pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Slug</th>
                    <th className="text-left pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Anos</th>
                    <th className="text-left pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Moeda</th>
                    <th className="text-right pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Linhas</th>
                    <th className="text-right pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.editions.map(ed => (
                    <tr key={ed.slug} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 font-medium text-gray-800">{ed.name || ed.slug}</td>
                      <td className="py-2.5 text-gray-400 font-mono text-xs">
                        {ed.slug}
                        {ed.matchedSlug && <span className="block text-[10px] text-emerald-600">→ {ed.matchedSlug}</span>}
                      </td>
                      <td className="py-2.5 text-gray-500 text-xs">{ed.years?.[0]}–{ed.years?.[ed.years.length - 1]}</td>
                      <td className="py-2.5 text-gray-500">{ed.currency}</td>
                      <td className="py-2.5 text-right text-gray-700 font-medium">{ed.rows}</td>
                      <td className="py-2.5 text-right">
                        {ed.exists
                          ? <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">Atualizar</span>
                          : <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">Novo</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium flex items-center gap-2 px-1"><AlertCircle size={14}/>{error}</p>}

          <div className="flex gap-3">
            <button onClick={reset} className={btnSecondary}>Cancelar</button>
            <button onClick={handleImport} disabled={loading} className={`${btnPrimary} flex-1`}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Importando…</>
                : <><Trophy size={16} /> Confirmar importação</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && result && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Importação concluída!</h2>
          <p className="text-gray-500 text-sm">
            <strong>{result.editions}</strong> edições · <strong>{result.rows?.toLocaleString("pt-BR")}</strong> registros financeiros
          </p>
          <button onClick={reset} className={`${btnPrimary} mx-auto`}>Nova importação</button>
        </div>
      )}
    </div>
  );
}
