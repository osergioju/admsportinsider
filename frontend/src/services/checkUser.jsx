import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function useRedirectIfAuthenticated() {
  const { user, loadingAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingAuth && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loadingAuth, navigate]);

  return { loadingAuth, user };
}
