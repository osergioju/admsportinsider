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
        const token = params.get("token");

        // Se não veio token, volta pro login
        if (!token) {
          navigate("/login");
          return;
        }

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
