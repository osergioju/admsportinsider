import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import Dashboard from "./Pages/Dashboard/Main";
import NotFound from "./Pages/Errors/NotFound";

// User pages
import UserIndex from "./Pages/User";
import UserPerfil from "./Pages/User/Perfil";
import UserConfiguracoes from "./Pages/User/Configuracoes";

// Admin pages
import AdminIndex from "./Pages/Admin";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// Rotas 
import PrivateRoute from "./routes/PrivateRoute";
import RoleRoute from "./routes/RoleRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ---- Abertos para todos ---- */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>


        {/* ---- Apenas para usuários - Dashboard e afins ---- */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>

            <Route element={<RoleRoute allowedRoles={["user"]} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/user" element={<UserIndex />} />
              <Route path="/user/perfil" element={<UserPerfil />} />
              <Route path="/user/configuracoes" element={<UserConfiguracoes />} />
            </Route>

          </Route>
        </Route>

        {/* ---- Adm - páginas do admin comum e do admin master ---- */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>

            <Route element={<RoleRoute allowedRoles={["admin", "admin_master"]} />}>
              <Route path="/admin" element={<AdminIndex />} />
            </Route>

          </Route>
        </Route>


        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
