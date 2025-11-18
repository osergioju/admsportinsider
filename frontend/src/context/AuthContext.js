import { createContext, useState, useEffect } from "react";
import { api } from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica login ao abrir o site
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      api.get("/auth/me")
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
