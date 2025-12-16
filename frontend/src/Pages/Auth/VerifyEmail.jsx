import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api"; 

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const storedEmail = localStorage.getItem("pending_email_verification");
  const [email, setEmail] = useState(storedEmail || "");

  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Token não informado.");
            return;
        }

        async function verify() {
            console.log(token);
            try {
                const { data } = await api.get(`/auth/verify-email?token=${token}`);

                setStatus("success");
                setMessage(data.message);
            } catch (err) {
                console.log(err);
                setStatus("error");
                setMessage(err.response.data.error);

            }
        }


        verify();
    }, [token]);


    async function resend() {
        try {
            await api.post("/auth/resend-verification", {
                email: email
            });

            alert("E-mail reenviado. Verifique sua caixa de entrada.");
        } catch (err) {
            alert(
            err.response?.data?.error || "Erro ao reenviar confirmação."
            );
        }
    }


  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">

        {status === "loading" && (
          <>
            <h1 className="text-xl font-semibold">Confirmando e-mail…</h1>
            <p>Aguarde um momento.</p>
          </>
        )}

        {status === "success" && (
          <div>
            <h1 className="text-2xl font-semibold text-green-600">
              Tudo certo
            </h1>
            <p className="text-white">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 px-4 py-2 rounded bg-black text-white"
            >
              Ir para login
            </button>
          </div>
        )}

        {status === "error" && (
          <div>
            <h1 className="text-2xl font-semibold text-red-600">
                Algo deu errado
            </h1>
            <p className="text-white">{message}</p>
            <button onClick={resend} className="text-white mt-4 px-4 py-2 rounded border">
                Reenviar confirmação
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
