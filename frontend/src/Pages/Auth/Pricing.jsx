import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const isPaid =
    user?.stripe_subscription_id &&
    ["active", "trialing"].includes(user.subscription_status);

  async function handleSubscribe(plan_id) {
    if (!user) {
      navigate("/login");
      return;
    }

    if (isPaid) {
      navigate("/me/subscription");
      return;
    }

    try {
      setLoadingPlan(plan_id);

      const response = await api.post("/stripe/create-checkout-session", {
        userId: user.id,
        plan_id
      });

      window.location.href = response.data.url;
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-20 px-6">
      <h1 className="text-white text-3xl font-semibold text-center mb-4">
        Escolha o seu plano
      </h1>

      <p className="text-center text-gray-500 mb-12">
        Aprimore sua experiência e desbloqueie recursos premium.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* FREE */}
        <div className="border bg-white rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">
            Grátis
          </h2>

          <p className="text-3xl font-bold">
            R$ 0
          </p>

          <ul className="text-sm text-gray-600 space-y-2">
            <li>Acesso básico</li>
            <li>Recursos limitados</li>
            <li>Sem cobrança</li>
          </ul>

          <button
            disabled
            className="w-full mt-4 px-4 py-2 border rounded-md text-gray-400"
          >
            Plano atual
          </button>
        </div>

        {/* PREMIUM */}
        <div className="border bg-white rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">
            Premium
          </h2>

          <p className="text-3xl font-bold">
            R$ 49,90<span className="text-sm">/mo</span>
          </p>

          <ul className="text-sm text-gray-600 space-y-2">
            <li>Todos os recursos gratuitos</li>
            <li>Informações avançadas</li>
            <li>Suporte por e-mail</li>
          </ul>

          <button
            onClick={() => handleSubscribe(2)}
            disabled={loadingPlan === 2}
            className="w-full mt-4 px-4 py-2 bg-black text-white rounded-md"
          >
            {loadingPlan === 2 ? "Redirecionando..." : "Atualizar para Premium"}
          </button>
        </div>

        {/* BUSINESS */}
        <div className="border bg-white rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">
            Business
          </h2>

          <p className="text-3xl font-bold">
            R$ 129,90<span className="text-sm">/mo</span>
          </p>

          <ul className="text-sm text-gray-600 space-y-2">
            <li>Todos os recursos Premium</li>
            <li>Dados avançados</li>
            <li>Suporte prioritário</li>
          </ul>

          <button
            onClick={() => handleSubscribe(3)}
            disabled={loadingPlan === 3}
            className="w-full mt-4 px-4 py-2 bg-black text-white rounded-md"
          >
            {loadingPlan === 3 ? "Redirecionando..." : "Atualizar para o Business"}
          </button>
        </div>

      </div>

      {isPaid && (
        <p className="text-center text-sm text-gray-500 mt-8">
          Você já tem uma assinatura.{" "}
          <button
            onClick={() => navigate("/me/subscription")}
            className="underline"
          >
            Gerenciar assinatura
          </button>
        </p>
      )}
    </div>
  );
}
