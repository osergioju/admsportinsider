import { useState } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, Trophy, ArrowRight, CheckCircle2,
  AlertTriangle, ChevronRight, XCircle,
} from "lucide-react";

const selectClass =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7F33D9] transition-all font-light";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";

export default function UploadMatchesPage() {
  const [file, setFile]             = useState(null);
  const [step, setStep]             = useState("upload"); // "upload" | "mapping" | "done"
  const [analyzing, setAnalyzing]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [preview, setPreview]       = useState(null);
  // { detectedYear, rowCount, leagues, foundTeams, notFoundTeams, allClubs }

  const [selectedCountry, setSelectedCountry] = useState("");
  const [league, setLeague]                   = useState("");
  const [clubMappings, setClubMappings]       = useState({}); // { "csvTeamName": clubId }
  const [importResult, setImportResult]       = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0] || null);
    setStep("upload");
    setPreview(null);
    setImportResult(null);
    setLeague("");
    setSelectedCountry("");
    setClubMappings({});
  }

  async function handleAnalyze() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      setAnalyzing(true);
      const { data } = await api.post("/upload/import/matches/preview", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data);
      const init = {};
      for (const name of data.notFoundTeams) init[name] = "";
      setClubMappings(init);
      setStep("mapping");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao analisar arquivo.");
    } finally {
      setAnalyzing(false);
    }
  }

  function setClubMap(csvName, clubId) {
    setClubMappings(prev => ({ ...prev, [csvName]: clubId }));
  }

  async function handleImport() {
    if (!league) return alert("Selecione uma liga.");
    const activeMappings = Object.fromEntries(
      Object.entries(clubMappings).filter(([, v]) => v !== "")
    );
    const form = new FormData();
    form.append("file", file);
    form.append("league", league);
    form.append("season", preview.detectedYear);
    if (Object.keys(activeMappings).length > 0)
      form.append("clubMappings", JSON.stringify(activeMappings));
    try {
      setLoading(true);
      const { data } = await api.post("/upload/import/matches", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(data);
      setStep("done");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao importar partidas.");
    } finally {
      setLoading(false);
    }
  }

  const countries = preview
    ? [...new Map(preview.leagues.map(l => [l.id_country, l.country_name])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const filteredLeagues = preview
    ? (selectedCountry ? preview.leagues.filter(l => String(l.id_country) === selectedCountry) : preview.leagues)
    : [];

  const unmappedCount = preview
    ? preview.notFoundTeams.filter(n => !clubMappings[n]).length
    : 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <Trophy className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Upload de Partidas</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto font-light">
          O sistema detecta o ano e verifica os times. Times não encontrados podem ser mapeados antes de importar.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 justify-center text-xs font-bold text-gray-400">
        <span className={step !== "upload" ? "text-[#7F33D9]" : ""}>1. Arquivo</span>
        <ChevronRight size={14} />
        <span className={step === "mapping" ? "text-[#7F33D9]" : step === "done" ? "text-green-500" : ""}>2. Mapeamento</span>
        <ChevronRight size={14} />
        <span className={step === "done" ? "text-green-500" : ""}>3. Resultado</span>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-6 animate-in zoom-in-95 duration-300">

        {/* Step 1 */}
        <div>
          <label className={labelClass}>Arquivo CSV / XLSX</label>
          <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
            <input type="file" accept=".csv,.xlsx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileChange} />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${file ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400 group-hover:text-[#7F33D9]"}`}>
                {file ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
              </div>
              <span className={`text-sm font-semibold ${file ? "text-green-600" : "text-gray-600 group-hover:text-[#7F33D9]"}`}>
                {file ? file.name : "Selecionar arquivo de partidas"}
              </span>
            </div>
          </div>
          {file && step === "upload" && (
            <div className="mt-4 flex justify-center">
              <button onClick={handleAnalyze} disabled={analyzing} className={btnPrimary}>
                {analyzing ? <><Loader2 className="animate-spin w-4 h-4" /> Analisando...</> : <>Analisar Arquivo <ArrowRight size={16} /></>}
              </button>
            </div>
          )}
        </div>

        {/* Step 2 */}
        {step !== "upload" && preview && (
          <div className="space-y-5 border-t border-gray-100 pt-6 animate-in fade-in">
            {/* Info */}
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] uppercase font-black text-purple-400 mb-1">Ano detectado</p>
                <p className="text-sm font-bold text-purple-700">{preview.detectedYear ?? "—"}</p>
              </div>
              <div className="flex-1 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] uppercase font-black text-purple-400 mb-1">Partidas no arquivo</p>
                <p className="text-sm font-bold text-purple-700">{preview.rowCount}</p>
              </div>
            </div>

            {/* Liga */}
            <div>
              <label className={labelClass}>Filtrar por País</label>
              <select value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setLeague(""); }} className={selectClass}>
                <option value="">Todos os países</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Liga</label>
              {filteredLeagues.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-sm text-amber-700">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  Nenhuma liga encontrada. Cadastre uma liga primeiro.
                </div>
              ) : (
                <select value={league} onChange={e => setLeague(e.target.value)} className={selectClass}>
                  <option value="">Selecione a liga</option>
                  {filteredLeagues.map(l => <option key={l.id_league} value={l.id_league}>{l.name} — {l.country_name}</option>)}
                </select>
              )}
            </div>

            {/* Clubes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
                <p className="text-[10px] uppercase font-black text-green-400 mb-1">Encontrados</p>
                <p className="text-xl font-bold text-green-600">{preview.foundTeams.length}</p>
                <p className="text-[10px] text-green-500 mt-0.5">times reconhecidos</p>
              </div>
              <div className={`p-3 rounded-2xl border ${preview.notFoundTeams.length > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
                <p className={`text-[10px] uppercase font-black mb-1 ${preview.notFoundTeams.length > 0 ? "text-amber-400" : "text-green-400"}`}>Não encontrados</p>
                <p className={`text-xl font-bold ${preview.notFoundTeams.length > 0 ? "text-amber-600" : "text-green-600"}`}>{preview.notFoundTeams.length}</p>
                <p className={`text-[10px] mt-0.5 ${preview.notFoundTeams.length > 0 ? "text-amber-500" : "text-green-500"}`}>
                  {preview.notFoundTeams.length > 0 ? "requerem mapeamento" : "todos reconhecidos!"}
                </p>
              </div>
            </div>

            {/* Mapeamento */}
            {preview.notFoundTeams.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Times Não Encontrados</p>
                <p className="text-xs text-gray-400">
                  Para cada time do CSV não reconhecido, selecione o clube correspondente no banco. Times sem mapeamento terão as partidas ignoradas.
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {preview.notFoundTeams.map(csvName => (
                    <div key={csvName} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {clubMappings[csvName] ? <CheckCircle2 size={14} className="text-green-500 shrink-0" /> : <XCircle size={14} className="text-amber-400 shrink-0" />}
                        <span className="text-xs font-mono text-gray-600 truncate">{csvName}</span>
                      </div>
                      <ArrowRight size={12} className="text-gray-300 shrink-0" />
                      <select
                        value={clubMappings[csvName] || ""}
                        onChange={e => setClubMap(csvName, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7F33D9]"
                      >
                        <option value="">— ignorar —</option>
                        {preview.allClubs.map(c => <option key={c.id_club} value={c.id_club}>{c.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {unmappedCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-600">
                    <AlertTriangle size={14} className="shrink-0" />
                    {unmappedCount} time(s) sem mapeamento — partidas envolvendo esses times serão ignoradas.
                  </div>
                )}
              </div>
            )}

            {step !== "done" && (
              <div className="flex justify-center">
                <button onClick={handleImport} disabled={loading || !league} className={btnPrimary}>
                  {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Importando...</> : <>Importar Partidas <ArrowRight size={16} /></>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === "done" && importResult && (
          <div className="border-t border-gray-100 pt-6 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-700">{importResult.total}</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-[10px] uppercase font-black text-green-400">Inseridos</p>
                <p className="text-2xl font-bold text-green-600">{importResult.inserted}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-orange-400">Ignorados</p>
                <p className="text-2xl font-bold text-orange-600">{importResult.skipped}</p>
              </div>
            </div>
            {importResult.skipped > 0 && importResult.skippedDetails?.filter(d => d.reason === "club_not_found").length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-amber-500" /><p className="text-xs font-bold text-amber-700">Partidas ainda ignoradas</p></div>
                <ul className="space-y-1">
                  {[...new Set(importResult.skippedDetails.filter(d => d.reason === "club_not_found").map(d => `${d.home} vs ${d.away}`))].slice(0, 8).map((l, i) => (
                    <li key={i} className="text-[11px] text-amber-600 font-mono">{l}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-center">
              <button onClick={() => { setStep("upload"); setFile(null); setPreview(null); setImportResult(null); setLeague(""); setSelectedCountry(""); setClubMappings({}); }} className="text-sm text-[#7F33D9] font-bold hover:underline">
                Fazer novo upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
