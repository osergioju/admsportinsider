import { useState } from "react";
import { api } from "../../services/api";
import {
  FileSpreadsheet, UploadCloud, X, Loader2,
  CheckCircle2, AlertTriangle, HelpCircle, Plus, Globe, ShieldOff, Shield
} from "lucide-react";
import SearchableSelect from "../../components/uxui/SearchableSelect";

const btnPrimary =
  "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";

// ---------------------------------------------------------------------------
// Mini-modal: cadastrar país inline
// Abre quando o país está "unregistered" (achou no world-countries mas não no banco)
// ou "unknown" (não achou em lugar nenhum — campo livre)
// ---------------------------------------------------------------------------
function RegisterCountryModal({ suggestion, onClose, onCreated }) {
  const [name, setName] = useState(suggestion?.namePtBr ?? "");
  const [flag, setFlag] = useState(suggestion?.flag ?? "");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      // POST /admin/send-countries espera { value, flag, codigo }
      await api.post("/admin/send-countries", {
        value: name.trim(),
        flag: flag.trim() || null,
        codigo: suggestion?.cca2 ?? null,
      });

      // Busca o país recém-criado pra pegar o id_country
      const res = await api.get("/admin/countries?limit=500");
      const created = res.data.countries.find(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase()
      );

      onCreated({ id_country: created?.id_country, name: name.trim() });
    } catch {
      alert("Erro ao cadastrar país");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 " />
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Globe size={18} className="text-[#7F33D9]" />
            Cadastrar País
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Preview da flag se veio sugestão */}
          {suggestion?.flag && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <img
                src={suggestion.flag}
                alt={name}
                className="w-8 h-5 rounded object-cover shadow-sm"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <span className="text-xs text-gray-500">
                Encontrado em <strong>world-countries</strong> como{" "}
                <span className="font-mono">{suggestion.nameEn}</span>
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Nome (como ficará no sistema)
            </label>
            <input
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Brasil"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              URL da Bandeira
            </label>
            <div className="flex gap-2 items-center">
              {flag && (
                <img
                  src={flag}
                  alt="flag preview"
                  className="w-8 h-5 rounded object-cover shadow-sm shrink-0"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
              <input
                type="text"
                className={inputClass}
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="https://flagcdn.com/br.svg"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className={`w-full ${btnPrimary}`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Cadastrar e selecionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge de status para cada linha de país no mapping
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
  if (status === "ok") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} /> No sistema
    </span>
  );
  if (status === "unregistered") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <AlertTriangle size={10} /> Não cadastrado
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <HelpCircle size={10} /> Desconhecido
    </span>
  );
}

// ---------------------------------------------------------------------------
// Select de país com busca — cadastrados no sistema
// ---------------------------------------------------------------------------
function CountrySelect({ value, onChange, dbCountries }) {
  return (
    <SearchableSelect
      options={dbCountries.map((c) => ({
        value: String(c.id_country),
        label: c.name,
        image: c.flag_url,
      }))}
      value={value}
      onChange={onChange}
      placeholder="Selecione um país..."
    />
  );
}

