import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";

function Modal({ children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  const [modalType, setModalType] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [editForm, setEditForm] = useState({
    title: "",
    message: "",
    send_at: "",
    target: "all",
    status: "draft",
  });

  async function fetchNotifications() {
    try {
      const response = await api.get("/admin/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  function openEditModal(notification) {
    setSelectedNotification(notification);
    setEditForm({
      title: notification.title,
      message: notification.message,
      target: notification.target,
      status: notification.status,
      send_at: notification.send_at
        ? new Date(notification.send_at).toISOString().slice(0, 16)
        : "",
    });
    setModalType("edit");
  }

  // Edita a notificaçãos
  async function handleUpdateNotification() {
    try {
      await api.put(`/admin/notifications/${selectedNotification.id}`, editForm);

      // Atualiza a lista localmente (UX rápida)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === selectedNotification.id
            ? { ...n, ...editForm }
            : n
        )
      );

      setModalType(null);
      setSelectedNotification(null);

    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar notificação.");
    }
  }


  // Deleta ele 
  async function handleDeleteNotification() {
    try {
      await api.delete(
        `/admin/notifications/${notificationToDelete.id}`
      );

      // remove da lista sem refetch
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationToDelete.id)
      );

      setDeleteModalOpen(false);
      setNotificationToDelete(null);

    } catch (error) {
      console.error(error);
      alert("Erro ao excluir notificação.");
    }
  }


  return (
    <div className="p-6 bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notificações</h1>

        <Link
          to="/admin/new-notification"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nova notificação
        </Link>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <p>Carregando...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">Nenhuma notificação encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="py-3">Título</th>
                <th>Status</th>
                <th>Público</th>
                <th>Envio</th>
                <th>Criada em</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {notifications.map((n) => (
                <tr
                  key={n.id}
                  className="border-b hover:bg-gray-50 text-sm"
                >
                  <td className="py-3 font-medium">{n.title}</td>

                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold
                        ${
                          n.status === "draft"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-green-200 text-green-700"
                        }`}
                    >
                      {n.status}
                    </span>
                  </td>

                  <td>{n.target}</td>

                  <td>
                    {n.send_at
                      ? new Date(n.send_at).toLocaleString("pt-BR")
                      : "-"}
                  </td>

                  <td>
                    {new Date(n.created_at).toLocaleDateString("pt-BR")}
                  </td>

                  <td className="text-right space-x-3">
                    <button
                      onClick={() => openEditModal(n)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>

                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => {
                        setNotificationToDelete(n);
                        setDeleteModalOpen(true);
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalType === "edit" && (
        <Modal onClose={() => setModalType(null)}>
          <h2 className="text-lg font-semibold mb-5">
            Editar notificação
          </h2>

          <div className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm mb-1">Título</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm mb-1">Descrição</label>
              <textarea
                rows={4}
                className="w-full border rounded px-3 py-2"
                value={editForm.message}
                onChange={(e) =>
                  setEditForm({ ...editForm, message: e.target.value })
                }
              />
            </div>

            {/* Público */}
            <div>
              <label className="block text-sm mb-1">Público-alvo</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={editForm.target}
                onChange={(e) =>
                  setEditForm({ ...editForm, target: e.target.value })
                }
              >
                <option value="all">Todos os usuários</option>
                <option value="user">Usuários</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
              >
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendada</option>
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm mb-1">
                Data e hora de envio
              </label>
              <input
                type="datetime-local"
                className={
                  `w-full border rounded px-3 py-2`
                  + (editForm.status === "draft" ? " opacity-20" : "")
                }
                value={editForm.send_at}
                onChange={(e) =>
                  setEditForm({ ...editForm, send_at: e.target.value })
                }
                disabled={editForm.status === "draft"}
              />
              {editForm.status === "draft" && (
                <p className="text-xs text-gray-500 mt-1">
                  A data só é obrigatória quando a notificação está agendada.
                </p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setModalType(null)}
              className="border px-4 py-2 rounded"
            >
              Cancelar
            </button>

            <button
              onClick={handleUpdateNotification}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Salvar alterações
            </button>
          </div>
        </Modal>
      )}

      {deleteModalOpen && notificationToDelete && (
        <Modal onClose={() => setDeleteModalOpen(false)}>
          <h2 className="text-lg font-semibold mb-4 text-red-600">
            Excluir notificação
          </h2>

          <p className="mb-6">
            Tem certeza que deseja excluir a notificação{" "}
            <strong>"{notificationToDelete.title}"</strong>?
            <br />
            Essa ação não poderá ser desfeita.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="border px-4 py-2 rounded"
            >
              Cancelar
            </button>

            <button
              onClick={handleDeleteNotification}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
