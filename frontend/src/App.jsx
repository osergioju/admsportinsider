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
import ProfileDetails from "./Pages/User/Profile/ProfileDetails";
import SubscriptionInvoices from "./Pages/User/Profile/SubscriptionInvoices";
import SubscriptionPlan from "./Pages/User/Profile/SubscriptionPlan";
import Onboarding from "./Pages/User/Onboarding";
import Faq from "./Pages/User/Profile/Components/Faq";
import ContactUs from "./Pages/User/Profile/Components/ContactUs";
import MeuDashboard from "./Pages/User/MeuDashboard";
import SubscriptionManagement from "./Pages/User/Profile/Components/Financial";
import PlansFinancial from "./Pages/User/Profile/Components/PlansFinancial";
import Relatorios from "./Pages/User/Relatorios";
import Players from "./Pages/User/Players";
import ClubsFavorites from "./Pages/User/ClubsFavorites";
import LeaguesFavorites from "./Pages/User/LeaguesFavorites";

// ADMIN PAGES // 
import AdminIndex from "./Pages/Admin/Index";
import SendLeaguePage from "./Pages/Admin/Datasend/SendLeaguePage";
import AdminProfileDetails from "./Pages/Admin/AdminProfileDetails";
import UploadTeamsPage from "./Pages/Admin/Datasend/UploadTeamsPage";
import UploadPlayersPage from "./Pages/Admin/Datasend/UploadPlayersPage";
import UploadMatchesPage from "./Pages/Admin/Datasend/UploadMatchesPage";

// ADMIN - Gestão de ligas, países e clubes
import GestaoPaises from "./Pages/Admin/GestaoPaises";
import GestaoLigas from "./Pages/Admin/GestaoLigas";
import GestaoClubes from "./Pages/Admin/GestaoClubes";
 
// ADMIN - Gestão do usuário 
import AdminUsuarios from "./Pages/Admin/Usuarios/GestaoUsuarios";
import AdminNewUsuario from "./Pages/Admin/Usuarios/NovoUsuario";
import UnicoUsuario from "./Pages/Admin/Usuarios/UserDetailPage";

// ADMIN - Gestão dos planos
import GestaoPlanos from "./Pages/Admin/Planos/GestaoPlanos";
import NovoPlano from "./Pages/Admin/Planos/NovoPlano";
import EditarPlano from "./Pages/Admin/Planos/EditarPlano";

// ADMIN - Insights
import InsightUsuarios from "./Pages/Admin/Insights/Users/Index"
import InsightClubes from "./Pages/Admin/Insights/Clubes/Index"
import InsightLigas from "./Pages/Admin/Insights/Ligas/Index"
import InsightFinanceiro from "./Pages/Admin/Insights/Financeiro/Index"
import InsightPlanos from "./Pages/Admin/Insights/Planos/Index"
import InsightImportacoes from "./Pages/Admin/Insights/Importacoes/Index"
import InsightUso from "./Pages/Admin/Insights/Uso/Index"
import InsightPerformance from "./Pages/Admin/Insights/Performance/Index"

// ADMIN - Notificações 
import Notifications from "./Pages/Admin/Notificacoes/Notifications";

// Banners 
import Banners from "./Pages/Admin/Banners/Banners";

// Regiões,idiomas e moedas
import Regions from "./Pages/Admin/Regions/Regions";
import RegionsDetailPage from "./Pages/Admin/Regions/RegionsDetailPage";
import FinancialTransPage from "./Pages/Admin/Regions/FinancialTransPage";
import CommonTermsTransPage from "./Pages/Admin/Regions/CommonTermsTransPage";
import Currencies from "./Pages/Admin/Currencies/Currencies";

// Faq Admin 
import FaqAdmin from "./Pages/Admin/Faq/FaqAdmin";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// Rotas 
import PrivateRoute from "./routes/PrivateRoute";
import RoleRoute from "./routes/RoleRoute";
import ScrollToTop from "./components/uxui/ScrollTop";

