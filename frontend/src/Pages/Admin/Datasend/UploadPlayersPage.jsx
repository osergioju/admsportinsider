import { useState } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, Users, ArrowRight, CheckCircle2,
  AlertTriangle, ChevronRight, XCircle,
} from "lucide-react";

const selectClass =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7F33D9] transition-all font-light";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";

export default function UploadPlayersPage() {
  const [file, setFile]           = useState(null);
  const [step, setStep]           = useState("upload"); // "upload" | "mapping" | "done"
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading]     = useState(false);

  // Dados do preview
  const [preview, setPreview]       = useState(null);
  // { csvLeague, csvSeason, foundLeague, foundClubs, notFoundClubs, allLeagues, allClubs }

  // Mapeamentos que o usuário define
  const [leagueId, setLeagueId]               = useState("");
  const [clubMappings, setClubMappings]       = useState({}); // { "Palmeiras": "SE Palmeiras" }
  const [natMappings, setNatMappings]         = useState({}); // { "English": "England" }

  const [importResult, setImportResult] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0] || null);
    setStep("upload");
    setPreview(null);
    setImportResult(null);
    setLeagueId("");
    setClubMappings({});
    setNatMappings({});
  }

  async function handleAnalyze() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      setAnalyzing(true);
      const { data } = await api.post("/upload/import/players/preview", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data);
      // Pré-seleciona liga se encontrou match exato
      if (data.foundLeague) setLeagueId(String(data.foundLeague.id_league));
      // Pré-inicializa mapeamentos dos clubes não encontrados com string vazia
      const initMappings = {};
      for (const club of data.notFoundClubs) initMappings[club] = "";
      setClubMappings(initMappings);
      // Pré-inicializa mapeamentos de nacionalidades não encontradas
      const initNatMappings = {};
      for (const nat of (data.notFoundNationalities || [])) initNatMappings[nat] = "";
      setNatMappings(initNatMappings);
      setStep("mapping");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao analisar arquivo.");
    } finally {
      setAnalyzing(false);
    }
  }

  function setClubMap(csvName, dbName) {
    setClubMappings(prev => ({ ...prev, [csvName]: dbName }));
  }

  function setNatMap(csvName, dbName) {
    setNatMappings(prev => ({ ...prev, [csvName]: dbName }));
  }

  async function handleImport() {
    if (!leagueId) return alert("Selecione (ou confirme) a liga.");

    // clubMappings só com entradas preenchidas
    const activeMappings = Object.fromEntries(
      Object.entries(clubMappings).filter(([, v]) => v !== "")
    );

    const form = new FormData();
    form.append("file", file);
    form.append("leagueId", leagueId);
    if (Object.keys(activeMappings).length > 0) {
      form.append("clubMappings", JSON.stringify(activeMappings));
    }

    const activeNatMappings = Object.fromEntries(
      Object.entries(natMappings).filter(([, v]) => v !== "")
    );
    if (Object.keys(activeNatMappings).length > 0) {
      form.append("nationalityMappings", JSON.stringify(activeNatMappings));
    }

    try {
      setLoading(true);
      const { data } = await api.post("/upload/import/players", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(data);
      setStep("done");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao importar jogadores.");
    } finally {
      setLoading(false);
    }
  }

  const unmappedCount = preview
    ? preview.notFoundClubs.filter(c => !clubMappings[c]).length
    : 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <Users className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Importar Jogadores</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto font-light">
          O sistema verifica os clubes do CSV. Clubes não encontrados podem ser mapeados manualmente.
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

        {/* Step 1: File */}
        <div>
          <label className={labelClass}>Arquivo CSV / XLSX</label>
          <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${file ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400 group-hover:text-[#7F33D9]"}`}>
                {file ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
              </div>
              <span className={`text-sm font-semibold ${file ? "text-green-600" : "text-gray-600 group-hover:text-[#7F33D9]"}`}>
                {file ? file.name : "Selecionar base de jogadores"}
              </span>
            </div>
          </div>
          {file && step === "upload" && (
            <div className="mt-4 flex justify-center">
              <button onClick={handleAnalyze} disabled={analyzing} className={btnPrimary}>
                {analyzing
                  ? <><Loader2 className="animate-spin w-4 h-4" /> Analisando...</>
                  : <>Analisar Arquivo <ArrowRight size={16} /></>}
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Mapping */}
        {step !== "upload" && preview && (
          <div className="space-y-6 border-t border-gray-100 pt-6 animate-in fade-in">

            {/* League mapping */}
            <div>
              <label className={labelClass}>
                Liga
                {preview.foundLeague && (
                  <span className="ml-2 text-green-500 normal-case font-normal">
                    — "{preview.csvLeague}" encontrada automaticamente
                  </span>
                )}
                {!preview.foundLeague && (
                  <span className="ml-2 text-amber-500 normal-case font-normal">
                    — "{preview.csvLeague}" não encontrada, selecione abaixo
                  </span>
                )}
              </label>
              <select value={leagueId} onChange={e => setLeagueId(e.target.value)} className={selectClass}>
                <option value="">Selecione a liga</option>
                {preview.allLeagues.map(l => (
                  <option key={l.id_league} value={l.id_league}>
                    {l.name} ({l.country_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Club summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
                <p className="text-[10px] uppercase font-black text-green-400 mb-1">Encontrados</p>
                <p className="text-xl font-bold text-green-600">{preview.foundClubs.length}</p>
                <p className="text-[10px] text-green-500 mt-0.5">clubes reconhecidos</p>
              </div>
              <div className={`p-3 rounded-2xl border ${preview.notFoundClubs.length > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
                <p className={`text-[10px] uppercase font-black mb-1 ${preview.notFoundClubs.length > 0 ? "text-amber-400" : "text-green-400"}`}>Não encontrados</p>
                <p className={`text-xl font-bold ${preview.notFoundClubs.length > 0 ? "text-amber-600" : "text-green-600"}`}>{preview.notFoundClubs.length}</p>
                <p className={`text-[10px] mt-0.5 ${preview.notFoundClubs.length > 0 ? "text-amber-500" : "text-green-500"}`}>
                  {preview.notFoundClubs.length > 0 ? "requerem mapeamento" : "todos reconhecidos!"}
                </p>
              </div>
            </div>

            {/* Not-found clubs mapping */}
            {preview.notFoundClubs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Mapear Clubes Não Encontrados
                </p>
                <p className="text-xs text-gray-400">
                  Para cada clube do CSV não reconhecido, selecione o correspondente no banco.
                  Clubes sem mapeamento terão seus jogadores ignorados.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {preview.notFoundClubs.map(csvClub => (
                    <div key={csvClub} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {clubMappings[csvClub]
                          ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                          : <XCircle size={14} className="text-amber-400 shrink-0" />}
                        <span className="text-xs font-mono text-gray-600 truncate">{csvClub}</span>
                      </div>
                      <ArrowRight size={12} className="text-gray-300 shrink-0" />
                      <select
                        value={clubMappings[csvClub] || ""}
                        onChange={e => setClubMap(csvClub, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7F33D9]"
                      >
                        <option value="">— ignorar —</option>
                        {preview.allClubs.map(c => (
                          <option key={c.id_club} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {unmappedCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-600">
                    <AlertTriangle size={14} className="shrink-0" />
                    {unmappedCount} clube(s) sem mapeamento — jogadores desses clubes serão ignorados.
                  </div>
                )}
              </div>
            )}

            {/* Nationality mapping */}
            {preview.notFoundNationalities && preview.notFoundNationalities.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Mapear Nacionalidades Não Encontradas
                </p>
                <p className="text-xs text-gray-400">
                  Para cada nacionalidade do CSV não reconhecida, selecione o país correspondente no banco.
                  Jogadores sem mapeamento terão a nacionalidade em branco.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {preview.notFoundNationalities.map(csvNat => (
                    <div key={csvNat} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {natMappings[csvNat]
                          ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                          : <XCircle size={14} className="text-amber-400 shrink-0" />}
                        <span className="text-xs font-mono text-gray-600 truncate">{csvNat}</span>
                      </div>
                      <ArrowRight size={12} className="text-gray-300 shrink-0" />
                      <select
                        value={natMappings[csvNat] || ""}
                        onChange={e => setNatMap(csvNat, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7F33D9]"
                      >
                        <option value="">— deixar em branco —</option>
                        {(preview.allCountries || []).map(c => (
                          <option key={c.id_country} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step !== "done" && (
              <div className="flex justify-center">
                <button onClick={handleImport} disabled={loading || !leagueId} className={btnPrimary}>
                  {loading
                    ? <><Loader2 className="animate-spin w-4 h-4" /> Importando jogadores...</>
                    : <>Importar Jogadores <ArrowRight size={16} /></>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Result */}
        {step === "done" && importResult && (
          <div className="border-t border-gray-100 pt-6 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-gray-400">Jogadores</p>
                <p className="text-2xl font-bold text-gray-700">{importResult.players ?? 0}</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-[10px] uppercase font-black text-green-400">Temporadas</p>
                <p className="text-2xl font-bold text-green-600">{importResult.seasons ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-blue-400">Stats</p>
                <p className="text-2xl font-bold text-blue-600">{importResult.stats ?? 0}</p>
              </div>
            </div>

            {importResult.skipped && (importResult.skipped.noClubSeason > 0 || importResult.skipped.noPlayer > 0) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Ignorados</p>
                {importResult.skipped.noClubSeason > 0 && (
                  <p className="text-xs text-amber-700">
                    {importResult.skipped.noClubSeason} jogador(es) sem clube/temporada no banco — verifique mapeamentos de clube.
                  </p>
                )}
                {importResult.skipped.noPlayer > 0 && (
                  <p className="text-xs text-amber-700">
                    {importResult.skipped.noPlayer} jogador(es) não resolvidos na tabela de players.
                  </p>
                )}
              </div>
            )}

            {importResult.seasons === 0 && importResult.players > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Jogadores criados mas nenhuma temporada vinculada. Verifique se o upload de times foi feito antes e se os mapeamentos de clube estão corretos.
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <button onClick={() => { setStep("upload"); setFile(null); setPreview(null); setImportResult(null); setLeagueId(""); setClubMappings({}); setNatMappings({}); }}
                className="text-sm text-[#7F33D9] font-bold hover:underline">
                Fazer novo upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
