import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";

export default function GoogleCallback() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function handleGoogleLogin() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        // Se não veio código, volta pro login
        if (!code) {
          navigate("/login");
          return;
        }

        // Troca o código de uso único (não fica na URL/histórico) pelo JWT
        const exchange = await api.post("/auth/google/exchange", { code });
        const token = exchange.data.token;

        // Guarda o token (se seu AuthContext já faz isso, depois podemos simplificar)
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Busca os dados do usuário no backend
        const response = await api.get("/auth/me");
        const user = response.data.user || response.data;

        // Usa o mesmo login do fluxo normal
        login(token, user);

        // Redireciona igual à página de login
        if (user.role === "user") navigate("/dashboard");
        if (user.role === "admin") navigate("/admin");
        if (user.role === "admin_master") navigate("/admin");

      } catch (error) {
        console.error("Erro ao finalizar login com Google:", error);
        navigate("/login");
      }
    }

    handleGoogleLogin();
  }, []);

  return <p className="text-white">Conectando com Google...</p>;
}
