import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { useNavigate, useParams } from "react-router-dom";

export default function EditarPlano() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);

  useEffect(() => {
    async function loadPlan() {
      const { data } = await api.get("/admin/plans/" + id);
      setForm(data.plan);
    }
    loadPlan();
  }, []);

  if (!form) return <p>Carregando...</p>;

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.put(`/admin/plans/${id}`, form);
      alert("Plano atualizado!");
      navigate("/admin/gestao-planos");
    } catch (error) {
      alert("Erro ao atualizar plano.", error);
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Editar plano</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label>Nome</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </div>

        <div>
          <label>Preço de exibição</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={form.price_display}
            onChange={(e) =>
              setForm({ ...form, price_display: e.target.value })
            }
          />
        </div>

        <div>
          <label>Benefícios</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="5"
            value={form.benefits}
            onChange={(e) =>
              setForm({ ...form, benefits: e.target.value })
            }
          ></textarea>
        </div>

        <div>
          <label>ID pagar.me</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.pagarme_plan_id}
            onChange={(e) =>
              setForm({ ...form, pagarme_plan_id: e.target.value })
            }
          />
        </div>

        <div>
          <label>Status</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={form.active}
            onChange={(e) =>
              setForm({ ...form, active: e.target.value === "true" })
            }
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>

        <button className="bg-blue-600 px-4 py-2 text-white rounded">
          Salvar alterações
        </button>
      </form>
    </div>
  );
}
