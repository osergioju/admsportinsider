import { useState, useMemo, useEffect } from "react";
import { api } from "../../../services/api";
import { clubLogo } from "../../../utils/clubUrl";
import {
  Loader2, UploadCloud, Shield, ArrowRight, CheckCircle2,
  AlertTriangle, ChevronRight, MapPin, XCircle, EyeOff, Trash2,
} from "lucide-react";
import SearchableSelect from "../../../components/uxui/SearchableSelect";

const selectClass =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7F33D9] transition-all font-light";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";

export default function UploadTeamsPage() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload"); // "upload" | "mapping" | "done"
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  // { csvCountry, csvSeason, leagues, foundTeams, notFoundTeams, allClubs }

  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [league, setLeague] = useState("");
  const [clubMappings, setClubMappings] = useState({}); // { "csvName": clubId }
  const [hiddenClubs, setHiddenClubs] = useState({}); // { "csvName": true } — created as hidden
  const [creatingHidden, setCreatingHidden] = useState({}); // { "csvName": true } — loading state
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Seção de delete
  const [allLeaguesList, setAllLeaguesList] = useState([]);
  const [deleteLeague, setDeleteLeague] = useState("");
  const [deleteYear, setDeleteYear] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  useEffect(() => {
    async function loadCountries() {
      try {
        let page = 1;
        let all = [];
        while (true) {
          const { data } = await api.get(`/admin/countries?page=${page}`);
          all = [...all, ...data.countries];
          if (page >= data.pagination.totalPages) break;
          page++;
        }
        setCountries(all);
      } catch (e) {
        console.error("Erro ao carregar países");
      }
    }
    async function loadLeagues() {
      try {
        const { data } = await api.get("/admin/leagues?limit=500");
        setAllLeaguesList(data.leagues ?? []);
      } catch (e) {
        console.error("Erro ao carregar ligas");
      }
    }
    loadCountries();
    loadLeagues();
  }, []);

  async function handleDeleteStats() {
    if (!deleteLeague || !deleteYear) return alert("Selecione a liga e informe o ano.");
    if (!window.confirm(`Apagar todas as stats de times da liga selecionada na temporada ${deleteYear}?`)) return;
    try {
      setDeleting(true);
      setDeleteResult(null);
      const { data } = await api.delete(`/upload/import/teams/${deleteLeague}/seasons/${deleteYear}`);
      setDeleteResult(data);
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao apagar stats.");
    } finally {
      setDeleting(false);
    }
  }

  function handleFileChange(e) {
    setFile(e.target.files[0] || null);
    setStep("upload");
    setPreview(null);
    setImportResult(null);
    setLeague("");
    setClubMappings({});
    setHiddenClubs({});
    setCreatingHidden({});
    setShowAllLeagues(false);
  }

  async function handleAnalyze() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      setAnalyzing(true);
      const { data } = await api.post("/upload/import/teams/preview", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data);
      if (data.leagues.length === 1) setLeague(String(data.leagues[0].id_league));
      if (data.isMultiCountry) setShowAllLeagues(true);
      const init = {};
      for (const name of data.notFoundTeams) init[name] = "";
      // Pré-popula conflitos para o usuário ver e resolver
      for (const conflict of (data.duplicateConflicts ?? [])) {
        for (const name of conflict.csv_names) {
          init[name] = String(conflict.id_club);
        }
      }
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
    setHiddenClubs(prev => ({ ...prev, [csvName]: false }));
  }

  async function handleCreateHidden(csvName) {
    setCreatingHidden(prev => ({ ...prev, [csvName]: true }));
    try {
      const { data } = await api.post("/admin/clubs/create-hidden", { name: csvName });
      setClubMappings(prev => ({ ...prev, [csvName]: String(data.id_club) }));
      setHiddenClubs(prev => ({ ...prev, [csvName]: true }));
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao criar clube oculto.");
    } finally {
      setCreatingHidden(prev => ({ ...prev, [csvName]: false }));
    }
  }

  async function handleImport() {
    if (!league) return alert("Selecione uma competição.");
    const activeMappings = Object.fromEntries(
      Object.entries(clubMappings).filter(([, v]) => v !== "")
    );
    const form = new FormData();
    form.append("file", file);
    form.append("league", league);
    form.append("season", preview.csvSeason);
    if (Object.keys(activeMappings).length > 0)
      form.append("clubMappings", JSON.stringify(activeMappings));
    try {
      setLoading(true);
      const { data } = await api.post("/upload/import/teams", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(data);
      setStep("done");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao importar times.");
    } finally {
      setLoading(false);
    }
  }

  const unmappedCount = preview
    ? preview.notFoundTeams.filter(n => !clubMappings[n] && !hiddenClubs[n]).length
    : 0;

  // Conflito = dois nomes do CSV ainda mapeados para o mesmo id_club
  const unresolvedConflicts = preview?.duplicateConflicts?.filter(conflict => {
    const activeNames = conflict.csv_names.filter(
      n => clubMappings[n] && clubMappings[n] !== ""
    );
    // Ainda há conflito se mais de um nome aponta pro mesmo clube
    const stillSameClub = activeNames.filter(
      n => clubMappings[n] === String(conflict.id_club)
    );
    return stillSameClub.length > 1;
  }) ?? [];

  const clubsGrouped = useMemo(() => {
    if (!preview?.allClubs) return [];
    const detectedCountry = preview.csvCountry ?? null;
    const byCountry = new Map();
    for (const c of preview.allClubs) {
      const key = c.country_name ?? "—";
      if (!byCountry.has(key)) byCountry.set(key, []);
      byCountry.get(key).push({
        value: String(c.id_club),
        label: c.name,
        slug: c.slug || undefined,
        image: c.crest_url || undefined,
      });
    }
    const sorted = [...byCountry.entries()].sort(([a], [b]) => a.localeCompare(b, "pt"));
    return sorted.map(([groupLabel, options]) => ({
      groupLabel: groupLabel === detectedCountry ? `${groupLabel} ✓` : groupLabel,
      options,
      _isDetected: groupLabel === detectedCountry,
    })).sort((a, b) => (b._isDetected ? 1 : 0) - (a._isDetected ? 1 : 0));
  }, [preview?.allClubs, preview?.csvCountry]);

  const shouldAskCountry =
    preview &&
    !preview.isMultiCountry &&
    !preview.csvCountry;

  const countriesOptions = useMemo(() => {
    return countries.map(c => ({
      value: c.name,
      label: c.name,
      image: c.flag_url
    }));
  }, [countries]);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <Shield className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Upload de Estatísticas de Times</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto font-light">
          O sistema detecta o país e verifica os clubes. Times não encontrados podem ser mapeados antes de importar.
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
                {file ? file.name : "Selecionar arquivo de times"}
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
            {/* Info detectada */}
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] uppercase font-black text-purple-400 mb-1">
                  {preview.isMultiCountry ? "Escopo" : "País detectado"}
                </p>
                <p className="text-sm font-bold text-purple-700 flex items-center gap-1">
                  <MapPin size={13} />
                  {preview.isMultiCountry ? "Continental (múltiplos países)" : (preview.csvCountry || "—")}
                </p>
              </div>
              <div className="flex-1 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] uppercase font-black text-purple-400 mb-1">Temporada</p>
                <p className="text-sm font-bold text-purple-700">{preview.csvSeason || "—"}</p>
                {preview.csvSeasonYear && String(preview.csvSeasonYear) !== preview.csvSeason && (
                  <p className="text-[10px] text-purple-400 mt-0.5">→ gravado como {preview.csvSeasonYear}</p>
                )}
              </div>
            </div>

            {shouldAskCountry && (
              <div className="space-y-1.5">
                <label className={labelClass}>Selecionar País</label>

                <SearchableSelect
                  grouped={[
                    {
                      groupLabel: "Países",
                      options: countriesOptions
                    }
                  ]}
                  value={selectedCountry}
                  onChange={(val) => {
                    setSelectedCountry(val);
                    setLeague(""); // reset liga
                  }}
                  placeholder="Buscar país..."
                />

                <p className="text-[11px] text-gray-400 ml-1">
                  Não conseguimos identificar automaticamente. Selecione o país para filtrar as ligas.
                </p>
              </div>
            )}

            {/* Liga */}
            <div>
              <label className={labelClass}>
                Competição
                {preview.leagues.length === 1 && <span className="text-green-500 normal-case font-normal ml-1">— pré-selecionada</span>}
                {preview.isMultiCountry && <span className="text-purple-400 normal-case font-normal ml-1">— selecione a competição continental</span>}
              </label>
              {preview.leagues.length === 0 && !showAllLeagues ? (
                <div className="space-y-2">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-sm text-amber-700">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    {preview.isMultiCountry
                      ? <>Nenhuma competição continental cadastrada. Cadastre uma competição sem país associado ou{" "}
                        <button onClick={() => setShowAllLeagues(true)} className="underline font-bold text-amber-800 hover:text-amber-900">ver todas as competições</button>.</>
                      : <>Nenhuma competição encontrada para "{preview.csvCountry}". Cadastre uma competição ou{" "}
                        <button onClick={() => setShowAllLeagues(true)} className="underline font-bold text-amber-800 hover:text-amber-900">ver todas as competições</button>.</>
                    }
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select value={league} onChange={e => setLeague(e.target.value)} className={selectClass}>
                    <option value="">Selecione a liga</option>
                    {(showAllLeagues ? preview.allLeagues ?? preview.leagues : preview.leagues).map(l => (
                      <option key={l.id_league} value={l.id_league}>
                        {l.name}{!preview.isMultiCountry && l.country_name && l.country_name !== preview.csvCountry ? ` (${l.country_name})` : ""}
                      </option>
                    ))}
                  </select>
                  {!preview.isMultiCountry && !showAllLeagues && preview.leagues.length > 0 && (
                    <button
                      onClick={() => setShowAllLeagues(true)}
                      className="text-[11px] text-gray-400 hover:text-[#7F33D9] font-medium ml-1 underline underline-offset-2 transition-colors"
                    >
                      Ver todas as ligas
                    </button>
                  )}
                  {!preview.isMultiCountry && showAllLeagues && (
                    <button
                      onClick={() => { setShowAllLeagues(false); setLeague(""); }}
                      className="text-[11px] text-gray-400 hover:text-[#7F33D9] font-medium ml-1 underline underline-offset-2 transition-colors"
                    >
                      Mostrar apenas ligas de "{preview.csvCountry}"
                    </button>
                  )}
                </div>
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

            {/* Conflitos de duplicidade */}
            {preview.duplicateConflicts?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>
                    <strong>{preview.duplicateConflicts.length} conflito{preview.duplicateConflicts.length > 1 ? "s" : ""} detectado{preview.duplicateConflicts.length > 1 ? "s" : ""}:</strong>{" "}
                    nomes diferentes no CSV estão resolvendo para o mesmo clube. Mantenha apenas um ou remapeie.
                  </span>
                </div>
                <div className="space-y-3">
                  {preview.duplicateConflicts.map(conflict => (
                    <div key={conflict.id_club} className="border border-red-200 rounded-2xl p-3 bg-red-50/40 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-red-700 font-bold mb-1">
                        {conflict.crest_url && (
                          <img src={clubLogo(conflict.crest_url)} className="w-5 h-5 object-contain rounded" alt="" />
                        )}
                        Conflito → <span className="text-gray-900">{conflict.club_name}</span>
                      </div>
                      {conflict.csv_names.map(csvName => (
                        <div key={csvName} className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {clubMappings[csvName] && clubMappings[csvName] !== ""
                              ? <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                              : <XCircle size={12} className="text-gray-400 shrink-0" />}
                            <span className="text-xs font-mono font-semibold text-gray-700">{csvName}</span>
                            {clubMappings[csvName] === "" && (
                              <span className="text-[10px] text-gray-400 ml-1">— será ignorado</span>
                            )}
                          </div>
                          <SearchableSelect
                            grouped={clubsGrouped}
                            value={clubMappings[csvName] ?? String(conflict.id_club)}
                            onChange={val => setClubMap(csvName, val)}
                            placeholder="Remapear ou deixar vazio para ignorar"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {unresolvedConflicts.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-2xl text-xs text-red-700 font-semibold">
                    <AlertTriangle size={14} className="shrink-0" />
                    Resolva os conflitos antes de importar: para cada conflito, mantenha apenas um nome mapeado para o clube (os outros devem ser remapeados ou limpos).
                  </div>
                )}
              </div>
            )}

            {/* Mapeamento de times não encontrados */}
            {preview.notFoundTeams.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Times Não Encontrados</p>
                <p className="text-xs text-gray-400">
                  Para cada time do CSV não reconhecido, selecione o clube correspondente no banco. Times sem mapeamento serão ignorados.
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {preview.notFoundTeams.map(csvName => (
                    <div key={csvName} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex items-center gap-1.5">
                        {hiddenClubs[csvName]
                          ? <EyeOff size={13} className="text-purple-400 shrink-0" />
                          : clubMappings[csvName]
                            ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                            : <XCircle size={13} className="text-amber-400 shrink-0" />}
                        <span className="text-xs font-mono font-semibold text-gray-700 truncate">{csvName}</span>
                        {hiddenClubs[csvName] && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold shrink-0">oculto</span>
                        )}
                        <ArrowRight size={11} className="text-gray-300 shrink-0 ml-auto" />
                      </div>
                      {!hiddenClubs[csvName] && (
                        <SearchableSelect
                          grouped={clubsGrouped}
                          value={clubMappings[csvName] || ""}
                          onChange={val => setClubMap(csvName, val)}
                          placeholder="Buscar clube... (deixar vazio = ignorar)"
                        />
                      )}
                      {!clubMappings[csvName] && !hiddenClubs[csvName] && (
                        <button
                          onClick={() => handleCreateHidden(csvName)}
                          disabled={creatingHidden[csvName]}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors"
                        >
                          {creatingHidden[csvName]
                            ? <Loader2 size={11} className="animate-spin" />
                            : <EyeOff size={11} />}
                          Cadastrar como oculto
                        </button>
                      )}
                      {hiddenClubs[csvName] && (
                        <button
                          onClick={() => { setHiddenClubs(p => ({ ...p, [csvName]: false })); setClubMappings(p => ({ ...p, [csvName]: "" })); }}
                          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Desfazer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {unmappedCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-600">
                    <AlertTriangle size={14} className="shrink-0" />
                    {unmappedCount} time(s) sem mapeamento — serão ignorados na importação.
                  </div>
                )}
              </div>
            )}

            {step !== "done" && (
              <div className="flex justify-center">
                <button
                  onClick={handleImport}
                  disabled={loading || !league || unresolvedConflicts.length > 0}
                  className={btnPrimary}
                >
                  {loading
                    ? <><Loader2 className="animate-spin w-4 h-4" /> Importando...</>
                    : unresolvedConflicts.length > 0
                      ? <><AlertTriangle size={16} /> {unresolvedConflicts.length} conflito{unresolvedConflicts.length > 1 ? "s" : ""} pendente{unresolvedConflicts.length > 1 ? "s" : ""}</>
                      : <>Importar Times <ArrowRight size={16} /></>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === "done" && importResult && (
          <div className="border-t border-gray-100 pt-6 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-green-400">Inseridos</p>
                <p className="text-2xl font-bold text-green-600">{importResult.inserted ?? 0}</p>
              </div>
              <div className="text-center border-l border-gray-200">
                <p className="text-[10px] uppercase font-black text-orange-400">Ignorados</p>
                <p className="text-2xl font-bold text-orange-600">{importResult.skipped ?? 0}</p>
              </div>
            </div>
            {importResult.skippedTeams?.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-amber-500" /><p className="text-xs font-bold text-amber-700">Times ainda ignorados</p></div>
                <ul className="space-y-1">{importResult.skippedTeams.map((n, i) => <li key={i} className="text-[11px] text-amber-600 font-mono">{n}</li>)}</ul>
              </div>
            )}
            <div className="flex justify-center">
              <button onClick={() => { setStep("upload"); setFile(null); setPreview(null); setImportResult(null); setLeague(""); setClubMappings({}); setHiddenClubs({}); setCreatingHidden({}); }} className="text-sm text-[#7F33D9] font-bold hover:underline">
                Fazer novo upload
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Apagar stats de uma temporada */}
      <div className="bg-white rounded-3xl border border-red-100 shadow-xl p-8 space-y-5 mt-6 animate-in fade-in">
        <div className="flex items-center gap-2">
          <Trash2 size={16} className="text-red-400" />
          <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Apagar Stats de Times</p>
        </div>
        <p className="text-xs text-gray-400">Remove todas as estatísticas de times de uma liga em uma temporada específica. Ação irreversível.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Liga</label>
            <select value={deleteLeague} onChange={e => { setDeleteLeague(e.target.value); setDeleteResult(null); }} className={selectClass}>
              <option value="">Selecione a liga</option>
              {allLeaguesList.map(l => (
                <option key={l.id_league} value={l.id_league}>{l.name}{l.country_name ? ` — ${l.country_name}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ano</label>
            <input
              type="number"
              placeholder="ex: 2025"
              value={deleteYear}
              onChange={e => { setDeleteYear(e.target.value); setDeleteResult(null); }}
              className={selectClass}
            />
          </div>
        </div>
        {deleteResult && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-2xl text-sm text-green-700 font-semibold">
            <CheckCircle2 size={14} /> {deleteResult.deleted} registro(s) apagado(s).
          </div>
        )}
        <div className="flex justify-center">
          <button
            onClick={handleDeleteStats}
            disabled={deleting || !deleteLeague || !deleteYear}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {deleting ? <><Loader2 className="animate-spin w-4 h-4" /> Apagando...</> : <><Trash2 size={16} /> Apagar Stats</>}
          </button>
        </div>
      </div>
    </div>
  );
}
