import { useState, useMemo } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, Users, ArrowRight, CheckCircle2,
  AlertTriangle, ChevronRight, XCircle, Plus, Globe, X, EyeOff,
} from "lucide-react";
import SearchableSelect from "../../../components/uxui/SearchableSelect";

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
const selectClass =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7F33D9] transition-all font-light";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";

// ─────────────────────────────────────────────────────────────────────────────
// Mini-modal: cadastrar país inline (para nacionalidades não encontradas)
// ─────────────────────────────────────────────────────────────────────────────
function RegisterCountryModal({ csvNat, suggestion, onClose, onCreated }) {
  const [name, setName] = useState(suggestion?.namePtBr ?? csvNat ?? "");
  const [flag, setFlag] = useState(suggestion?.flag ?? "");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post("/admin/send-countries", {
        value: name.trim(),
        flag: flag.trim() || null,
        codigo: suggestion?.cca2 ?? null,
      });
      const res = await api.get("/admin/countries?limit=500");
      const created = res.data.countries.find(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase()
      );
      onCreated({
        id_country: created?.id_country,
        name: name.trim(),
        flag_url: created?.flag_url || flag.trim() || null,
      });
    } catch {
      alert("Erro ao cadastrar país");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Globe size={18} className="text-[#7F33D9]" /> Cadastrar País
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {suggestion ? (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <img src={suggestion.flag} alt={suggestion.nameEn}
              className="w-8 h-5 rounded object-cover shadow-sm shrink-0"
              onError={(e) => { e.target.style.display = "none"; }} />
            <span className="text-xs text-gray-500">
              Encontrado em <strong>world-countries</strong> como{" "}
              <span className="font-mono text-gray-700">{suggestion.nameEn}</span>
            </span>
          </div>
        ) : (
          <div className="mb-4 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
            Nacionalidade <strong>"{csvNat}"</strong> não reconhecida — preencha manualmente.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nome (como ficará no sistema)</label>
            <input type="text" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Brasil" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">URL da Bandeira</label>
            <div className="flex gap-2 items-center">
              {flag && (
                <img src={flag} alt="preview" className="w-8 h-5 rounded object-cover shadow-sm shrink-0"
                  onError={(e) => { e.target.style.display = "none"; }} />
              )}
              <input type="text" className={inputClass} value={flag} onChange={(e) => setFlag(e.target.value)}
                placeholder={`https://flagcdn.com/${suggestion?.cca2?.toLowerCase() ?? "xx"}.svg`} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={!name.trim() || loading} className={`w-full ${btnPrimary}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Cadastrar e selecionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function UploadPlayersPage() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload");
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const [leagueId, setLeagueId] = useState("");
  const [clubMappings, setClubMappings] = useState({}); // { csvClubName: dbClubName }
  const [hiddenClubs, setHiddenClubs] = useState({}); // { csvClubName: true } — created as hidden
  const [creatingHidden, setCreatingHidden] = useState({}); // { csvClubName: true } — loading state
  const [natMappings, setNatMappings] = useState({}); // { csvNat: dbCountryName }

  // Lista local de países — cresce quando o usuário cria inline
  const [allCountries, setAllCountries] = useState([]);

  // Mini-modal de criação de país
  const [registerModal, setRegisterModal] = useState(null); // { csvNat, suggestion }

  const [importResult, setImportResult] = useState(null);

  // ── handlers ────────────────────────────────────────────────────────────────
  function handleFileChange(e) {
    setFile(e.target.files[0] || null);
    setStep("upload");
    setPreview(null);
    setImportResult(null);
    setLeagueId("");
    setClubMappings({});
    setHiddenClubs({});
    setCreatingHidden({});
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
      if (data.foundLeague) setLeagueId(String(data.foundLeague.id_league));

      const initClubs = {};
      for (const club of data.notFoundClubs) initClubs[club] = "";
      setClubMappings(initClubs);

      const initNat = {};
      for (const nat of (data.notFoundNationalities || [])) initNat[nat] = "";
      setNatMappings(initNat);

      setAllCountries(data.allCountries ?? []);
      setStep("mapping");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao analisar arquivo.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleImport() {
    if (!leagueId) return alert("Selecione (ou confirme) a liga.");
    const activeClub = Object.fromEntries(Object.entries(clubMappings).filter(([, v]) => v !== ""));
    const activeNat = Object.fromEntries(Object.entries(natMappings).filter(([, v]) => v !== ""));
    const form = new FormData();
    form.append("file", file);
    form.append("leagueId", leagueId);
    if (Object.keys(activeClub).length) form.append("clubMappings", JSON.stringify(activeClub));
    if (Object.keys(activeNat).length) form.append("nationalityMappings", JSON.stringify(activeNat));
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

  // Adiciona país criado inline à lista local e pre-seleciona no mapeamento
  function handleCountryCreated(csvNat, newCountry) {
    if (newCountry.id_country) {
      setAllCountries(prev => {
        if (prev.find(c => c.id_country === newCountry.id_country)) return prev;
        return [...prev, { id_country: newCountry.id_country, name: newCountry.name, flag_url: newCountry.flag_url }]
          .sort((a, b) => a.name.localeCompare(b.name));
      });
    }
    setNatMappings(prev => ({ ...prev, [csvNat]: newCountry.name }));
    setRegisterModal(null);
  }

  // ── dados derivados ──────────────────────────────────────────────────────────

  // Clubes agrupados por país para o SearchableSelect (mesmo padrão de UploadMatchesPage)
  const clubsGrouped = useMemo(() => {
    if (!preview?.allClubs) return [];
    const byCountry = new Map();
    for (const c of preview.allClubs) {
      const key = c.country_name ?? "—";
      if (!byCountry.has(key)) byCountry.set(key, []);
      byCountry.get(key).push({
        value: c.name,                         // import usa nome, não id
        label: c.name,
        slug: c.slug || undefined,
        image: c.crest_url || undefined,
      });
    }
    return [...byCountry.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "pt"))
      .map(([groupLabel, options]) => ({ groupLabel, options }));
  }, [preview?.allClubs]);

  // Países para o SearchableSelect de nacionalidades (com bandeiras)
  const countryOptions = useMemo(() =>
    allCountries.map(c => ({
      value: c.name,          // import usa nome
      label: c.name,
      image: c.flag_url || undefined,
    })),
    [allCountries]
  );

  // Mapa enriquecido de nacionalidades não encontradas: { csvName, suggestion }
  const notFoundNatData = useMemo(() => {
    if (!preview) return [];
    if (preview.notFoundNationalitiesData?.length) return preview.notFoundNationalitiesData;
    return (preview.notFoundNationalities ?? []).map(n => ({ csvName: n, suggestion: null }));
  }, [preview]);

  const unmappedClubs = preview
    ? preview.notFoundClubs.filter(c => !clubMappings[c] && !hiddenClubs[c]).length
    : 0;

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

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <Users className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Importar Jogadores</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto font-light">
          O sistema verifica clubes e nacionalidades. Itens não encontrados podem ser mapeados antes de importar.
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

        {/* ── Step 1: Upload ── */}
        <div>
          <label className={labelClass}>Arquivo CSV / XLSX</label>
          <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
            <input type="file" accept=".csv,.xlsx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileChange} />
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
                {analyzing ? <><Loader2 className="animate-spin w-4 h-4" /> Analisando...</> : <>Analisar Arquivo <ArrowRight size={16} /></>}
              </button>
            </div>
          )}
        </div>

        {/* ── Step 2: Mapeamento ── */}
        {step !== "upload" && preview && (
          <div className="space-y-6 border-t border-gray-100 pt-6 animate-in fade-in">

            {/* Temporada detectada */}
            {preview.csvSeason && (
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] uppercase font-black text-purple-400 mb-1">Temporada detectada</p>
                <p className="text-sm font-bold text-purple-700">{preview.csvSeason}</p>
                {preview.csvSeasonYear && String(preview.csvSeasonYear) !== String(preview.csvSeason) && (
                  <p className="text-[10px] text-purple-400 mt-0.5">→ gravado como {preview.csvSeasonYear}</p>
                )}
              </div>
            )}

            {/* Liga */}
            <div>
              <label className={labelClass}>
                Liga
                {preview.foundLeague && (
                  <span className="ml-2 text-green-500 normal-case font-normal">
                    — "{preview.csvLeague}" encontrada automaticamente
                  </span>
                )}
                {!preview.foundLeague && preview.isMultiCountry && (
                  <span className="ml-2 text-purple-400 normal-case font-normal">
                    — selecione a liga continental
                  </span>
                )}
                {!preview.foundLeague && !preview.isMultiCountry && (
                  <span className="ml-2 text-amber-500 normal-case font-normal">
                    — "{preview.csvLeague}" não encontrada, selecione abaixo
                  </span>
                )}
              </label>
              <select value={leagueId} onChange={e => setLeagueId(e.target.value)} className={selectClass}>
                <option value="">Selecione a liga</option>
                {preview.allLeagues.map(l => (
                  <option key={l.id_league} value={l.id_league}>
                    {l.name}{l.country_name ? ` (${l.country_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Cards de resumo — clubes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
                <p className="text-[10px] uppercase font-black text-green-400 mb-1">Clubes encontrados</p>
                <p className="text-xl font-bold text-green-600">{preview.foundClubs.length}</p>
              </div>
              <div className={`p-3 rounded-2xl border ${preview.notFoundClubs.length > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
                <p className={`text-[10px] uppercase font-black mb-1 ${preview.notFoundClubs.length > 0 ? "text-amber-400" : "text-green-400"}`}>
                  Clubes não encontrados
                </p>
                <p className={`text-xl font-bold ${preview.notFoundClubs.length > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {preview.notFoundClubs.length}
                </p>
              </div>
            </div>

            {/* Mapeamento de clubes */}
            {preview.notFoundClubs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Clubes Não Encontrados</p>
                <p className="text-xs text-gray-400">
                  Selecione o clube correspondente no banco. Sem mapeamento, os jogadores desse clube serão ignorados.
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {preview.notFoundClubs.map(csvClub => (
                    <div key={csvClub} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex items-center gap-1.5">
                        {hiddenClubs[csvClub]
                          ? <EyeOff size={13} className="text-purple-400 shrink-0" />
                          : clubMappings[csvClub]
                            ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                            : <XCircle size={13} className="text-amber-400 shrink-0" />}
                        <span className="text-xs font-mono font-semibold text-gray-700 truncate">{csvClub}</span>
                        {hiddenClubs[csvClub] && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold shrink-0">oculto</span>
                        )}
                        <ArrowRight size={11} className="text-gray-300 shrink-0 ml-auto" />
                      </div>
                      {!hiddenClubs[csvClub] && (
                        <SearchableSelect
                          grouped={clubsGrouped}
                          value={clubMappings[csvClub] || ""}
                          onChange={val => { setClubMappings(prev => ({ ...prev, [csvClub]: val })); setHiddenClubs(prev => ({ ...prev, [csvClub]: false })); }}
                          placeholder="Buscar clube... (vazio = ignorar)"
                        />
                      )}
                      {!clubMappings[csvClub] && !hiddenClubs[csvClub] && (
                        <button
                          onClick={() => handleCreateHidden(csvClub)}
                          disabled={creatingHidden[csvClub]}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors"
                        >
                          {creatingHidden[csvClub]
                            ? <Loader2 size={11} className="animate-spin" />
                            : <EyeOff size={11} />}
                          Cadastrar como oculto
                        </button>
                      )}
                      {hiddenClubs[csvClub] && (
                        <button
                          onClick={() => { setHiddenClubs(p => ({ ...p, [csvClub]: false })); setClubMappings(p => ({ ...p, [csvClub]: "" })); }}
                          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Desfazer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {unmappedClubs > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-600">
                    <AlertTriangle size={14} className="shrink-0" />
                    {unmappedClubs} clube(s) sem mapeamento — jogadores desses clubes serão ignorados.
                  </div>
                )}
              </div>
            )}

            {/* Cards de resumo — nacionalidades */}
            {(preview.foundNationalities.length > 0 || notFoundNatData.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="text-[10px] uppercase font-black text-green-400 mb-1">Nac. encontradas</p>
                  <p className="text-xl font-bold text-green-600">{preview.foundNationalities.length}</p>
                </div>
                <div className={`p-3 rounded-2xl border ${notFoundNatData.length > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
                  <p className={`text-[10px] uppercase font-black mb-1 ${notFoundNatData.length > 0 ? "text-amber-400" : "text-green-400"}`}>
                    Nac. não encontradas
                  </p>
                  <p className={`text-xl font-bold ${notFoundNatData.length > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {notFoundNatData.length}
                  </p>
                </div>
              </div>
            )}

            {/* Mapeamento de nacionalidades */}
            {notFoundNatData.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Nacionalidades Não Encontradas</p>
                <p className="text-xs text-gray-400">
                  Selecione o país correspondente ou crie um novo. Sem mapeamento, a nacionalidade fica em branco.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notFoundNatData.map(({ csvName, suggestion }) => (
                    <div key={csvName} className={`p-3 rounded-2xl border space-y-2 ${natMappings[csvName] ? "bg-white border-gray-100" : "bg-amber-50/40 border-amber-200"}`}>
                      <div className="flex items-center gap-1.5">
                        {natMappings[csvName]
                          ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                          : <XCircle size={13} className="text-amber-400 shrink-0" />}
                        <span className="text-xs font-mono font-semibold text-gray-700 truncate">{csvName}</span>
                        <ArrowRight size={11} className="text-gray-300 shrink-0 ml-auto" />
                      </div>

                      <div className="flex gap-2 items-center">
                        <SearchableSelect
                          options={countryOptions}
                          value={natMappings[csvName] || ""}
                          onChange={val => setNatMappings(prev => ({ ...prev, [csvName]: val }))}
                          placeholder="Buscar país... (vazio = deixar em branco)"
                        />
                        {!natMappings[csvName] && (
                          <button
                            onClick={() => setRegisterModal({ csvNat: csvName, suggestion })}
                            title="Cadastrar este país"
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#7F33D9]/10 text-[#7F33D9] hover:bg-[#7F33D9]/20 transition-colors border border-[#7F33D9]/20"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                        {natMappings[csvName] && (
                          <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-200">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>

                      {/* Hint: sugestão world-countries */}
                      {!natMappings[csvName] && suggestion && (
                        <p className="text-[10px] text-amber-600 flex items-center gap-1">
                          <img src={suggestion.flag} alt="" className="w-4 h-3 rounded object-cover shrink-0"
                            onError={(e) => { e.target.style.display = "none"; }} />
                          Sugestão: <strong>{suggestion.nameEn}</strong> — clique em <strong>+</strong> para cadastrar.
                        </p>
                      )}
                      {!natMappings[csvName] && !suggestion && (
                        <p className="text-[10px] text-red-500">
                          Não reconhecido. Selecione um país existente ou clique em <strong>+</strong> para cadastrar.
                        </p>
                      )}
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

        {/* ── Step 3: Resultado ── */}
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
                    {importResult.skipped.noClubSeason} jogador(es) sem clube/temporada — verifique mapeamentos.
                  </p>
                )}
                {importResult.skipped.noPlayer > 0 && (
                  <p className="text-xs text-amber-700">
                    {importResult.skipped.noPlayer} jogador(es) não resolvidos.
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
              <button
                onClick={() => { setStep("upload"); setFile(null); setPreview(null); setImportResult(null); setLeagueId(""); setClubMappings({}); setHiddenClubs({}); setCreatingHidden({}); setNatMappings({}); setAllCountries([]); }}
                className="text-sm text-[#7F33D9] font-bold hover:underline"
              >
                Fazer novo upload
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mini-modal de cadastro inline de país */}
      {registerModal && (
        <RegisterCountryModal
          csvNat={registerModal.csvNat}
          suggestion={registerModal.suggestion}
          onClose={() => setRegisterModal(null)}
          onCreated={(newCountry) => handleCountryCreated(registerModal.csvNat, newCountry)}
        />
      )}
    </div>
  );
}
