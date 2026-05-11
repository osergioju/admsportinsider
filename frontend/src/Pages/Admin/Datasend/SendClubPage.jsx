import { useState } from "react";
import { api } from "../../../services/api";

const STEPS = ["Upload", "Pré-visualização", "Resultado"];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold
              ${i < current ? "bg-green-500 text-white" : i === current ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span className={`text-sm ${i === current ? "font-semibold text-gray-800" : "text-gray-400"}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300 mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Upload ────────────────────────────────────────────────────────────
function StepUpload({ onNext }) {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [sheetName, setSheetName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError("");

    const formData = new FormData();
    formData.append("file", f);

    try {
      setLoading(true);
      const { data } = await api.post("/admin/preview-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSheets(data.sheets || []);
      setSheetName(data.sheets?.[0] || "");
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao ler abas do arquivo.");
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!file || !sheetName) return;
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sheetName", sheetName);

    try {
      setLoading(true);
      const { data } = await api.post("/admin/preview-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onNext({ file, sheetName, preview: data });
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao gerar pré-visualização.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Arquivo XLSX</label>
        <input
          type="file"
          accept=".xlsx"
          className="border rounded w-full p-2"
          onChange={handleFileChange}
        />
      </div>

      {sheets.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Aba</label>
          <select
            className="border rounded w-full p-2"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
          >
            {sheets.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleNext}
        disabled={!file || !sheetName || loading}
        className="px-4 py-2 rounded text-white bg-primary hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? "Carregando..." : "Próximo"}
      </button>
    </div>
  );
}

// ─── Step 2: Preview + Options ─────────────────────────────────────────────────
function StepPreview({ uploadData, onNext, onBack }) {
  const { preview } = uploadData;
  const [options, setOptions] = useState({
    insertNew: true,
    updateColors: false,
    updateGender: false,
    updateTranslations: false,
  });
  const [countryMap, setCountryMap] = useState(() => {
    const map = {};
    (preview.countries || []).forEach((c) => {
      map[c.file] = c.resolved?.id_country || "";
    });
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nameChanges = preview.nameChanges || [];
  const unmappedCountries = (preview.countries || []).filter(
    (c) => !countryMap[c.file]
  );

  const toggle = (key) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleImport = async () => {
    setError("");
    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("sheetName", uploadData.sheetName);
    const resolvedMap = {};
    Object.entries(countryMap).forEach(([k, v]) => {
      if (v) resolvedMap[k.toLowerCase().trim()] = v;
    });
    formData.append("country_map", JSON.stringify(resolvedMap));
    formData.append("options", JSON.stringify(options));

    try {
      setLoading(true);
      const { data } = await api.post("/admin/import-clubs-xlsx", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onNext(data);
    } catch (err) {
      setError(err?.response?.data?.error || "Erro na importação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Opções de atualização */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">O que atualizar em clubes já existentes?</p>
        <div className="flex flex-wrap gap-3">
          {[
            { key: "insertNew", label: "Inserir novos clubes" },
            { key: "updateColors", label: "Atualizar cores" },
            { key: "updateGender", label: "Atualizar gênero" },
            { key: "updateTranslations", label: "Atualizar traduções" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggle(key)}
                className="w-4 h-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Mudanças de nome */}
      {nameChanges.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Mudanças de nome detectadas ({nameChanges.length})
          </p>
          <div className="border rounded overflow-hidden text-sm">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Slug</th>
                  <th className="text-left px-3 py-2">Nome antigo</th>
                  <th className="text-left px-3 py-2">Nome novo</th>
                </tr>
              </thead>
              <tbody>
                {nameChanges.map((nc, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{nc.slug}</td>
                    <td className="px-3 py-2 text-red-500 line-through">{nc.oldName}</td>
                    <td className="px-3 py-2 text-green-600 font-medium">{nc.newName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Os nomes novos serão gravados nas colunas <code>new_name</code> / <code>old_name</code> — o nome principal do clube não é alterado.
          </p>
        </div>
      )}

      {/* Mapeamento de países */}
      {(preview.countries || []).length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Mapeamento de países</p>
          <div className="flex flex-col gap-2">
            {(preview.countries || []).map((c) => (
              <div key={c.file} className="flex items-center gap-3 text-sm">
                <span className={`w-40 truncate ${c.status === "ok" ? "text-gray-700" : "text-amber-600"}`}>
                  {c.file}
                  {c.status !== "ok" && <span className="ml-1 text-xs">⚠</span>}
                </span>
                <span className="text-gray-400">→</span>
                <select
                  className="border rounded p-1 flex-1"
                  value={countryMap[c.file] || ""}
                  onChange={(e) =>
                    setCountryMap((prev) => ({ ...prev, [c.file]: e.target.value }))
                  }
                >
                  <option value="">-- Selecione --</option>
                  {(preview.dbCountries || []).map((db) => (
                    <option key={db.id_country} value={db.id_country}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {unmappedCountries.length > 0 && (
            <p className="text-xs text-red-500 mt-1">
              {unmappedCountries.length} país(es) sem mapeamento — esses clubes serão ignorados.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleImport}
          disabled={loading}
          className="px-4 py-2 rounded text-white bg-primary hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? "Importando..." : "Importar"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Result ────────────────────────────────────────────────────────────
function StepResult({ result, onReset }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="font-semibold text-green-700 mb-3">{result.message}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
          <span>Total processadas:</span>
          <span className="font-medium">{result.total_processadas}</span>
          <span>Inseridas/atualizadas:</span>
          <span className="font-medium text-green-600">{result.inserted}</span>
          <span>Duplicatas ignoradas:</span>
          <span className="font-medium">{result.duplicatas_ignoradas}</span>
          <span>Erros de parse:</span>
          <span className="font-medium text-red-500">{result.skipped}</span>
        </div>
      </div>

      {result.sample_errors?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Erros ({result.total_errors})
          </p>
          <div className="border rounded text-xs overflow-auto max-h-48">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Linha</th>
                  <th className="text-left px-3 py-2">Motivo</th>
                  <th className="text-left px-3 py-2">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {result.sample_errors.map((e, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{e.row}</td>
                    <td className="px-3 py-2">{e.reason}</td>
                    <td className="px-3 py-2 text-gray-400">{e.detail || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="px-4 py-2 rounded text-white bg-primary hover:opacity-90 w-fit"
      >
        Nova importação
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SendClubPage() {
  const [step, setStep] = useState(0);
  const [uploadData, setUploadData] = useState(null);
  const [result, setResult] = useState(null);

  const reset = () => {
    setStep(0);
    setUploadData(null);
    setResult(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Upload de Clubes</h1>
      <div className="bg-white rounded-xl p-6 shadow max-w-2xl">
        <StepIndicator current={step} />

        {step === 0 && (
          <StepUpload
            onNext={(data) => { setUploadData(data); setStep(1); }}
          />
        )}

        {step === 1 && uploadData && (
          <StepPreview
            uploadData={uploadData}
            onNext={(res) => { setResult(res); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && result && (
          <StepResult result={result} onReset={reset} />
        )}
      </div>
    </div>
  );
}
