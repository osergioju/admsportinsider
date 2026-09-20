import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import {
  UploadCloud, Search, X, Trash2, Loader2, Copy, Check, AlertCircle, CheckCircle2, Image as ImageIcon,
} from "lucide-react";
import {
  IMAGE_ACCEPT, IMAGE_RULES_TEXT, validateImageFile, uploadErrorMessage, formatBytes,
} from "../../../utils/media";

const PAGE_SIZE = 40;
const SIZE_LABELS = { original: "Original", large: "Grande (1024)", medium: "Média (512)", small: "Pequena (256)", xsmall: "Mini (96)" };

const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";

// Fundo xadrez p/ dar pra ver PNG/WEBP transparente.
const checker = {
  backgroundColor: "#f3f4f6",
  backgroundImage: "linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0,8px 8px",
};

export default function Media() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // [{ key, name, status: "sending"|"ok"|"error", message }]
  const fileInput = useRef(null);

  const [selected, setSelected] = useState(null);

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(async (p, q) => {
    const { data } = await api.get("/admin/media", { params: { page: p, limit: PAGE_SIZE, q } });
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    fetchPage(1, query)
      .then((d) => { if (!cancelled) { setItems(d.items); setTotal(d.total); setPage(1); setPages(d.pages); } })
      .catch((err) => { if (!cancelled) setLoadError(uploadErrorMessage(err, "Erro ao carregar as mídias.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const d = await fetchPage(page + 1, query);
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...d.items.filter((i) => !seen.has(i.id))];
      });
      setPage(d.page);
      setPages(d.pages);
      setTotal(d.total);
    } catch (err) {
      setLoadError(uploadErrorMessage(err, "Erro ao carregar mais mídias."));
    } finally {
      setLoadingMore(false);
    }
  };

  // Envia um arquivo por vez: cada um tem seu próprio resultado/erro.
  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const queue = files.map((file, i) => ({ file, key: `${Date.now()}-${i}-${file.name}` }));
    setUploads((prev) => [...queue.map((q) => ({ key: q.key, name: q.file.name, status: "sending" })), ...prev].slice(0, 30));
    const patch = (key, changes) => setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, ...changes } : u)));

    for (const { file, key } of queue) {
      const invalid = validateImageFile(file);
      if (invalid) { patch(key, { status: "error", message: invalid }); continue; }

      try {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
        patch(key, { status: "ok", message: data.file_name });
        // só entra na grade se combinar com a busca atual (ou se não há busca)
        if (!query) {
          setItems((prev) => [data, ...prev]);
          setTotal((t) => t + 1);
        }
      } catch (err) {
        patch(key, { status: "error", message: uploadErrorMessage(err) });
      }
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const onItemChanged = (updated) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelected(updated);
  };
  const onItemDeleted = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => Math.max(t - 1, 0));
    setSelected(null);
  };

  const sending = uploads.some((u) => u.status === "sending");

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Mídias</h1>
          <p className="text-gray-500 text-sm mt-1">
            Biblioteca de imagens do sistema. Cada envio gera automaticamente as versões grande, média, pequena e mini (SVG fica só com o original).
          </p>
        </div>
        <button onClick={() => fileInput.current?.click()} disabled={sending} className={btnPrimary}>
          {sending ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />} Adicionar mídia
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* DROPZONE */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
        className={`mb-4 flex flex-col items-center justify-center gap-1 py-6 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${dragging ? "border-[#7F33D9] bg-purple-50" : "border-gray-200 bg-white hover:border-purple-300"}`}
      >
        <UploadCloud size={22} className="text-gray-400" />
        <p className="text-sm text-gray-600">Arraste as imagens aqui ou clique para selecionar</p>
        <p className="text-xs text-gray-400">{IMAGE_RULES_TEXT}</p>
      </div>

      {/* RESULTADO DOS ENVIOS */}
      {uploads.length > 0 && (
        <div className="mb-4 bg-white border border-gray-200 rounded-2xl p-3 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Envios</span>
            <button disabled={sending} onClick={() => setUploads([])} className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40">Limpar</button>
          </div>
          {uploads.map((u) => (
            <div key={u.key} className="flex items-center gap-2 text-sm px-1">
              {u.status === "sending" && <Loader2 size={14} className="animate-spin text-[#7F33D9] shrink-0" />}
              {u.status === "ok" && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
              {u.status === "error" && <AlertCircle size={14} className="text-red-500 shrink-0" />}
              <span className="truncate text-gray-700">{u.name}</span>
              {u.status === "ok" && <span className="text-xs text-gray-400 truncate">→ {u.message}</span>}
              {u.status === "error" && <span className="text-xs text-red-500">{u.message}</span>}
            </div>
          ))}
        </div>
      )}

      {/* BUSCA */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${inputClass} pl-10`} placeholder="Buscar por nome, título ou texto alternativo" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="text-xs text-gray-400 shrink-0">{total} {total === 1 ? "arquivo" : "arquivos"}</span>
      </div>

      {/* GRADE */}
      {loadError && <p className="mb-4 text-sm text-red-500">{loadError}</p>}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#7F33D9]" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-gray-400">
          <ImageIcon size={32} />
          <p className="text-sm">{query ? "Nenhuma mídia encontrada para essa busca." : "Nenhuma mídia enviada ainda."}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                title={item.file_name}
                className="group relative aspect-square rounded-xl border border-gray-200 overflow-hidden hover:border-[#7F33D9] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#7F33D9]"
                style={checker}
              >
                <img
                  src={item.urls.small}
                  alt={item.alt_text || item.title || item.file_name}
                  loading="lazy"
                  className="w-full h-full object-contain"
                  onError={(e) => { if (e.currentTarget.src !== item.urls.original) e.currentTarget.src = item.urls.original; }}
                />
                <span className="absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] text-white bg-black/55 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.file_name}.{item.ext}{item.used_by ? ` · ${item.used_by.name}` : ""}
                </span>
                {item.used_by && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title={`Escudo de ${item.used_by.name}`} />}
              </button>
            ))}
          </div>
          {page < pages && (
            <div className="flex justify-center mt-6">
              <button onClick={loadMore} disabled={loadingMore} className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#7F33D9] hover:text-[#7F33D9] transition-colors disabled:opacity-60">
                {loadingMore && <Loader2 size={14} className="animate-spin" />} Carregar mais
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <MediaDetail item={selected} onClose={() => setSelected(null)} onChanged={onItemChanged} onDeleted={onItemDeleted} />
      )}
    </div>
  );
}

function MediaDetail({ item, onClose, onChanged, onDeleted }) {
  const [title, setTitle] = useState(item.title || "");
  const [alt, setAlt] = useState(item.alt_text || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dirty = title !== (item.title || "") || alt !== (item.alt_text || "");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch(`/admin/media/${item.id}`, { title, alt_text: alt });
      onChanged(data);
    } catch (err) {
      setError(uploadErrorMessage(err, "Erro ao salvar."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/admin/media/${item.id}`);
      onDeleted(item.id);
    } catch (err) {
      setError(uploadErrorMessage(err, "Erro ao excluir."));
      setDeleting(false);
    }
  };

  const copy = async (key, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1500);
    } catch { /* clipboard indisponível (http/permissão): o usuário ainda pode selecionar o texto */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
        <div className="md:w-1/2 min-h-[220px] flex items-center justify-center p-4" style={checker}>
          <img src={item.urls.large} alt={item.alt_text || item.file_name} className="max-w-full max-h-[70vh] object-contain"
            onError={(e) => { if (e.currentTarget.src !== item.urls.original) e.currentTarget.src = item.urls.original; }} />
        </div>

        <div className="md:w-1/2 p-6 overflow-y-auto space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#111] truncate">{item.file_name}.{item.ext}</h2>
              <p className="text-xs text-gray-400 mt-0.5 break-all">Enviado como “{item.original_name}”</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
          </div>

          <p className="text-xs text-gray-500">
            {item.width}×{item.height} px · {formatBytes(item.size_bytes)} · {item.mime_type.replace("image/", "").toUpperCase()} · {new Date(item.created_at).toLocaleString("pt-BR")}
          </p>

          <div>
            <label className={labelClass}>Título</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
          </div>
          <div>
            <label className={labelClass}>Texto alternativo</label>
            <input className={inputClass} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={500} placeholder="Descreva a imagem" />
          </div>

          {item.used_by && (
            <p className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-3 py-2">
              Em uso como escudo do clube <b>{item.used_by.name}</b>.
            </p>
          )}

          <div>
            <label className={labelClass}>URLs</label>
            {item.ext === "svg" && <p className="text-[11px] text-gray-400 mb-1.5 ml-1">SVG é vetorial: não gera versões, só o original.</p>}
            <div className="space-y-1.5">
              {Object.entries(item.urls).filter(([key]) => item.ext !== "svg" || key === "original").map(([key, url]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-gray-500">{SIZE_LABELS[key] || key}</span>
                  <input readOnly value={url} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600" />
                  <button onClick={() => copy(key, url)} className="p-1.5 rounded-md text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50" title="Copiar">
                    {copied === key ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {item.used_by ? `Remove o escudo de ${item.used_by.name}. ` : ""}{item.ext === "svg" ? "Excluir?" : "Excluir também as 4 versões?"}
                </span>
                <button onClick={remove} disabled={deleting} className="px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-60 flex items-center gap-1">
                  {deleting && <Loader2 size={12} className="animate-spin" />} Excluir
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600">
                <Trash2 size={15} /> Excluir
              </button>
            )}
            <button onClick={save} disabled={!dirty || saving} className={btnPrimary}>
              {saving && <Loader2 size={16} className="animate-spin" />} Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
