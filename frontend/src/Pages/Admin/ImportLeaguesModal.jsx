import { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  FileSpreadsheet, UploadCloud, X, Loader2,
  CheckCircle2, AlertTriangle, HelpCircle, Plus, Globe,
  Trophy, ArrowRight,
} from "lucide-react";
import SearchableSelect from "../../components/uxui/SearchableSelect";

const btnPrimary =
  "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";

// ─────────────────────────────────────────────────────────────────────────────
// Mini-modal: cadastrar país inline
// ─────────────────────────────────────────────────────────────────────────────
function RegisterCountryModal({ csvName, suggestion, onClose, onCreated }) {
  // Pré-preenche com a sugestão do world-countries se existir
  const [name, setName] = useState(suggestion?.namePtBr ?? csvName ?? "");
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
      const res = await api.get("/admin/countries?onlyActive=true&limit=500");
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
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Globe size={18} className="text-[#7F33D9]" /> Cadastrar País
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Sugestão do world-countries — mostra flag + nome en */}
        {suggestion ? (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <img
              src={suggestion.flag}
              alt={suggestion.nameEn}
              className="w-8 h-5 rounded object-cover shadow-sm shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="text-xs text-gray-500">
              Encontrado em <strong>world-countries</strong> como{" "}
              <span className="font-mono text-gray-700">{suggestion.nameEn}</span>
            </span>
          </div>
        ) : (
          <div className="mb-4 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
            <strong>"{csvName}"</strong> não encontrado automaticamente — preencha manualmente.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Nome (como ficará no sistema)
            </label>
            <input
              type="text" className={inputClass} value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Ex: Brasil"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              URL da Bandeira
            </label>
            <div className="flex gap-2 items-center">
              {flag && (
                <img src={flag} alt="preview" className="w-8 h-5 rounded object-cover shadow-sm shrink-0"
                  onError={(e) => { e.target.style.display = "none"; }} />
              )}
              <input
                type="text" className={inputClass} value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder={`https://flagcdn.com/${suggestion?.cca2?.toLowerCase() ?? "xx"}.svg`}
              />
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
// Badge de status para cada país no mapping
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === "ok") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} /> No sistema
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <AlertTriangle size={10} /> Não cadastrado
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ImportLeaguesModal({ onClose, onSuccess }) {
  const [step, setStep] = useState("upload"); // upload | mapping | confirm | done
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dados do preview
  const [dbCountries, setDbCountries] = useState([]);
  const [countriesMap, setCountriesMap] = useState([]); // [{ csvName, id_country, autoResolved, status, selected }]
  const [summary, setSummary] = useState(null);

  // Mini-modal de cadastro
  const [registerModal, setRegisterModal] = useState(null); // null | { index }

  // Resultado final
  const [result, setResult] = useState(null);

  // Pré-carrega países com bandeiras assim que o modal abre (garante flags antes de qualquer análise)
  useEffect(() => {
    api.get("/admin/countries?onlyActive=true&limit=500")
      .then((res) => setDbCountries(res.data.countries ?? []))
      .catch(() => { });
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep("upload"); setFile(null);
    setCountriesMap([]); setSummary(null);
    setRegisterModal(null); setResult(null);
    // Não limpa dbCountries — mantém as bandeiras já carregadas para a próxima tentativa
  };

  const handleClose = () => { reset(); onClose(); };

  // Override map para enviar ao backend: { "csvName": id_country }
  const buildOverrideMap = () => {
    const map = {};
    countriesMap.forEach((c) => {
      if (c.selected && !c.autoResolved) map[c.csvName] = c.selected;
    });
    return map;
  };

  // ── Step 1 → 2: Upload e análise ──────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload/import/leagues/preview", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Mescla com o que já foi pré-carregado; o backend é a fonte de verdade (tem flag_url)
      if ((data.allDbCountries ?? []).length > 0) {
        setDbCountries(data.allDbCountries);
      }
      setSummary(data.summary);

      // Inicializa mapa: auto-resolvidos ficam como selecionados; guarda registerSuggestion
      setCountriesMap(
        (data.countriesForMapping ?? []).map((c) => ({
          ...c,
          selected: c.id_country ? String(c.id_country) : "",
          // registerSuggestion vem do backend: { namePtBr, nameEn, cca2, flag }
        }))
      );

      // Se todos países já estão resolvidos, pula direto para confirmação
      const hasUnresolved = (data.countriesForMapping ?? []).some((c) => !c.id_country);
      setStep(hasUnresolved ? "mapping" : "confirm");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao analisar arquivo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → 3: Do mapping para confirmação ───────────────────────────────
  const handleGoToConfirm = async () => {
    // Recalcula summary com o mapeamento atual
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("countryMap", JSON.stringify(buildOverrideMap()));
      const { data } = await api.post("/upload/import/leagues/preview", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSummary(data.summary);
      setStep("confirm");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao recalcular.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 → 4: Importação final ──────────────────────────────────────────
  const handleImport = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("countryMap", JSON.stringify(buildOverrideMap()));
      const { data } = await api.post("/upload/import/leagues", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      setStep("done");
      onSuccess();
    } catch (err) {
      alert(err?.response?.data?.error || "Erro na importação.");
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers do mapeamento ─────────────────────────────────────────────────
  const updateMapping = (index, value) =>
    setCountriesMap((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], selected: value, status: value ? "ok" : "notfound" };
      return copy;
    });

  const handleCountryCreated = (index, newCountry) => {
    if (newCountry.id_country) {
      setDbCountries((prev) => {
        if (prev.find((c) => c.id_country === newCountry.id_country)) return prev;
        return [...prev, { id_country: newCountry.id_country, name: newCountry.name, flag_url: newCountry.flag_url }]
          .sort((a, b) => a.name.localeCompare(b.name));
      });
    }
    updateMapping(index, newCountry.id_country ? String(newCountry.id_country) : "");
    setRegisterModal(null);
  };

  const missingCount = countriesMap.filter((c) => !c.selected).length;
  const unresolvedCountries = countriesMap.filter((c) => !c.autoResolved);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/40 " />
        <div
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy size={18} className="text-[#7F33D9]" /> Importar Competições
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">

            {/* ── STEP 1: Upload ──────────────────────────────────── */}
            {step === "upload" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Selecione o arquivo CSV de competições (delimitado por <code className="text-xs bg-gray-100 px-1 rounded">;</code>).
                </p>
                <label className="block p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-purple-300 transition-colors text-center cursor-pointer group">
                  <input
                    type="file" accept=".csv" className="hidden"
                    onChange={(e) => setFile(e.target.files[0] || null)}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud size={32} className="text-gray-400 group-hover:text-[#7F33D9] transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                      {file ? file.name : "Clique para selecionar o arquivo .csv"}
                    </span>
                  </div>
                </label>
                <button onClick={handleAnalyze} disabled={!file || loading} className={`w-full ${btnPrimary}`}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
                </button>
              </div>
            )}

            {/* ── STEP 2: Mapeamento de países ─────────────────────── */}
            {step === "mapping" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-medium">Mapeie os países não encontrados:</p>
                  {missingCount > 0 && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      {missingCount} pendente{missingCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Países auto-resolvidos — só contagem, sem listar */}
                {countriesMap.filter((c) => c.autoResolved).length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="text-sm text-emerald-700">
                      <strong>{countriesMap.filter((c) => c.autoResolved).length}</strong>{" "}
                      país{countriesMap.filter((c) => c.autoResolved).length !== 1 ? "es" : ""} reconhecido{countriesMap.filter((c) => c.autoResolved).length !== 1 ? "s" : ""} automaticamente.
                    </span>
                  </div>
                )}

                {/* Países não resolvidos */}
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 -mr-1">
                  {unresolvedCountries.map((item, i) => {
                    const globalIndex = countriesMap.findIndex((c) => c.csvName === item.csvName);
                    return (
                      <div
                        key={item.csvName}
                        className={`rounded-xl border p-3 transition-colors ${item.selected ? "border-gray-200 bg-white" : "border-amber-300 bg-amber-50/40"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-700 truncate mr-2">{item.csvName}</span>
                          <StatusBadge status={item.selected ? "ok" : "notfound"} />
                        </div>
                        <div className="flex gap-2 items-center">
                          <SearchableSelect
                            options={dbCountries.map((c) => ({
                              value: String(c.id_country),
                              label: c.name,
                              image: c.flag_url,
                            }))}
                            value={item.selected}
                            onChange={(val) => updateMapping(globalIndex, val)}
                            placeholder="Selecione um país..."
                          />
                          {!item.selected && (
                            <button
                              onClick={() => setRegisterModal({
                                index: globalIndex,
                                csvName: item.csvName,
                                suggestion: item.registerSuggestion ?? null,
                              })}
                              title="Cadastrar este país"
                              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#7F33D9]/10 text-[#7F33D9] hover:bg-[#7F33D9]/20 transition-colors border border-[#7F33D9]/20"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                          {item.selected && (
                            <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-200">
                              <CheckCircle2 size={16} />
                            </div>
                          )}
                        </div>
                        {!item.selected && item.registerSuggestion && (
                          <p className="mt-1.5 text-[10px] text-amber-600 flex items-center gap-1">
                            <img
                              src={item.registerSuggestion.flag}
                              alt=""
                              className="w-4 h-3 rounded object-cover shadow-sm shrink-0"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                            Sugestão encontrada: <strong>{item.registerSuggestion.nameEn}</strong> — clique em <strong>+</strong> para cadastrar.
                          </p>
                        )}
                        {!item.selected && !item.registerSuggestion && (
                          <p className="mt-1.5 text-[10px] text-red-500">
                            Não reconhecido. Selecione um país existente ou clique em <strong>+</strong> para cadastrar manualmente.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleGoToConfirm}
                  disabled={missingCount > 0 || loading}
                  className={`w-full ${btnPrimary}`}
                >
                  {loading
                    ? <Loader2 size={18} className="animate-spin" />
                    : missingCount > 0
                      ? `${missingCount} país${missingCount > 1 ? "es" : ""} pendente${missingCount > 1 ? "s" : ""}`
                      : <>Continuar <ArrowRight size={16} /></>
                  }
                </button>
              </div>
            )}

            {/* ── STEP 3: Confirmação ────────────────────────────────── */}
            {step === "confirm" && summary && (
              <div className="space-y-5">
                <p className="text-sm text-gray-500">Revise o resumo antes de importar:</p>

                <div className="grid grid-cols-2 gap-3">
                  <SummaryCard label="Total" value={summary.total} color="gray" />
                  <SummaryCard label="Novos" value={summary.insert} color="emerald" />
                  <SummaryCard label="Atualizações" value={summary.update} color="blue" />
                  <SummaryCard label="Sem país (ignorados)" value={summary.error} color="red" />
                </div>

                {summary.error > 0 && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{summary.error} linha(s) sem país mapeado serão ignoradas.</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep("mapping")} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                    Voltar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading || (summary.insert + summary.update) === 0}
                    className={`flex-1 ${btnPrimary}`}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Importar"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Resultado ─────────────────────────────────── */}
            {step === "done" && result && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="text-emerald-600 w-6 h-6 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">Importação concluída!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {result.inserted} inseridas · {result.updated} atualizadas · {result.skipped} ignoradas
                    </p>
                  </div>
                </div>

                {result.errors?.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-xs font-bold text-red-700 mb-2 uppercase tracking-wide">
                      Erros ({result.errors.length})
                    </p>
                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-xs text-red-600">
                          <strong>{e.name}</strong> — {e.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button onClick={handleClose} className={`w-full ${btnPrimary}`}>
                  Fechar
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mini-modal de cadastro inline */}
      {registerModal && (
        <RegisterCountryModal
          csvName={registerModal.csvName}
          suggestion={registerModal.suggestion}
          onClose={() => setRegisterModal(null)}
          onCreated={(newCountry) => handleCountryCreated(registerModal.index, newCountry)}
        />
      )}
    </>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    gray: "bg-gray-50   border-gray-200   text-gray-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-blue-50   border-blue-200   text-blue-700",
    red: "bg-red-50    border-red-200    text-red-700",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide mt-1 opacity-80">{label}</div>
    </div>
  );
}
