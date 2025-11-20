import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Input from "../../components/ui/Input";
import Submit from "../../components/ui/Submit";
import { api } from "../../services/api"; 

export default function ResetPassConfirm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
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
      setMsg("Token inválido ou ausente.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (senha !== confirmSenha) {
        setMsg("As senhas não coincidem.");
        return;
    }

    if (strength < 3) {
        setMsg("A senha precisa ser mais forte.");
        return;
    }

    if (!token) {
        setMsg("Token inválido.");
        return;
    }

    setLoading(true);

      try {
        await api.post("/auth/reset-password/confirm", {
          token,
          senha
        });
        
        // SUCESSO
        setMsg("Senha redefinida com sucesso! Redirecionando...");

        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);

      } catch (error) {
        console.error("Erro:", error);

        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Erro ao se conectar ao servidor.";

        setMsg(msg);

      } finally {
        setLoading(false);
      }

    };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">

        <h1 className="text-2xl font-semibold mb-4">
          Criar nova senha
        </h1>

        {!token ? (
          <p className="text-red-600">Token inválido ou expirado.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="mb-4">
                <Input
                    label="Nova senha"
                    type="password"
                    variant="light"
                    value={senha}
                    onChange={(e) => {
                    setSenha(e.target.value);
                    setStrength(checkPasswordStrength(e.target.value));
                    }}
                />

                <div className="mt-2">
                    {strength === 0 && senha.length > 0 && (
                    <p className="text-red-600 text-sm">Senha muito fraca</p>
                    )}

                    {strength === 1 && (
                    <p className="text-red-600 text-sm">Senha fraca</p>
                    )}

                    {strength === 2 && (
                    <p className="text-yellow-600 text-sm">Senha média</p>
                    )}

                    {strength === 3 && (
                    <p className="text-yellow-600 text-sm">Boa, mas pode melhorar</p>
                    )}

                    {strength === 4 && (
                    <p className="text-green-600 text-sm">Senha forte</p>
                    )}

                    {strength === 5 && (
                    <p className="text-green-700 font-semibold text-sm">
                        Senha muito forte!
                    </p>
                    )}
                </div>
                </div>
            </div>

            <div className="mb-4">
              <Input
                label="Confirmar senha"
                type="password"
                variant="light"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
              />
            </div>

            <Submit value={loading ? "Salvando..." : "Salvar nova senha"} />
          </form>
        )}

        {msg && (
          <p className="mt-4 text-sm text-center text-blue-600 font-medium">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
