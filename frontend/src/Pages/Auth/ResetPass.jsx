import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/uxui/Input";
import SubmitButton from "../../components/uxui/SubmitButton";
import useTitle from '../../hooks/useTitle';
import { api } from "../../services/api";

export default function ResetPass() {
  useTitle("Redefinir Senha");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 
  const [success, setSuccess] = useState(""); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email) {
        setError("Por favor, digite seu e-mail.");
        setLoading(false);
        return;
    }

    try {
      const { data } = await api.post("/auth/reset-password", { email });
      setSuccess(data.message || "Se o e-mail existir, enviamos um link de redefinição.");
      
    } catch (err) {
      console.error("Erro ao enviar reset:", err);
      const msg = err.response?.data?.error || "Não foi possível conectar ao servidor. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0C0718] text-white font-sans overflow-x-hidden">

      <div className="flex-grow flex flex-col items-center justify-center w-full py-12 lg:py-24 relative z-10">
        
        <div className="w-full max-w-[480px] px-6 flex flex-col gap-8">
          
          <div className="w-full text-center">
            <h1 className="mb-4 bg-[linear-gradient(90deg,#FFFFFF_0%,#E2D6FF_100%)] bg-clip-text text-3xl lg:text-4xl text-transparent font-semibold">
              Esqueceu a senha?
            </h1>
            <p className="text-[#FFFFFF99] text-base leading-relaxed">
              Não se preocupe. Digite seu e-mail abaixo e enviaremos as instruções para redefinição.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
            <Input
              label="E-mail cadastrado"
              labelColor="text-[#FFFFFF99]"
              type="email"
              placeholder="seu@email.com"
              value={email}
              variant="dark"
              onChange={(e) => setEmail(e.target.value)}
            />

            <SubmitButton disabled={loading}>
                <span className="text-[#7F33D9] font-semibold text-lg cursor-pointer">
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                </span>
            </SubmitButton>

            {/* Erro */}
            {error && (
                <p className="text-[#F44336] text-sm text-center mt-2 bg-[#F44336]/10 py-4 px-6 rounded-xl border border-[#F44336]/20 leading-relaxed">
                    {error}
                </p>
            )}

            {/* Sucesso */}
            {success && (
                <p className="text-green-400 text-sm text-center mt-2 bg-green-500/10 py-4 px-6 rounded-xl border border-green-500/20 leading-relaxed">
                    {success}
                </p>
            )}
          </form>

          <div className="flex justify-center mt-2">
            <Link 
              to="/login" 
              className="text-sm text-[#FFFFFF99] hover:text-white transition-colors flex items-center gap-2 group"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:-translate-x-1 transition-transform">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Voltar para o Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}