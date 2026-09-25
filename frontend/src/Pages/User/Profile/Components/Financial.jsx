import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ExternalLink, X } from "lucide-react";
import { useTranslation } from "../../../../context/TranslationContext";
import { AuthContext } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";
import { formatPlanPrice, intervalSuffix } from "../../../../utils/planBilling";
import BillingShell, {
  ArrowLink, Dot, Eyebrow, Hairline, INK, LINE, LINE_SOFT, MUTED, PillButton,
} from "../../../../components/billing/BillingShell";

const CARD_BRANDS = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", elo: "Elo", discover: "Discover", diners: "Diners Club", jcb: "JCB", unionpay: "UnionPay" };

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

// Uma linha da lista "Seu plano": rótulo em caixa alta à esquerda, valor à direita
function PlanRow({ label, children, last = false }) {
  return (
    <div
      className="flex items-baseline justify-between gap-5 py-[15px]"
      style={{ borderTop: `1px solid ${LINE}`, ...(last ? { borderBottom: `1px solid ${LINE}` } : {}) }}
    >
      <dt className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: MUTED }}>{label}</dt>
      <dd className="text-[19px] font-semibold tracking-[-0.012em] text-right" style={{ color: INK }}>{children}</dd>
    </div>
  );
}

export default function SubscriptionManagement() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoadingPlans(true);
        const response = await api.get("/admin/plans");
        setPlans(response.data.plans || []);
      } catch (err) {
        console.error("Erro ao buscar planos:", err);
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();
  }, []);

  const currentPlan = plans.find((p) => p.id === user?.plan_id) || null;
  const isFreePlan = !user?.plan_id || (currentPlan && Number(currentPlan.price) === 0);

  // Cancelamento agendado / pagamento falho — vêm direto do user (SELECT u.* no /auth/me)
  const isCanceling = user?.cancel_at_period_end === true;
  const isPastDue = user?.subscription_status === "past_due";
  const periodEnd = formatDate(user?.subscription_current_period_end);
  const upgradePlan = plans.find((p) => Number(p.price) > 0 && p.active);

  // Cartão da assinatura (só bandeira + final; opcional — some da lista se o Stripe não tiver)
  useEffect(() => {
    if (loadingPlans || isFreePlan || !currentPlan) return;
    let cancelled = false;
    api
      .get("/stripe/billing/payment-method")
      .then((res) => !cancelled && setPaymentMethod(res.data?.payment_method || null))
      .catch(() => !cancelled && setPaymentMethod(null));
    return () => { cancelled = true; };
  }, [loadingPlans, isFreePlan, currentPlan]);

  const benefits = currentPlan?.benefits
    ? typeof currentPlan.benefits === "string"
      ? JSON.parse(currentPlan.benefits)
      : currentPlan.benefits
    : [];
  const benefitsList = (Array.isArray(benefits) ? benefits : Object.entries(benefits).filter(([, v]) => v === true).map(([k]) => k))
    .map((b) => (typeof b === "string" ? b : b.label || b.name))
    .filter(Boolean);

  // Tudo que altera a assinatura (trocar plano, cartão, cancelar, reativar, faturas) é no portal do Stripe
  async function handleOpenBillingPortal() {
    try {
      setPortalLoading(true);
      setError(null);
      const response = await api.post("/stripe/billing/portal");
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Billing portal error:", err);
      setError("Não foi possível abrir o portal. Tente novamente.");
      setPortalLoading(false);
    }
  }

  const planName = currentPlan?.name || t("financial.free_plan", "Free");

  // Bloco de status (lado esquerdo): muda conforme o estado da assinatura
  function renderStatus() {
    if (loadingPlans) {
      return (
        <div className="animate-pulse motion-reduce:animate-none space-y-5" aria-busy="true">
          <div className="h-3 w-40 rounded" style={{ background: LINE }} />
          <div className="h-12 w-3/4 rounded" style={{ background: LINE }} />
          <div className="h-12 w-1/2 rounded" style={{ background: LINE }} />
          <div className="h-14 w-56 rounded-full" style={{ background: LINE }} />
        </div>
      );
    }

    const heading = "mt-[22px] text-[34px] sm:text-[40px] lg:text-[46px] leading-[1.08] font-light tracking-[-0.028em]";

    if (isPastDue) {
      return (
        <>
          <Eyebrow color={INK}>Pagamento pendente</Eyebrow>
          <h2 className={heading} style={{ color: INK }}>
            Não conseguimos<br /><strong className="font-semibold">cobrar seu cartão</strong>
          </h2>
          <p className="mt-[22px] text-[17px] max-w-xl" style={{ color: MUTED }}>
            {t("financial.past_due_body", "Atualize seu método de pagamento para evitar a interrupção do seu plano.")}
          </p>
          <div className="mt-[34px]">
            <PillButton onClick={handleOpenBillingPortal} loading={portalLoading} disabled={portalLoading}>
              {t("financial.update_payment", "Atualizar pagamento")}
            </PillButton>
          </div>
        </>
      );
    }

    if (isCanceling && periodEnd) {
      return (
        <>
          <Eyebrow color={INK}>Cancelamento agendado</Eyebrow>
          <h2 className={heading} style={{ color: INK }}>
            Seu acesso {planName} termina em<br /><strong className="font-semibold">{periodEnd}</strong>
          </h2>
          <p className="mt-[22px] text-[17px] max-w-xl" style={{ color: MUTED }}>
            Até lá, todos os recursos continuam disponíveis. Reativando antes dessa data, nada é interrompido.
          </p>
          <div className="mt-[34px]">
            <PillButton onClick={handleOpenBillingPortal} loading={portalLoading} disabled={portalLoading}>
              {t("financial.reactivate", "Reativar assinatura")}
            </PillButton>
          </div>
        </>
      );
    }

    if (isFreePlan) {
      return (
        <>
          <Eyebrow color={INK}>Plano gratuito</Eyebrow>
          <h2 className={heading} style={{ color: INK }}>
            Você está no plano<br /><strong className="font-semibold">{planName}</strong>
          </h2>
          <p className="mt-[22px] text-[17px] max-w-xl" style={{ color: MUTED }}>
            {t("financial.premium_subtitle", "Assine um plano pago para desbloquear recursos avançados e suporte prioritário.")}
          </p>
          {upgradePlan && (
            <div className="mt-[34px]">
              <PillButton onClick={() => navigate("/me/plans")}>{t("financial.see_plans_cta", "Ver planos e assinar")}</PillButton>
            </div>
          )}
        </>
      );
    }

    // Assinatura ativa
    return (
      <>
        <Eyebrow color={INK}>Assinatura ativa</Eyebrow>
        <h2 className={heading} style={{ color: INK }}>
          {periodEnd ? (
            <>Seu plano {planName} renova em<br /><strong className="font-semibold">{periodEnd}</strong></>
          ) : (
            <>Seu plano<br /><strong className="font-semibold">{planName}</strong></>
          )}
        </h2>
        <p className="mt-[22px] text-[17px] max-w-xl" style={{ color: MUTED }}>
          Troque de plano, atualize o cartão ou cancele quando quiser. Tudo pelo portal seguro do Stripe.
        </p>
        <div className="mt-[34px] flex flex-wrap items-center gap-x-8 gap-y-4">
          <PillButton onClick={handleOpenBillingPortal} loading={portalLoading} disabled={portalLoading}>
            {t("financial.change_plan", "Mudar plano")}
          </PillButton>
          <ArrowLink onClick={() => setIsCancelModalOpen(true)} disabled={portalLoading}>
            {t("financial.cancel", "Cancelar assinatura")}
          </ArrowLink>
        </div>
      </>
    );
  }

  return (
    <BillingShell
      title={t("financial.title", "Assinatura e cobrança")}
      subtitle={t("financial.subtitle", "Gerencie seu plano, formas de pagamento e notas fiscais.")}
    >
      {error && (
        <div role="alert" className="mt-8 flex items-center gap-3 border-l-2 border-red-500 pl-4 py-1 text-[15px] text-red-700 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-2 underline underline-offset-4 cursor-pointer">Fechar</button>
        </div>
      )}

      <div className="mt-10 lg:mt-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,28.6rem)] gap-x-16 gap-y-14">
        {/* Esquerda: estado da assinatura + o que o plano inclui */}
        <div>
          {renderStatus()}

          {!loadingPlans && benefitsList.length > 0 && (
            <section className="mt-14 lg:mt-16" aria-label="O que seu plano inclui">
              <Eyebrow color={MUTED}>O que seu plano inclui</Eyebrow>
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-14">
                {benefitsList.map((b) => (
                  <li key={b} className="flex items-center gap-3.5 py-3.5" style={{ borderTop: `1px solid ${LINE_SOFT}` }}>
                    <span className="w-[9px] h-[9px] rounded-full bg-[#7F33D9] shrink-0" aria-hidden="true" />
                    <span className="text-[17px] font-medium" style={{ color: INK }}>{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Direita: resumo do plano */}
        <aside aria-label="Seu plano">
          <Eyebrow color={MUTED}>Seu plano</Eyebrow>
          {loadingPlans ? (
            <div className="mt-[22px] space-y-3 animate-pulse motion-reduce:animate-none" aria-busy="true">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded" style={{ background: LINE }} />)}
            </div>
          ) : (
            <dl className="mt-[22px]">
              <PlanRow label="Plano">{planName}</PlanRow>
              <PlanRow label="Valor" last={isFreePlan}>
                {isFreePlan || !currentPlan ? (
                  "Gratuito"
                ) : (
                  <>
                    {formatPlanPrice(currentPlan)} <span className="font-normal" style={{ color: MUTED }}>{intervalSuffix(currentPlan)}</span>
                  </>
                )}
              </PlanRow>
              {!isFreePlan && paymentMethod && (
                <PlanRow label="Forma de pagamento">
                  {CARD_BRANDS[paymentMethod.brand] || paymentMethod.brand} •••• {paymentMethod.last4}
                </PlanRow>
              )}
              {!isFreePlan && periodEnd && (
                <PlanRow label={isCanceling ? "Acesso até" : "Próxima cobrança"} last>{periodEnd}</PlanRow>
              )}
            </dl>
          )}

          {!loadingPlans && !isFreePlan && (
            <div className="mt-[26px]">
              <ArrowLink onClick={handleOpenBillingPortal} disabled={portalLoading}>
                Notas fiscais e histórico de cobranças
              </ArrowLink>
            </div>
          )}
        </aside>
      </div>

      {/* Rodapé de atalhos */}
      <div className="mt-16 lg:mt-20">
        <Hairline />
        <nav aria-label="Atalhos" className="pt-[22px] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
          <ArrowLink to="/me/plans">Comparar planos</ArrowLink>
          <span className="hidden sm:block mx-[22px]"><Dot /></span>
          <ArrowLink to="/fale-conosco">Falar com o suporte financeiro</ArrowLink>
        </nav>
      </div>

      {/* Confirmação de cancelamento (o cancelamento em si é no portal do Stripe) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => !portalLoading && setIsCancelModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[var(--dm-surface)] p-8 sm:p-10 shadow-2xl">
            {!portalLoading && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                aria-label="Fechar"
                className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:text-[#7F33D9] transition-colors"
                style={{ color: MUTED }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
            <AlertTriangle size={28} className="text-red-500" aria-hidden="true" />
            <h3 id="cancel-title" className="mt-5 text-[30px] leading-tight font-light tracking-[-0.02em]" style={{ color: INK }}>
              {t("financial.cancel_title", "Cancelar assinatura?")}
            </h3>
            <p className="mt-4 text-[17px]" style={{ color: MUTED }}>
              {t("financial.cancel_text", "Tem certeza que deseja cancelar o")} <strong style={{ color: INK }}>{planName}</strong>?{" "}
              {t("financial.cancel_lose_access", "Você perderá acesso a todos os recursos premium ao final do ciclo atual.")}
            </p>
            <p className="mt-3 flex items-start gap-2 text-sm" style={{ color: MUTED }}>
              <ExternalLink size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {t("financial.cancel_stripe_note", "Você será redirecionado para o portal seguro do Stripe para confirmar o cancelamento.")}
            </p>
            <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
              <PillButton variant="secondary" onClick={handleOpenBillingPortal} loading={portalLoading} disabled={portalLoading}>
                {portalLoading ? "Abrindo portal..." : t("financial.go_to_cancel", "Ir para o cancelamento")}
              </PillButton>
              <PillButton onClick={() => setIsCancelModalOpen(false)} disabled={portalLoading}>
                {t("financial.keep_plan", "Manter meu plano")}
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </BillingShell>
  );
}
