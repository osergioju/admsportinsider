import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useTranslation } from "../../../context/TranslationContext";
import { useNavigate } from "react-router-dom";

export default function SubscriptionPlan() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!user) return null;

  const isPaid =
    user.stripe_subscription_id &&
    ["active", "trialing"].includes(user.subscription_status);

  const isFree = !isPaid;

  return (
    <div>
      <h1 className="text-xl font-medium mb-2">
        {t("subscription.title", "Minha assinatura")}
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        {t("subscription.subtitle", "Gerencie sua assinatura e veja o histórico de pagamentos.")}
      </p>

      {/* ================= FREE PLAN ================= */}
      {isFree && (
        <div className="border rounded-lg p-6 space-y-4 max-w-lg">
          <h2 className="text-lg font-medium">
            {t("subscription.basic", "Plano básico")}
          </h2>

          <p className="text-sm text-gray-500">
            {t("subscription.basic_desc", "Você está utilizando o plano básico.")}
          </p>

          <ul className="text-sm list-disc ml-5 text-gray-600">
            <li>{t("subscription.limited_access", "Acesso limitado")}</li>
            <li>{t("subscription.no_history", "Sem histórico de pagamentos")}</li>

          </ul>

          <button
            onClick={() => navigate("/pricing")}
            className="mt-4 px-5 py-2 bg-black text-white rounded-md"
          >
            {t("subscription.update", "Atualizar assinatura")}
          </button>
        </div>
      )}

      {/* ================= PAID PLAN ================= */}
      {isPaid && (
        <div className="border rounded-lg p-6 space-y-4 max-w-lg">
          <h2 className="text-lg font-medium">
            {t("subscription.active", "Assinatura ativa")}
          </h2>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>{t("subscription.plan_label", "Plano:")}</strong>{" "}
              {
                user.plan_id == 1 ? t("subscription.free", "Grátis") :
                  user.plan_id == 2 ? t("subscription.premium", "Premium") :
                    t("subscription.business", "Business")
              }
            </p>

            <p>
              <strong>{t("subscription.status_label", "Status:")}</strong>{" "}
              {
                user.subscription_status == "active" ? t("subscription.status_active", "Ativo") :
                  user.subscription_status == "canceled" ? t("subscription.status_cancelled", "Cancelado") :
                    t("subscription.status_pending", "Pendente")
              }
            </p>

            {user.subscription_current_period_end && (
              <p>
                <strong>{t("subscription.next_payment", "Próximo pagamento:")}</strong>{" "}
                {new Date(
                  user.subscription_current_period_end
                ).toLocaleDateString()}
              </p>
            )}

            {user.cancel_at_period_end && (
              <p className="text-yellow-600">
                {t("subscription.cancel_notice", "Sua assinatura será cancelada ao final do período de faturamento atual.")}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => navigate("/me/financial")}
              className="px-5 py-2 border rounded-md"
            >
              {t("subscription.view_invoices", "Ver faturas")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
