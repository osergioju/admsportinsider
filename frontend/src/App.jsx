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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ---- Layout sem sidebar ---- */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* ---- Layout com sidebar ---- */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* User routes */}
          <Route path="/user" element={<UserIndex />} />
          <Route path="/user/perfil" element={<UserPerfil />} />
          <Route path="/user/configuracoes" element={<UserConfiguracoes />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminIndex />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
