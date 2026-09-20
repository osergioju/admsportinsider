import { useEffect, useReducer, useRef, useState } from "react";
import { api } from "../../../services/api";
import { FolderOpen, UploadCloud, Download, Loader2, CheckCircle2, AlertCircle, X, RotateCcw } from "lucide-react";
import { IMAGE_EXTENSIONS, IMAGE_MAX_BYTES, IMAGE_RULES_TEXT, uploadErrorMessage, formatBytes } from "../../../utils/media";

const MATCH_CHUNK = 500;   // o backend aceita até 1000 nomes por chamada
const CONCURRENCY = 4;
const PAGE_ROWS = 200;

// Arquivos de sistema que vêm junto quando se escolhe uma pasta: ignorados sem fazer barulho.
const isJunk = (name) => name.startsWith(".") || /^(thumbs\.db|desktop\.ini)$/i.test(name);

const STATUS = {
  match:          { label: "Casado",            cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  no_club:        { label: "Sem clube",         cls: "bg-amber-50 text-amber-700 border-amber-100" },
  invalid_format: { label: "Formato inválido",  cls: "bg-red-50 text-red-600 border-red-100" },
  too_big:        { label: "Maior que 3 MB",    cls: "bg-red-50 text-red-600 border-red-100" },
  duplicate:      { label: "Duplicado",         cls: "bg-amber-50 text-amber-700 border-amber-100" },
};
const CREST_LABEL = { none: "Sem escudo", legacy: "Escudo antigo", media: "Escudo da biblioteca" };

// Qual estado do escudo do clube cada modo permite sobrescrever (espelha o backend).
const MODES = {
  none:   { label: "Só clubes sem escudo",                                   allows: ["none"] },
  legacy: { label: "Sem escudo + escudos antigos (fora da biblioteca)",      allows: ["none", "legacy"] },
  all:    { label: "Todos, inclusive os que já vieram da biblioteca",        allows: ["none", "legacy", "media"] },
};

const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed";
const btnGhost = "flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#7F33D9] hover:text-[#7F33D9] transition-colors disabled:opacity-50";

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["arquivo", "situacao", "motivo", "clube", "slug"].map(esc).join(";")];
  for (const r of rows) lines.push([r.name, r.result === "error" ? "erro no envio" : r.result === "skipped" ? "ignorado" : STATUS[r.status]?.label, r.message, r.club_name, r.slug].map(esc).join(";"));
  return "﻿" + lines.join("\r\n"); // BOM p/ o Excel abrir os acentos
}

