import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  CircleCheck,
  ShieldCheck,
  Loader2,
  Zap,
  X,
  AlertCircle,
  Check
} from "lucide-react";
import IconInsider from "../../../../assets/svg/brand-icon.svg";
import { AuthContext } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";

export default function PlansFinancial() {
  const { user } = useContext(AuthContext);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Rastreia qual plan_id está em checkout (null = idle)
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoadingPlans(true);
        const response = await api.get("/admin/plans");
        setPlans(response.data.plans?.filter((p) => p.active) || []);
      } catch (err) {
        console.error("Erro ao buscar planos:", err);
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();
  }, []);

  // Plano atual do usuário
  const isCurrentPlan = (plan) => plan.id === user?.plan_id;

  /**
   * Dispara o checkout Stripe.
   * Sem finally — se o redirect acontecer, a página some.
   * Se der erro, reseta manualmente no catch.
   */
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

  // Coleta todos os benefits únicos de todos os planos para montar a tabela
  function parseBenefits(raw) {
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed;
    return Object.values(parsed);
  }

  // Monta lista única de features para a tabela (união de todos os planos)
  const allFeatures = (() => {
    const seen = new Set();
    const result = [];
    for (const plan of plans) {
      for (const benefit of parseBenefits(plan.benefits)) {
        const key = typeof benefit === "string" ? benefit : benefit.name || benefit.label;
        if (key && !seen.has(key)) {
          seen.add(key);
          result.push(
            typeof benefit === "string"
              ? { name: benefit, desc: "" }
              : { name: benefit.name || benefit.label, desc: benefit.desc || benefit.description || "" }
          );
        }
      }
    }
    return result;
  })();

  // Verifica se um plano tem determinado feature
  function planHasFeature(plan, featureName) {
    return parseBenefits(plan.benefits).some((b) => {
      const key = typeof b === "string" ? b : b.name || b.label;
      return key === featureName;
    });
  }

  // Skeleton para loading
  const PlanSkeleton = () => (
    <div className="rounded-[2.5rem] bg-white border border-gray-200/60 flex flex-col p-8 animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-gray-100 mb-5" />
      <div className="h-5 w-24 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-32 bg-gray-100 rounded mb-8" />
      <div className="h-10 w-36 bg-gray-100 rounded mb-8" />
      <div className="h-10 w-full bg-gray-100 rounded-xl mb-8" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-10 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="flex items-center gap-6 mb-16">
        <Link
          to="/me/financial"
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm group shrink-0"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Planos e preços</h1>
          <p className="text-gray-400 text-[10px] font-bold mt-0.5">Gestão de assinatura</p>
        </div>
      </div>

      {/* Erro de checkout */}
      {checkoutError && (
        <div className="flex items-center gap-3 p-4 mb-8 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{checkoutError}</span>
          <button
            onClick={() => setCheckoutError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-28">
        {loadingPlans
          ? [1, 2, 3].map((i) => <PlanSkeleton key={i} />)
          : plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan);
              const isFree = Number(plan.price) === 0;
              const isLoadingThis = checkoutLoading === plan.id;
              const benefits = parseBenefits(plan.benefits);

              return (
                <div
                  key={plan.id}
                  className={`group rounded-[2.5rem] bg-white flex flex-col p-8 transition-all duration-500 relative
                    ${isCurrent
                      ? "border-2 border-[#7F33D9] shadow-[0_8px_30px_rgba(127,51,217,0.12)] -translate-y-1"
                      : "border border-gray-200/60 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:border-purple-200"
                    }`}
                >
                  {/* Badge plano atual */}
                  {isCurrent && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-[#7F33D9] text-white text-[10px] font-bold shadow-md whitespace-nowrap">
                        Seu plano atual
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-[#F5F3FF] flex items-center justify-center mb-5">
                      <img src={IconInsider} alt="Logo" className="w-6 h-auto" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">{plan.name}</h2>
                    <p className="text-gray-400 text-[10px] font-semibold">
                      {/* Usa description do banco se existir, senão fallback */}
                      {plan.description || (isFree ? "Para quem usa de forma casual" : "Plano completo")}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-gray-300 font-bold text-lg">R$</span>
                    <span className="text-4xl font-bold text-gray-900 tracking-tight">
                      {Number(plan.price).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Botão */}
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 mb-8 cursor-not-allowed"
                    >
                      Plano atual
                    </button>
                  ) : isFree ? (
                    <Link
                      to="/me/financial"
                      className="w-full py-3 rounded-xl bg-[#7F33D9] text-white font-semibold text-sm transition-all hover:bg-[#6025A8] active:scale-[0.98] flex items-center justify-center gap-2 mb-8"
                    >
                      Acessar <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!!checkoutLoading}
                      className="w-full py-3 rounded-xl bg-[#7F33D9] text-white font-semibold text-sm transition-all hover:bg-[#6025A8] active:scale-[0.98] flex items-center justify-center gap-2 mb-8 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoadingThis ? (
                        <><Loader2 size={14} className="animate-spin" /> Aguarde...</>
                      ) : (
                        <><Zap size={14} /> Contratar plano</>
                      )}
                    </button>
                  )}

                  {/* Benefícios do card */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-gray-400 border-b border-gray-50 pb-2">
                      Principais recursos
                    </p>
                    <ul className="space-y-3">
                      {benefits.slice(0, 3).map((b, i) => {
                        const label = typeof b === "string" ? b : b.name || b.label;
                        return (
                          <li key={i} className="flex items-center gap-3 text-xs font-medium text-gray-500">
                            <CircleCheck size={14} className="text-[#7F33D9]/70 shrink-0" />
                            {label}
                          </li>
                        );
                      })}
                      {benefits.length === 0 && (
                        <li className="flex items-center gap-3 text-xs font-medium text-gray-400">
                          <CircleCheck size={14} className="text-[#7F33D9]/70 shrink-0" />
                          Acesso básico à plataforma
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
      </div>

      {/* TABELA COMPARATIVA */}
      {!loadingPlans && allFeatures.length > 0 && (
        <div className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-gray-200/50 shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/40">
                    <th className="py-6 px-10">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <img src={IconInsider} alt="Logo" className="w-4 h-auto opacity-80" />
                      </div>
                    </th>
                    {plans.map((p) => (
                      <th key={p.id} className="py-6 px-4 text-center">
                        <span className={`text-[10px] font-bold ${isCurrentPlan(p) ? "text-[#7F33D9]" : "text-[#6025A8]"}`}>
                          {p.name}
                        </span>
                        {isCurrentPlan(p) && (
                          <div className="text-[8px] text-[#7F33D9]/60 font-bold mt-0.5">atual</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allFeatures.map((feature, fIdx) => (
                    <tr key={fIdx} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-10">
                        <p className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                          {feature.name}
                        </p>
                        {feature.desc && (
                          <p className="text-[10px] text-gray-400 font-normal mt-0.5">{feature.desc}</p>
                        )}
                      </td>
                      {plans.map((p) => (
                        <td key={p.id} className="py-5 px-4 text-center">
                          <div className="flex justify-center">
                            {planHasFeature(p, feature.name) ? (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110">
                                <Check size={14} className="text-[#7F33D9]" strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-7 h-7 flex items-center justify-center">
                                <div className="w-1.5 h-0.5 bg-gray-200 rounded" />
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-20 flex flex-col items-center opacity-20">
        <ShieldCheck size={20} className="text-gray-400 mb-2" />
        <span className="text-[8px] font-bold text-gray-500">Secure ssl payment system</span>
      </div>
    </div>
  );
}