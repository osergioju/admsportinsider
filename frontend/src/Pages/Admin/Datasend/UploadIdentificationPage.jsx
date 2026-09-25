import { useState } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle,
  AlertTriangle, ArrowRight, Database,
} from "lucide-react";

const btnPrimary = "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const btnSecondary = "flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
const selectClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all text-gray-700";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

// Ordem recomendada: cada uma depende da anterior (cidade → país, estádio → cidade...).
const ENTITIES = [
  { key: "countries",   label: "Países",     hint: "Vincula por slug (países já cadastrados sem slug são adotados pelo nome) e define o continente." },
  { key: "cities",      label: "Cidades",    hint: "Precisa dos países cadastrados. O país vem do prefixo do slug (ex: afghanistan_farah)." },
  { key: "federations", label: "Federações", hint: "Usa país e cidade por slug e monta a hierarquia pela coluna Filiação (sigla)." },
  { key: "stadiums",    label: "Estádios",   hint: "Usa país e cidade por slug. O vínculo clube ↔ estádio é feito pela aba do clube (slug do estádio)." },
];

const REASON_LABEL = {
  slug_ou_nome_vazio: "Slug ou nome vazio",
  slug_ou_sigla_vazio: "Slug ou sigla vazio",
  slug_duplicado: "Slug repetido na planilha",
  pais_nao_encontrado: "País não cadastrado (suba Países antes)",
  cidade_nao_encontrada: "Cidade não cadastrada (suba Cidades antes) — a linha entra sem cidade",
  continente_nao_encontrado: "Continente não reconhecido",
  filiacao_nao_encontrada: "Filiação (sigla) não encontrada",
  data_invalida: "Data de fundação inválida",
  data_construcao_invalida: "Data de construção inválida",
  data_reforma_invalida: "Data de reforma inválida",
  coordenadas_invalidas: "Coordenadas inválidas (esperado: lat, lng)",
  capacidade_invalida: "Capacidade inválida",
};

const STAT_LABEL = { total: "Linhas válidas", toInsert: "Novas", toAdopt: "Adotadas (país já existia sem slug)", toUpdate: "Já existem" };

function Issues({ title, data, tone }) {
  if (!data?.total) return null;
  const isError = tone === "error";
  const box = isError ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50";
  const text = isError ? "text-red-700" : "text-amber-700";
  const Icon = isError ? AlertCircle : AlertTriangle;
  return (
    <div className={`rounded-xl border p-4 ${box}`}>
      <div className={`flex items-center gap-2 text-sm font-bold ${text} mb-2`}>
        <Icon size={16} /> {title} ({data.total})
      </div>
      <ul className={`text-xs ${text} space-y-0.5 mb-3`}>
        {Object.entries(data.counts).map(([reason, n]) => (
          <li key={reason}><strong>{n}×</strong> {REASON_LABEL[reason] || reason}</li>
        ))}
      </ul>
      <div className="max-h-40 overflow-y-auto text-[11px] font-mono text-gray-600 bg-white/70 rounded-lg p-2 space-y-0.5">
        {data.list.map((e, i) => (
          <div key={i}>linha {e.row} · {e.reason}{e.detail ? ` · ${e.detail}` : ""}</div>
        ))}
        {data.total > data.list.length && <div className="text-gray-400">… e mais {data.total - data.list.length}</div>}
      </div>
    </div>
  );
}

