import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ADMIN_PAGES } from "../constants/adminPages";

/**
 * Guard de rota para páginas admin com permissão granular.
 *
 * - admin_master: acesso total, passa direto.
 * - admin: verifica se user.admin_permissions contém uma chave
 *   cujos `routes` fazem match com o pathname atual.
 *   Se não tiver permissão, redireciona para /admin.
 *
 * Uso em App.jsx:
 *   <Route element={<AdminPermissionRoute permissionKey="gestao-dados" />}>
 *     <Route path="/admin/gestao-paises" element={<GestaoPaises />} />
 *   </Route>
 */
export default function AdminPermissionRoute({ permissionKey }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  // admin_master nunca é bloqueado
  if (user.role === "admin_master") return <Outlet />;

  const permissions = user.admin_permissions ?? [];

  // Se permissionKey foi passado explicitamente, usa ele
  if (permissionKey) {
    if (!permissions.includes(permissionKey)) {
      return <Navigate to="/admin" replace state={{ blocked: location.pathname }} />;
    }
    return <Outlet />;
  }

  // Fallback: inferir permissão pelo pathname atual
  const matched = ADMIN_PAGES.find((page) =>
    page.routes.some((route) =>
      location.pathname === route || location.pathname.startsWith(route + "/")
    )
  );

  if (!matched || !permissions.includes(matched.key)) {
    return <Navigate to="/admin" replace state={{ blocked: location.pathname }} />;
  }

  return <Outlet />;
}
