import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle,
  ArrowRight, Table, XCircle, AlertTriangle, Shield,
} from "lucide-react";
import SearchableSelect from "../../../components/uxui/SearchableSelect";

const btnPrimary = "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const selectClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all text-gray-700";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

export default function SendLeaguePage() {
  const [file, setFile]           = useState(null);
  const [step, setStep]           = useState("upload"); // upload | mapping | clubs | done
  const [analysis, setAnalysis]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [leagues, setLeagues]         = useState([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [mapping, setMapping] = useState({ leagueId: "", years: [] });

  // Step clubs
  const [clubPreview, setClubPreview] = useState(null); // { foundClubs, notFoundSlugs, allClubsGrouped }
  const [clubMappings, setClubMappings] = useState({}); // { csvSlug: id_club }

  useEffect(() => {
    if (step !== "mapping") return;
    async function loadLeagues() {
      try {
        setLoadingLeagues(true);
        const { data } = await api.get("/admin/leagues?limit=1000");
        setLeagues(data.leagues);
      } catch { /* ignore */ } finally { setLoadingLeagues(false); }
    }
    loadLeagues();
  }, [step]);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/upload/xlsx/analyze", form, { headers: { "Content-Type": "multipart/form-data" } });
      setAnalysis(data);
      setStep("mapping");
    } catch { alert("Erro ao ler o arquivo"); } finally { setUploading(false); }
  }

  async function handlePreviewClubs() {
    if (!file || !mapping.years.length) return;
    setPreviewing(true);
    const form = new FormData();
    form.append("file", file);
    form.append("years", JSON.stringify(mapping.years));
    try {
      const { data } = await api.post("/upload/xlsx/preview-clubs", form, { headers: { "Content-Type": "multipart/form-data" } });
      setClubPreview(data);
      // Pré-popula com o que já foi resolvido automaticamente
      const init = {};
      for (const slug of data.notFoundSlugs) init[slug] = "";
      setClubMappings(init);
      setStep("clubs");
    } catch { alert("Erro ao analisar clubes."); } finally { setPreviewing(false); }
  }

  async function handleConfirmImport() {
    if (!file || !selectedSheet || !mapping.leagueId) { alert("Mapeamento incompleto."); return; }
    if (!window.confirm("Confirma a importação? Os dados serão gravados no banco.")) return;

    setImporting(true);
    const activeMappings = Object.fromEntries(Object.entries(clubMappings).filter(([, v]) => v !== ""));
    const form = new FormData();
    form.append("file", file);
    form.append("sheetName", selectedSheet);
    form.append("leagueId", mapping.leagueId);
    form.append("years", JSON.stringify(mapping.years));
    if (Object.keys(activeMappings).length) form.append("clubMappings", JSON.stringify(activeMappings));
    try {
      await api.post("/upload/xlsx/import-country", form, { headers: { "Content-Type": "multipart/form-data" } });
      setStep("done");
    } catch (err) {
      alert(err?.response?.data?.message || "Erro ao importar dados da liga.");
    } finally { setImporting(false); }
  }

  function toggleYear(year) {
    setMapping(prev => ({
      ...prev,
      years: prev.years.includes(year) ? prev.years.filter(y => y !== year) : [...prev.years, year],
    }));
  }

  function reset() {
    setFile(null); setStep("upload"); setAnalysis(null);
    setSelectedSheet(null); setMapping({ leagueId: "", years: [] });
    setClubPreview(null); setClubMappings({});
  }

  const currentSheet = analysis?.sheets.find(s => s.sheetName === selectedSheet);
  const unmappedCount = clubPreview?.notFoundSlugs.filter(s => !clubMappings[s]).length ?? 0;
  const canImport = mapping.leagueId && selectedSheet && mapping.years.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <FileSpreadsheet className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Importação Financeira</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
          Carregue planilhas de balanços financeiros para alimentar os dados das ligas e clubes.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 justify-center text-xs font-bold text-gray-400">
        {["upload","mapping","clubs","done"].map((s, i, arr) => (
          <span key={s} className="flex items-center gap-2">
            <span className={step === s ? "text-[#7F33D9]" : step === "done" && s !== "done" ? "text-green-500" : ""}>
              {i + 1}. {s === "upload" ? "Arquivo" : s === "mapping" ? "Liga & Anos" : s === "clubs" ? "Clubes" : "Concluído"}
            </span>
            {i < arr.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* STEP 1 — UPLOAD */}
        {step === "upload" && (
          <div className="p-8 text-center space-y-6">
            <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
              <input type="file" accept=".xlsx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={e => setFile(e.target.files[0])} />
              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${file ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400 group-hover:text-[#7F33D9]"}`}>
                  {file ? <CheckCircle2 className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
                </div>
                <span className={`text-sm font-semibold ${file ? "text-green-600" : "text-gray-600 group-hover:text-[#7F33D9]"}`}>
                  {file ? file.name : "Clique para selecionar (.xlsx)"}
                </span>
              </div>
            </div>
            <div className="flex justify-center">
              <button onClick={handleUpload} disabled={uploading || !file} className={btnPrimary}>
                {uploading ? <><Loader2 className="animate-spin w-4 h-4" /> Processando...</> : <>Ler Arquivo <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — MAPPING (liga, aba, anos) */}
        {step === "mapping" && analysis && (
          <div className="animate-in fade-in">
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">Arquivo carregado</p>
                <p className="text-xs text-gray-500">{file?.name}</p>
              </div>
            </div>
            <div className="p-8 space-y-7">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Aba da Planilha</label>
                  <div className="relative">
                    <select className={selectClass} value={selectedSheet || ""} onChange={e => { setSelectedSheet(e.target.value); setMapping(m => ({ ...m, years: [] })); }}>
                      <option value="">Selecione...</option>
                      {analysis.sheets.map(s => <option key={s.sheetName} value={s.sheetName}>{s.sheetName}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-gray-400"><Table size={15} /></div>
                  </div>
                </div>
                {selectedSheet && (
                  <div className="animate-in fade-in">
                    <label className={labelClass}>Vincular à Competição</label>
                    <select className={selectClass} value={mapping.leagueId} onChange={e => setMapping(m => ({ ...m, leagueId: e.target.value }))} disabled={loadingLeagues}>
                      <option value="">Selecione...</option>
                      {leagues.map(l => <option key={l.id_league} value={l.id_league}>{l.name}</option>)}
                    </select>
                    {loadingLeagues && <p className="text-xs text-purple-500 mt-1 animate-pulse">Carregando competições...</p>}
                  </div>
                )}
              </div>

              {currentSheet?.detectedYears?.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle size={15} className="text-[#7F33D9]" /> Anos para importar
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {currentSheet.detectedYears.map(year => {
                      const sel = mapping.years.includes(year);
                      return (
                        <label key={year} className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border transition-all select-none ${sel ? "bg-[#7F33D9] border-[#7F33D9] text-white shadow-md shadow-purple-500/20" : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50"}`}>
                          <input type="checkbox" className="hidden" checked={sel} onChange={() => toggleYear(year)} />
                          <span className="font-medium text-sm">{year}</span>
                          {sel && <CheckCircle2 size={13} />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handlePreviewClubs} disabled={previewing || !canImport} className={btnPrimary}>
                  {previewing ? <><Loader2 className="animate-spin w-4 h-4" /> Analisando clubes...</> : <>Verificar Clubes <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — CLUBES */}
        {step === "clubs" && clubPreview && (
          <div className="animate-in fade-in">
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <Shield size={18} className="text-[#7F33D9] shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">Verificação de Clubes</p>
                <p className="text-xs text-gray-500">Anos: {mapping.years.join(", ")}</p>
              </div>
              <button onClick={() => setStep("mapping")} className="ml-auto text-xs text-gray-400 hover:text-[#7F33D9] font-medium underline underline-offset-2">← Voltar</button>
            </div>
            <div className="p-8 space-y-5">
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="text-[10px] uppercase font-black text-green-400 mb-1">Encontrados</p>
                  <p className="text-xl font-bold text-green-600">{clubPreview.foundClubs.length}</p>
                  <p className="text-[10px] text-green-500 mt-0.5">clubes reconhecidos</p>
                </div>
                <div className={`p-3 rounded-2xl border ${clubPreview.notFoundSlugs.length > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
                  <p className={`text-[10px] uppercase font-black mb-1 ${clubPreview.notFoundSlugs.length > 0 ? "text-amber-400" : "text-green-400"}`}>Não encontrados</p>
                  <p className={`text-xl font-bold ${clubPreview.notFoundSlugs.length > 0 ? "text-amber-600" : "text-green-600"}`}>{clubPreview.notFoundSlugs.length}</p>
                  <p className={`text-[10px] mt-0.5 ${clubPreview.notFoundSlugs.length > 0 ? "text-amber-500" : "text-green-500"}`}>
                    {clubPreview.notFoundSlugs.length > 0 ? "requerem mapeamento" : "todos reconhecidos!"}
                  </p>
                </div>
              </div>

              {/* Mapeamento manual */}
              {clubPreview.notFoundSlugs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700">
                    <AlertTriangle size={14} className="shrink-0" />
                    Estes slugs do XLSX não foram reconhecidos. Vincule cada um a um clube existente — os não vinculados serão <strong>ignorados</strong> na importação.
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {clubPreview.notFoundSlugs.map(slug => (
                      <div key={slug} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                        <div className="flex items-center gap-1.5">
                          {clubMappings[slug] ? <CheckCircle2 size={13} className="text-green-500 shrink-0" /> : <XCircle size={13} className="text-amber-400 shrink-0" />}
                          <span className="text-xs font-mono font-semibold text-gray-700 truncate">{slug}</span>
                        </div>
                        <SearchableSelect
                          grouped={clubPreview.allClubsGrouped}
                          value={clubMappings[slug] || ""}
                          onChange={val => setClubMappings(prev => ({ ...prev, [slug]: val }))}
                          placeholder="Buscar clube... (deixar vazio = ignorar)"
                        />
                      </div>
                    ))}
                  </div>
                  {unmappedCount > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-600">
                      <AlertTriangle size={13} className="shrink-0" />
                      {unmappedCount} clube(s) sem mapeamento serão ignorados na importação.
                    </div>
                  )}
                </div>
              )}

              {/* Clubes encontrados (colapsável) */}
              {clubPreview.foundClubs.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-bold text-gray-400 uppercase tracking-widest list-none flex items-center gap-1 hover:text-gray-600">
                    <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
                    {clubPreview.foundClubs.length} clubes reconhecidos automaticamente
                  </summary>
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
                    {clubPreview.foundClubs.map(c => (
                      <div key={c.csvSlug} className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                        {c.crest_url && <img src={c.crest_url} className="w-5 h-5 object-contain rounded" alt="" />}
                        <span className="text-xs font-mono text-gray-500">{c.csvSlug}</span>
                        <ArrowRight size={11} className="text-gray-300" />
                        <span className="text-xs font-semibold text-gray-700">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <div className="pt-2 flex justify-end">
                <button onClick={handleConfirmImport} disabled={importing} className={btnPrimary}>
                  {importing ? <><Loader2 className="animate-spin w-4 h-4" /> Importando...</> : "Confirmar Importação"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — DONE */}
        {step === "done" && (
          <div className="p-8 text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
              <CheckCircle2 className="text-green-500 w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Importação concluída!</h3>
              <p className="text-sm text-gray-500 mt-1">Anos importados: <strong>{mapping.years.join(", ")}</strong></p>
            </div>
            <button onClick={reset} className="text-sm text-[#7F33D9] font-bold hover:underline">Fazer novo upload</button>
          </div>
        )}
      </div>
    </div>
  );
}
