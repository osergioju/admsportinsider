import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle,
  ArrowRight, XCircle, AlertTriangle, Shield, Plus, Trash2, Trophy,
  Building2,
} from "lucide-react";
import SearchableSelect from "../../../components/uxui/SearchableSelect";

const btnPrimary = "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const btnSecondary = "flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
const selectClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all text-gray-700";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

let _nextId = 0;
const mkId = () => ++_nextId;

export default function SendLeaguePage() {
  const [file, setFile]             = useState(null);
  const [step, setStep]             = useState("upload"); // upload | configure | clubs | done
  const [analysis, setAnalysis]     = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting]   = useState(false);

  const [dbLeagues, setDbLeagues]             = useState([]);
  const [loadingDbLeagues, setLoadingDbLeagues] = useState(false);
  const [leaguesGrouped, setLeaguesGrouped]   = useState([]);

  // Part 1: one card per league to import
  const [leagueMappings, setLeagueMappings] = useState([{ id: mkId(), sheetName: "", leagueId: "" }]);

  // Part 2: club year-sheet imports
  const [clubYears, setClubYears] = useState([]);
  const [skipClubs, setSkipClubs] = useState(false);
  const [clubOnlyLeagueId, setClubOnlyLeagueId] = useState("");

  // Club preview
  const [clubPreview, setClubPreview]   = useState(null);
  const [clubMappings, setClubMappings] = useState({});

  // Done summary
  const [doneInfo, setDoneInfo] = useState({ leagues: [], clubYears: [] });

  useEffect(() => {
    if (step !== "configure") return;
    setLoadingDbLeagues(true);
    api.get("/admin/leagues?limit=1000")
      .then(({ data }) => {
        const leagues = data.leagues ?? [];
        setDbLeagues(leagues);

        // Build grouped structure for SearchableSelect
        const countryMap = {};
        for (const l of leagues) {
          const key = l.id_country ?? "__no_country__";
          if (!countryMap[key]) {
            countryMap[key] = {
              groupLabel: l.country_name ?? "Sem país",
              groupImage: l.flag_url ?? null,
              options: [],
            };
          }
          countryMap[key].options.push({
            value: String(l.id_league),
            label: l.name,
            image: l.logo_url ?? null,
          });
        }
        setLeaguesGrouped(
          Object.values(countryMap).sort((a, b) =>
            a.groupLabel.localeCompare(b.groupLabel, "pt", { sensitivity: "base" })
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoadingDbLeagues(false));
  }, [step]);

  // Derived: split sheets into league sheets and year sheets.
  // Year sheets can be named "2020" (single) or "2025/2026" (fiscal) — always use the second year.
  function isFiscalYear(name) {
    const parts = name.split("/");
    return parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]));
  }
  function canonicalYear(name) {
    if (!isNaN(Number(name))) return Number(name);
    if (isFiscalYear(name)) return Number(name.split("/")[1]);
    return null;
  }
  const leagueSheets = analysis?.sheets ?? [];
  const yearSheets   = analysis?.sheets
    .map(s => canonicalYear(s.sheetName))
    .filter(y => y !== null)
    .filter((y, i, arr) => arr.indexOf(y) === i) // deduplicate
    .sort((a, b) => a - b) ?? [];

  const validMappings  = leagueMappings.filter(m => m.sheetName && m.leagueId);
  const onlyClubsMode  = validMappings.length === 0;
  const canAdvance     = validMappings.length > 0 || (!skipClubs && clubYears.length > 0 && !!clubOnlyLeagueId);
  const unmappedCount  = clubPreview?.notFoundSlugs.filter(s => !clubMappings[s]).length ?? 0;

  // ── handlers ──────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/upload/xlsx/analyze", form, { headers: { "Content-Type": "multipart/form-data" } });
      setAnalysis(data);
      setStep("configure");
    } catch { alert("Erro ao ler o arquivo"); } finally { setUploading(false); }
  }

  async function handleAdvance() {
    if (!canAdvance) return;
    if (!skipClubs && clubYears.length === 0 && yearSheets.length > 0) {
      alert("Selecione pelo menos uma temporada na Parte 2, ou marque \"Pular\".");
      return;
    }
    if (skipClubs || clubYears.length === 0) {
      await handleImportAll();
    } else {
      await handlePreviewClubs();
    }
  }

  async function handlePreviewClubs() {
    setPreviewing(true);
    const form = new FormData();
    form.append("file", file);
    form.append("years", JSON.stringify(clubYears));
    try {
      const { data } = await api.post("/upload/xlsx/preview-clubs", form, { headers: { "Content-Type": "multipart/form-data" } });
      setClubPreview(data);
      const init = {};
      for (const slug of data.notFoundSlugs) init[slug] = "";
      setClubMappings(init);
      setStep("clubs");
    } catch { alert("Erro ao analisar clubes."); } finally { setPreviewing(false); }
  }

  async function handleImportAll() {
    if (!window.confirm("Confirmar importação? Os dados serão gravados no banco.")) return;
    setImporting(true);
    const activeMappings = Object.fromEntries(Object.entries(clubMappings).filter(([, v]) => v !== ""));

    try {
      // Part 1: import each league's aggregate financial data (no club year sheets)
      for (const lm of validMappings) {
        const form = new FormData();
        form.append("file", file);
        form.append("sheetName", lm.sheetName);
        form.append("leagueId", lm.leagueId);
        form.append("years", JSON.stringify([]));
        await api.post("/upload/xlsx/import-country", form, { headers: { "Content-Type": "multipart/form-data" } });
      }

      // Part 2: import club data from year-named sheets
      if (!skipClubs && clubYears.length > 0) {
        const form = new FormData();
        form.append("file", file);
        form.append("years", JSON.stringify(clubYears));
        if (Object.keys(activeMappings).length) form.append("clubMappings", JSON.stringify(activeMappings));

        if (validMappings.length > 0) {
          const ref = validMappings[0];
          form.append("sheetName", ref.sheetName);
          form.append("leagueId", ref.leagueId);
        } else {
          // onlyClubs mode — no league sheet, use reference league
          form.append("onlyClubs", "true");
          form.append("leagueId", clubOnlyLeagueId);
        }

        await api.post("/upload/xlsx/import-country", form, { headers: { "Content-Type": "multipart/form-data" } });
      }

      setDoneInfo({
        leagues: validMappings.map(m => ({
          sheet: m.sheetName,
          league: dbLeagues.find(l => String(l.id_league) === String(m.leagueId))?.name ?? m.leagueId,
        })),
        clubYears: (!skipClubs && clubYears.length > 0) ? clubYears : [],
      });
      setStep("done");
    } catch (err) {
      alert(err?.response?.data?.message || "Erro ao importar dados.");
    } finally { setImporting(false); }
  }

  function addLeagueMapping() {
    setLeagueMappings(prev => [...prev, { id: mkId(), sheetName: "", leagueId: "" }]);
  }

  function removeLeagueMapping(id) {
    setLeagueMappings(prev => prev.filter(m => m.id !== id));
  }

  function updateMapping(id, field, value) {
    setLeagueMappings(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  }

  function toggleClubYear(year) {
    setClubYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  }

  function reset() {
    setFile(null); setStep("upload"); setAnalysis(null);
    setLeagueMappings([{ id: mkId(), sheetName: "", leagueId: "" }]);
    setClubYears([]); setSkipClubs(false); setClubOnlyLeagueId("");
    setClubPreview(null); setClubMappings({});
    setDoneInfo({ leagues: [], clubYears: [] });
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const STEPS = [
    { key: "upload",    label: "Arquivo" },
    { key: "configure", label: "Configurar" },
    { key: "clubs",     label: "Clubes" },
    { key: "done",      label: "Concluído" },
  ];
  const stepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <FileSpreadsheet className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Importação Financeira</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
          Carregue planilhas XLSX para importar dados financeiros de competições e clubes.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 justify-center text-xs font-bold text-gray-400">
        {STEPS.map((s, i) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className={
              step === s.key ? "text-[#7F33D9]"
              : i < stepIndex ? "text-green-500"
              : ""
            }>
              {i + 1}. {s.label}
            </span>
            {i < STEPS.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">

        {/* ── STEP 1: UPLOAD ── */}
        {step === "upload" && (
          <div className="p-8 text-center space-y-6 animate-in fade-in">
            <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
              <input
                type="file"
                accept=".xlsx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={e => setFile(e.target.files[0] || null)}
              />
              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${file ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400 group-hover:text-[#7F33D9]"}`}>
                  {file ? <CheckCircle2 className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
                </div>
                <span className={`text-sm font-semibold ${file ? "text-green-600" : "text-gray-600 group-hover:text-[#7F33D9]"}`}>
                  {file ? file.name : "Clique para selecionar (.xlsx)"}
                </span>
                <span className="text-xs text-gray-400">Planilha de balanços financeiros</span>
              </div>
            </div>
            <div className="flex justify-center">
              <button onClick={handleUpload} disabled={uploading || !file} className={btnPrimary}>
                {uploading
                  ? <><Loader2 className="animate-spin w-4 h-4" /> Processando...</>
                  : <>Ler Arquivo <ArrowRight size={16} /></>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: CONFIGURE ── */}
        {step === "configure" && analysis && (
          <div className="animate-in fade-in">
            {/* File header */}
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">Arquivo carregado</p>
                <p className="text-xs text-gray-500">
                  {file?.name} — {leagueSheets.length} aba(s) disponível(is) · {yearSheets.length} aba(s) com ano
                </p>
              </div>
            </div>

            <div className="p-8 space-y-8">

              {/* ── Part 1: League financials ── */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-[#7F33D9] flex items-center justify-center shrink-0">
                    <Trophy size={15} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Parte 1 — Competições</h2>
                    <p className="text-xs text-gray-400">Vincule cada aba de competição do XLSX a uma competição no banco</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {leagueMappings.map((lm, idx) => (
                    <div key={lm.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                          Competição {idx + 1}
                        </span>
                        {leagueMappings.length > 1 && (
                          <button
                            onClick={() => removeLeagueMapping(lm.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Aba do XLSX</label>
                          <select
                            className={selectClass}
                            value={lm.sheetName}
                            onChange={e => updateMapping(lm.id, "sheetName", e.target.value)}
                          >
                            <option value="">Selecionar aba...</option>
                            {leagueSheets.map(s => (
                              <option key={s.sheetName} value={s.sheetName}>{s.sheetName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Competição no Banco</label>
                          {loadingDbLeagues ? (
                            <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-purple-400 animate-pulse">
                              Carregando competições...
                            </div>
                          ) : (
                            <SearchableSelect
                              grouped={leaguesGrouped}
                              value={lm.leagueId}
                              onChange={val => updateMapping(lm.id, "leagueId", val)}
                              placeholder="Buscar competição..."
                              imageClass="w-6 h-6 object-contain rounded flex-shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add league button */}
                  <button
                    onClick={addLeagueMapping}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 font-medium hover:border-[#7F33D9] hover:text-[#7F33D9] hover:bg-purple-50/30 transition-all"
                  >
                    <Plus size={15} /> Adicionar competição
                  </button>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest px-1">e/ou</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* ── Part 2: Club financials by year ── */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${skipClubs ? "bg-gray-100" : "bg-blue-500"}`}>
                      <Building2 size={15} className={skipClubs ? "text-gray-400" : "text-white"} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Parte 2 — Clubes por Temporada</h2>
                      <p className="text-xs text-gray-400">Selecione as temporadas com dados financeiros de clubes</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={skipClubs}
                      onChange={e => { setSkipClubs(e.target.checked); setClubYears([]); }}
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 font-semibold">Pular</span>
                  </label>
                </div>

                {!skipClubs && (
                  yearSheets.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-3">
                          Abas de temporada encontradas — selecione as que deseja importar:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {yearSheets.map(year => {
                            const sel = clubYears.includes(year);
                            return (
                              <label
                                key={year}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border transition-all select-none ${
                                  sel
                                    ? "bg-[#7F33D9] border-[#7F33D9] text-white shadow-md shadow-purple-500/20"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50"
                                }`}
                              >
                                <input type="checkbox" className="hidden" checked={sel} onChange={() => toggleClubYear(year)} />
                                <span className="font-medium text-sm">{year}</span>
                                {sel && <CheckCircle2 size={13} />}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Reference league picker — only shown when Parte 1 has no mappings */}
                      {onlyClubsMode && clubYears.length > 0 && (
                        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                            Competição de referência
                          </p>
                          <p className="text-xs text-blue-400 mb-3">
                            Nenhuma competição configurada na Parte 1. Selecione a qual competição estes dados de clubes pertencem.
                          </p>
                          {loadingDbLeagues ? (
                            <div className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm text-blue-400 animate-pulse">
                              Carregando competições...
                            </div>
                          ) : (
                            <SearchableSelect
                              grouped={leaguesGrouped}
                              value={clubOnlyLeagueId}
                              onChange={setClubOnlyLeagueId}
                              placeholder="Buscar competição..."
                              imageClass="w-6 h-6 object-contain rounded flex-shrink-0"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-400">
                      <AlertCircle size={16} className="shrink-0" />
                      Nenhuma aba de temporada encontrada neste arquivo.
                    </div>
                  )
                )}
              </div>

              {/* ── Actions ── */}
              <div className="flex justify-between items-center pt-2">
                <button onClick={reset} className={btnSecondary}>Cancelar</button>
                <button
                  onClick={handleAdvance}
                  disabled={previewing || importing || !canAdvance}
                  className={btnPrimary}
                >
                  {previewing
                    ? <><Loader2 className="animate-spin w-4 h-4" /> Analisando clubes...</>
                    : importing
                    ? <><Loader2 className="animate-spin w-4 h-4" /> Importando...</>
                    : (skipClubs || clubYears.length === 0)
                    ? <>Importar <ArrowRight size={16} /></>
                    : <>Verificar Clubes <ArrowRight size={16} /></>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: CLUBS ── */}
        {step === "clubs" && clubPreview && (
          <div className="animate-in fade-in">
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <Shield size={18} className="text-[#7F33D9] shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">Parte 2 — Verificação de Clubes</p>
                <p className="text-xs text-gray-500">Temporadas: {clubYears.join(", ")}</p>
              </div>
              <button
                onClick={() => setStep("configure")}
                className="ml-auto text-xs text-gray-400 hover:text-[#7F33D9] font-medium underline underline-offset-2"
              >
                ← Voltar
              </button>
            </div>

            <div className="p-8 space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="text-[10px] uppercase font-black text-green-400 mb-1">Encontrados</p>
                  <p className="text-2xl font-bold text-green-600">{clubPreview.foundClubs.length}</p>
                  <p className="text-[10px] text-green-500 mt-0.5">clubes reconhecidos</p>
                </div>
                <div className={`p-4 rounded-2xl border ${clubPreview.notFoundSlugs.length > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
                  <p className={`text-[10px] uppercase font-black mb-1 ${clubPreview.notFoundSlugs.length > 0 ? "text-amber-400" : "text-green-400"}`}>
                    Não encontrados
                  </p>
                  <p className={`text-2xl font-bold ${clubPreview.notFoundSlugs.length > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {clubPreview.notFoundSlugs.length}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${clubPreview.notFoundSlugs.length > 0 ? "text-amber-500" : "text-green-500"}`}>
                    {clubPreview.notFoundSlugs.length > 0 ? "requerem mapeamento" : "todos reconhecidos!"}
                  </p>
                </div>
              </div>

              {/* Manual mapping */}
              {clubPreview.notFoundSlugs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700">
                    <AlertTriangle size={14} className="shrink-0" />
                    Estes slugs do XLSX não foram reconhecidos — vincule-os a clubes existentes. Não vinculados serão <strong>ignorados</strong>.
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {clubPreview.notFoundSlugs.map(slug => (
                      <div key={slug} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                        <div className="flex items-center gap-1.5">
                          {clubMappings[slug]
                            ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                            : <XCircle size={13} className="text-amber-400 shrink-0" />
                          }
                          <span className="text-xs font-mono font-semibold text-gray-700 truncate">{slug}</span>
                        </div>
                        <SearchableSelect
                          grouped={clubPreview.allClubsGrouped}
                          value={clubMappings[slug] || ""}
                          onChange={val => setClubMappings(prev => ({ ...prev, [slug]: val }))}
                          placeholder="Buscar clube... (vazio = ignorar)"
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

              {/* Found clubs (collapsible) */}
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
                <button onClick={handleImportAll} disabled={importing} className={btnPrimary}>
                  {importing
                    ? <><Loader2 className="animate-spin w-4 h-4" /> Importando...</>
                    : "Confirmar Importação"
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: DONE ── */}
        {step === "done" && (
          <div className="p-8 text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
              <CheckCircle2 className="text-green-500 w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Importação concluída!</h3>
            </div>

            <div className="text-left space-y-3 max-w-sm mx-auto">
              {doneInfo.leagues.length > 0 && (
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                  <p className="text-[11px] font-black text-purple-600 uppercase tracking-widest mb-3">
                    Competições importadas
                  </p>
                  <div className="space-y-2">
                    {doneInfo.leagues.map((l, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                        <span className="text-xs font-mono text-gray-400">{l.sheet}</span>
                        <ArrowRight size={11} className="text-gray-300 shrink-0" />
                        <span className="text-gray-700 font-medium truncate">{l.league}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {doneInfo.clubYears.length > 0 && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-3">
                    Temporadas de clubes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {doneInfo.clubYears.map(y => (
                      <span key={y} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{y}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={reset} className="text-sm text-[#7F33D9] font-bold hover:underline">
              Fazer novo upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
