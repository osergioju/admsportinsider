import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../context/TranslationContext";
import {
  CheckCircle2, Clock, AlertCircle, Zap, Shield,
  MessageCircle, ArrowRight, X, AlertTriangle, Loader2,
  Star, Package, ExternalLink, CalendarX2
} from "lucide-react";
import { AuthContext } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";

export default function SubscriptionManagement() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

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

  // Cancelamento agendado — vem direto do user (SELECT u.* no /auth/me)
  const isCanceling = user?.cancel_at_period_end === true;
  const expiresAt = user?.subscription_current_period_end
    ? new Date(user.subscription_current_period_end).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : null;

  const benefits = currentPlan?.benefits
    ? typeof currentPlan.benefits === "string"
      ? JSON.parse(currentPlan.benefits)
      : currentPlan.benefits
    : [];
  const benefitsList = Array.isArray(benefits) ? benefits : Object.values(benefits);

  const upgradePlan = plans.find((p) => Number(p.price) > 0 && p.active);

  async function handleSubscribe(plan_id) {
    if (!plan_id || checkoutLoading) return;
    try {
      setCheckoutLoading(plan_id);
      setCheckoutError(null);
      const response = await api.post("/stripe/create-checkout-session", {
        userId: user.id,
        plan_id,
      });
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError("Não foi possível iniciar o checkout. Tente novamente.");
      setCheckoutLoading(null);
    }
  }

  async function handleOpenBillingPortal() {
    try {
      setPortalLoading(true);
      setCheckoutError(null);
      const response = await api.post("/stripe/billing/portal");
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Billing portal error:", err);
      setCheckoutError("Não foi possível abrir o portal. Tente novamente.");
      setPortalLoading(false);
    }
  }

  function UpgradeButton({ plan_id, label = "Fazer Upgrade", size = "md", className = "" }) {
    const isThisLoading = checkoutLoading === plan_id;
    const iconSize = size === "sm" ? 13 : 16;
    const baseClass =
      size === "sm"
        ? "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl"
        : "px-6 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2";

    return (
      <button
        onClick={() => handleSubscribe(plan_id)}
        disabled={!!checkoutLoading || portalLoading}
        className={`${baseClass} bg-[#7F33D9] text-white hover:bg-[#6025A8] hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isThisLoading
          ? <Loader2 size={iconSize} className="animate-spin" />
          : <Zap size={iconSize} />
        }
        {isThisLoading ? "Aguarde..." : label}
      </button>
    );
  }

  const StatusBadge = ({ status }) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      free: "bg-gray-100 text-gray-600 border-gray-200",
      canceling: "bg-amber-50 text-amber-700 border-amber-200",
      canceled: "bg-red-50 text-red-600 border-red-100",
    };
    const labels = {
      active: t("financial.status_active", "Ativo"),
      free: t("financial.status_free", "Gratuito"),
      canceling: t("financial.status_cancel_sched", "Cancelamento agendado"),
      canceled: t("financial.status_cancelled", "Cancelado"),
    };
    const icons = {
      active: <CheckCircle2 size={12} />,
      free: <Package size={12} />,
      canceling: <CalendarX2 size={12} />,
      canceled: <AlertCircle size={12} />,
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 w-fit ${styles[status] || styles.free}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  // Resolve o status do badge do plano atual
  const planStatus = isFreePlan ? "free" : isCanceling ? "canceling" : "active";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            {t("financial.title", "Assinatura e Cobrança")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("financial.subtitle", "Gerencie seu plano, métodos de pagamento e notas fiscais.")}
          </p>
        </div>

        {!loadingPlans && upgradePlan && !isCanceling && (
          <UpgradeButton
            plan_id={isFreePlan ? upgradePlan.id : currentPlan?.id}
            label={isFreePlan ? t("financial.upgrade", "Fazer Upgrade") : t("financial.change_plan", "Mudar Plano")}
          />
        )}

        {/* Se está cancelando, o botão do header vira "Reativar" via portal */}
        {!loadingPlans && isCanceling && (
          <button
            onClick={handleOpenBillingPortal}
            disabled={portalLoading}
            className="px-6 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 flex items-center gap-2 disabled:opacity-60"
          >
            {portalLoading
              ? <Loader2 size={16} className="animate-spin" />
              : <Zap size={16} />
            }
            {portalLoading ? "Aguarde..." : t("financial.reactivate", "Reativar assinatura")}
          </button>
        )}
      </div>

      {/* Banner de erro global */}
      {checkoutError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{checkoutError}</span>
          <button onClick={() => setCheckoutError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Banner de cancelamento agendado */}
      {isCanceling && expiresAt && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
          <CalendarX2 size={18} className="shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-bold">{t("financial.cancel_scheduled_banner", "Cancelamento agendado")}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {t("financial.cancel_banner_body", "Seu acesso ao {plan} será encerrado em {date}. Até lá, todos os recursos continuam disponíveis.")
                .replace("{plan}", currentPlan?.name || "")
                .replace("{date}", expiresAt || "")}
            </p>
          </div>
          <button
            onClick={handleOpenBillingPortal}
            disabled={portalLoading}
            className="shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {portalLoading ? "Aguarde..." : t("financial.reactivate", "Reativar")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-2 space-y-6">

          {loadingPlans ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm flex items-center justify-center min-h-[220px]">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-sm">{t("financial.loading", "Carregando seu plano...")}</span>
              </div>
            </div>
          ) : (
            <div className={`bg-white rounded-3xl border p-8 shadow-sm relative overflow-hidden group transition-all ${isCanceling ? "border-amber-200" : "border-gray-200"
              }`}>
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50 ${isCanceling ? "bg-amber-50" : "bg-purple-50"
                }`} />

              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentPlan?.name || t("financial.free_plan", "Plano Gratuito")}
                    </h2>
                    <StatusBadge status={planStatus} />
                  </div>

                  <div className="flex items-baseline gap-1 mb-4">
                    {isFreePlan ? (
                      <span className="text-3xl font-bold text-gray-700">{t("financial.free", "Grátis")}</span>
                    ) : (
                      <>
                        <span className={`text-3xl font-bold ${isCanceling ? "text-amber-600" : "text-[#7F33D9]"}`}>
                          {Number(currentPlan?.price).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        <span className="text-gray-500 text-sm">{t("financial.per_month", "/mês")}</span>
                      </>
                    )}
                  </div>

                  <p className="text-gray-500 text-sm mb-2 flex items-center gap-2">
                    {isFreePlan ? (
                      <><Star size={16} /> {t("financial.upgrade_premium", "Faça upgrade para desbloquear recursos premium")}</>
                    ) : isCanceling && expiresAt ? (
                      <><CalendarX2 size={16} className="text-amber-500" /> {t("financial.access_until", "Acesso garantido até")} <span className="font-semibold text-amber-700">{expiresAt}</span></>
                    ) : (
                      <><Clock size={16} /> {t("financial.subscription_via", "Assinatura ativa via")} <span className="font-semibold text-gray-700">Stripe</span></>
                    )}
                  </p>
                </div>

                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isCanceling ? "bg-amber-50 text-amber-500" : "bg-[#7F33D9]/10 text-[#7F33D9]"
                  }`}>
                  <Shield size={32} />
                </div>
              </div>

              {benefitsList.length > 0 && (
                <div className="pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {benefitsList.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCanceling ? "bg-amber-400" : "bg-[#7F33D9]"}`} />
                      {typeof benefit === "string"
                        ? benefit
                        : benefit.label || benefit.name || JSON.stringify(benefit)}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex items-center gap-3">
                {isFreePlan ? (
                  <button
                    onClick={() => handleSubscribe(upgradePlan?.id)}
                    disabled={!!checkoutLoading || portalLoading}
                    className="text-sm font-semibold text-[#7F33D9] hover:text-[#6025A8] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {checkoutLoading === upgradePlan?.id && <Loader2 size={14} className="animate-spin" />}
                    {t("financial.see_plans", "Ver planos disponíveis")}
                  </button>
                ) : isCanceling ? (
                  // Se está cancelando, só oferece reativação
                  <button
                    onClick={handleOpenBillingPortal}
                    disabled={portalLoading || !!checkoutLoading}
                    className="text-sm font-semibold text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {portalLoading && <Loader2 size={14} className="animate-spin" />}
                    {t("financial.reactivate", "Reativar assinatura")}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSubscribe(currentPlan?.id)}
                      disabled={!!checkoutLoading || portalLoading}
                      className="text-sm font-semibold text-[#7F33D9] hover:text-[#6025A8] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {checkoutLoading === currentPlan?.id && <Loader2 size={14} className="animate-spin" />}
                      {t("financial.alter_plan", "Alterar Plano")}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      disabled={portalLoading || !!checkoutLoading}
                      className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {t("financial.cancel", "Cancelar Assinatura")}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">

          <div
            onClick={() => navigate("/fale-conosco")}
            className="bg-gradient-to-br from-[#7F33D9] to-[#6025A8] rounded-3xl p-5 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] -mr-10 -mt-10 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0  group-hover:bg-white/30 transition-colors border border-white/10">
                <MessageCircle size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-white mb-0.5">{t("financial.support_title", "Suporte Financeiro")}</h3>
                <p className="text-purple-100 text-[11px] mb-1.5 leading-tight opacity-90">
                  {t("financial.support_subtitle", "Dúvidas sobre faturas ou mudança de plano?")}
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-white group-hover:gap-2 transition-all">
                  {t("financial.contact_support", "Falar com suporte")} <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </div>

          {!loadingPlans && !isFreePlan && currentPlan && (
            <div className={`bg-white rounded-3xl border p-6 shadow-sm ${isCanceling ? "border-amber-200" : "border-gray-200"}`}>
              <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Package size={16} className="text-gray-400" /> {t("financial.my_plan", "Seu Plano")}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t("ui.plan", "Plano")}</span>
                  <span className="font-bold text-gray-900">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t("ui.value", "Valor")}</span>
                  <span className={`font-bold ${isCanceling ? "text-amber-600" : "text-[#7F33D9]"}`}>
                    {Number(currentPlan.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                    <span className="text-gray-400 font-normal">{t("financial.per_month", "/mês")}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t("ui.status", "Status")}</span>
                  <StatusBadge status={planStatus} />
                </div>
                {isCanceling && expiresAt && (
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-amber-100">
                    <span className="text-gray-500">{t("financial.expires_on", "Expira em")}</span>
                    <span className="font-bold text-amber-700">{expiresAt}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loadingPlans && isFreePlan && upgradePlan && (
            <div className="bg-white rounded-3xl border border-dashed border-[#7F33D9]/30 p-6 shadow-sm text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#7F33D9]/10 flex items-center justify-center mx-auto mb-4">
                <Star size={22} className="text-[#7F33D9]" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{t("financial.unlock_premium", "Desbloqueie o Premium")}</h3>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                {t("financial.premium_subtitle", "Acesse recursos avançados e suporte prioritário.")}
              </p>
              <UpgradeButton plan_id={upgradePlan.id} label="Ver Planos" size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* MODAL CANCELAMENTO */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/40 "
            onClick={() => !portalLoading && setIsCancelModalOpen(false)}
          />

          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t("financial.cancel_title", "Cancelar Assinatura?")}
              </h3>
              <p className="text-gray-500 text-sm mb-2 leading-relaxed">
                {t("financial.cancel_text", "Tem certeza que deseja cancelar o")} <strong>{currentPlan?.name}</strong>?
              </p>
              <p className="text-gray-400 text-xs mb-2 leading-relaxed">
                {t("financial.cancel_lose_access", "Você perderá acesso a todos os recursos premium ao final do ciclo atual.")}
              </p>

              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl mb-8 text-left">
                <ExternalLink size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {t("financial.cancel_stripe_note", "Você será redirecionado para o portal seguro do Stripe para confirmar o cancelamento.")}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={portalLoading}
                  className="w-full py-3.5 rounded-xl bg-[#111] text-white font-bold text-sm hover:bg-[#333] transition-all disabled:opacity-50"
                >
                  {t("financial.keep_plan", "Não, manter meu plano")}
                </button>
                <button
                  onClick={handleOpenBillingPortal}
                  disabled={portalLoading}
                  className="w-full py-3.5 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {portalLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Abrindo portal...</>
                  ) : (
                    <><ExternalLink size={15} /> {t("financial.go_to_cancel", "Ir para o portal de cancelamento")}</>
                  )}
                </button>
              </div>
            </div>

            {!portalLoading && (
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}