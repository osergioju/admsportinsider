import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Award, Download } from "lucide-react";

const btnPrimary = "flex items-center justify-center gap-2 px-6 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";
const selectClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all text-gray-700";

const CSV_TEMPLATE = `edition_year,edition_name,position_order,position_label,value,currency
2022,"FIFA World Cup Qatar 2022",1,"1º Colocado",42000000,USD
2022,"FIFA World Cup Qatar 2022",2,"2º Colocado",32000000,USD
2022,"FIFA World Cup Qatar 2022",3,"3º Colocado",28000000,USD
2022,"FIFA World Cup Qatar 2022",4,"4º Colocado",25000000,USD
2022,"FIFA World Cup Qatar 2022",5,"5º ao 8º (cada)",18000000,USD
2022,"FIFA World Cup Qatar 2022",9,"9º ao 16º (cada)",13000000,USD
2022,"FIFA World Cup Qatar 2022",17,"17º ao 32º (cada)",9000000,USD
2022,"FIFA World Cup Qatar 2022",99,"Pool total",440000000,USD`;

export default function UploadPrizesPage() {
    const [leagues, setLeagues] = useState([]);
    const [leagueId, setLeagueId] = useState("");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState(null); // null | "parsing" | "ready" | "importing" | "done" | "error"
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        api.get("/admin/leagues?limit=2000").then(({ data }) => {
            setLeagues(data.leagues ?? []);
        }).catch(() => {});
    }, []);

    function handleFileChange(e) {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(null);
        setStatus("parsing");
        setErrorMsg("");

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target.result;
                const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
                const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
                const rows = lines.slice(1).map(line => {
                    // Simple CSV parse (handles quoted fields)
                    const cols = [];
                    let cur = "", inQ = false;
                    for (const ch of line) {
                        if (ch === '"') { inQ = !inQ; }
                        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ""; }
                        else { cur += ch; }
                    }
                    cols.push(cur.trim());
                    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
                });
                setPreview(rows);
                setStatus("ready");
            } catch {
                setStatus("error");
                setErrorMsg("Erro ao ler o CSV. Verifique o formato.");
            }
        };
        reader.readAsText(f);
    }

    async function handleImport() {
        if (!leagueId) { setErrorMsg("Selecione a competição antes de importar."); return; }
        if (!preview?.length) return;
        setStatus("importing");
        setErrorMsg("");
        try {
            await api.post("/admin/prizes/import", { leagueId: Number(leagueId), rows: preview });
            setStatus("done");
        } catch (err) {
            setStatus("error");
            setErrorMsg(err?.response?.data?.error || "Erro ao importar. Tente novamente.");
        }
    }

    function downloadTemplate() {
        const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template_premiacoes.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    function reset() {
        setFile(null); setPreview(null); setStatus(null); setErrorMsg(""); setLeagueId("");
    }

    /* ── Colunas visíveis na preview ── */
    const previewCols = ["edition_year", "edition_name", "position_order", "position_label", "value", "currency"];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                    <Award size={20} className="text-purple-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Importar Premiações</h1>
                    <p className="text-sm text-gray-500">Upload de CSV com premiações por edição de competição</p>
                </div>
            </div>

            {status === "done" ? (
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-sm border border-gray-100">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Importação concluída!</h2>
                    <p className="text-sm text-gray-500">{preview.length} registros importados com sucesso.</p>
                    <button onClick={reset} className={btnPrimary}>Nova importação</button>
                </div>
            ) : (
                <div className="space-y-4">

                    {/* Selecionar competição */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">1. Selecionar competição</h2>
                        <div>
                            <label className={labelClass}>Competição</label>
                            <select className={selectClass} value={leagueId} onChange={e => setLeagueId(e.target.value)}>
                                <option value="">Selecione uma competição...</option>
                                {leagues.map(l => (
                                    <option key={l.id_league} value={l.id_league}>
                                        {l.name} {l.country_name ? `— ${l.country_name}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Upload do CSV */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-700">2. Enviar arquivo CSV</h2>
                            <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors">
                                <Download size={13} />
                                Baixar template
                            </button>
                        </div>

                        {/* Formato esperado */}
                        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Colunas esperadas</p>
                            <div className="flex flex-wrap gap-2">
                                {["edition_year", "edition_name", "position_order", "position_label", "value", "currency"].map(col => (
                                    <span key={col} className="inline-block bg-white border border-gray-200 rounded-md px-2 py-0.5 text-xs font-mono text-gray-600">
                                        {col}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">
                                · <strong>position_order</strong>: número para ordenação (1, 2, 3, 4, 5, 9, 17, 99 = pool total) &nbsp;
                                · <strong>value</strong>: valor bruto em unidade da moeda (ex: 42000000 para USD 42M)
                            </p>
                        </div>

                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-10 px-6 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all text-center group">
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                            {file ? (
                                <>
                                    <FileSpreadsheet size={32} className="text-purple-500 mb-2" />
                                    <p className="text-sm font-semibold text-gray-700">{file.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Clique para trocar o arquivo</p>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={32} className="text-gray-300 group-hover:text-purple-400 mb-2 transition-colors" />
                                    <p className="text-sm font-medium text-gray-500">Clique ou arraste o arquivo CSV aqui</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Somente .csv</p>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Preview */}
                    {preview?.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3">
                                3. Preview — {preview.length} linhas detectadas
                            </h2>
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            {previewCols.map(c => (
                                                <th key={c} className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                                    {c}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.slice(0, 10).map((row, i) => (
                                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                                {previewCols.map(c => (
                                                    <td key={c} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                                        {row[c] ?? "—"}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {preview.length > 10 && (
                                    <p className="px-3 py-2 text-[11px] text-gray-400 border-t border-gray-100">
                                        + {preview.length - 10} linhas adicionais não exibidas
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Erro */}
                    {errorMsg && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            {errorMsg}
                        </div>
                    )}

                    {/* Botão importar */}
                    {status === "ready" && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleImport}
                                disabled={!leagueId || !preview?.length}
                                className={btnPrimary}
                            >
                                <UploadCloud size={16} />
                                Importar {preview.length} registros
                            </button>
                        </div>
                    )}

                    {status === "importing" && (
                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                            Importando...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