function downloadCsv(rows, filename) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function EscudosEmMassa() {
  const [phase, setPhase] = useState("idle"); // idle | analyzing | review | uploading | done
  const [mode, setMode] = useState("none");
  const [filter, setFilter] = useState("match");
  const [shown, setShown] = useState(PAGE_ROWS);
  const [error, setError] = useState("");
  const [ignored, setIgnored] = useState(0);
  const [, rerender] = useReducer((x) => x + 1, 0);

  // 3.600+ linhas mudando a cada arquivo: ficam num ref e a tela é atualizada em intervalo, não a cada resposta.
  const rowsRef = useRef([]);
  const cancelRef = useRef(false);
  const folderInput = useRef(null);
  const filesInput = useRef(null);

  useEffect(() => {
    if (phase !== "uploading") return undefined;
    const t = setInterval(rerender, 300);
    return () => clearInterval(t);
  }, [phase]);

  const rows = rowsRef.current;

  // ---------- 1) escolher arquivos e cruzar com os clubes (sem enviar nada) ----------
  const analyze = async (fileList) => {
    const all = Array.from(fileList || []);
    if (!all.length) return;

    setError(""); setPhase("analyzing"); setFilter("match"); setShown(PAGE_ROWS);
    const files = all.filter((f) => !isJunk(f.name));
    setIgnored(all.length - files.length);

    const list = files.map((file, i) => {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const row = { i, file, name: file.name, size: file.size, status: "match", result: null };
      if (!file.name.includes(".") || !IMAGE_EXTENSIONS.includes(ext)) row.status = "invalid_format";
      else if (file.size > IMAGE_MAX_BYTES) row.status = "too_big";
      return row;
    });

    try {
      const toMatch = list.filter((r) => r.status === "match");
      for (let s = 0; s < toMatch.length; s += MATCH_CHUNK) {
        const chunk = toMatch.slice(s, s + MATCH_CHUNK);
        const { data } = await api.post("/admin/clubs/crests/match", { names: chunk.map((r) => r.name) });
        data.results.forEach((res, k) => Object.assign(chunk[k], res));
      }
    } catch (err) {
      setError(uploadErrorMessage(err, "Erro ao cruzar os arquivos com os clubes."));
      setPhase("idle");
      return;
    }

    // Dois arquivos p/ o mesmo clube (ex.: x.png e x.svg): o primeiro (ordem alfabética) fica, os outros viram "duplicado".
    const seen = new Map();
    [...list].sort((a, b) => a.name.localeCompare(b.name)).forEach((r) => {
      if (r.status !== "match") return;
      if (seen.has(r.id_club)) { r.status = "duplicate"; r.message = `já existe "${seen.get(r.id_club)}" para este clube`; }
      else seen.set(r.id_club, r.name);
    });

    rowsRef.current = list;
    setPhase("review");
  };

  // ---------- 2) enviar ----------
  const eligible = (r) => r.status === "match" && r.result !== "ok" && MODES[mode].allows.includes(r.crest_state);

  const runUpload = async (onlyFailed = false) => {
    const queue = rowsRef.current.filter((r) => (onlyFailed ? r.result === "error" : eligible(r)));
    if (!queue.length) return;
    cancelRef.current = false;
    setPhase("uploading");
    queue.forEach((r) => { r.result = null; r.message = ""; });

    let next = 0;
    const worker = async () => {
      while (!cancelRef.current && next < queue.length) {
        const r = queue[next++];
        r.result = "sending";
        try {
          const fd = new FormData();
          fd.append("file", r.file);
          fd.append("replace", mode);
          await api.post(`/admin/clubs/${r.id_club}/crest`, fd, { headers: { "Content-Type": "multipart/form-data" } });
          r.result = "ok";
        } catch (err) {
          r.result = err?.response?.status === 409 ? "skipped" : "error";
          r.message = uploadErrorMessage(err);
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    queue.forEach((r) => { if (r.result === "sending") r.result = null; }); // cancelado no meio
    setPhase("done");
  };

  const reset = () => { rowsRef.current = []; setPhase("idle"); setError(""); setIgnored(0); };

  // ---------- números da tela ----------
  const count = (fn) => rows.filter(fn).length;
  const byStatus = (s) => count((r) => r.status === s);
  const matched = rows.filter((r) => r.status === "match");
  const willSend = count(eligible);
  const byCrest = (c) => matched.filter((r) => r.crest_state === c).length;
  const ok = count((r) => r.result === "ok");
  const failed = count((r) => r.result === "error");
  const skipped = count((r) => r.result === "skipped");
  const doneCount = ok + failed + skipped;
  const total = phase === "uploading" || phase === "done" ? Math.max(ok + failed + skipped + count((r) => r.result === "sending") + willSend - ok - failed - skipped, doneCount) : willSend;

  const visible = rows.filter((r) => {
    if (filter === "match") return r.status === "match";
    if (filter === "problems") return r.status !== "match" || r.result === "error" || r.result === "skipped";
    return r.status === filter;
  });

  const tabs = [
    ["match", `Casados (${matched.length})`],
    ["no_club", `Sem clube (${byStatus("no_club")})`],
    ["invalid_format", `Formato inválido (${byStatus("invalid_format")})`],
    ["too_big", `Grandes (${byStatus("too_big")})`],
    ["duplicate", `Duplicados (${byStatus("duplicate")})`],
    ["problems", "Todos os problemas"],
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Escudos em massa</h1>
        <p className="text-gray-500 text-sm mt-1">
          O <b>nome de cada arquivo deve ser o slug do clube</b> (ex.: <code className="text-xs bg-gray-100 px-1 rounded">turkey_balikesirspor.png</code>).
          Cada imagem passa pelo mesmo processamento da aba Mídias e fica vinculada ao clube.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {/* ETAPA 1 — escolher */}
      {(phase === "idle" || phase === "analyzing") && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          {phase === "analyzing" ? (
            <><Loader2 className="animate-spin text-[#7F33D9]" /><p className="text-sm text-gray-600">Cruzando os arquivos com os clubes…</p></>
          ) : (
            <>
              <FolderOpen size={30} className="text-gray-400" />
              <p className="text-sm text-gray-600">Escolha a pasta com os escudos. Nada é enviado ainda: primeiro você confere o resultado.</p>
              <p className="text-xs text-gray-400">{IMAGE_RULES_TEXT}</p>
              <div className="flex gap-3 mt-2">
                <button className={btnPrimary} onClick={() => folderInput.current?.click()}><FolderOpen size={16} /> Escolher pasta</button>
                <button className={btnGhost} onClick={() => filesInput.current?.click()}>Escolher arquivos</button>
              </div>
            </>
          )}
          <input ref={folderInput} type="file" className="hidden" multiple webkitdirectory="" directory="" onChange={(e) => { analyze(e.target.files); e.target.value = ""; }} />
          <input ref={filesInput} type="file" className="hidden" multiple accept={IMAGE_EXTENSIONS.map((e) => `.${e}`).join(",")} onChange={(e) => { analyze(e.target.files); e.target.value = ""; }} />
        </div>
      )}

      {/* ETAPAS 2-4 */}
      {(phase === "review" || phase === "uploading" || phase === "done") && (
        <>
          {/* resumo */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {[
              ["Arquivos", rows.length, "text-[#111]"],
              ["Casados com clube", matched.length, "text-emerald-600"],
              ["Sem clube", byStatus("no_club"), "text-amber-600"],
              ["Inválidos / grandes", byStatus("invalid_format") + byStatus("too_big"), "text-red-500"],
              ["Duplicados", byStatus("duplicate"), "text-amber-600"],
            ].map(([label, n, cls]) => (
              <div key={label} className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold ${cls}`}>{n}</p>
              </div>
            ))}
          </div>
          {ignored > 0 && <p className="text-xs text-gray-400 mb-3">{ignored} arquivo(s) de sistema (.DS_Store etc.) ignorado(s).</p>}

          {/* o que fazer com clubes que já têm escudo */}
          {phase === "review" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Clubes que já têm escudo</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9]">
                {Object.entries(MODES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Entre os {matched.length} casados: <b>{byCrest("none")}</b> sem escudo · <b>{byCrest("legacy")}</b> com escudo antigo · <b>{byCrest("media")}</b> já vinculados à biblioteca.
                Substituir apaga a imagem anterior da biblioteca.
              </p>
            </div>
          )}

          {/* ações / progresso */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {phase === "review" && (
              <>
                <button className={btnPrimary} disabled={!willSend} onClick={() => runUpload(false)}><UploadCloud size={16} /> Enviar {willSend} escudo(s)</button>
                <button className={btnGhost} onClick={reset}><X size={15} /> Escolher outra pasta</button>
                <button className={btnGhost} disabled={!rows.some((r) => r.status !== "match")} onClick={() => downloadCsv(rows.filter((r) => r.status !== "match"), "escudos-problemas.csv")}><Download size={15} /> Baixar problemas (CSV)</button>
              </>
            )}
            {phase === "uploading" && (
              <>
                <div className="flex-1 min-w-[220px]">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#7F33D9] transition-all" style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} /></div>
                  <p className="text-xs text-gray-500 mt-1">{doneCount} de {total} · {ok} ok · {failed} com erro · {skipped} ignorados</p>
                </div>
                <button className={btnGhost} onClick={() => { cancelRef.current = true; }}>Cancelar</button>
              </>
            )}
            {phase === "done" && (
              <>
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  {failed ? <AlertCircle size={16} className="text-amber-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                  <b>{ok}</b> enviados · <b>{failed}</b> com erro · <b>{skipped}</b> ignorados
                </p>
                {failed > 0 && <button className={btnPrimary} onClick={() => runUpload(true)}><RotateCcw size={15} /> Tentar de novo os {failed} com erro</button>}
                <button className={btnGhost} onClick={() => downloadCsv(rows.filter((r) => r.status !== "match" || r.result === "error" || r.result === "skipped"), "escudos-relatorio.csv")}><Download size={15} /> Baixar relatório (CSV)</button>
                <button className={btnGhost} onClick={reset}>Nova importação</button>
              </>
            )}
          </div>

          {/* tabela */}
          <div className="flex flex-wrap gap-2 mb-3">
            {tabs.map(([k, label]) => (
              <button key={k} onClick={() => { setFilter(k); setShown(PAGE_ROWS); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === k ? "bg-[#7F33D9] text-white border-[#7F33D9]" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-2.5">Arquivo</th><th className="px-4 py-2.5">Clube</th><th className="px-4 py-2.5">Escudo atual</th><th className="px-4 py-2.5">Situação</th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, shown).map((r) => (
                  <tr key={r.i} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2 text-gray-700">{r.name} <span className="text-xs text-gray-400">{formatBytes(r.size)}</span></td>
                    <td className="px-4 py-2 text-gray-600">{r.club_name ? <>{r.club_name} <span className="text-xs text-gray-400">{r.slug}</span></> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{r.crest_state ? CREST_LABEL[r.crest_state] : "—"}</td>
                    <td className="px-4 py-2">
                      {r.result === "ok" ? <span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 size={13} /> Enviado</span>
                        : r.result === "sending" ? <Loader2 size={14} className="animate-spin text-[#7F33D9]" />
                        : r.result === "error" ? <span className="text-xs text-red-500">{r.message || "Erro"}</span>
                        : r.result === "skipped" ? <span className="text-xs text-amber-600">Ignorado: {r.message}</span>
                        : <>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[r.status]?.cls}`}>{STATUS[r.status]?.label}</span>
                            {r.status === "match" && !MODES[mode].allows.includes(r.crest_state) && <span className="ml-2 text-[11px] text-gray-400">será pulado (modo escolhido)</span>}
                            {r.status === "duplicate" && <span className="ml-2 text-[11px] text-gray-400">{r.message}</span>}
                          </>}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">Nada nesta categoria.</td></tr>}
              </tbody>
            </table>
          </div>
          {visible.length > shown && (
            <div className="flex justify-center mt-4"><button className={btnGhost} onClick={() => setShown((s) => s + PAGE_ROWS)}>Mostrar mais ({visible.length - shown} restantes)</button></div>
          )}
        </>
      )}
    </div>
  );
}
