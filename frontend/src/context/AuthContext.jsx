import { createContext, useEffect, useState } from "react";
import { api } from "../services/api";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     Bootstrap auth (on load)
  ========================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    async function loadUser() {
      try {
        const response = await api.get("/auth/me");

        // garante shape consistente
        setUser(response.data.user);
      } catch (err) {
        console.error("Auth bootstrap failed", err);

        // token inválido / expirado
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  /* =========================
     Login
  ========================= */
  function login(token, userData) {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(userData);
  }

  /* =========================
     Logout
  ========================= */
  function logout() {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];

    setUser(null);
  }

  /* =========================
     Context value
  ========================= */
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,      // 🔥 ESSENCIAL (sync de perfil)
        loading,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
