import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useRedirectIfAuthenticated } from "../../services/checkUser";


export default function VerifyEmail() {
    const { loadingAuth, user } = useRedirectIfAuthenticated();  
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const storedEmail = localStorage.getItem("pending_email_verification");
    const [email, setEmail] = useState(storedEmail || "");

    const token = searchParams.get("token");

    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const [resendFeedback, setResendFeedback] = useState({ type: "", text: "" });

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Token não informado.");
            return;
        }

        async function verify() {
            try {
                const { data } = await api.get(`/auth/verify-email?token=${token}`);
                setStatus("success");
                setMessage(data.message);
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.error || "Erro ao verificar e-mail.");
            }
        }

        verify();
    }, [token]);

    async function resend() {
        setResendFeedback({ type: "", text: "" });

        try {
            await api.post("/auth/resend-verification", {
                email: email
            });

            setResendFeedback({
                type: "success",
                text: "E-mail reenviado com sucesso! Verifique sua caixa de entrada."
            });

        } catch (err) {
            const msg = err.response?.data?.error || "Erro ao reenviar confirmação.";
            setResendFeedback({
                type: "error",
                text: msg
            });
        }
    }

    if (loadingAuth || user) return null;

    return (
        <div className="w-full min-h-screen flex flex-col bg-[#0C0718] text-white font-sans overflow-x-hidden">
            <div className="flex-grow flex flex-col items-center justify-center px-4 py-12 relative z-10 animate-fade-in">
                <div className="max-w-md w-full text-center flex flex-col items-center">

                    {/* --- LOADING --- */}
                    {status === "loading" && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative w-16 h-16">
                                <div className="absolute top-0 left-0 w-full h-full border-4 border-[#FFFFFF1A] rounded-full"></div>
                                <div className="absolute top-0 left-0 w-full h-full border-4 border-[#7F33D9] rounded-full animate-spin border-t-transparent"></div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-semibold bg-[linear-gradient(90deg,#FFFFFF_0%,#E2D6FF_100%)] bg-clip-text text-transparent">
                                    Confirmando e-mail...
                                </h1>
                                <p className="text-[#FFFFFF99]">
                                    Aguarde um momento enquanto validamos seus dados.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* --- SUCESSO --- */}
                    {status === "success" && (
                        <div className="flex flex-col items-center w-full">
                            <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>

                            <h1 className="mb-4 text-3xl lg:text-4xl font-bold bg-[linear-gradient(90deg,#FFFFFF_0%,#E2D6FF_100%)] bg-clip-text text-transparent">
                                Tudo certo!
                            </h1>

                            <p className="text-[#FFFFFF99] text-lg mb-8 leading-relaxed max-w-xs">
                                {message || "Seu e-mail foi confirmado com sucesso."}
                            </p>

                            <button
                                onClick={() => navigate("/login")}
                                className="w-full h-14 rounded-full bg-[linear-gradient(109.09deg,#FFFFFF_3.35%,#E7D3FF_96.65%)] hover:opacity-90 transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-purple-500/10"
                            >
                                <span className="text-[#7F33D9] font-semibold text-lg">Ir para login</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#7F33D9] group-hover:translate-x-1 transition-transform">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* --- ERRO --- */}
                    {status === "error" && (
                        <div className="flex flex-col items-center w-full">
                            <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>

                            <h1 className="mb-4 text-3xl lg:text-4xl font-bold text-white">
                                Algo deu errado
                            </h1>

                            <p className="text-[#FFFFFF99] text-base mb-8 leading-relaxed bg-red-500/5 border border-red-500/10 p-4 rounded-xl w-full">
                                {message || "Não foi possível confirmar seu e-mail."}
                            </p>

                            {/* Botão Único */}
                            <button
                                onClick={resend}
                                className="w-full h-14 rounded-full bg-[#FFFFFF05] border border-[#FFFFFF1A] hover:bg-[#FFFFFF10] transition-all text-white font-medium text-lg flex items-center justify-center gap-2 mb-4"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#FFFFFF99]">
                                    <path d="M21 12C21 16.9706 16.9706 21 12 21C9.69494 21 7.59227 20.1398 6 18.7083L3 16M3 12C3 7.02944 7.02944 3 12 3C14.3051 3 16.4077 3.86022 18 5.29168L21 8M3 21V16M3 16H8M21 3V8M21 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Reenviar confirmação
                            </button>

                            {/* Feedback do Reenvio */}
                            {resendFeedback.text && (
                                <div className={`
                                    w-full px-4 py-3 rounded-xl border text-sm text-center animate-fade-in
                                    ${resendFeedback.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-[#F44336]/10 border-[#F44336]/20 text-[#F44336]'}
                                `}>
                                    {resendFeedback.text}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}