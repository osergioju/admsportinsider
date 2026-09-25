import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { AuthContext } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";
import { formatPlanPrice, intervalSuffix, intervalAdjective } from "../../../../utils/planBilling";
import BillingShell, { Dot, Eyebrow, INK, LINE, LINE_SOFT, MUTED, PillButton } from "../../../../components/billing/BillingShell";

// Coluna do rótulo à esquerda (mesma largura no bloco de planos e na tabela, pra alinhar)
const LABEL_COL = "lg:grid-cols-[minmax(0,20rem)_repeat(var(--cols),minmax(0,1fr))]";

// Planos guardam benefits como array (strings/objetos) ou objeto { chave: boolean }
function parseBenefits(raw) {
  if (!raw) return [];
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (Array.isArray(parsed)) return parsed;
  return Object.entries(parsed)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
}

const benefitLabel = (b) => (typeof b === "string" ? b : b.name || b.label);

export default function PlansFinancial() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Qual plan_id está em checkout (null = ocioso)
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoadingPlans(true);
        const response = await api.get("/admin/plans");
        setPlans(
          (response.data.plans || [])
            .filter((p) => p.active)
            .sort((a, b) => Number(a.price) - Number(b.price))
        );
      } catch (err) {
        console.error("Erro ao buscar planos:", err);
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();
  }, []);

  const currentPlan = plans.find((p) => p.id === user?.plan_id) || null;
  const userIsPaid = !!currentPlan && Number(currentPlan.price) > 0;

  /**
   * Dispara o checkout Stripe. Sem finally: se o redirect acontecer, a página some.
   * Em erro, reseta manualmente no catch.
   */
  async function handleSubscribe(plan_id) {
    if (!plan_id || checkoutLoading) return;

    try {
      setCheckoutLoading(plan_id);
      setCheckoutError(null);
      const response = await api.post("/stripe/create-checkout-session", { plan_id });
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      // Já tem assinatura ativa: troca de plano é no gerenciamento (portal do Stripe)
      if (err.response?.data?.code === "ALREADY_SUBSCRIBED") {
        navigate("/me/financial");
        return;
      }
      setCheckoutError("Não foi possível iniciar o checkout. Tente novamente.");
      setCheckoutLoading(null);
    }
  }

  // União de todos os benefícios de todos os planos, para a tabela comparativa
  const allFeatures = (() => {
    const seen = new Set();
    const result = [];
    for (const plan of plans) {
      for (const benefit of parseBenefits(plan.benefits)) {
        const key = benefitLabel(benefit);
        if (key && !seen.has(key)) {
          seen.add(key);
          result.push({
            name: key,
            desc: typeof benefit === "string" ? "" : benefit.desc || benefit.description || "",
          });
        }
      }
    }
    return result;
  })();

  const planHasFeature = (plan, featureName) =>
    parseBenefits(plan.benefits).some((b) => benefitLabel(b) === featureName);

  const gridVars = { "--cols": plans.length || 1 };

  return (
    <BillingShell
      title="Escolha seu plano"
      subtitle="Assinatura recorrente. Cancele quando quiser, sem multa — o acesso continua até o fim do período já pago."
      backTo="/me/financial"
      backLabel="Voltar para assinatura e cobrança"
    >
      {/* Erro de checkout */}
      {checkoutError && (
        <div role="alert" className="mt-8 flex items-center gap-3 border-l-2 border-red-500 pl-4 py-1 text-[15px] text-red-700 dark:text-red-300">
          <span>{checkoutError}</span>
          <button
            type="button"
            onClick={() => setCheckoutError(null)}
            className="ml-2 underline underline-offset-4 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* PLANOS — colunas lado a lado no desktop, empilhadas no celular */}
      <div
        className={`mt-10 lg:mt-14 grid grid-cols-1 gap-x-14 gap-y-14 ${LABEL_COL}`}
        style={gridVars}
        aria-busy={loadingPlans}
      >
        <div className="hidden lg:block" />

        {loadingPlans
          ? [1, 2].map((i) => (
              <div key={i} className="animate-pulse motion-reduce:animate-none space-y-5">
                <div className="h-4 w-24 rounded" style={{ background: LINE }} />
                <div className="h-12 w-40 rounded" style={{ background: LINE }} />
                <div className="h-14 w-56 rounded" style={{ background: LINE }} />
                <div className="h-14 w-48 rounded-full" style={{ background: LINE }} />
              </div>
            ))
          : plans.map((plan) => {
              const isCurrent = plan.id === user?.plan_id;
              const isFree = Number(plan.price) === 0;
              const isFeatured = !!plan.is_featured && !isFree;
              const isLoadingThis = checkoutLoading === plan.id;

              return (
                <section key={plan.id} aria-label={`Plano ${plan.name}`} className="flex flex-col items-start">
                  {/* Etiqueta: plano atual / recomendado (espaço reservado mantém as colunas alinhadas) */}
                  <span className="h-4 flex items-center gap-2.5">
                    {(isCurrent || isFeatured) && (
                      <>
                        <span className="w-[9px] h-[9px] rounded-full bg-[#7F33D9] shrink-0" aria-hidden="true" />
                        <Eyebrow className="tracking-[0.24em]">{isCurrent ? "Seu plano atual" : "Recomendado"}</Eyebrow>
                      </>
                    )}
                  </span>

                  <h2 className="mt-[22px] text-[40px] xl:text-[50px] leading-none font-light tracking-[-0.03em]" style={{ color: INK }}>
                    {plan.name}
                  </h2>
                  <p className="mt-3.5 text-base" style={{ color: MUTED }}>
                    {plan.description || (isFree ? "Para quem usa de forma casual" : "Plano completo")}
                  </p>

                  <div className="mt-8 flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-[40px] xl:text-[56px] leading-none font-light tracking-[-0.03em]" style={{ color: INK }}>
                      {isFree ? "Gratuito" : formatPlanPrice(plan)}
                    </span>
                    {!isFree && (
                      <span className="text-xl font-medium" style={{ color: MUTED }}>{intervalSuffix(plan)}</span>
                    )}
                  </div>
                  <p className="mt-3.5 text-[15px]" style={{ color: MUTED }}>
                    {isFree ? "Sem cobrança" : `Cobrança ${intervalAdjective(plan)} · cancele quando quiser`}
                  </p>

                  <div className="mt-8">
                    {isCurrent && !isFree ? (
                      <PillButton onClick={() => navigate("/me/financial")}>Gerenciar assinatura</PillButton>
                    ) : isFree ? (
                      <PillButton variant="secondary" onClick={() => navigate("/dashboard")}>
                        Continuar no plano gratuito
                      </PillButton>
                    ) : userIsPaid ? (
                      <PillButton onClick={() => navigate("/me/financial")}>Mudar para {plan.name}</PillButton>
                    ) : (
                      <PillButton
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={!!checkoutLoading}
                        loading={isLoadingThis}
                      >
                        {isLoadingThis ? "Abrindo pagamento seguro..." : `Assinar ${plan.name}`}
                      </PillButton>
                    )}
                  </div>
                </section>
              );
            })}
      </div>

      {/* COMPARATIVO — tabela com linhas finas; rola na horizontal no celular */}
      {!loadingPlans && allFeatures.length > 0 && (
        <section className="mt-16 lg:mt-20" aria-label="Comparação de recursos por plano">
          <div className="relative overflow-x-auto overflow-y-hidden" tabIndex={0} role="region" aria-label="Tabela comparativa de planos, role para o lado no celular">
            <table className="w-full border-collapse table-fixed min-w-[560px]">
              <caption className="sr-only">Recursos incluídos em cada plano</caption>
              <colgroup>
                <col className="w-[11rem] lg:w-[20rem]" />
                {plans.map((p) => <col key={p.id} />)}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className="pb-4 text-left text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: MUTED, borderBottom: `1px solid ${LINE}` }}>
                    Recurso
                  </th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      scope="col"
                      className="pb-4 pl-8 lg:pl-14 text-left text-[11px] font-bold uppercase tracking-[0.24em]"
                      style={{ color: p.id === user?.plan_id ? "var(--dm-brand, #7F33D9)" : MUTED, borderBottom: `1px solid ${LINE}` }}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature) => (
                  <tr key={feature.name}>
                    <th scope="row" className="py-5 text-left align-top" style={{ borderBottom: `1px solid ${LINE_SOFT}` }}>
                      <span className="block text-[17px] font-medium" style={{ color: INK }}>{feature.name}</span>
                      {feature.desc && <span className="block text-sm font-normal mt-1" style={{ color: MUTED }}>{feature.desc}</span>}
                    </th>
                    {plans.map((p) => {
                      const has = planHasFeature(p, feature.name);
                      return (
                        <td
                          key={p.id}
                          aria-label={`${has ? "Incluído" : "Não incluído"} no ${p.name}`}
                          className="py-5 pl-8 lg:pl-14"
                          style={{ borderBottom: `1px solid ${LINE_SOFT}` }}
                        >
                          {has ? (
                            <Check size={20} strokeWidth={2.4} className="text-[#7F33D9]" aria-hidden="true" />
                          ) : (
                            <span className="inline-block w-4 h-0.5 align-middle" style={{ background: "rgba(60,24,103,0.3)" }} aria-hidden="true" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Rodapé de confiança */}
      <ul
        className="mt-14 pt-[22px] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 text-[15px]"
        style={{ borderTop: `1px solid ${LINE}`, color: MUTED }}
      >
        <li>Pagamento processado pelo Stripe</li>
        <li className="hidden sm:block mx-[22px]"><Dot /></li>
        <li>Cancele quando quiser, sem multa</li>
        <li className="hidden sm:block mx-[22px]"><Dot /></li>
        <li>Não guardamos os dados do seu cartão</li>
      </ul>
    </BillingShell>
  );
}
