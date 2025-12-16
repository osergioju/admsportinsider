import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api"

export default function NewNotification() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "all",
    send_at: "",
    status: "draft",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post("/admin/new-notification", form);

      alert("Notificação criada com sucesso!");
      navigate("/admin/notifications");

    } catch (error) {
      console.error(error);
      alert("Erro ao criar notificação.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Criar Notificação</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-600 mb-2">
            Título
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Atualização do sistema"
          />
        </div>

        {/* Mensagem */}
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-600 mb-2">
            Mensagem
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={5}
            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o conteúdo da notificação"
          />
        </div>

        {/* Público-alvo */}
        <div>
          <label htmlFor="target" className="block text-sm font-semibold text-gray-600 mb-2">
            Público-alvo
          </label>
          <select
            id="target"
            name="target"
            value={form.target}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os usuários</option>
            <option value="user">Usuários</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Data de envio */}
        <div>
          <label htmlFor="send_at" className="block text-sm font-semibold text-gray-600 mb-2">
            Enviar em
          </label>
          <input
            id="send_at"
            type="datetime-local"
            name="send_at"
            value={form.send_at}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-gray-600 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Rascunho</option>
            <option value="scheduled">Agendada</option>
          </select>
        </div>

        {/* Ações */}
        <div className="flex justify-between pt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-6 py-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Criar Notificação
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-gray-300 text-gray-800 rounded px-6 py-3 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
