import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import ResetPass from "./Pages/Auth/ResetPass";
import Dashboard from "./Pages/Dashboard/Main";
import NotFound from "./Pages/Errors/NotFound";
import FrontPage from "./Pages/FrontPage";
import ResetPassConfirm from "./Pages/Auth/ResetPassConfirm";
import GoogleCallback from "./Pages/Auth/GoogleCallback";

// User pages
import UserIndex from "./Pages/User/Index";
import UserPerfil from "./Pages/User/Perfil";
import UserConfiguracoes from "./Pages/User/Configuracoes";
import VerifyEmail from "./Pages/Auth/VerifyEmail";
// ADMIN PAGES // 
import AdminIndex from "./Pages/Admin/Index";
import SendLeaguePage from "./Pages/Admin/Datasend/SendLeaguePage";

// ADMIN - Gestão de ligas, países e clubes
import GestaoPaises from "./Pages/Admin/GestaoPaises";
import GestaoLigas from "./Pages/Admin/GestaoLigas";
import GestaoClubes from "./Pages/Admin/GestaoClubes";
 
// ADMIN - Gestão do usuário 
import AdminUsuarios from "./Pages/Admin/Usuarios/GestaoUsuarios";
import AdminNewUsuario from "./Pages/Admin/Usuarios/NovoUsuario";
import UnicoUsuario from "./Pages/Admin/Usuarios/UnicoUsuario";

// ADMIN - Gestão dos planos
import GestaoPlanos from "./Pages/Admin/Planos/GestaoPlanos";
import NovoPlano from "./Pages/Admin/Planos/NovoPlano";
import EditarPlano from "./Pages/Admin/Planos/EditarPlano";


// ADMIN - Insights 
import InsightUsuarios from "./Pages/Admin/Insights/Users/Index"

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
          <Route path="/" element={<FrontPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPass />} />
          <Route path="/reset" element={<ResetPassConfirm />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>


        {/* ---- Apenas para usuários - Dashboard e afins ---- */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>

            <Route element={<RoleRoute allowedRoles={["user", "admin_master"]} />}>
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

              {/* Gestão de países, ligas e clubes */}
              <Route path="/admin/gestao-paises" element={<GestaoPaises />} />

              <Route path="/admin/gestao-ligas" element={<GestaoLigas />} />
              <Route path="/admin/gestao-clubes" element={<GestaoClubes />} />

              {/* GEstão de usuários */}
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/new-user" element={<AdminNewUsuario />} />
              <Route path="/admin/usuarios/:id" element={<UnicoUsuario />} />

              {/* GESTÃO DE PLANOS */}
              <Route path="/admin/gestao-planos" element={<GestaoPlanos />} />
              <Route path="/admin/gestao-planos/novo" element={<NovoPlano />} />
              <Route path="/admin/gestao-planos/:id" element={<EditarPlano />} />

              {/*--------- INSIGHTS -----------*/}
              {/* Insights - Usuários */}
              <Route path="/admin/insights/usuarios" element={<InsightUsuarios />} />

              {/*--------- Aqui o negócio fica louco, upload do primeiro XLSX -----------*/}
              <Route path="/admin/upload/ligas" element={<SendLeaguePage />} />
            </Route>

          </Route>
        </Route>


        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
