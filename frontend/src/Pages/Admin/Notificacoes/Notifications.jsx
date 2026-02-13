import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Bell, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Users, 
  AlertCircle,
  Calendar,
  X
} from "lucide-react";

import NotificationFormModal from "./NotificationFormModal"; 

export default function Notifications() {
  // --- STATES ---
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // FEEDBACK SYSTEM (TOAST)
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Helper para mostrar notificações
  const showToast = (type, message) => {
    setFeedback({ type, message });
    // Auto-hide após 4 segundos
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- DATA FETCHING ---
  async function fetchNotifications() {
    try {
      const response = await api.get("/admin/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível carregar a lista de notificações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  // --- HANDLERS ---

  const handleOpenCreate = () => {
    setEditingNotification(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (notification) => {
    setEditingNotification(notification);
    setIsFormOpen(true);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      if (editingNotification) {
        // Update
        await api.put(`/admin/notifications/${editingNotification.id}`, formData);
        setNotifications(prev => prev.map(n => n.id === editingNotification.id ? { ...n, ...formData } : n));
        showToast("success", "Notificação atualizada com sucesso!");
      } else {
        // Create
        // Idealmente, a API retorna o objeto criado com ID. Vamos simular reload ou push.
        await api.post("/admin/notifications", formData);
        showToast("success", "Notificação criada com sucesso!");
        fetchNotifications(); 
      }
      setIsFormOpen(false); // Fecha modal apenas no sucesso
    } catch (error) {
      console.error(error);
      // Mantém o modal aberto para o usuário tentar de novo
      showToast("error", "Erro ao salvar. Verifique sua conexão ou tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/notifications/${notificationToDelete.id}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id));
      showToast("success", "Notificação removida.");
      setDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast("error", "Erro ao excluir notificação.");
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status) {
        case 'sent': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={12}/> Enviada</span>;
        case 'scheduled': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><Clock size={12}/> Agendada</span>;
        default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200"><FileText size={12}/> Rascunho</span>;
    }
  };

  const btnPrimary = "flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20";

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500 relative">
      
      {/* --- TOAST NOTIFICATION (Fixed no topo direito) --- */}
      {feedback && (
        <div className={`
            fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 animate-in slide-in-from-right-10
            ${feedback.type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'}
        `}>
            <div className={`p-1 rounded-full ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <p className="text-sm font-medium">{feedback.message}</p>
            <button onClick={() => setFeedback(null)} className="ml-2 text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
            </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Enviar notificações</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie e envie alertas para os usuários do app.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Search size={18} /></div>
                <input type="text" placeholder="Buscar notificação..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={handleOpenCreate} className={btnPrimary}>
                <Plus size={18} /> Nova Notificação
            </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="animate-spin mb-2"><Clock size={24}/></div>
                <p className="text-sm">Carregando...</p>
             </div>
        ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Bell size={32} className="text-gray-300" /></div>
                <h3 className="text-lg font-bold text-gray-900">Nenhuma notificação</h3>
                <p className="text-sm text-gray-500 mt-1">Crie uma nova notificação para engajar seus usuários.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                            <th className="px-6 py-4">Título / Mensagem</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Público</th>
                            <th className="px-6 py-4">Envio</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredNotifications.map((n) => (
                            <tr key={n.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xs">{n.message}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(n.status)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md w-fit">
                                        <Users size={12} />
                                        {n.target === 'all' ? 'Todos' : n.target === 'admin' ? 'Admins' : 'Usuários'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {n.send_at ? (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-gray-400"/>
                                            {new Date(n.send_at).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    ) : <span className="text-gray-300">-</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenEdit(n)} className="p-2 text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50 rounded-lg transition-all" title="Editar">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => { setNotificationToDelete(n); setDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* MODAL FORM */}
      <NotificationFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSave} 
        initialData={editingNotification}
        isLoading={isSaving}
      />

      {/* MODAL DELETE */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)}/>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 p-6 text-center">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir notificação?</h3>
                <p className="text-sm text-gray-500 mb-6">Você tem certeza que deseja remover <strong>"{notificationToDelete?.title}"</strong>?</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20">Sim, excluir</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}