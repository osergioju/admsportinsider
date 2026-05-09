import { useState } from "react";
import { api } from "../../services/api";
import { FileSpreadsheet, UploadCloud, X, Loader2, CheckCircle2, AlertTriangle, HelpCircle, Plus, Globe } from "lucide-react";
import SearchableSelect from "../../components/uxui/SearchableSelect";

const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";

function StatusBadge({ status }) {
  if (status === "ok") return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> No sistema</span>;
  if (status === "unregistered") return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> Não cadastrado</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><HelpCircle size={10} /> Desconhecido</span>;
}

const IMPORT_OPTIONS = [
  { key: "insertNew",          label: "Inserir competições novas",        desc: "Adiciona competições que ainda não existem no sistema" },
  { key: "updateName",         label: "Atualizar nome (PT)",              desc: "Sobrescreve o nome principal da competição" },
  { key: "updateFullName",     label: "Atualizar nome completo",          desc: "Sobrescreve o nome completo (exibido em parênteses)" },
  { key: "updateOrganizer",    label: "Atualizar organizador",            desc: "Atualiza o nome da entidade organizadora (ex: CBF)" },
  { key: "updateFormat",       label: "Atualizar fórmula de disputa",     desc: "Atualiza a fórmula de disputa da competição" },
  { key: "updateGender",       label: "Atualizar gênero",                 desc: "Define o gênero (Masculino / Feminino / Misto)" },
  { key: "updateTranslations", label: "Atualizar traduções (PT/EN/ES)",   desc: "Insere ou atualiza os nomes traduzidos" },
];

export default function LeagueImportModal({ countries: initialCountries, onClose, onSuccess }) {
  const [step, setStep] = useState("upload"); // upload | selectSheet | options | mapping
  const [importFile, setImportFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbCountries, setDbCountries] = useState(initialCountries ?? []);
  const [options, setOptions] = useState({ insertNew: true, updateName: false, updateFullName: false, updateOrganizer: false, updateFormat: false, updateGender: false, updateTranslations: false });

  const toggleOption = (key) => setOptions(p => ({ ...p, [key]: !p[key] }));
  const anySelected = Object.values(options).some(Boolean);
  const missingCount = previewData.filter(p => !p.selected).length;

  const reset = () => {
    setStep("upload"); setImportFile(null); setSheets([]); setSelectedSheet(""); setPreviewData([]);
    setOptions({ insertNew: true, updateName: false, updateFullName: false, updateOrganizer: false, updateFormat: false, updateGender: false, updateTranslations: false });
  };
  const handleClose = () => { reset(); onClose(); };

  const handleUploadContinue = async () => {
    if (!importFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await api.post("/admin/preview-league-import", fd);
      setSheets(res.data.sheets);
      setStep("selectSheet");
    } catch { alert("Erro ao processar arquivo"); }
    finally { setLoading(false); }
  };

  const handleSheetContinue = () => { if (selectedSheet) setStep("options"); };

  const handleOptionsContinue = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("sheetName", selectedSheet);
      const res = await api.post("/admin/preview-league-import", fd);
      if (res.data.dbCountries?.length) setDbCountries(res.data.dbCountries);
      setPreviewData((res.data.countries ?? []).map(c => ({
        ...c,
        selected: c.resolved?.id_country ? String(c.resolved.id_country) : "",
      })));
      setStep("mapping");
    } catch { alert("Erro ao processar aba"); }
    finally { setLoading(false); }
  };

  const handleFinalImport = async () => {
    if (missingCount) return alert("Existem países não mapeados");
    const country_map = {};
    previewData.forEach(p => { country_map[p.file] = p.selected; });
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("sheetName", selectedSheet);
      fd.append("country_map", JSON.stringify(country_map));
      fd.append("options", JSON.stringify(options));
      const res = await api.post("/admin/import-leagues-xlsx", fd);
      alert(`Importação concluída! ${res.data.inserted} processadas, ${res.data.skipped} ignoradas.`);
      reset(); onSuccess(); onClose();
    } catch { alert("Erro na importação"); }
    finally { setLoading(false); }
  };

  const updateSelected = (index, value) =>
    setPreviewData(prev => { const c = [...prev]; c[index] = { ...c[index], selected: value }; return c; });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 p-6" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="text-green-600" size={20} />
            Importar Competições
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <label className="block p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-purple-300 transition-colors text-center cursor-pointer group">
              <input type="file" accept=".xlsx" className="hidden" onChange={e => setImportFile(e.target.files[0])} />
              <div className="flex flex-col items-center gap-2">
                <UploadCloud size={32} className="text-gray-400 group-hover:text-[#7F33D9] transition-colors" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                  {importFile ? importFile.name : "Clique para selecionar o arquivo XLSX"}
                </span>
              </div>
            </label>
            <button onClick={handleUploadContinue} disabled={!importFile || loading} className={`w-full ${btnPrimary}`}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Continuar"}
            </button>
          </div>
        )}

        {/* STEP 2: Aba */}
        {step === "selectSheet" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Escolha a aba da planilha:</p>
            <select value={selectedSheet} onChange={e => setSelectedSheet(e.target.value)} className={inputClass}>
              <option value="">Selecione...</option>
              {sheets.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
            <button onClick={handleSheetContinue} disabled={!selectedSheet} className={`w-full ${btnPrimary}`}>
              Continuar
            </button>
          </div>
        )}

        {/* STEP 3: Opções */}
        {step === "options" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">O que fazer com os dados da planilha?</p>
            <div className="space-y-2">
              {IMPORT_OPTIONS.map(({ key, label, desc }) => (
                <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${options[key] ? "border-[#7F33D9] bg-purple-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                  <input type="checkbox" className="mt-0.5 accent-[#7F33D9]" checked={options[key]} onChange={() => toggleOption(key)} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {!anySelected && <p className="text-xs text-red-500 font-medium">Selecione pelo menos uma opção.</p>}
            <button onClick={handleOptionsContinue} disabled={loading || !anySelected} className={`w-full ${btnPrimary}`}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Continuar"}
            </button>
          </div>
        )}

        {/* STEP 4: Mapping de países */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {previewData.length === 0 ? "Nenhum país para mapear (só ligas continentais)." : "Mapeie os países do Excel:"}
              </p>
              {missingCount > 0 && (
                <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  {missingCount} pendente{missingCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {previewData.length > 0 && (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 -mr-1">
                {previewData.map((item, i) => (
                  <div key={i} className={`rounded-xl border p-3 transition-colors ${item.selected ? "border-gray-100 bg-white" : item.status === "unknown" ? "border-red-200 bg-red-50/40" : "border-amber-200 bg-amber-50/40"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 truncate mr-2">{item.file}</span>
                      <StatusBadge status={item.selected ? "ok" : item.status} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <SearchableSelect
                        options={dbCountries.map(c => ({ value: String(c.id_country), label: c.name, image: c.flag_url }))}
                        value={item.selected}
                        onChange={val => updateSelected(i, val)}
                        placeholder="Selecione um país..."
                      />
                      {item.selected && (
                        <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-200">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleFinalImport} disabled={missingCount > 0 || loading} className={`w-full ${btnPrimary}`}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : missingCount > 0 ? `${missingCount} país pendente` : "Importar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
