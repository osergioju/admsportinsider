import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

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

      alert("✅ Importação concluída com sucesso!");

      setStep("upload");
      setFile(null);
      setAnalysis(null);
      setSelectedSheet(null);
      setMapping({ leagueId: "", years: [] });

    } catch (err) {
      console.error("❌ Erro na importação:", err);
      alert("Erro ao importar dados da liga.");
    } finally {
      setImporting(false);
    }
  }



  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Importação Financeira
      </h1>

      {/* STEP 1 — UPLOAD */}
      {step === "upload" && (
        <div className="bg-white rounded-xl p-6 shadow space-y-4">
          <label className="block text-sm font-medium">
            Arquivo XLSX
          </label>

          <input
            type="file"
            accept=".xlsx"
            className="border rounded w-full p-2"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-primary text-white px-4 py-2 rounded w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Lendo arquivo...
              </>
            ) : (
              "Ler arquivo"
            )}
          </button>
        </div>
      )}

      {/* STEP 2 — MAPEAMENTO */}
      {step === "mapping" && analysis && (
        <div className="bg-white rounded-xl p-6 shadow space-y-6">

          {/* Aba */}
          <div>
            <h2 className="font-medium mb-2">Aba do arquivo</h2>
            <select
              className="border rounded w-full p-2"
              value={selectedSheet || ""}
              onChange={(e) => {
                setSelectedSheet(e.target.value);
                setMapping({ leagueId: "", years: [] });
              }}
            >
              <option value="">Selecione uma aba</option>
              {analysis.sheets.map((sheet) => (
                <option
                  key={sheet.sheetName}
                  value={sheet.sheetName}
                >
                  {sheet.sheetName}
                </option>
              ))}
            </select>
          </div>

          {/* Liga */}
          {selectedSheet && (
            <div>
              <h2 className="font-medium mb-2">Liga</h2>

              <select
                className="border rounded w-full p-2"
                value={mapping.leagueId}
                onChange={(e) =>
                  setMapping({
                    ...mapping,
                    leagueId: e.target.value
                  })
                }
                disabled={loadingLeagues}
              >
                <option value="">Selecione a liga</option>

                {leagues.map((league) => (
                  <option
                    key={league.id_league}
                    value={league.id_league}
                  >
                    {league.name}
                  </option>
                ))}
              </select>

              {loadingLeagues && (
                <p className="text-sm text-gray-500 mt-1">
                  Carregando ligas...
                </p>
              )}
            </div>
          )}

          {/* Anos */}
          {currentSheet && currentSheet.detectedYears.length > 0 && (
            <div>
              <h2 className="font-medium mb-2">Anos detectados</h2>

              <div className="grid grid-cols-4 gap-3">
                {currentSheet.detectedYears.map((year) => (
                  <label
                    key={year}
                    className="flex items-center gap-2 border rounded p-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={mapping.years.includes(year)}
                      onChange={() => toggleYear(year)}
                    />
                    {year}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleConfirmImport}
            disabled={
              importing ||
              !selectedSheet ||
              !mapping.leagueId ||
              mapping.years.length === 0
            }
            className="bg-green-600 text-white px-4 py-2 rounded w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {importing ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Importando...
              </>
            ) : (
              "Confirmar importação"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
