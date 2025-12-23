import { BrowserRouter, Routes, Route } from "react-router-dom";

// Básicos
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import ResetPass from "./Pages/Auth/ResetPass";
import Pricing from "./Pages/Auth/Pricing";
import PaymentSuccess from "./Pages/Auth/SucessPayment";
import Dashboard from "./Pages/Dashboard/Main";
import NotFound from "./Pages/Errors/NotFound";
import FrontPage from "./Pages/FrontPage";
import ResetPassConfirm from "./Pages/Auth/ResetPassConfirm";
import GoogleCallback from "./Pages/Auth/GoogleCallback";

// User pages
import UserIndex from "./Pages/User/Index";
import VerifyEmail from "./Pages/Auth/VerifyEmail";
import PageNotifications from "./Pages/User/Notifications";
import ProfileDetails from "Pages/User/Profile/ProfileDetails";
import ProfilePreferences from "Pages/User/Profile/ProfilePreferences";
import SubscriptionPlan from "Pages/User/Profile/SubscriptionPlan";
import SubscriptionInvoices from "Pages/User/Profile/SubscriptionInvoices";
import PrivacyData from "Pages/User/Profile/PrivacyData";
import PrivacyDelete from "Pages/User/Profile/PrivacyDelete";


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

// ADMIN - Notificações 
import Notifications from "./Pages/Admin/Notificacoes/Index";
import NewNotification from "./Pages/Admin/Notificacoes/NewNotification";

// Banners 
import Banners from "./Pages/Admin/Banners/Banners";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// Rotas 
import PrivateRoute from "./routes/PrivateRoute";
import RoleRoute from "./routes/RoleRoute";

import ScrollToTop from "./components/uxui/ScrollTop";


export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        {/* ---- Abertos para todos ---- */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<FrontPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pagamento-sucesso" element={<PaymentSuccess />} />
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
              <Route path="/me/notifications" element={<PageNotifications />} />
              
              <Route path="me/profile" element={<ProfileDetails />} />
              <Route path="me/profile/preferences" element={<ProfilePreferences />} />
              <Route path="me/subscription" element={<SubscriptionPlan />} />
              <Route path="me/subscription/invoices" element={<SubscriptionInvoices />} />
              <Route path="me/privacy/data" element={<PrivacyData />} />
              <Route path="me/privacy/delete" element={<PrivacyDelete />} />
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

              {/* Insights - Usuários */}
              <Route path="/admin/insights/usuarios" element={<InsightUsuarios />} />

              {/*--------- Aqui o negócio fica louco, upload do primeiro XLSX -----------*/}
              <Route path="/admin/upload/ligas" element={<SendLeaguePage />} />

              {/* Notificações */}
              <Route path="/admin/new-notification" element={<NewNotification />} />
              <Route path="/admin/notifications" element={<Notifications />} />

              {/* Banners */}
              <Route path="/admin/banners" element={<Banners />} />
            </Route>


          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
