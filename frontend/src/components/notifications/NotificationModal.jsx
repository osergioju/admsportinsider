import { useEffect } from "react";
import { api } from "../../services/api";
import { X, Bell, CheckCircle2 } from "lucide-react";

export default function NotificationModal({ notification, onClose, onRead }) {

  // --- Lógica original mantida ---
  useEffect(() => {
    async function markAsRead() {
      try {
        if (!notification.read_at) {
          await api.patch(`/user/notifications/${notification.id}/read`);
          onRead();
        }
      } catch (error) {
        console.error(error);
      }
    }

    markAsRead();
  }, [notification]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* --- Header --- */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-[#7F33D9] shrink-0">
                    <Bell size={16} />
                </div>
                <h2 className="text-base font-bold text-[#111] line-clamp-1 text-left">
                    {notification.title}
                </h2>
            </div>
            <button 
                onClick={onClose}
                className="text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50 p-1.5 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* --- Corpo da Mensagem --- */}
        <div className="p-6 flex flex-col items-start text-left">
            <div className="w-full text-sm text-gray-600 leading-relaxed whitespace-pre-line wrap-break-word">
                {/* Tratamento para remover tags HTML se houver */}
                {notification.message ? notification.message.replace(/<[^>]*>?/gm, '') : ""}
            </div>

            {/* Badge de Lida */}
            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <CheckCircle2 size={12} />
                <span>Marcada como lida</span>
            </div>
        </div>

        {/* --- Footer --- */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button
                onClick={onClose}
                className={`
                    w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2
                    
                    /* Estado Estático (Padrão) */
                    bg-white border border-gray-200 text-gray-500 shadow-sm
                    
                    /* Transições */
                    transition-all duration-200
                    
                    /* Estado Hover (Passar o mouse) */
                    hover:border-[#7F33D9] hover:text-[#7F33D9] hover:bg-purple-50/50 hover:shadow-md
                    
                    /* Estado Active (Clicar/Pressionar) - Feedback Tátil */
                    active:bg-[#7F33D9] active:text-white active:border-[#7F33D9] active:shadow-none active:scale-[0.98]
                `}
            >
                Fechar
            </button>
        </div>

      </div>
    </div>
  );
}