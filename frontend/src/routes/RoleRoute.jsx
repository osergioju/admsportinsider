import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RoleRoute({ allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  // Enquanto está carregando o autenticador
  if (loading) {
    return <p>Carregando...</p>;
  }

  // Se não estiver logado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o user.role não estiver na lista de permitidos
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
    // ou: return <Navigate to="/403" /> caso queira página de acesso negado
  }

  // Liberado
  return <Outlet />;
}
