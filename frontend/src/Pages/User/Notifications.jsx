import { useEffect, useState } from "react";
import { api } from "../../services/api";

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

  async function markAsRead(id) {
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

    if (!n.read_at) markAsRead(n.id);
  }

  function closeModal() {
    setSelected(null);
    setOpenModal(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Notificações
      </h1>

      {loading && notifications.length === 0 && (
        <p>Carregando notificações...</p>
      )}

      {!loading && notifications.length === 0 && (
        <p>Você ainda não tem notificações 👌</p>
      )}

      {notifications.length > 0 && (
        <>
          <button
            onClick={markAll}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Marcar todas como lidas
          </button>

          <ul className="mt-5 space-y-3">
            {notifications.map(n => (
              <li
                key={n.id}
                className={`p-4 border rounded-lg flex justify-between items-center
                  ${!n.read_at ? "bg-blue-50" : "bg-gray-100"}`}
              >
                <div>
                  <div className="font-semibold">{n.title}</div>
                  {!n.read_at && (
                    <span className="text-xs text-blue-700">
                      Nova
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  {!n.read_at && (
                    <button
                      className="text-sm text-blue-600 underline"
                      onClick={() => markAsRead(n.id)}
                    >
                      Marcar lida
                    </button>
                  )}

                  <button
                    className="px-3 py-1 border rounded text-sm"
                    onClick={() => openNotification(n)}
                  >
                    Ver
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border rounded"
              >
                Carregar mais
              </button>
            </div>
          )}
        </>
      )}

      {/* ===== MODAL ===== */}
      {openModal && selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-white max-w-xl w-full p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-3">{selected.title}</h2>

            {/* Se vier HTML / imagens do backend */}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selected.message }}
            />

            <div className="text-right mt-5">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-800 text-white rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