export default function UploadIdentificationPage() {
  const [entity, setEntity]         = useState(ENTITIES[0]);
  const [file, setFile]             = useState(null);
  const [sheets, setSheets]         = useState([]);
  const [sheetName, setSheetName]   = useState("");
  const [updateExisting, setUpdate] = useState(false);
  const [step, setStep]             = useState("upload"); // upload | preview | done
  const [preview, setPreview]       = useState(null);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const reset = (nextEntity = entity) => {
    setEntity(nextEntity); setFile(null); setSheets([]); setSheetName("");
    setStep("upload"); setPreview(null); setResult(null); setError("");
  };

  const buildForm = () => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("sheetName", sheetName);
    fd.append("options", JSON.stringify({ updateExisting }));
    return fd;
  };
  const post = (kind, fd) =>
    api.post(`/admin/identification/${entity.key}/${kind}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  const errMsg = (err, fallback) => err.response?.data?.error || fallback;

  const handleFile = async (f) => {
    setFile(f); setSheets([]); setSheetName(""); setError("");
    if (!f) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await post("preview", fd);
      setSheets(data.sheets || []);
      setSheetName(data.sheets?.includes(data.defaultSheet) ? data.defaultSheet : "");
    } catch (err) {
      setError(errMsg(err, "Não foi possível ler o arquivo."));
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await post("preview", buildForm());
      setPreview(data); setStep("preview");
    } catch (err) {
      setError(errMsg(err, "Erro ao analisar a aba."));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await post("import", buildForm());
      setResult(data); setStep("done");
    } catch (err) {
      setError(errMsg(err, "Erro ao importar."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-400">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Database size={18} className="text-[#7F33D9]" />
          <span className="text-xs font-semibold text-[#7F33D9] uppercase tracking-widest">Base de identificação</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Países, Cidades, Federações e Estádios</h1>
        <p className="text-gray-500 text-sm mt-1">
          Cada aba da planilha Identificação sobe de forma independente. Ordem recomendada: Países → Cidades → Federações → Estádios.
          Nada é gravado antes da confirmação.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ENTITIES.map((e, i) => (
          <button
            key={e.key}
            onClick={() => e.key !== entity.key && reset(e)}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              e.key === entity.key ? "bg-[#7F33D9] text-white border-[#7F33D9]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {i + 1}. {e.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {step === "upload" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-5">
          <p className="text-sm text-gray-500">{entity.hint}</p>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-10 cursor-pointer hover:border-[#7F33D9] transition-colors">
            {file ? <FileSpreadsheet className="text-[#7F33D9]" size={28} /> : <UploadCloud className="text-gray-400" size={28} />}
            <span className="text-sm text-gray-600">{file ? file.name : "Clique para escolher a planilha .xlsx"}</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
          </label>

          {sheets.length > 0 && (
            <div>
              <label className={labelClass}>Aba</label>
              <select className={selectClass} value={sheetName} onChange={(e) => setSheetName(e.target.value)}>
                <option value="">Selecione a aba…</option>
                {sheets.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" className="mt-1" checked={updateExisting} onChange={(e) => setUpdate(e.target.checked)} />
            <span>
              Atualizar registros que já existem (mesmo slug).
              <span className="block text-xs text-gray-400">Desmarcado, só entram os novos. Células vazias na planilha nunca apagam dado existente.</span>
            </span>
          </label>

          <div className="flex justify-end">
            <button className={btnPrimary} disabled={!file || !sheetName || loading} onClick={handlePreview}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Analisar
            </button>
          </div>
        </div>
      )}

      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              {Object.entries(preview.stats).map(([k, v]) => (
                <div key={k} className="flex-1 min-w-[140px] rounded-xl bg-gray-50 border border-gray-100 p-3">
                  <div className="text-2xl font-bold text-gray-900">{v}</div>
                  <div className="text-xs text-gray-500">{STAT_LABEL[k] || k}</div>
                </div>
              ))}
            </div>

            {preview.sample?.length > 0 && (
              <div className="overflow-x-auto">
                <div className={labelClass}>Amostra</div>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      {Object.keys(preview.sample[0]).map((k) => <th key={k} className="py-1.5 pr-4 font-medium">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 text-gray-700">
                        {Object.values(r).map((v, j) => <td key={j} className="py-1.5 pr-4">{v ?? "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Issues title="Linhas que serão ignoradas" data={preview.errors} tone="error" />
          <Issues title="Avisos (a linha entra, mas incompleta)" data={preview.warnings} tone="warn" />

          <div className="flex justify-between">
            <button className={btnSecondary} onClick={() => { setStep("upload"); setPreview(null); }} disabled={loading}>Voltar</button>
            <button className={btnPrimary} onClick={handleImport} disabled={loading || !preview.stats.total}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              Importar {preview.stats.total} {entity.label.toLowerCase()}
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2 text-green-600 font-bold"><CheckCircle2 size={20} /> {result.message}</div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-700">
              <span><strong>{result.inserted ?? 0}</strong> inseridos</span>
              <span><strong>{result.updated ?? 0}</strong> atualizados</span>
              <span><strong>{result.skipped ?? 0}</strong> já existiam (ignorados)</span>
            </div>
          </div>
          <Issues title="Linhas ignoradas" data={result.errors} tone="error" />
          <Issues title="Avisos" data={result.warnings} tone="warn" />
          <div className="flex justify-end">
            <button className={btnSecondary} onClick={() => reset()}>Subir outra planilha</button>
          </div>
        </div>
      )}
    </div>
  );
}
