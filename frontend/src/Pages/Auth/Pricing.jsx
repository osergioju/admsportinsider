import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import SportinsiderIcon from "../../assets/img/sportinsider-logo.png";
import IconInsider from "../../assets/svg/brand-icon.svg"; 
import SubmitButtonMini from "../../components/uxui/SubmitButtonMini";
import { CircleCheck, Check } from "lucide-react";

export default function Pricing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);


  const isPaid = user.plan_id !== 1;


  async function handleSubscribe(plan_id) {
    if (!user) {
      navigate("/login");
      return;
    }

    if (isPaid) {
      navigate("/me/profile");
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
    <div className="bg-[#0C0718] w-full">
        <div className="w-full flex justify-center pt-8 px-4 sm:px-6 lg:px-8 z-20">
            <div className="w-full max-w-[1740px] h-[68px] rounded-full flex justify-between items-center px-4 lg:px-12 backdrop-blur-md border border-white/10 bg-gradient-to-l from-[#1C142F] via-[#3D315D] to-[#c53ed40] to-transparent">
                <div className="flex items-center gap-3">
                    <img 
                        src={SportinsiderIcon} 
                        alt="Logo Sportinsider" 
                        className="w-36 h-auto" 
                    />
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
                <div className="opacity-30 -translate-y-1/2 absolute mx-auto left-0 right-0 top-0 xl:w-180 xl:h-180 xl:blur-4xl blur-3xl lg:w-120 lg:h-120 w-100 h-100 bg-[radial-gradient(50%_50%_at_50%_50%,_#7E34D9_0%,_rgba(126,52,217,0)_89%)] rounded-full"></div>
                <h1 className="relative mb-6 bg-linear-to-r from-[#FFFFFF] to-[#ffffff0] bg-clip-text text-4xl text-transparent">
                    Planos e preços
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 lg:mt-20">
                    
                {/* FREE */}
                <div className="rounded-3xl bg plan_box relative overflow-hidden">
                    <div className="p-10 lg:p-12 relative">
                        <img src={IconInsider} alt=""  className="w-12 h-auto grayscale brightness-400"/>
                        <div className="text-left text-white mt-4">
                            <h2 className="text-xl lg:text-2xl xl:text-3xl mb-1">Básico</h2>
                            <p className="mb-10 font-light lg:text-lg">Para quem usa de forma casual</p>
                            <p className="font-[100] text-4xl text-[#ffffff38] lg:text-6xl xl:text-7xl mb-10">R$ <span className="text-white font-medium">0,00</span></p>
                        </div>
                        <SubmitButtonMini 
                            onClick={() => handleSubscribe(1)}
                            disabled={loadingPlan === 1}
                            text="Acessar"></SubmitButtonMini>
                        <div className="my-5 lg:my-10 w-full border border-[#ffffff38]"></div>
                        <p className="mb-2 lg:mb-5 text-white font-medium text-base lg:text-lg">Você recebe</p>
                        <ul>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="opacity-10 flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="opacity-10 flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="opacity-10 flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                        </ul>
                    </div>
                </div>

                <div className="rounded-3xl bg plan_box relative overflow-hidden">
                    <div className="p-10 lg:p-12 relative">
                        <img src={IconInsider} alt=""  className="w-12 h-auto grayscale brightness-400"/>
                        <div className="text-left text-white mt-4">
                            <h2 className="text-xl lg:text-2xl xl:text-3xl mb-1">Premium</h2>
                            <p className="mb-10 font-light lg:text-lg">Para quem trabalha com o futebol</p>
                            <p className="font-[100] text-4xl text-[#ffffff38] lg:text-6xl xl:text-7xl mb-10">R$ <span className="text-white font-medium">49,90</span></p>
                        </div>
                        <SubmitButtonMini 
                            onClick={() => handleSubscribe(2)}
                            disabled={loadingPlan === 2}
                            text="Contratar plano"></SubmitButtonMini>
                        <div className="my-5 lg:my-10 w-full border border-[#ffffff38]"></div>
                        <p className="mb-2 lg:mb-5 text-white font-medium text-base lg:text-lg">Você recebe</p>
                        <ul>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="opacity-10 flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="opacity-10 flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                        </ul>
                    </div>
                </div>

                <div className="rounded-3xl bg plan_box relative overflow-hidden">
                    <div className="p-10 lg:p-12 relative">
                        <img src={IconInsider} alt=""  className="w-12 h-auto grayscale brightness-400"/>
                        <div className="text-left text-white mt-4">
                            <h2 className="text-xl lg:text-2xl xl:text-3xl mb-1">Business</h2>
                            <p className="mb-10 font-light lg:text-lg">Para empresas que trabalham com futebol</p>
                            <p className="font-[100] text-4xl text-[#ffffff38] lg:text-6xl xl:text-7xl mb-10">R$ <span className="text-white font-medium">129,90</span></p>
                        </div>
                        <SubmitButtonMini 
                            onClick={() => handleSubscribe(3)}
                            disabled={loadingPlan === 3}
                            text="Contratar plano"></SubmitButtonMini>
                        <div className="my-5 lg:my-10 w-full border border-[#ffffff38]"></div>
                        <p className="mb-2 lg:mb-5 text-white font-medium text-base lg:text-lg">Você recebe</p>
                        <ul>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                            <li className="flex items-center gap-2 mb-3 text-white"><CircleCheck size={20} className="text-[#841CFF]"></CircleCheck> Benefício do plano 1</li>
                        </ul>
                    </div>
                </div>

            </div>

            <div className="w-full mt-10 lg:mt-20">
                {/* Tabeluxa de coisas e tal */}
                <div className="overflow-hidden rounded-xl border border-white/20">
                    <table className="w-full border-collapse bg-transparent text-white">
                        <thead>
                        <tr className="border-b border-white/20">
                            <th className="p-4 text-left">
                            <img
                                src={IconInsider}
                                alt=""
                                className="w-12 h-auto grayscale brightness-400"
                            />
                            </th>
                            <th className="border-l border-white/20 p-4 text-center">
                                <p className="font-[400] flex items-center justify-between">
                                    <span>Básico</span>
                                    <span>R$ 0,00</span>
                                </p>
                            </th>
                            <th className="border-l border-white/20 p-4 text-center">
                                <p className="font-[400] flex items-center justify-between">
                                    <span>Premium</span>
                                    <span>R$ 49,90</span>
                                </p>
                            </th>
                            <th className="border-l border-white/20 p-4 text-center">
                                <p className="font-[400] flex items-center justify-between">
                                    <span>Business</span>
                                    <span>R$ 129,90</span>
                                </p>
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                            <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                                <tr className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 text-left">
                                    <p className="text-base p-2 inline-block">
                                        Benefício do plano 1
                                        <br />
                                        <span className="text-sm font-light">Lorem ipsum</span>
                                    </p>
                                </td>
                                <td className="border-l border-white/20  p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                                <td className="border-l border-white/20 p-4 text-center">
                                    <Check size={20} className="mx-auto text-white" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>


      {isPaid && (
        <p className="text-center text-sm text-gray-500 mt-8">
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
