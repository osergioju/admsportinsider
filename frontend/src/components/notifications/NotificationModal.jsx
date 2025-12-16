import { api } from "../../services/api";

export default function NotificationModal({
  notification,
  onClose,
  onRead,
}) {
  async function markAsRead() {
    try {
      if (!notification.read_at) {
        await api.patch(
          `/user/notifications/${notification.id}/read`
        );
        onRead();
      }
    } catch (error) {
      console.error(error);
    }
  }

  // marca como lida ao abrir
  markAsRead();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-3">
          {notification.title}
        </h2>

        <p className="text-gray-700 mb-6">
          {notification.message}
        </p>

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
