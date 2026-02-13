import { useEffect, useState } from "react";
import { api } from "../../../services/api";
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
  Link as LinkIcon,
  Eye,
  FileText,
  AlertTriangle
} from "lucide-react";

export default function Banners() {

  // STATES
  const [banners, setBanners] = useState([]);
  
  // Modal Criar/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Modal Excluir
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  // Loadings & Feedback
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false); // Para ações de salvar/excluir
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const [form, setForm] = useState({
    title: "",
    image_desktop_url: "",
    image_mobile_url: "",
    link_url: "",
    start_at: "",
    end_at: "",
    status: "draft"
  });

  // HELPER: Feedback Inline
  const handleFeedback = (type, text) => {
    setFeedback({ type, text });
    // Limpa automaticamente após alguns segundos apenas se for sucesso (para dar tempo de ler e fechar)
    // Se for erro, deixa lá para o usuário corrigir.
    if (type === 'success') {
        setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Componente Visual de Mensagem (Inline)
  const FeedbackMessage = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.type === 'success';
    return (
        <div className={`mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {isSuccess ? <CheckCircle2 size={18} className="text-green-600 shrink-0"/> : <AlertCircle size={18} className="text-red-600 shrink-0"/>}
            <span>{msg.text}</span>
        </div>
    );
  };

  // LOAD BANNERS
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

  useEffect(() => {
    loadBanners();
  }, []);


  // UPLOAD IMAGE
  async function uploadImage(file, type) {
    if (!file) return;
    setUploading(true);
    setFeedback(null); // Limpa erros anteriores

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(
        "/admin/banners/upload-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setForm((prev) => ({
        ...prev,
        [type]: res.data.url
      }));

    } catch (err) {
      handleFeedback("error", "Erro ao enviar imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  // OPEN MODALS
  function openCreate() {
    setIsEditing(false);
    setCurrentId(null);
    setFeedback(null);
    setForm({
      title: "",
      image_desktop_url: "",
      image_mobile_url: "",
      link_url: "",
      start_at: "",
      end_at: "",
      status: "draft"
    });
    setModalOpen(true);
  }

  function openEdit(banner) {
    setIsEditing(true);
    setFeedback(null);
    setCurrentId(banner.id_banner);
    setForm({
      ...banner,
      start_at: banner.start_at ? banner.start_at.slice(0, 16) : "",
      end_at: banner.end_at ? banner.end_at.slice(0, 16) : ""
    });
    setModalOpen(true);
  }

  function openDelete(banner) {
      setBannerToDelete(banner);
      setFeedback(null);
      setDeleteModalOpen(true);
  }


  // SAVE
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
      
      // Fecha o modal após mostrar o sucesso
      setTimeout(() => {
          setModalOpen(false);
          setFeedback(null);
      }, 1500);

    } catch (err) {
      handleFeedback("error", "Erro ao salvar. Verifique os dados.");
    } finally {
        setProcessing(false);
    }
  }

  // DELETE CONFIRMATION
  async function confirmDelete() {
    if (!bannerToDelete) return;
    setProcessing(true);
    
    try {
      await api.delete(`/admin/banners/${bannerToDelete.id_banner}`);
      handleFeedback("success", "Banner removido.");
      await loadBanners();
      
      setTimeout(() => {
          setDeleteModalOpen(false);
          setBannerToDelete(null);
          setFeedback(null);
      }, 1500);

    } catch (err) {
      handleFeedback("error", "Erro ao remover banner.");
    } finally {
        setProcessing(false);
    }
  }

  // HELPERS
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

  //ESTILOS
  const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
  const btnSecondary = "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

  // RENDER
  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500 relative">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Banners</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie os destaques visuais do app e site.</p>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={18} /> Novo Banner
        </button>
      </div>

      {/* GRID DE BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => {
            const status = getBannerDisplayStatus(banner);
            const statusConfig = getStatusConfig(status);
            const StatusIcon = statusConfig.icon;

            return (
                <div 
                    key={banner.id_banner} 
                    onClick={() => openEdit(banner)}
                    className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
                >
                    {/* Preview da Imagem (Capa) */}
                    <div className="relative h-40 bg-gray-100 overflow-hidden">
                        {banner.image_desktop_url ? (
                            <img 
                                src={banner.image_desktop_url} 
                                alt={banner.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={40} />
                            </div>
                        )}
                        
                        {/* Badge de Status Flutuante */}
                        <div className="absolute top-3 right-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${statusConfig.color} bg-white`}>
                                <StatusIcon size={12} />
                                {statusConfig.label}
                            </span>
                        </div>
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{banner.title}</h3>
                        
                        {/* Datas */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                            <Calendar size={14} />
                            <span>
                                {banner.start_at 
                                    ? `${new Date(banner.start_at).toLocaleDateString()} - ${banner.end_at ? new Date(banner.end_at).toLocaleDateString() : 'Indefinido'}`
                                    : "Sem agendamento"
                                }
                            </span>
                        </div>

                        {/* Footer do Card */}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex gap-2">
                                {banner.image_desktop_url && <Monitor size={16} className="text-gray-400" title="Desktop OK" />}
                                {banner.image_mobile_url && <Smartphone size={16} className="text-gray-400" title="Mobile OK" />}
                            </div>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); openDelete(banner); }}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Desativar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            );
        })}

        {/* Empty State */}
        {!loading && banners.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <ImageIcon size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Nenhum banner criado</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">Crie banners para promover campanhas ou novidades no app.</p>
                <button onClick={openCreate} className={`mt-6 ${btnPrimary}`}>
                    Criar meu primeiro banner
                </button>
            </div>
        )}
      </div>

      {/* MODAL CRIAR / EDITAR */}
      {modalOpen && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setModalOpen(false)}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            
            <div 
                className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">{isEditing ? "Editar Banner" : "Novo Banner"}</h2>
                    <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Campos do Formulário (Título, Status, Imagens, Link, Datas) */}
                    {/* ... (Mantive o conteúdo interno igual ao anterior para brevidade, mas está aqui na lógica) ... */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2">
                            <label className={labelClass}>Título Interno</label>
                            <input className={inputClass} placeholder="Ex: Promoção" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="draft">Rascunho</option>
                                <option value="scheduled">Agendado</option>
                                <option value="active">Ativo</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className={labelClass}><Monitor size={14} className="inline mr-1" /> Desktop</label>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 hover:border-purple-200 transition-colors cursor-pointer relative h-32 flex items-center justify-center overflow-hidden group">
                                <input type="file" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => uploadImage(e.target.files[0], "image_desktop_url")} />
                                {form.image_desktop_url ? <img src={form.image_desktop_url} className="absolute inset-0 w-full h-full object-cover" /> : <ImageIcon className="text-gray-300"/>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}><Smartphone size={14} className="inline mr-1" /> Mobile</label>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 hover:border-purple-200 transition-colors cursor-pointer relative h-32 flex items-center justify-center overflow-hidden group">
                                <input type="file" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => uploadImage(e.target.files[0], "image_mobile_url")} />
                                {form.image_mobile_url ? <img src={form.image_mobile_url} className="absolute inset-0 w-full h-full object-cover" /> : <ImageIcon className="text-gray-300"/>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Link</label>
                        <input className={inputClass} placeholder="https://..." value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs text-gray-500 mb-1">Início</label><input type="datetime-local" className={`${inputClass} bg-white`} value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} /></div>
                            <div><label className="block text-xs text-gray-500 mb-1">Fim</label><input type="datetime-local" className={`${inputClass} bg-white`} value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} /></div>
                        </div>
                    </div>
                </div>

                {/* Footer Modal com Feedback Inline */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 shrink-0 flex flex-col gap-3">
                    
                    {/* FEEDBACK AQUI EMBAIXO */}
                    <FeedbackMessage msg={feedback} />

                    <div className="flex justify-end gap-3 w-full">
                        <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancelar</button>
                        <button 
                            onClick={saveBanner} 
                            disabled={uploading || processing}
                            className={btnPrimary}
                        >
                            {(uploading || processing) ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? "Salvar Alterações" : "Criar Banner")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteModalOpen && bannerToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !processing && setDeleteModalOpen(false)}/>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl relative z-10 p-6 text-center">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir banner?</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Você tem certeza que deseja remover <strong>"{bannerToDelete.title}"</strong>?
                </p>
                
                {/* Feedback Inline no Modal de Exclusão */}
                <FeedbackMessage msg={feedback} />

                {!feedback && (
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setDeleteModalOpen(false)} 
                            className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50"
                            disabled={processing}
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete} 
                            className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 flex items-center gap-2"
                            disabled={processing}
                        >
                            {processing && <Loader2 size={14} className="animate-spin"/>}
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