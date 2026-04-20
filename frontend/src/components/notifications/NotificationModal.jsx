import { useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../../services/api";
import { X, Bell, CheckCircle2 } from "lucide-react";

export default function NotificationModal({ notification, onClose, onRead }) {

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

  // Renderiza o conteúdo diretamente no BODY do site, fugindo de qualquer bloqueio do layout
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  transition-opacity animate-in fade-in duration-200">

      {/* Card do Modal */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-[#7F33D9] shrink-0 border border-purple-100">
              <Bell size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Notificação
              </h2>
              <span className="text-xs text-gray-400 font-medium">Sistema</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Linha Divisória */}
        <div className="w-full h-px bg-gray-100 mb-2"></div>

        {/* Corpo da Mensagem (Com Scroll se necessário) */}
        <div className="px-6 py-2 flex-1 overflow-y-auto min-h-[100px]">
          <h3 className="text-base font-bold text-gray-800 mb-2">
            {notification.title}
          </h3>
          <div className="w-full text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
            {notification.message ? notification.message.replace(/<[^>]*>?/gm, '') : ""}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 mt-auto bg-white border-t border-gray-50">
          <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 select-none">
            <CheckCircle2 size={18} strokeWidth={2.5} />
            <span className="text-xs font-bold uppercase tracking-wide">Marcada como lida</span>
          </div>
        </div>

      </div>
    </div>,
    document.body // Alvo do Portal
  );
}