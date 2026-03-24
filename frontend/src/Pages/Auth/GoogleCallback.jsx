import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";

export default function GoogleCallback() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function handleGoogleLogin() {
      console.log("🚀 Iniciando callback Google");

      try {
        console.log("🌐 URL completa:", window.location.href);

        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        console.log("🔑 Token recebido:", token);

        // Se não veio token, volta pro login
        if (!token) {
          console.warn("⚠️ Token não encontrado na URL");
          navigate("/login");
          return;
        }

        // Salva token
        localStorage.setItem("token", token);
        console.log("💾 Token salvo no localStorage");

        // Seta header
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("📡 Header Authorization setado:", api.defaults.headers.common["Authorization"]);

        // Teste rápido antes do /me
        console.log("🧪 Testando chamada /auth/me...");

        const response = await api.get("/auth/me");

        console.log("✅ Resposta /auth/me:", response);

        const user = response.data.user || response.data;

        console.log("👤 Usuário identificado:", user);

        // Login no contexto
        console.log("🔐 Chamando login()...");
        login(token, user);

        console.log("📍 Role do usuário:", user.role);

        // Redirecionamento
        if (user.role === "user") {
          console.log("➡️ Indo para /dashboard");
          navigate("/dashboard");
        }

        if (user.role === "admin" || user.role === "admin_master") {
          console.log("➡️ Indo para /admin");
          navigate("/admin");
        }

      } catch (error) {
        console.error("❌ Erro no login com Google:", error);

        if (error.response) {
          console.error("📦 response:", error.response.data);
          console.error("📊 status:", error.response.status);
        }

        navigate("/login");
      }
    }

    handleGoogleLogin();
  }, []);

  return <p className="text-white">Conectando com Google...</p>;
}