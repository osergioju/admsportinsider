import { useEffect, useState } from "react";
import { api } from "../../services/api";
import NotificationModal from "../../components/notifications/NotificationModal";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  MailOpen, 
  ChevronRight, 
  Loader2,
  Inbox
} from "lucide-react"; 

export default function PageNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadNotifications(page);
    // eslint-disable-next-line
  }, [page]);

  async function loadNotifications(currentPage = 1) {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/user/notifications?page=${currentPage}&pageSize=${pageSize}`
      );

      if (currentPage === 1) {
        setNotifications(data.data);
      } else {
        setNotifications(prev => [...prev, ...data.data]);
      }

      setHasMore(data.pagination.hasMore);
    } catch (err) {
      console.error("Erro ao carregar notificações", err);
    } finally {
      setLoading(false);
    }
  }

  // Função usada pelo botão "Marcar como lida" (texto azul)
  async function markAsRead(id, e) {
    if(e) e.stopPropagation(); // Evita abrir o modal ao clicar só no botão

    try {
      await api.patch(`/user/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, read_at: new Date() } : n
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function markAll() {
    try {
      await api.patch("/user/notifications/read-all");
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date() }))
      );
    } catch (e) {
      console.error(e);
    }
  }

  function openNotification(n) {
    setSelected(n);
    setOpenModal(true);
    
    // OBS: Removemos o markAsRead daqui pois o NotificationModal 
    // já faz isso automaticamente no useEffect dele ao montar.
  }

  function closeModal() {
    setSelected(null);
    setOpenModal(false);
  }

  // Helper visual para data
  const formatDate = (dateString) => {
    if(!dateString) return "Recente";
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      
      {/* --- Header da Página --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-[#111]">Notificações</h1>
            <p className="text-gray-500 text-sm mt-1">
                Gerencie suas mensagens e alertas do sistema.
            </p>
        </div>

        {notifications.length > 0 && (
            <button
                onClick={markAll}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all text-sm font-medium shadow-sm active:scale-[0.98]"
            >
                <CheckCheck size={16} />
                Marcar todas como lidas
            </button>
        )}
      </div>

      {/* --- Estado Loading Inicial --- */}
      {loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-3" size={30} />
            <p>Carregando notificações...</p>
        </div>
      )}

      {/* --- Estado Vazio --- */}
      {!loading && notifications.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Inbox size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#111]">Tudo limpo!</h3>
            <p className="text-gray-500 mt-1">Você não tem novas notificações no momento.</p>
        </div>
      )}

      {/* --- Lista de Notificações --- */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {notifications.map(n => {
                const isUnread = !n.read_at;

                return (
                  <li
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`
                        group p-5 flex gap-4 items-start cursor-pointer transition-all duration-200
                        ${isUnread ? "bg-purple-50/40 hover:bg-purple-50/70" : "bg-white hover:bg-gray-50"}
                    `}
                  >
                    {/* Ícone de Status */}
                    <div className={`
                        shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-colors
                        ${isUnread 
                            ? "bg-[#7F33D9] border-[#7F33D9] text-white shadow-sm" 
                            : "bg-white border-gray-200 text-gray-400 group-hover:border-gray-300"
                        }
                    `}>
                        {isUnread ? <Bell size={18} fill="currentColor" /> : <MailOpen size={18} />}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                            <h4 className={`text-sm ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                                {n.title}
                            </h4>
                            <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                                <Clock size={12} />
                                {formatDate(n.created_at)}
                            </span>
                        </div>
                        
                        {/* Preview Texto */}
                        <p className={`text-sm line-clamp-2 ${isUnread ? "text-gray-600" : "text-gray-500"}`}>
                             {n.message ? n.message.replace(/<[^>]*>?/gm, '') : "Nova mensagem recebida."}
                        </p>

                        {/* Botão de Ação Rápida (Marcar como lida sem abrir) */}
                        {isUnread && (
                            <button
                                onClick={(e) => markAsRead(n.id, e)}
                                className="mt-3 text-xs font-semibold text-[#7F33D9] hover:underline flex items-center gap-1"
                            >
                                Marcar como lida
                            </button>
                        )}
                    </div>

                    {/* Seta com Hover */}
                    <div className="self-center pl-2 text-gray-300 group-hover:text-[#7F33D9] group-hover:translate-x-1 transition-all">
                        <ChevronRight size={20} />
                    </div>
                  </li>
                );
            })}
          </ul>

          {/* Botão Carregar Mais */}
          {hasMore && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm active:scale-[0.99]"
              >
                {loading ? "Carregando..." : "Carregar mensagens anteriores"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {openModal && selected && (
        <NotificationModal
            notification={selected}
            onClose={closeModal}
            // Atualiza o estado local quando o modal marcar como lida internamente
            onRead={() => {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === selected.id ? { ...n, read_at: new Date() } : n
                    )
                );
            }}
        />
      )}
    </div>
  );
}