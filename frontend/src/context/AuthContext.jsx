import { createContext, useEffect, useState } from "react";
import { api } from "../services/api";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = carregando
  const [loading, setLoading] = useState(true);

  /* =========================
     Bootstrap auth (on load)
  ========================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    async function loadUser() {
      try {
        const response = await api.get("/auth/me");

        setUser(response.data.user);
      } catch (err) {
        console.error("Auth bootstrap failed", err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  /* =========================
     Refresh user (ex: após webhook do Stripe processar um pagamento)
  ========================= */
  async function refreshUser() {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      console.error("Failed to refresh user", err);
      return null;
    }
  }

  /* =========================
     Login
  ========================= */
  function login(token, userData) {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(userData);
  }

  /* =========================
     Update user (perfil, preferences, onboarding)
  ========================= */
  function updateUser(updates) {
    setUser(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        ...updates,
        preferences: {
          ...prev.preferences,
          ...updates.preferences,
        },
      };
    });
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
        loading,
        login,
        logout,
        refreshUser,
        updateUser, // 🔥 use isso no onboarding
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
