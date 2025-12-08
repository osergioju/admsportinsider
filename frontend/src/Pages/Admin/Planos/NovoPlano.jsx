import { useState } from "react";
import { api } from "../../../services/api";
import { useNavigate } from "react-router-dom";

export default function NovoPlano() {
  const [form, setForm] = useState({
    name: "",
    price_display: "",
    benefits: "",
    pagarme_plan_id: ""
  });

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post("/admin/plans", form);
      alert("Plano criado!");
      navigate("/admin/gestao-planos");
    } catch (error) {
      alert("Erro ao criar plano.", error);
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Criar plano</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label>Nome</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label>Preço de exibição</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            onChange={(e) =>
              setForm({ ...form, price_display: e.target.value })
            }
          />
        </div>

        <div>
          <label>Benefícios (texto ou JSON)</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="5"
            onChange={(e) =>
              setForm({ ...form, benefits: e.target.value })
            }
          ></textarea>
        </div>

        <div>
          <label>ID do plano pagar.me (opcional)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            onChange={(e) =>
              setForm({ ...form, pagarme_plan_id: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 px-4 py-2 text-white rounded"
        >
          Criar
        </button>
      </form>
    </div>
  );
}
