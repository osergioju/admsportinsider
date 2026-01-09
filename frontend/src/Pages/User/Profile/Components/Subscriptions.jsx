import { useContext } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Subscriptions() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return null;

  const isPaid =
    user.stripe_subscription_id &&
    ["active", "trialing"].includes(user.subscription_status);

  const isFree = !isPaid;

  return (
    <div>
      <h1 className="text-xl font-medium mb-2">
        Minha assinatura
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Gerencie sua assinatura e veja o histórico de pagamentos.
      </p>

      {/* ================= FREE PLAN ================= */}
      {isFree && (
        <div className="border rounded-lg p-6 space-y-4 max-w-lg">
          <h2 className="text-lg font-medium">
            Plano básico
          </h2>

          <p className="text-sm text-gray-500">
            Você está utilizando o plano básico.
          </p>

          <ul className="text-sm list-disc ml-5 text-gray-600">
            <li>Acesso limitado</li>
            <li>Sem histórico de pagamentos</li>
          </ul>

          <button
            onClick={() => navigate("/pricing")}
            className="mt-4 px-5 py-2 bg-black text-white rounded-md"
          >
            Atualizar assinatura
          </button>
        </div>
      )}

      {/* ================= PAID PLAN ================= */}
      {isPaid && (
        <div className="border rounded-lg p-6 space-y-4 max-w-lg">
          <h2 className="text-lg font-medium">
            Assinatura ativa
          </h2>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Plano:</strong>{" "}
              {
                user.plan_id == 1 ? "Grátis" :
                  user.plan_id == 2 ? "Premium" :
                    "Business"
              }
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {
                user.subscription_status == "active" ? "Ativo" :
                  user.subscription_status == "canceled" ? "Cancelado" :
                    "Pendente"
              }
            </p>

            {user.subscription_current_period_end && (
              <p>
                <strong>Próximo pagamento:</strong>{" "}
                {new Date(
                  user.subscription_current_period_end
                ).toLocaleDateString()}
              </p>
            )}

            {user.cancel_at_period_end && (
              <p className="text-yellow-600">
                Sua assinatura será cancelada ao final do período de faturamento atual.
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => navigate("/me/subscription/invoices")}
              className="px-5 py-2 border rounded-md"
            >
              Ver faturas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