// Páginas do dashboard 
import PrePageClubs from "./Pages/Dashboard/Clubs/PrePageClubs";
import DashCountries from "./Pages/Dashboard/Countries/Index";
import CountryDetail from "./Pages/Dashboard/Countries/CountryDetail";
import PlayersList from "./Pages/Dashboard/Players/PlayersList";
import DashClubs from "./Pages/Dashboard/Clubs/Index";
import DashClubUniques from "./Pages/Dashboard/Clubs/DashClubUniques";
import DashLeagues from "./Pages/Dashboard/Leagues/Index";
import DashLeagueUniques from "./Pages/Dashboard/Leagues/DashLeagueUniques";
import CompetitionsClubs from "./Pages/Dashboard/Clubs/CompetitionsClubs";
import ClubPlayers from "./Pages/Dashboard/Clubs/ClubPlayers";
import AdminProfile from "./Pages/Admin/Componentes/AdminPersonalData";
import MatchDetail from "./Pages/Dashboard/Matches/MatchDetail";


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
              <Route path="/faq" element={<Faq />} />
              <Route path="/fale-conosco" element={<ContactUs />} />
              <Route path="/me/notifications" element={<PageNotifications />} />

              {/* Aqui é pro usuário compeltar o cadastro dele no site */}
              <Route path="/onboarding/preferences" element={<Onboarding />} />

              <Route path="me/profile" element={<ProfileDetails />} />
              <Route path="me/financial" element={<SubscriptionManagement />} />
              <Route path="me/plans" element={<PlansFinancial/>} />
              <Route path="me/subscription" element={<SubscriptionPlan />} />


              {/* Favoritos */}
              <Route path="/dashboard/clubs/favorites" element={<ClubsFavorites />} />
              <Route path="/dashboard/leagues/favorites" element={<LeaguesFavorites />} />

              {/* Meu Dashboard */}
              <Route path="/dashboard/meu-dashboard" element={<MeuDashboard />} />

              {/* Relatórios */}
              <Route path="/dashboard/relatorios" element={<Relatorios />} />
            </Route>

          </Route>
        </Route>

        {/*--- Dashboard público + clubes e ligas (acessíveis sem login) ---*/}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard-public" element={<Dashboard />} />

          {/* Clubes */}
          <Route path="/dashboard/clubs" element={<DashClubs />} />
          <Route path="/dashboard/clubs/:id" element={<PrePageClubs />} />
          <Route path="/dashboard/clubs/finance/:id" element={<DashClubUniques />} />
          <Route path="/dashboard/clubs/competitions/:id" element={<CompetitionsClubs />} />
          <Route path="/dashboard/clubs/club-players/:id" element={<ClubPlayers />} />

          {/* Países */}
          <Route path="/dashboard/countries" element={<DashCountries />} />
          <Route path="/dashboard/countries/:id" element={<CountryDetail />} />

          {/* Ligas */}
          <Route path="/dashboard/leagues" element={<DashLeagues />} />
          <Route path="/dashboard/league/:id" element={<DashLeagueUniques />} />

          {/* Jogadores */}
          <Route path="/dashboard/players" element={<PlayersList />} />
          <Route path="/dashboard/players/:id" element={<Players />} />

          {/* Partidas */}
          <Route path="/dashboard/matches/:id" element={<MatchDetail />} />
        </Route>

        {/* ---- Adm - páginas do admin comum e do admin master ---- */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>

            <Route element={<RoleRoute allowedRoles={["admin", "admin_master"]} />}>
              <Route path="/admin" element={<AdminIndex />} />
              <Route path="/admin/profile" element={<AdminProfileDetails />} />

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

              {/* Insights */}
              <Route path="/admin/insights/usuarios" element={<InsightUsuarios />} />
              <Route path="/admin/insights/clubes" element={<InsightClubes />} />
              <Route path="/admin/insights/ligas" element={<InsightLigas />} />
              <Route path="/admin/insights/financeiro" element={<InsightFinanceiro />} />
              <Route path="/admin/insights/planos" element={<InsightPlanos />} />
              <Route path="/admin/insights/importacoes" element={<InsightImportacoes />} />
              <Route path="/admin/insights/uso" element={<InsightUso />} />
              <Route path="/admin/insights/performance" element={<InsightPerformance />} />

              {/*--------- Aqui o negócio fica louco, upload do primeiro XLSX -----------*/}
              <Route path="/admin/upload/ligas" element={<SendLeaguePage />} />

              {/*--------- Aqui o negócio fica louco, upload do primeiro XLSX -----------*/}
              <Route path="/admin/upload/teams" element={<UploadTeamsPage />} />
              <Route path="/admin/upload/players" element={<UploadPlayersPage />} />
              <Route path="/admin/upload/matches" element={<UploadMatchesPage />} />

              {/* Notificações */}
              <Route path="/admin/notifications" element={<Notifications />} />

              {/* Banners */}
              <Route path="/admin/banners" element={<Banners />} />

              {/* Regiões e idioma */}
              <Route path="/admin/regions" element={<Regions />} />
              <Route path="/admin/regions/:id" element={<RegionsDetailPage />} />
              <Route path="/admin/regions/:id/financial-indicators" element={<FinancialTransPage />} />
              <Route path="/admin/regions/:id/common-terms" element={<CommonTermsTransPage />} />

              {/* Moedas */}
              <Route path="/admin/currencies" element={<Currencies />} />

              {/* FAQ */}
              <Route path="/admin/faq" element={<FaqAdmin />} />
            </Route>


          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
