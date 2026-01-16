import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const sessionId = params.get("session_id");

  useEffect(() => {
    // fallback de segurança
    if (!sessionId) {
      navigate("/me/subscription");
      return;
    }

    const timer = setTimeout(() => {
      navigate("/me/subscription");
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, [sessionId, navigate]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0C0718] text-white font-sans overflow-x-hidden">
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12 relative z-10 animate-fade-in">
        <div className="max-w-md w-full text-center flex flex-col items-center">

          {/* --- ÍCONE DE SUCESSO (Baseado na referência) --- */}
          <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* --- TÍTULO COM GRADIENTE --- */}
          <h1 className="mb-4 text-3xl lg:text-4xl font-bold bg-[linear-gradient(90deg,#FFFFFF_0%,#E2D6FF_100%)] bg-clip-text text-transparent">
            Pagamento confirmado!
          </h1>

          {/* --- TEXTO DE DESCRIÇÃO --- */}
          <div className="space-y-2 mb-8">
            <p className="text-[#FFFFFF99] text-lg leading-relaxed max-w-xs mx-auto">
                Sua assinatura foi ativada com sucesso.
            </p>
            <p className="text-[#FFFFFF66] text-sm leading-relaxed max-w-xs mx-auto">
                Você será redirecionado para os detalhes da sua conta em instantes.
            </p>
          </div>

          {/* --- BOTÃO PRINCIPAL (Estilo da referência) --- */}
          <button
            onClick={() => navigate("/me/subscription")}
            className="w-full h-14 rounded-full bg-[linear-gradient(109.09deg,#FFFFFF_3.35%,#E7D3FF_96.65%)] hover:opacity-90 transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-purple-500/10"
          >
            <span className="text-[#7F33D9] font-semibold text-lg">Ir para meu plano</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#7F33D9] group-hover:translate-x-1 transition-transform">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* --- FOOTER STATUS --- */}
          <div className="mt-6">
            <span className="inline-block text-xs text-[#FFFFFF40] animate-pulse">
              Processando assinatura...
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}