// ---------------------------------------------------------------------------
// ImportModal principal
// ---------------------------------------------------------------------------
export default function ImportModal({ countries: initialCountries, onClose, onSuccess }) {
  const [step, setStep] = useState("upload"); // upload | selectSheet | options | mapping | confirmDisable
  const [importFile, setImportFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clubsToDisable, setClubsToDisable] = useState([]);

  // Opções de importação
  const [options, setOptions] = useState({
    insertNew:          true,
    updateColors:       false,
    updateGender:       false,
    updateTranslations: false,
    updateSlug:         false,
    disableMissing:     false,
  });
  const toggleOption = (key) => setOptions(p => ({ ...p, [key]: !p[key] }));

  // Lista de países do banco — pode crescer se o usuário cadastrar inline
  const [dbCountries, setDbCountries] = useState(initialCountries ?? []);

  // Mini-modal de cadastro
  const [registerModal, setRegisterModal] = useState(null); // null | { index, suggestion }

  // -------------------------------------------------------------------------
  const reset = () => {
    setStep("upload");
    setImportFile(null);
    setSheets([]);
    setSelectedSheet("");
    setPreviewData([]);
    setClubsToDisable([]);
    setRegisterModal(null);
    setOptions({ insertNew: true, updateColors: false, updateGender: false, updateTranslations: false, updateSlug: false, disableMissing: false });
  };

  const handleClose = () => { reset(); onClose(); };

  // -------------------------------------------------------------------------
  // Step 1 → 2
  const handleUploadContinue = async () => {
    if (!importFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await api.post("/admin/preview-import", fd);

      setSheets(res.data.sheets);
      setStep("selectSheet");
    } catch {
      alert("Erro ao processar arquivo");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → 3 (opções)
  const handleSheetContinue = () => {
    if (!selectedSheet) return;
    setStep("options");
  };

  // Step 3 → 4 (mapping)
  const handleOptionsContinue = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("sheetName", selectedSheet);
      const res = await api.post("/admin/preview-import", fd);

      if (res.data.dbCountries?.length) {
        setDbCountries(res.data.dbCountries);
      }

      setPreviewData(
        (res.data.countries ?? []).map((c) => ({
          ...c,
          selected: c.resolved?.id_country ? String(c.resolved.id_country) : "",
        }))
      );
      setStep("mapping");
    } catch {
      alert("Erro ao processar aba");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: importação final
  const handleFinalImport = async () => {
    const hasMissing = previewData.some((p) => !p.selected);
    if (hasMissing) return alert("Existem países não mapeados");

    const country_map = {};
    previewData.forEach((p) => { country_map[p.file] = p.selected; });

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("sheetName", selectedSheet);
      fd.append("country_map", JSON.stringify(country_map));
      fd.append("options", JSON.stringify(options));
      const res = await api.post("/admin/import-clubs-xlsx", fd);

      const toDisable = res.data.clubs_to_disable ?? [];
      if (options.disableMissing && toDisable.length > 0) {
        setClubsToDisable(toDisable);
        setStep("confirmDisable");
        onSuccess();
      } else {
        alert(`Importação concluída! ${res.data.inserted} inseridos, ${res.data.skipped} ignorados.`);
        reset();
        onSuccess();
        onClose();
      }
    } catch {
      alert("Erro na importação");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: confirmar desativação em massa
  const handleConfirmDisable = async () => {
    setLoading(true);
    try {
      const ids = clubsToDisable.map(c => c.id_club);
      await api.post("/admin/clubs/bulk-disable", { ids });
      alert(`${ids.length} clube${ids.length !== 1 ? "s" : ""} desativado${ids.length !== 1 ? "s" : ""}.`);
      reset();
      onClose();
    } catch {
      alert("Erro ao desativar clubes");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  const updateSelected = (index, value) =>
    setPreviewData((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], selected: value };
      return copy;
    });

  // Chamado quando o usuário cadastra um país inline
  const handleCountryCreated = (index, newCountry) => {
    // Adiciona na lista local pra aparecer nos outros selects também
    if (newCountry.id_country) {
      setDbCountries((prev) => {
        const already = prev.find((c) => c.id_country === newCountry.id_country);
        if (already) return prev;
        return [...prev, newCountry].sort((a, b) => a.name.localeCompare(b.name));
      });
    }

    // Pré-seleciona para a linha que abriu o modal
    updateSelected(index, newCountry.id_country ?? "");

    // Atualiza o status da linha pra "ok"
    setPreviewData((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        status: "ok",
        resolved: newCountry,
        selected: newCountry.id_country ?? "",
      };
      return copy;
    });

    setRegisterModal(null);
  };

  // -------------------------------------------------------------------------
  const missingCount = previewData.filter((p) => !p.selected).length;

  const borderClass = (item) => {
    if (item.selected) return "border-gray-200";
    if (item.status === "unknown") return "border-red-400 focus:border-red-400 focus:ring-red-200";
    return "border-amber-400 focus:border-amber-400 focus:ring-amber-200";
  };

  // -------------------------------------------------------------------------
  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/40 " />
        <div
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="text-green-600" size={20} />
              Importar Clubes
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* ===== STEP 1: Upload ===== */}
          {step === "upload" && (
            <div className="space-y-4">
              <label className="block p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-purple-300 transition-colors text-center cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files[0])}
                />
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud size={32} className="text-gray-400 group-hover:text-[#7F33D9] transition-colors" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                    {importFile ? importFile.name : "Clique para selecionar o arquivo XLSX"}
                  </span>
                </div>
              </label>
              <button
                onClick={handleUploadContinue}
                disabled={!importFile || loading}
                className={`w-full ${btnPrimary}`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Continuar"}
              </button>
            </div>
          )}

          {/* ===== STEP 2: Selecionar aba ===== */}
          {step === "selectSheet" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Escolha a aba da planilha:</p>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {sheets.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
              <button
                onClick={handleSheetContinue}
                disabled={!selectedSheet || loading}
                className={`w-full ${btnPrimary}`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Continuar"}
              </button>
            </div>
          )}

          {/* ===== STEP 3: Opções ===== */}
          {step === "options" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">O que fazer com os dados da planilha?</p>

              <div className="space-y-2">
                {[
                  { key: "insertNew",          label: "Inserir clubes novos",           desc: "Adiciona clubes que ainda não existem no sistema" },
                  { key: "updateColors",        label: "Atualizar cores",                desc: "Sobrescreve cor primária, secundária e terciária dos clubes existentes" },
                  { key: "updateGender",        label: "Atualizar gênero",               desc: "Define o campo gênero (Masculino / Feminino) nos clubes existentes" },
                  { key: "updateTranslations",  label: "Atualizar traduções (PT/EN/ES)", desc: "Insere ou atualiza os nomes traduzidos dos clubes existentes" },
                  { key: "updateSlug",          label: "Atualizar slug",                 desc: "Atualiza o slug (e crest_url) dos clubes existentes buscando por nome + país" },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      options[key]
                        ? "border-[#7F33D9] bg-purple-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[#7F33D9]"
                      checked={options[key]}
                      onChange={() => toggleOption(key)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Opção destrutiva — separada visualmente */}
              <div className="pt-1 border-t border-gray-100">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    options.disableMissing
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white hover:bg-red-50/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-red-500"
                    checked={options.disableMissing}
                    onChange={() => toggleOption("disableMissing")}
                  />
                  <div>
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                      <ShieldOff size={13} /> Desabilitar clubes ausentes do CSV
                    </p>
                    <p className="text-xs text-red-500 mt-0.5">
                      Após importar, mostra uma prévia dos clubes ativos nos mesmos países que não estão no arquivo. Você confirma antes de qualquer desativação.
                    </p>
                  </div>
                </label>
              </div>

              {!options.insertNew && !options.updateColors && !options.updateGender && !options.updateTranslations && !options.updateSlug && !options.disableMissing && (
                <p className="text-xs text-red-500 font-medium">Selecione pelo menos uma opção.</p>
              )}

              <button
                onClick={handleOptionsContinue}
                disabled={loading || (!options.insertNew && !options.updateColors && !options.updateGender && !options.updateTranslations && !options.updateSlug && !options.disableMissing)}
                className={`w-full ${btnPrimary}`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Continuar"}
              </button>
            </div>
          )}

          {/* ===== STEP 4: Mapping ===== */}
          {step === "mapping" && (
            <div className="space-y-4">
              {/* Sumário */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Mapeie os países do Excel:</p>
                {missingCount > 0 && (
                  <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    {missingCount} pendente{missingCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 -mr-1">
                {previewData.map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 transition-colors ${item.selected
                      ? "border-gray-100 bg-white"
                      : item.status === "unknown"
                        ? "border-red-200 bg-red-50/40"
                        : "border-amber-200 bg-amber-50/40"
                      }`}
                  >
                    {/* Nome do arquivo + badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 truncate mr-2">
                        {item.file}
                      </span>
                      <StatusBadge status={item.selected ? "ok" : item.status} />
                    </div>

                    {/* Linha: select + botão cadastrar */}
                    <div className="flex gap-2 items-center">
                      <CountrySelect
                        value={item.selected}
                        onChange={(val) => updateSelected(i, val)}
                        dbCountries={dbCountries}
                        status={item.status}
                        borderClass={borderClass(item)}
                      />

                      {/* Botão cadastrar — aparece só quando não está no banco */}
                      {item.status !== "ok" && !item.selected && (
                        <button
                          onClick={() => setRegisterModal({ index: i, suggestion: item.registerSuggestion })}
                          title="Cadastrar este país"
                          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#7F33D9]/10 text-[#7F33D9] hover:bg-[#7F33D9]/20 transition-colors border border-[#7F33D9]/20"
                        >
                          <Plus size={16} />
                        </button>
                      )}

                      {/* Check quando já mapeado */}
                      {item.selected && (
                        <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-200">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>

                    {/* Hint: sugestão automática */}
                    {item.status === "unregistered" && !item.selected && item.registerSuggestion && (
                      <p className="mt-1.5 text-[10px] text-amber-600">
                        Encontrado como <strong>{item.registerSuggestion.nameEn}</strong> — clique em{" "}
                        <strong>+</strong> para cadastrar rapidamente.
                      </p>
                    )}
                    {item.status === "unknown" && !item.selected && (
                      <p className="mt-1.5 text-[10px] text-red-500">
                        País não reconhecido. Selecione manualmente ou cadastre um novo.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinalImport}
                disabled={missingCount > 0 || loading}
                className={`w-full ${btnPrimary}`}
              >
                {loading
                  ? <Loader2 size={18} className="animate-spin" />
                  : missingCount > 0
                    ? `${missingCount} país${missingCount > 1 ? "es" : ""} pendente${missingCount > 1 ? "s" : ""}`
                    : "Importar"}
              </button>
            </div>
          )}

          {/* ===== STEP 5: Confirmar desativação ===== */}
          {step === "confirmDisable" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Atenção: ação irreversível</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Os <strong>{clubsToDisable.length} clube{clubsToDisable.length !== 1 ? "s" : ""}</strong> abaixo estão ativos no sistema mas não constam no CSV. Confirme para desativá-los.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1 -mr-1">
                {clubsToDisable.map((club) => (
                  <div key={club.id_club} className="flex items-center gap-2.5 px-3 py-2 bg-white border border-gray-100 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {club.crest_url
                        ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_${club.crest_url}.webp`} className="w-full h-full object-contain" alt="" />
                        : <Shield size={13} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{club.name}</p>
                      {club.country_name && (
                        <p className="text-[11px] text-gray-400">{club.country_name}</p>
                      )}
                    </div>
                    <ShieldOff size={13} className="text-red-300 shrink-0" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar (não desabilitar)
                </button>
                <button
                  onClick={handleConfirmDisable}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-70"
                >
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><ShieldOff size={15} /> Desabilitar {clubsToDisable.length}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini-modal de cadastro inline */}
      {registerModal && (
        <RegisterCountryModal
          suggestion={registerModal.suggestion}
          onClose={() => setRegisterModal(null)}
          onCreated={(newCountry) => handleCountryCreated(registerModal.index, newCountry)}
        />
      )}
    </>
  );
}