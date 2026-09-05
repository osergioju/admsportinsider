import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

// Básicos
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import ResetPass from "./Pages/Auth/ResetPass";
import Pricing from "./Pages/Auth/Pricing";
import PaymentSuccess from "./Pages/Auth/SucessPayment";
import Dashboard from "./Pages/Dashboard/Main";
import NotFound from "./Pages/Errors/NotFound";
import FrontPage from "./Pages/FrontPage";
import Legal from "./Pages/Legal";
import Privacidade from "./Pages/Privacidade";
import UpdateNotes from "./Pages/UpdateNotes";
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
import UploadFederationFinancialPage from "./Pages/Admin/Datasend/UploadFederationFinancialPage";
import AdminProfileDetails from "./Pages/Admin/AdminProfileDetails";
import UploadTeamsPage from "./Pages/Admin/Datasend/UploadTeamsPage";
import UploadPlayersPage from "./Pages/Admin/Datasend/UploadPlayersPage";
import UploadMatchesPage from "./Pages/Admin/Datasend/UploadMatchesPage";
import UploadSuperPage from "./Pages/Admin/Datasend/UploadSuperPage";

// ADMIN - Gestão de ligas, países e clubes
import GestaoPaises from "./Pages/Admin/GestaoPaises";
import GestaoLigas from "./Pages/Admin/GestaoLigas";
import GestaoClubes from "./Pages/Admin/GestaoClubes";
import GestaoJogadores from "./Pages/Admin/GestaoJogadores";
import Manutencao from "./Pages/Admin/Manutencao";
import ApiIntegration from "./Pages/Admin/ApiIntegration";
import ApiResults from "./Pages/Admin/ApiResults";
import ApiImport from "./Pages/Admin/ApiImport";
import GestaoContinent from "./Pages/Admin/GestaoContinent";
import GestaoFederacoes from "./Pages/Admin/GestaoFederacoes";
import GestaoHospitalidade from "./Pages/Admin/GestaoHospitalidade";

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

// Legal Admin
import LegalAdmin from "./Pages/Admin/Legal/LegalAdmin";
import ChartsAdmin from "./Pages/Admin/Charts/ChartsAdmin";

// Update Notes Admin
import UpdateNotesAdmin from "./Pages/Admin/UpdateNotes/UpdateNotesAdmin";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// Rotas
import PrivateRoute from "./routes/PrivateRoute";
import RoleRoute from "./routes/RoleRoute";
import AdminPermissionRoute from "./routes/AdminPermissionRoute";
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
import DashLeagueFinance from "./Pages/Dashboard/Leagues/DashLeagueFinance";
import DashLeagueSports from "./Pages/Dashboard/Leagues/DashLeagueSports";
import DashLeaguePrizes from "./Pages/Dashboard/Leagues/DashLeaguePrizes";
import DashLeagueAttendance from "./Pages/Dashboard/Leagues/DashLeagueAttendance";
import UploadPrizesPage from "./Pages/Admin/Datasend/UploadPrizesPage";
import CompetitionsClubs from "./Pages/Dashboard/Clubs/CompetitionsClubs";
import ClubPlayers from "./Pages/Dashboard/Clubs/ClubPlayers";
import AdminProfile from "./Pages/Admin/Componentes/AdminPersonalData";
import MatchDetail from "./Pages/Dashboard/Matches/MatchDetail";
import DashFederations from "./Pages/Dashboard/Federations/Index";
import FederationDetail from "./Pages/Dashboard/Federations/FederationDetail";
import DashFederationFinance from "./Pages/Dashboard/Federations/DashFederationFinance";
import { FeatureRoute } from "./context/FeatureFlagsContext";


