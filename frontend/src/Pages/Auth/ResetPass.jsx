import { useState } from "react";
import Input from "../../components/ui/Input";
import Submit from "../../components/ui/Submit";
import { api } from "../../services/api"; 

export default function ResetPass() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data } = await api.post("/auth/reset-password", { email });

      setMessage(
        data.message ||
        "Se o e-mail existir no sistema, enviaremos um link de redefinição."
      );

    } catch (error) {
      console.error("Erro ao enviar reset:", error);
      setMessage("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-semibold mb-4">Redefinir senha</h1>

        <p className="text-gray-600 text-sm mb-6">
          Digite seu e-mail para enviarmos um link de redefinição.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              variant="light"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Submit
            value={loading ? "Enviando..." : "Enviar"}
            disabled={loading}
          />
        </form>

        {message && (
          <p className="mt-4 text-green-600 text-sm font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
