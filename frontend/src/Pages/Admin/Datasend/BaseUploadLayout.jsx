import {
  Loader2,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Table
} from "lucide-react";

export default function BaseUploadLayout({
  title,
  subtitle,
  file,
  setFile,
  step,
  uploading,
  importing,
  handleUpload,
  handleImport,
  analysis,
  selectedSheet,
  setSelectedSheet,
  competitions,
  competitionId,
  setCompetitionId,
  seasonYear,
  setSeasonYear
}) {
  const btnPrimary =
    "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto";

  const selectClass =
    "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all text-gray-700";

  const labelClass =
    "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <FileSpreadsheet className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">
          {title}
        </h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
          {subtitle}
        </p>
      </div>

      {step === "upload" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 text-center">
          <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
            <input
              type="file"
              accept=".xlsx,.csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <UploadCloud className="text-gray-400 w-7 h-7" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-700">
                  {file ? file.name : "Clique para selecionar"}
                </span>
                <p className="text-sm text-gray-400 mt-1">
                  Suporta apenas arquivos .xlsx e .csv
                </p>
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

      {step === "mapping" && analysis && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Arquivo Carregado
              </h3>
              <p className="text-xs text-gray-500">{file?.name}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div>
              <label className={labelClass}>Aba da Planilha</label>
              <div className="relative">
                <select
                  className={selectClass}
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {analysis.sheets.map((sheet) => (
                    <option key={sheet.sheetName} value={sheet.sheetName}>
                      {sheet.sheetName}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                  <Table size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Competição</label>
              <select
                className={selectClass}
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {competitions.map((comp) => (
                  <option key={comp.id_league} value={comp.id_league}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Temporada</label>
              <select
                className={selectClass}
                value={seasonYear}
                onChange={(e) => setSeasonYear(e.target.value)}
              >
                <option value="">Selecione...</option>
                {[2021, 2022, 2023, 2024, 2025].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleImport}
                disabled={
                  importing ||
                  !selectedSheet ||
                  !competitionId ||
                  !seasonYear
                }
                className={btnPrimary}
              >
                {importing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Importando...
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