// "/" vai direto ao dashboard: logado → /dashboard, visitante → /dashboard-public
function RootRedirect() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  return <Navigate to={user ? "/dashboard" : "/dashboard-public"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        {/* Dashboard é a primeira página — landing fica em /landing */}
        <Route path="/" element={<RootRedirect />} />

        {/* ---- Abertos para todos ---- */}
        <Route element={<AuthLayout />}>
          <Route path="/landing" element={<FrontPage />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/privacy" element={<Privacidade />} />
          <Route path="/privacidade" element={<Navigate to="/privacy" replace />} />
          <Route path="/update-notes" element={<UpdateNotes />} />
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
              <Route element={<FeatureRoute featureKey="faq" />}>
                <Route path="/faq" element={<Faq />} />
              </Route>
              <Route element={<FeatureRoute featureKey="contact" />}>
                <Route path="/fale-conosco" element={<ContactUs />} />
              </Route>
              <Route path="/me/notifications" element={<PageNotifications />} />

              {/* Aqui é pro usuário compeltar o cadastro dele no site */}
              <Route path="/onboarding/preferences" element={<Onboarding />} />

              <Route element={<FeatureRoute featureKey="profile" />}>
                <Route path="me/profile" element={<ProfileDetails />} />
              </Route>
              <Route element={<FeatureRoute featureKey="financial" />}>
                <Route path="me/financial" element={<SubscriptionManagement />} />
                <Route path="me/plans" element={<PlansFinancial />} />
                <Route path="me/subscription" element={<SubscriptionPlan />} />
              </Route>


              {/* Favoritos */}
              <Route element={<FeatureRoute featureKey="clubs.favorites" />}>
                <Route path="/dashboard/clubs/favorites" element={<ClubsFavorites />} />
              </Route>
              <Route element={<FeatureRoute featureKey="competitions.favorites" />}>
                <Route path="/dashboard/competitions/favorites" element={<LeaguesFavorites />} />
              </Route>

              {/* Meu Dashboard */}
              <Route path="/dashboard/meu-dashboard" element={<MeuDashboard />} />

              {/* Relatórios */}
              <Route element={<FeatureRoute featureKey="reports" />}>
                <Route path="/dashboard/relatorios" element={<Relatorios />} />
              </Route>
            </Route>

          </Route>
        </Route>

        {/*--- Dashboard público + clubes e ligas (acessíveis sem login) ---*/}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard-public" element={<Dashboard />} />

          {/* Clubes */}
          <Route element={<FeatureRoute featureKey="clubs" />}>
            <Route path="/dashboard/clubs" element={<DashClubs />} />
            <Route path="/dashboard/clubs/:id" element={<PrePageClubs />} />
            <Route path="/dashboard/clubs/:id/:slug" element={<PrePageClubs />} />
            <Route path="/dashboard/clubs/finance/:id" element={<DashClubUniques />} />
            <Route path="/dashboard/clubs/competitions/:id" element={<CompetitionsClubs />} />
            <Route path="/dashboard/clubs/club-players/:id" element={<ClubPlayers />} />
          </Route>

          {/* Países */}
          <Route element={<FeatureRoute featureKey="countries" />}>
            <Route path="/dashboard/countries" element={<DashCountries />} />
            <Route path="/dashboard/countries/:id" element={<CountryDetail />} />
          </Route>

          {/* Ligas */}
          <Route element={<FeatureRoute featureKey="federations" />}>
            <Route path="/dashboard/federations" element={<DashFederations />} />
            <Route path="/dashboard/federations/finance/:slug" element={<DashFederationFinance />} />
            <Route path="/dashboard/federations/:slug" element={<FederationDetail />} />
          </Route>

          <Route element={<FeatureRoute featureKey="competitions" />}>
            <Route path="/dashboard/competitions" element={<DashLeagues />} />
            <Route path="/dashboard/competitions/finance/:slug" element={<DashLeagueFinance />} />
            <Route path="/dashboard/competitions/sports/:slug" element={<DashLeagueSports />} />
            <Route path="/dashboard/competitions/prizes/:slug" element={<DashLeaguePrizes />} />
            <Route path="/dashboard/competitions/attendance/:slug" element={<DashLeagueAttendance />} />
            <Route path="/dashboard/competitions/:slug" element={<DashLeagueUniques />} />
          </Route>

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

              {/* ── Sempre acessíveis para qualquer admin ── */}
              <Route path="/admin" element={<AdminIndex />} />
              <Route path="/admin/profile" element={<AdminProfileDetails />} />
              <Route path="/admin/manutencao" element={<Manutencao />} />
              <Route path="/admin/api" element={<ApiIntegration />} />
              <Route path="/admin/api/resultados" element={<ApiResults />} />
              <Route path="/admin/api/importar" element={<ApiImport />} />

              {/* ── Gestão de países, ligas e clubes ── */}
              <Route element={<AdminPermissionRoute permissionKey="gestao-dados" />}>
                <Route path="/admin/gestao-paises" element={<GestaoPaises />} />
                <Route path="/admin/gestao-continentes" element={<GestaoContinent />} />
                <Route path="/admin/gestao-federacoes" element={<GestaoFederacoes />} />
                <Route path="/admin/gestao-ligas" element={<GestaoLigas />} />
                <Route path="/admin/gestao-clubes" element={<GestaoClubes />} />
                <Route path="/admin/gestao-jogadores" element={<GestaoJogadores />} />
              </Route>

              {/* ── Hospitalidade ── */}
              <Route element={<AdminPermissionRoute permissionKey="gestao-dados" />}>
                <Route path="/admin/hospitalidade" element={<GestaoHospitalidade />} />
              </Route>

              {/* ── Gestão de usuários ── */}
              <Route element={<AdminPermissionRoute permissionKey="usuarios" />}>
                <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                <Route path="/admin/new-user" element={<AdminNewUsuario />} />
                <Route path="/admin/usuarios/:id" element={<UnicoUsuario />} />
              </Route>

              {/* ── Gestão de planos ── */}
              <Route element={<AdminPermissionRoute permissionKey="planos" />}>
                <Route path="/admin/gestao-planos" element={<GestaoPlanos />} />
                <Route path="/admin/gestao-planos/novo" element={<NovoPlano />} />
                <Route path="/admin/gestao-planos/:id" element={<EditarPlano />} />
              </Route>

              {/* ── Insights ── */}
              <Route element={<AdminPermissionRoute permissionKey="insights-usuarios" />}>
                <Route path="/admin/insights/usuarios" element={<InsightUsuarios />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="insights-clubes" />}>
                <Route path="/admin/insights/clubes" element={<InsightClubes />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="insights-ligas" />}>
                <Route path="/admin/insights/ligas" element={<InsightLigas />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="insights-financeiro" />}>
                <Route path="/admin/insights/financeiro" element={<InsightFinanceiro />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="insights-planos" />}>
                <Route path="/admin/insights/planos" element={<InsightPlanos />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="insights-importacoes" />}>
                <Route path="/admin/insights/importacoes" element={<InsightImportacoes />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="insights-uso" />}>
                <Route path="/admin/insights/uso" element={<InsightUso />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="insights-performance" />}>
                <Route path="/admin/insights/performance" element={<InsightPerformance />} />
              </Route>

              {/* ── Upload de dados ── */}
              <Route element={<AdminPermissionRoute permissionKey="upload-financeiro" />}>
                <Route path="/admin/upload/ligas" element={<SendLeaguePage />} />
                <Route path="/admin/upload/federation-financial" element={<UploadFederationFinancialPage />} />
                <Route path="/admin/upload/prizes" element={<UploadPrizesPage />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="upload-times" />}>
                <Route path="/admin/upload/teams" element={<UploadTeamsPage />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="upload-jogadores" />}>
                <Route path="/admin/upload/players" element={<UploadPlayersPage />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="upload-partidas" />}>
                <Route path="/admin/upload/matches" element={<UploadMatchesPage />} />
              </Route>
              <Route element={<AdminPermissionRoute permissionKey="upload-times" />}>
                <Route path="/admin/upload/super" element={<UploadSuperPage />} />
              </Route>

              {/* ── Notificações ── */}
              <Route element={<AdminPermissionRoute permissionKey="notifications" />}>
                <Route path="/admin/notifications" element={<Notifications />} />
              </Route>

              {/* ── Banners ── */}
              <Route element={<AdminPermissionRoute permissionKey="banners" />}>
                <Route path="/admin/banners" element={<Banners />} />
              </Route>

              {/* ── Regiões e idioma ── */}
              <Route element={<AdminPermissionRoute permissionKey="regions" />}>
                <Route path="/admin/regions" element={<Regions />} />
                <Route path="/admin/regions/:id" element={<RegionsDetailPage />} />
                <Route path="/admin/regions/:id/financial-indicators" element={<FinancialTransPage />} />
                <Route path="/admin/regions/:id/common-terms" element={<CommonTermsTransPage />} />
              </Route>

              {/* ── Moedas ── */}
              <Route element={<AdminPermissionRoute permissionKey="currencies" />}>
                <Route path="/admin/currencies" element={<Currencies />} />
              </Route>

              {/* ── FAQ ── */}
              <Route element={<AdminPermissionRoute permissionKey="faq" />}>
                <Route path="/admin/faq" element={<FaqAdmin />} />
              </Route>

              {/* ── Páginas Legais ── */}
              <Route element={<AdminPermissionRoute permissionKey="legal" />}>
                <Route path="/admin/legal" element={<LegalAdmin />} />
              </Route>

              {/* ── Notas de Atualização ── */}
              <Route element={<AdminPermissionRoute permissionKey="update-notes" />}>
                <Route path="/admin/update-notes" element={<UpdateNotesAdmin />} />
              </Route>

              {/* ── Gerador de Gráficos ── */}
              <Route element={<AdminPermissionRoute permissionKey="charts" />}>
                <Route path="/admin/charts" element={<ChartsAdmin />} />
              </Route>

            </Route>


          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
