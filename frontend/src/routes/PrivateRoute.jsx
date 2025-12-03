import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoadingSkeleton from "../components/uxui/LoadingSkeleton";

export default function PrivateRoute() {
  const { user, loading } = useContext(AuthContext);

  // Enquanto estiver carregando (checando token no /auth/me)
  if (loading) {
    return <LoadingSkeleton></LoadingSkeleton>;
  }
  
  // Se NÃO estiver logado → manda para o login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver logado → libera as rotas internas
  return <Outlet />;
}
