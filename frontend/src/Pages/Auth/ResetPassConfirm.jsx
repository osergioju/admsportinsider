import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Input from "../../components/uxui/Input";
import SubmitButton from "../../components/uxui/SubmitButton";
import useTitle from '../../hooks/useTitle';
import { api } from "../../services/api";
import { useRedirectIfAuthenticated } from "../../services/checkUser";

export default function ResetPassConfirm() {
  useTitle("Nova Senha");
  const { loadingAuth, user } = useRedirectIfAuthenticated();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [loading, setLoading] = useState(false);
  // Separando estados de mensagem para controle de cor (erro vs sucesso)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [strength, setStrength] = useState(0);

  // Força da senha
  function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // símbolos
    return score;
  }

  useEffect(() => {
    if (!token) {
      setError("Token inválido ou ausente. Solicite uma nova redefinição.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (senha !== confirmSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    if (strength < 3) {
      setError("A senha precisa ser mais forte (pelo menos nível médio).");
      return;
    }

    if (!token) {
      setError("Token inválido.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password/confirm", {
        token,
        senha
      });

      setSuccess("Senha redefinida com sucesso! Você será redirecionado para o login...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);

    } catch (err) {
      console.error("Erro:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Erro ao conectar ao servidor.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth || user) return null;

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0C0718] text-/10 overflow-x-hidden">
      <div className="flex-grow flex flex-col items-center justify-center w-full py-12 lg:py-24 relative z-10 ">

        <div className="w-full max-w-[480px] px-6 flex flex-col gap-8">

          <div className="w-full text-center">
            <h1 className="mb-6 bg-linear-to-l from-[#ffffff1f] to-[#ffffff] bg-clip-text text-4xl text-transparent text-center font-semibold">
              Criar nova senha
            </h1>
            <p className="text-[#FFFFFF99] text-base leading-relaxed">
              Defina uma senha forte para proteger sua conta.
            </p>
          </div>

          {!token ? (
            <div className="bg-[#F44336]/10 border border-[#F44336]/20 text-[#F44336] px-6 py-4 rounded-xl text-center">
              <p className="mb-4">Link de redefinição inválido ou expirado.</p>
              <Link to="/reset-password" className="text-white underline font-medium hover:text-[#E2D6FF]">Solicitar novo link</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>

              <div className="flex flex-col gap-2">
                <Input
                  label="Nova senha"
                  labelColor="text-[#FFFFFF99]"
                  type="password"
                  placeholder="********"
                  value={senha}
                  variant="dark"
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setStrength(checkPasswordStrength(e.target.value));
                  }}
                />

                {senha.length > 0 && (
                  <div className="flex items-center justify-between px-1 mt-1">
                    <div className="flex gap-1 h-1 flex-grow mr-4">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-full flex-grow rounded-full transition-all duration-300 ${strength >= level
                              ? (strength < 3 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-400' : 'bg-green-400')
                              : 'bg-[#FFFFFF1A]'
                            }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${strength < 3 ? 'text-red-400' : strength < 4 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                      {strength === 0 && "Muito fraca"}
                      {strength === 1 && "Fraca"}
                      {strength === 2 && "Média"}
                      {strength === 3 && "Boa"}
                      {strength === 4 && "Forte"}
                      {strength === 5 && "Muito forte!"}
                    </span>
                  </div>
                )}
              </div>

              <Input
                label="Confirmar senha"
                labelColor="text-[#FFFFFF99]"
                type="password"
                placeholder="********"
                value={confirmSenha}
                variant="dark"
                onChange={(e) => setConfirmSenha(e.target.value)}
              />

              <SubmitButton disabled={loading}>
                <span className="text-[#7F33D9] text-lg cursor-pointer">
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </span>
              </SubmitButton>

              {/* Mensagens de Feedback */}
              {error && (
                <p className="text-[#F44336] text-sm text-center mt-2 bg-[#F44336]/10 py-4 px-6 rounded-xl border border-[#F44336]/20 leading-relaxed">
                  {error}
                </p>
              )}

              {success && (
                <p className="text-green-400 text-sm text-center mt-2 bg-green-500/10 py-4 px-6 rounded-xl border border-green-500/20 leading-relaxed font-medium">
                  {success}
                </p>
              )}

            </form>
          )}

        </div>
      </div>
    </div>
  );
}