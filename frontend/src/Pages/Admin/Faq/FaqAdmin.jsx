import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Plus, Trash2, Pencil, CheckCircle, XCircle, Search } from "lucide-react";

export default function FaqAdmin() {
  const [faqs, setFaqs] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadFaqs() {
    const res = await api.get("/admin/faq");
    setFaqs(res.data);
  }

  useEffect(() => {
    loadFaqs();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      question,
      answer,
      sort_order: Number(sortOrder),
      is_active: isActive
    };

    if (editingId) {
      await api.put(`/admin/faq/${editingId}`, payload);
    } else {
      await api.post("/admin/faq", payload);
    }

    resetForm();
    loadFaqs();
  }

  function resetForm() {
    setQuestion("");
    setAnswer("");
    setSortOrder(0);
    setEditingId(null);
    setIsActive(true);
  }

  function handleEdit(faq) {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setSortOrder(faq.sort_order ?? 0);
    setIsActive(faq.is_active);
  }

  async function handleDelete(id) {
    if (!confirm("Deseja desativar esta pergunta?")) return;
    await api.delete(`/admin/faq/${id}`);
    loadFaqs();
  }

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div>
        <h1 className="text-2xl font-bold">FAQ - Admin</h1>
        <p className="text-gray-500 text-sm">Gerencie as perguntas frequentes</p>
      </div>

      {/* BUSCA */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar pergunta ou resposta..."
          className="w-full pl-10 p-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border space-y-4"
      >
        <input
          type="text"
          placeholder="Pergunta"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />

        <textarea
          placeholder="Resposta"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border rounded-lg p-2"
          rows={4}
          required
        />

        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Ordem"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-32 border rounded-lg p-2"
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
            />
            Ativo
          </label>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus size={16} />
          {editingId ? "Atualizar" : "Adicionar"}
        </button>
      </form>

      {/* LISTA */}
      <div className="bg-white rounded-xl border divide-y">
        {filteredFaqs.map((faq) => (
          <div
            key={faq.id}
            className="p-4 flex justify-between items-start gap-4"
          >
            <div>
              <strong>
                [{faq.sort_order}] {faq.question}
              </strong>
              <p className="text-sm text-gray-500">{faq.answer}</p>
              <span
                className={`text-xs font-medium flex items-center gap-1 mt-1 ${
                  faq.is_active ? "text-green-600" : "text-red-600"
                }`}
              >
                {faq.is_active ? (
                  <>
                    <CheckCircle size={14} /> Ativo
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> Inativo
                  </>
                )}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(faq)}
                className="p-2 rounded hover:bg-gray-100"
              >
                <Pencil size={16} />
              </button>

              <button
                onClick={() => handleDelete(faq.id)}
                className="p-2 rounded hover:bg-red-100 text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}