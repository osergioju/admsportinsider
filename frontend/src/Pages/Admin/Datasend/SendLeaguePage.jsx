import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Table } from "lucide-react";

export default function UploadLeagueBalancePage() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload");
  const [analysis, setAnalysis] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);

  const [leagues, setLeagues] = useState([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  const [mapping, setMapping] = useState({
    leagueId: "",
    years: []
  });
    
  async function handleUpload() {
    if (!file) {
      alert("Selecione um arquivo XLSX");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post(
        "/upload/xlsx/analyze",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setAnalysis(data);
      setStep("mapping");

    } catch (err) {
      console.error(err);
      alert("Erro ao ler o arquivo");
    } finally {
      setUploading(false);
    }
  }


  // 🔹 Carregar ligas quando entrar no mapping
  useEffect(() => {
    if (step !== "mapping") return;

    async function loadLeagues() {
      try {
        setLoadingLeagues(true);
        const { data } = await api.get("/admin/leagues");
        setLeagues(data.leagues);
      } catch (err) {
        console.error("Erro ao carregar ligas", err);
        alert("Erro ao carregar ligas");
      } finally {
        setLoadingLeagues(false);
      }
    }

    loadLeagues();
  }, [step]);

  function toggleYear(year) {
    setMapping((prev) => ({
      ...prev,
      years: prev.years.includes(year)
        ? prev.years.filter((y) => y !== year)
        : [...prev.years, year]
    }));
  }

  const currentSheet = analysis?.sheets.find(
    s => s.sheetName === selectedSheet
  );
    
  async function handleConfirmImport() {
    if (!file || !selectedSheet || !mapping.leagueId) {
      alert("Mapeamento incompleto.");
      return;
    }

    const confirm = window.confirm(
      "Você tem certeza que deseja IMPORTAR esses dados?\n\n" +
      "Essa ação irá gravar os dados no banco e pode sobrescrever valores existentes."
    );

    if (!confirm) return;

    setImporting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sheetName", selectedSheet);
    formData.append("leagueId", mapping.leagueId);
    formData.append("years", JSON.stringify(mapping.years));

    try {
      await api.post(
        "/upload/xlsx/import-country",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Importação concluída com sucesso!");

      setStep("upload");
      setFile(null);
      setAnalysis(null);
      setSelectedSheet(null);
      setMapping({ leagueId: "", years: [] });

    } catch (err) {
      console.error("Erro na importação:", err);
      alert("Erro ao importar dados da liga.");
    } finally {
      setImporting(false);
    }
  }

  // --- ESTILOS PADRÃO ---
  const btnPrimary = "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto";
  const selectClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all text-gray-700";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
            <FileSpreadsheet className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Importação Financeira
        </h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Carregue planilhas de balanços financeiros para alimentar os dados das ligas.
        </p>
      </div>

      {/* STEP 1 — UPLOAD */}
      {step === "upload" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 text-center animate-in zoom-in-95 duration-300">
          
          <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
            <input
                type="file"
                accept=".xlsx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={(e) => setFile(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                    <UploadCloud className="text-gray-400 w-7 h-7 group-hover:text-[#7F33D9]" />
                </div>
                <div>
                    <span className="text-lg font-bold text-gray-700 group-hover:text-[#7F33D9] transition-colors">
                        {file ? file.name : "Clique para selecionar"}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">Suporta apenas arquivos .xlsx</p>
                </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className={`${btnPrimary} min-w-[200px]`}
            >
                {uploading ? (
                <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Processando...
                </>
                ) : (
                <>
                    Ler Arquivo <ArrowRight size={18} />
                </>
                )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — MAPEAMENTO */}
      {step === "mapping" && analysis && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in slide-in-from-right-8 duration-500">
            
            {/* Header do Card */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <CheckCircle2 size={18} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Arquivo Carregado</h3>
                    <p className="text-xs text-gray-500">{file?.name}</p>
                </div>
            </div>

            <div className="p-8 space-y-8">

                {/* Seleção de Aba e Liga */}
                <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Aba da Planilha</label>
                        <div className="relative">
                            <select
                                className={selectClass}
                                value={selectedSheet || ""}
                                onChange={(e) => {
                                    setSelectedSheet(e.target.value);
                                    setMapping({ leagueId: "", years: [] });
                                }}
                            >
                                <option value="">Selecione...</option>
                                {analysis.sheets.map((sheet) => (
                                    <option key={sheet.sheetName} value={sheet.sheetName}>
                                        {sheet.sheetName}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-3 mr-2 pointer-events-none text-gray-400">
                                <Table size={16} />
                            </div>
                        </div>
                    </div>

                    {selectedSheet && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className={labelClass}>Vincular à Liga</label>
                            <select
                                className={selectClass}
                                value={mapping.leagueId}
                                onChange={(e) =>
                                    setMapping({
                                        ...mapping,
                                        leagueId: e.target.value
                                    })
                                }
                                disabled={loadingLeagues}
                            >
                                <option value="">Selecione...</option>
                                {leagues.map((league) => (
                                    <option key={league.id_league} value={league.id_league}>
                                        {league.name}
                                    </option>
                                ))}
                            </select>
                            {loadingLeagues && <p className="text-xs text-purple-500 mt-1 animate-pulse">Carregando ligas...</p>}
                        </div>
                    )}
                </div>

                {/* Seleção de Anos */}
                {currentSheet && currentSheet.detectedYears.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 animate-in fade-in">
                        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle size={16} className="text-[#7F33D9]" />
                            Selecione os Anos para Importar
                        </h2>

                        <div className="flex flex-wrap gap-3">
                            {currentSheet.detectedYears.map((year) => {
                                const isSelected = mapping.years.includes(year);
                                return (
                                    <label
                                        key={year}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border transition-all duration-200 select-none
                                            ${isSelected 
                                                ? "bg-[#7F33D9] border-[#7F33D9] text-white shadow-md shadow-purple-500/20" 
                                                : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50"
                                            }
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isSelected}
                                            onChange={() => toggleYear(year)}
                                        />
                                        <span className="font-medium text-sm">{year}</span>
                                        {isSelected && <CheckCircle2 size={14} />}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Botão de Ação Final */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleConfirmImport}
                        disabled={
                            importing ||
                            !selectedSheet ||
                            !mapping.leagueId ||
                            mapping.years.length === 0
                        }
                        className={btnPrimary}
                    >
                        {importing ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5" />
                                Importando Dados...
                            </>
                        ) : (
                            "Confirmar Importação"
                        )}
                    </button>
                </div>

            </div>
        </div>
      )}
    </div>
  );
}