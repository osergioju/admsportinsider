import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { IMAGE_ACCEPT, validateImageFile, uploadErrorMessage } from "../../../utils/media";
import {
  Plus,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Loader2,
  FileText,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function Banners() {

  const [banners, setBanners] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    title: "",
    image_desktop_url: "",
    image_mobile_url: "",
    link_url: "",
    start_at: "",
    end_at: "",
    status: "draft",
    format: "horizontal",
  });

  const handleFeedback = (type, text) => {
    setFeedback({ type, text });
    if (type === "success") setTimeout(() => setFeedback(null), 3000);
  };

  const FeedbackMessage = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.type === "success";
    return (
      <div className={`mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${isSuccess ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
        {isSuccess ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
        <span>{msg.text}</span>
      </div>
    );
  };

  async function loadBanners() {
    setLoading(true);
    try {
      const res = await api.get("/admin/banners");
      setBanners(res.data.banners);
    } catch (err) {
      console.error("Erro ao carregar banners", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBanners(); }, []);

  async function uploadImage(file, type) {
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) { handleFeedback("error", invalid); return; }
    setUploading(true);
    setFeedback(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/admin/banners/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((prev) => ({ ...prev, [type]: res.data.url }));
    } catch (err) {
      handleFeedback("error", uploadErrorMessage(err, "Erro ao enviar imagem. Tente novamente."));
    } finally {
      setUploading(false);
    }
  }

  function openCreate() {
    setIsEditing(false);
    setCurrentId(null);
    setFeedback(null);
    setForm({ title: "", image_desktop_url: "", image_mobile_url: "", link_url: "", start_at: "", end_at: "", status: "draft", format: "horizontal" });
    setModalOpen(true);
  }

  function openEdit(banner) {
    setIsEditing(true);
    setFeedback(null);
    setCurrentId(banner.id_banner);
    setForm({
      ...banner,
      start_at: banner.start_at ? banner.start_at.slice(0, 16) : "",
      end_at: banner.end_at ? banner.end_at.slice(0, 16) : "",
    });
    setModalOpen(true);
  }

  function openDelete(banner) {
    setBannerToDelete(banner);
    setFeedback(null);
    setDeleteModalOpen(true);
  }

  async function saveBanner() {
    setProcessing(true);
    setFeedback(null);
    try {
      if (isEditing) {
        await api.put(`/admin/banners/${currentId}`, form);
        handleFeedback("success", "Banner atualizado com sucesso!");
      } else {
        await api.post("/admin/banners", form);
        handleFeedback("success", "Banner criado com sucesso!");
      }
      await loadBanners();
      setTimeout(() => { setModalOpen(false); setFeedback(null); }, 1500);
    } catch {
      handleFeedback("error", "Erro ao salvar. Verifique os dados.");
    } finally {
      setProcessing(false);
    }
  }

  async function confirmDelete() {
    if (!bannerToDelete) return;
    setProcessing(true);
    try {
      await api.delete(`/admin/banners/${bannerToDelete.id_banner}`);
      handleFeedback("success", "Banner removido.");
      await loadBanners();
      setTimeout(() => { setDeleteModalOpen(false); setBannerToDelete(null); setFeedback(null); }, 1500);
    } catch {
      handleFeedback("error", "Erro ao remover banner.");
    } finally {
      setProcessing(false);
    }
  }

  // Move banner up or down in the local list, then persist
  async function movebanner(index, direction) {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= banners.length) return;

    const updated = [...banners];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setBanners(updated);

    setReordering(true);
    try {
      const order = updated.map((b, i) => ({ id: b.id_banner, sort_order: i + 1 }));
      await api.put("/admin/banners/reorder", { order });
    } catch {
      handleFeedback("error", "Erro ao salvar a ordem.");
      await loadBanners(); // reverte
    } finally {
      setReordering(false);
    }
  }

  function getBannerDisplayStatus(banner) {
    const now = new Date();
    const start = banner.start_at ? new Date(banner.start_at) : null;
    const end = banner.end_at ? new Date(banner.end_at) : null;
    if (banner.status === "draft") return "draft";
    if (banner.status === "scheduled") {
      if (start && now < start) return "scheduled";
      if (start && (!end || now <= end)) return "published";
      if (end && now > end) return "expired";
    }
    if (banner.status === "active") return "published";
    return "draft";
  }

  function getStatusConfig(status) {
    switch (status) {
      case "published": return { label: "Publicado", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 };
      case "scheduled": return { label: "Agendado", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock };
      case "expired": return { label: "Expirado", color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle };
      default: return { label: "Rascunho", color: "bg-gray-100 text-gray-600 border-gray-200", icon: FileText };
    }
  }

  const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
  const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500 relative">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Banners</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie os destaques visuais. Use as setas para definir a ordem de exibição.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {reordering && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> salvando ordem...</span>}
          <button onClick={openCreate} className={btnPrimary}>
            <Plus size={18} /> Novo Banner
          </button>
        </div>
      </div>

      {/* LISTA DE BANNERS */}
      <div className="flex flex-col gap-3">
        {banners.map((banner, index) => {
          const status = getBannerDisplayStatus(banner);
          const statusConfig = getStatusConfig(status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={banner.id_banner}
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 overflow-hidden flex items-stretch"
            >
              {/* Coluna de Ordem (setas + número) */}
              <div className="flex flex-col items-center justify-center gap-1 px-3 py-4 bg-gray-50 border-r border-gray-100 shrink-0 min-w-[52px]">
                <button
                  onClick={() => movebanner(index, "up")}
                  disabled={index === 0 || reordering}
                  className="p-1 rounded-lg text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp size={16} />
                </button>
                <span className="text-xs font-bold text-gray-400 w-5 text-center">{index + 1}</span>
                <button
                  onClick={() => movebanner(index, "down")}
                  disabled={index === banners.length - 1 || reordering}
                  className="p-1 rounded-lg text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Thumbnail */}
              <div
                className="relative w-48 shrink-0 bg-gray-100 overflow-hidden cursor-pointer"
                onClick={() => openEdit(banner)}
              >
                {banner.image_desktop_url ? (
                  <img src={banner.image_desktop_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 min-h-[80px]">
                    <ImageIcon size={28} />
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div
                className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
                onClick={() => openEdit(banner)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base truncate">{banner.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold ${statusConfig.color}`}>
                      <StatusIcon size={10} />{statusConfig.label}
                    </span>

                    {/* Datas */}
                    {banner.start_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(banner.start_at).toLocaleDateString()}
                        {banner.end_at && ` → ${new Date(banner.end_at).toLocaleDateString()}`}
                      </span>
                    )}

                    {/* Dispositivos */}
                    <span className="flex items-center gap-1.5">
                      {banner.image_desktop_url && <Monitor size={13} className="text-gray-400" title="Desktop" />}
                      {banner.image_mobile_url && <Smartphone size={13} className="text-gray-400" title="Mobile" />}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ação excluir */}
              <div className="flex items-center px-4 shrink-0 border-l border-gray-100">
                <button
                  onClick={(e) => { e.stopPropagation(); openDelete(banner); }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {!loading && banners.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <ImageIcon size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nenhum banner criado</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">Crie banners para promover campanhas ou novidades no app.</p>
            <button onClick={openCreate} className={`mt-6 ${btnPrimary}`}>Criar meu primeiro banner</button>
          </div>
        )}
      </div>

      {/* MODAL CRIAR / EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setModalOpen(false)}>
          <div className="absolute inset-0 bg-black/40 " />
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{isEditing ? "Editar Banner" : "Novo Banner"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              {/* Título + Status */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className={labelClass}>Título Interno</label>
                  <input className={inputClass} placeholder="Ex: Promoção Verão" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Rascunho</option>
                    <option value="scheduled">Agendado</option>
                    <option value="active">Ativo</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Formato (Publicações)</label>
                  <select className={inputClass} value={form.format || "horizontal"} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                    <option value="horizontal">Horizontal (2 slots)</option>
                    <option value="square">Quadrado (1 slot)</option>
                  </select>
                </div>
              </div>

              {/* Imagens */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}><Monitor size={14} className="inline mr-1" /> Desktop</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 hover:border-purple-200 transition-colors cursor-pointer relative h-32 flex items-center justify-center overflow-hidden">
                    <input type="file" accept={IMAGE_ACCEPT} className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => { uploadImage(e.target.files[0], "image_desktop_url"); e.target.value = ""; }} />
                    {form.image_desktop_url ? <img src={form.image_desktop_url} className="absolute inset-0 w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" />}
                  </div>
                  <p className="text-[11px] text-gray-400 ml-1">Dimensão recomendada: 1500×200 px</p>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}><Smartphone size={14} className="inline mr-1" /> Mobile</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 hover:border-purple-200 transition-colors cursor-pointer relative h-32 flex items-center justify-center overflow-hidden">
                    <input type="file" accept={IMAGE_ACCEPT} className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => { uploadImage(e.target.files[0], "image_mobile_url"); e.target.value = ""; }} />
                    {form.image_mobile_url ? <img src={form.image_mobile_url} className="absolute inset-0 w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" />}
                  </div>
                  <p className="text-[11px] text-gray-400 ml-1">Dimensão recomendada: 768×200 px</p>
                </div>
              </div>

              {/* Link */}
              <div>
                <label className={labelClass}>Link</label>
                <input className={inputClass} placeholder="https://..." value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
              </div>

              {/* Datas */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1">Início</label><input type="datetime-local" className={`${inputClass} bg-white`} value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Fim</label><input type="datetime-local" className={`${inputClass} bg-white`} value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} /></div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 shrink-0 flex flex-col gap-3">
              <FeedbackMessage msg={feedback} />
              <div className="flex justify-end gap-3 w-full">
                <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancelar</button>
                <button onClick={saveBanner} disabled={uploading || processing} className={btnPrimary}>
                  {(uploading || processing) ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? "Salvar Alterações" : "Criar Banner")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {deleteModalOpen && bannerToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 " onClick={() => !processing && setDeleteModalOpen(false)} />
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl relative z-10 p-6 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={28} /></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir banner?</h3>
            <p className="text-sm text-gray-500 mb-6">Remover <strong>"{bannerToDelete.title}"</strong>?</p>
            <FeedbackMessage msg={feedback} />
            {!feedback && (
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50" disabled={processing}>Cancelar</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 flex items-center gap-2" disabled={processing}>
                  {processing && <Loader2 size={14} className="animate-spin" />}
                  Sim, excluir
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
