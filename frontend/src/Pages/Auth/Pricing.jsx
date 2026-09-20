import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import SportinsiderIcon from "../../assets/svg/brand-white.svg"
import IconInsider from "../../assets/svg/brand-icon.svg";
import SubmitButtonMini from "../../components/uxui/SubmitButtonMini";
import { CircleCheck, Check, AlertCircle, X, Loader2 } from "lucide-react";

// Planos podem guardar benefits como array de strings/objetos ou como objeto { chave: boolean }
function parseBenefits(raw) {
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.filter((b) => typeof b === "string" || typeof b === "object");
    return Object.entries(parsed)
        .filter(([, value]) => value === true)
        .map(([key]) => key);
}

function featureKey(benefit) {
    return typeof benefit === "string" ? benefit : benefit.name || benefit.label;
}

export default function Pricing() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);

    const isPaid = user?.plan_id !== 1;

    useEffect(() => {
        async function fetchPlans() {
            try {
                setLoadingPlans(true);
                const response = await api.get("/admin/plans");
                const active = (response.data.plans || [])
                    .filter((p) => p.active)
                    .sort((a, b) => Number(a.price) - Number(b.price));
                setPlans(active);
            } catch (err) {
                console.error("Erro ao buscar planos:", err);
            } finally {
                setLoadingPlans(false);
            }
        }
        fetchPlans();
    }, []);

    // União de todos os benefícios de todos os planos, pra montar a tabela comparativa
    const allFeatures = (() => {
        const seen = new Set();
        const result = [];
        for (const plan of plans) {
            for (const benefit of parseBenefits(plan.benefits)) {
                const key = featureKey(benefit);
                if (key && !seen.has(key)) {
                    seen.add(key);
                    result.push(key);
                }
            }
        }
        return result;
    })();

    function planHasFeature(plan, featureName) {
        return parseBenefits(plan.benefits).some((b) => featureKey(b) === featureName);
    }

    async function handleSubscribe(plan) {
        const isFree = Number(plan.price) === 0;

        if (!user) {
            navigate(isFree ? "/register" : "/login");
            return;
        }

        if (isFree) {
            navigate("/dashboard");
            return;
        }

        if (isPaid) {
            navigate("/me/profile");
            return;
        }

        try {
            setCheckoutError(null);
            setLoadingPlan(plan.id);

            const response = await api.post("/stripe/create-checkout-session", {
                plan_id: plan.id
            });

            window.location.href = response.data.url;
        } catch (err) {
            console.error("Checkout error:", err);
            setCheckoutError("Não foi possível iniciar o checkout. Tente novamente em instantes.");
            setLoadingPlan(null);
        }
    }

    return (
        <div className="bg-[#0C0718] w-full">
            <div className="w-full flex justify-center pt-8 px-4 sm:px-6 lg:px-8 z-20">
                <div className="w-full max-w-[1740px] h-[68px] rounded-full flex justify-between items-center px-4 lg:px-12 backdrop-blur-md border border-white/10 bg-gradient-to-l from-[#1C142F] via-[#3D315D] to-[#c53ed40] to-transparent">
                    <div className="flex items-center gap-3">
                        <Link to="/">
                            <img
                                src={SportinsiderIcon}
                                alt="Logo Sportinsider"
                                className="w-36 lg:w-44 xl:w-50 h-auto"
                            />
                        </Link>
                    </div>
                    <div className="lg:flex absolute left-1/2 -translate-x-1/2 gap-10 text-[#C2B3E0] font-light">
                        <Link to="/dados"><div className="cursor-pointer hover:text-white transition-colors">METODOLOGIA</div></Link>
                        <Link to="/pricing"><div className="cursor-pointer hover:text-white transition-colors">PLANOS</div></Link>
                        <Link to="/dashboard-public"><div className="cursor-pointer hover:text-white transition-colors">TESTE GRÁTIS</div></Link>
                        <Link to="/register"><div className="cursor-pointer hover:text-white transition-colors">COMEÇAR AGORA</div></Link>
                    </div>
                    <div className="flex items-center text-sm text-gray-300 bg-[#0C0718] px-8 py-3 rounded-full border border-white/10 shadow-lg">
                        <span className="mr-1 hidden sm:inline font-light">Já tem uma conta?</span>
                        <Link to="/login" className="text-[#9F50FF] hover:text-[#B475FF] font-medium transition-colors underline decoration-[#9F50FF] underline-offset-4 hover:decoration-[#B475FF]">
                            Login aqui
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6">
                <div className="text-center pt-10 lg:pt-16 relative">
                    <div className="pointer-events-none opacity-30 -translate-y-1/2 absolute mx-auto left-0 right-0 top-0 xl:w-180 xl:h-180 xl:blur-4xl blur-3xl lg:w-120 lg:h-120 w-100 h-100 bg-[radial-gradient(50%_50%_at_50%_50%,_#7E34D9_0%,_rgba(126,52,217,0)_89%)] rounded-full"></div>
                    <h1 className="relative mb-6 bg-linear-to-r from-[#FFFFFF] to-[#ffffff0] bg-clip-text text-4xl text-transparent">
                        Planos e preços
                    </h1>
                    <p className="relative text-[#C2B3E0] font-light">
                        Cobrança mensal recorrente. Cancele quando quiser, sem multa.
                    </p>
                </div>

                {checkoutError && (
                    <div className="max-w-xl mx-auto mt-8 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{checkoutError}</span>
                        <button onClick={() => setCheckoutError(null)} className="ml-auto text-red-300/70 hover:text-red-200">
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 lg:mt-20">
                    {loadingPlans ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="rounded-3xl bg plan_box relative overflow-hidden animate-pulse">
                                <div className="p-10 lg:p-12">
                                    <div className="w-12 h-12 rounded bg-white/10 mb-4" />
                                    <div className="h-6 w-24 bg-white/10 rounded mb-2" />
                                    <div className="h-4 w-40 bg-white/10 rounded mb-10" />
                                    <div className="h-10 w-32 bg-white/10 rounded mb-10" />
                                    <div className="h-12 w-full bg-white/10 rounded-full" />
                                </div>
                            </div>
                        ))
                    ) : (
                        plans.map((plan) => {
                            const isFree = Number(plan.price) === 0;
                            const isCurrent = plan.id === user?.plan_id;
                            const isLoadingThis = loadingPlan === plan.id;
                            const benefits = parseBenefits(plan.benefits);

                            return (
                                <div key={plan.id} className="rounded-3xl bg plan_box relative overflow-hidden">
                                    <div className="p-10 lg:p-12 relative">
                                        <img src={IconInsider} alt="" className="w-12 h-auto grayscale brightness-400" />
                                        <div className="text-left text-white mt-4">
                                            <h2 className="text-xl lg:text-2xl xl:text-3xl mb-1">{plan.name}</h2>
                                            <p className="mb-10 font-light lg:text-lg">
                                                {plan.description || (isFree ? "Para quem usa de forma casual" : "Plano completo")}
                                            </p>
                                            <p className="font-[100] text-4xl text-[#ffffff38] lg:text-6xl xl:text-7xl mb-10">
                                                R$ <span className="text-white font-medium">
                                                    {Number(plan.price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                {!isFree && <span className="text-base text-[#ffffff60] font-light">/mês</span>}
                                            </p>
                                        </div>
                                        <SubmitButtonMini
                                            onClick={() => handleSubscribe(plan)}
                                            disabled={isLoadingThis || isCurrent}
                                            text={
                                                isCurrent
                                                    ? "Plano atual"
                                                    : isLoadingThis
                                                        ? "Aguarde..."
                                                        : isFree
                                                            ? "Acessar"
                                                            : "Contratar plano"
                                            }
                                        ></SubmitButtonMini>
                                        <div className="my-5 lg:my-10 w-full border border-[#ffffff38]"></div>
                                        <p className="mb-2 lg:mb-5 text-white font-medium text-base lg:text-lg">Você recebe</p>
                                        <ul>
                                            {benefits.length > 0 ? (
                                                benefits.map((b, i) => (
                                                    <li key={i} className="flex items-center gap-2 mb-3 text-white">
                                                        <CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> {featureKey(b)}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="flex items-center gap-2 mb-3 text-white">
                                                    <CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Acesso à plataforma
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {!loadingPlans && allFeatures.length > 0 && (
                    <div className="w-full mt-10 lg:mt-20">
                        <div className="overflow-hidden rounded-xl border border-white/20">
                            <table className="w-full border-collapse bg-transparent text-white">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="p-4 text-left">
                                            <img src={IconInsider} alt="" className="w-12 h-auto grayscale brightness-400" />
                                        </th>
                                        {plans.map((p) => (
                                            <th key={p.id} className="border-l border-white/20 p-4 text-center">
                                                <p className="font-[400] flex items-center justify-between">
                                                    <span>{p.name}</span>
                                                    <span>R$ {Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </p>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allFeatures.map((feature, fIdx) => (
                                        <tr key={fIdx} className="border-b border-white/10 last:border-b-0">
                                            <td className="p-4 text-left">
                                                <p className="text-base p-2 inline-block">{feature}</p>
                                            </td>
                                            {plans.map((p) => (
                                                <td key={p.id} className="border-l border-white/20 p-4 text-center">
                                                    {planHasFeature(p, feature) ? (
                                                        <Check size={20} className="mx-auto text-white" />
                                                    ) : (
                                                        <span className="block w-4 h-0.5 mx-auto bg-white/20 rounded" />
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {isPaid && (
                <p className="text-center text-sm text-gray-500 mt-8 pb-8">
                    Você já tem uma assinatura.{" "}
                    <button
                        onClick={() => navigate("/me/profile")}
                        className="underline"
                    >
                        Gerenciar assinatura
                    </button>
                </p>
            )}
        </div>
    );
}
