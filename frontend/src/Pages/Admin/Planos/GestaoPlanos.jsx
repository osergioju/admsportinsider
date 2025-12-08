import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";

export default function GestaoPlanos() {
  const [plans, setPlans] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const navigate = useNavigate();

  async function loadPlans() {
    try {
      const { data } = await api.get(`/admin/plans?page=${page}&limit=10`);
      setPlans(data.plans);
      console.log(data.plans);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
    }
  }

  useEffect(() => {
    loadPlans();
  }, [page]);

  async function disablePlan(id) {
    if (!confirm("Deseja realmente desativar este plano?")) return;

    try {
      await api.delete(`/admin/plans/${id}`);
      alert("Plano desativado!");
      loadPlans();
    } catch (error) {
      alert("Erro ao desativar plano.", error);
    }
  }

  return (
    <div>
      <div className="pb-2 mb-2 border-b border-gray-300 flex justify-between items-center">
        <h1 className="font-bold text-2xl">Planos</h1>

        <Link
          to="/admin/gestao-planos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          Criar plano
        </Link>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        {plans.length === 0 ? (
          <p className="text-gray-500">Nenhum plano encontrado.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Preço (display)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Status
                </th>
                <th></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    navigate(`/admin/gestao-planos/${plan.id}`)
                  }
                >
                  <td className="px-6 py-4">{plan.name}</td>
                  <td className="px-6 py-4">R$ {plan.price_display}</td>
                  <td className="px-6 py-4">
                    { plan.active }
                    {plan.active ? (
                      <span className="px-2 py-1 bg-green-200 text-green-700 rounded-full text-xs">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-200 text-red-700 rounded-full text-xs">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        disablePlan(plan.id);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Desativar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-40"
          >
            Anterior
          </button>

          <span>
            Página {page} de {pagination.totalPages}
          </span>

          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
