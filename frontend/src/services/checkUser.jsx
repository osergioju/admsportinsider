import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function useRedirectIfAuthenticated() {
  const { user, loadingAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingAuth && user) {
      if (user.role === "user") navigate("/dashboard");
      if (user.role === "admin") navigate("/admin");
      if (user.role === "admin_master") navigate("/admin");
    }
  }, [user, loadingAuth, navigate]);

  return { loadingAuth, user };
}
