import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function PaymentSuccess() {
  const { user, loading, refreshUser } = useContext(AuthContext);
  const [syncing, setSyncing] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const initialPlanId = useRef(user?.plan_id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!sessionId || loading || !user) return;

    // A ativação do plano depende do webhook do Stripe (assíncrono), então
    // ficamos consultando /auth/me por alguns segundos até o plano refletir o pagamento.
    let attempts = 0;
    const maxAttempts = 8;

    const interval = setInterval(async () => {
      attempts += 1;
      const updated = await refreshUser();

      const planChanged = !!updated && updated.plan_id !== initialPlanId.current;
      if (planChanged || attempts >= maxAttempts) {
        clearInterval(interval);
        setConfirmed(planChanged);
        setSyncing(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [sessionId, loading, user, refreshUser]);

  if (loading || !user) return null;

  if (!sessionId) {
    navigate("/me/profile");
    return null;
  }

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
            {syncing ? "Confirmando seu pagamento..." : confirmed ? "Pagamento confirmado!" : "Recebemos seu pagamento"}
          </h1>

          {/* --- TEXTO DE DESCRIÇÃO --- */}
          <div className="space-y-2 mb-8" role="status" aria-live="polite">
            <p className="text-[#FFFFFFB3] text-lg leading-relaxed max-w-xs mx-auto">
              {syncing
                ? "Estamos ativando o seu plano. Leva só alguns segundos."
                : confirmed
                  ? "Sua assinatura foi ativada com sucesso."
                  : "A ativação do plano está demorando um pouco mais que o normal."}
            </p>
            <p className="text-[#FFFFFF99] text-sm leading-relaxed max-w-xs mx-auto">
              {syncing
                ? "Não feche esta página."
                : confirmed
                  ? "Você já pode acessar os detalhes da sua conta."
                  : "Não se preocupe: seu acesso será liberado assim que o Stripe confirmar. Se não mudar em alguns minutos, fale com o suporte."}
            </p>
          </div>

          {/* --- BOTÃO PRINCIPAL (Estilo da referência) --- */}
          <button
            onClick={() => navigate("/me/financial")}
            className="w-full h-14 rounded-full bg-[linear-gradient(109.09deg,#FFFFFF_3.35%,#E7D3FF_96.65%)] hover:opacity-90 transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-purple-500/10"
          >
            <span className="text-[#7F33D9] font-semibold text-lg">{confirmed ? "Ir para meu plano" : "Ver minha assinatura"}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#7F33D9] group-hover:translate-x-1 transition-transform">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* --- FOOTER STATUS --- */}
          {syncing && (
            <div className="mt-6">
              <span className="inline-block text-xs text-[#FFFFFF99] animate-pulse motion-reduce:animate-none">
                Processando assinatura...
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
