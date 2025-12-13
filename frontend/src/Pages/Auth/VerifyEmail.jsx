import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // Recupera o e-mail salvo no cadastro (do Código 1)
  const storedEmail = localStorage.getItem("pending_email_verification");
  const [email] = useState(storedEmail || "");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verificando seu e-mail...");

  // TRAVA DE SEGURANÇA (Do Código 2)
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token inválido ou não fornecido.");
      return;
    }

    // Impede execução dupla
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    api.get(`/auth/verify-email?token=${token}`)
      .then((response) => {
        setStatus("success");
        setMessage(response.data.message || "E-mail confirmado com sucesso!");
        // Limpa o storage pois já verificou
        localStorage.removeItem("pending_email_verification");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.response?.data?.error || "Erro ao verificar e-mail.");
      });
  }, [token, navigate]);

  // Função de Reenviar (Do Código 1)
  async function resend() {
    if (!email) {
        alert("E-mail não encontrado para reenvio. Tente fazer login.");
        return;
    }
    try {
        await api.post("/auth/resend-verification", { email });
        alert("E-mail reenviado! Verifique sua caixa de entrada.");
    } catch (err) {
        alert(err.response?.data?.error || "Erro ao reenviar confirmação.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        
        {/* LOADING */}
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Verificando...</h2>
            <p className="text-gray-300">Aguarde um momento.</p>
          </>
        )}

        {/* SUCESSO */}
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-green-400">Tudo certo!</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition"
            >
              Ir para Login
            </button>
          </>
        )}

        {/* ERRO */}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-red-400">Algo deu errado</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            
            <div className="flex flex-col gap-3">
                {/* Botão de Reenviar (Só aparece se tivermos o e-mail) */}
                {email && (
                    <button 
                        onClick={resend} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition"
                    >
                        Reenviar confirmação
                    </button>
                )}
                
                <button
                    onClick={() => navigate("/login")}
                    className="text-gray-400 hover:text-white underline transition"
                >
                    Voltar para Login
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}