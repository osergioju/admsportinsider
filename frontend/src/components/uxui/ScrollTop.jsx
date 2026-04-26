import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../services/api";

const SUFFIX = "Sport Insider";

const STATIC_TITLES = {
  "/": "Home",
  "/login": "Entre na sua conta",
  "/register": "Criar conta",
  "/pricing": "Planos e preços",
  "/pagamento-sucesso": "Pagamento concluído",
  "/reset-password": "Recuperar senha",
  "/reset": "Redefinir senha",
  "/auth/google/callback": "Autenticando...",
  "/verify-email": "Verificar e-mail",

  "/dashboard": "Dashboard",
  "/dashboard-public": "Dashboard",
  "/dashboard/meu-dashboard": "Meu Dashboard",
  "/dashboard/relatorios": "Relatórios",
  "/dashboard/clubs": "Clubes",
  "/dashboard/clubs/favorites": "Clubes favoritos",
  "/dashboard/leagues": "Ligas",
  "/dashboard/leagues/favorites": "Ligas favoritas",
  "/dashboard/countries": "Países",
  "/dashboard/players": "Jogadores",

  "/user": "Meu perfil",
  "/faq": "FAQ",
  "/fale-conosco": "Fale conosco",
  "/me/notifications": "Notificações",
  "/me/profile": "Meus dados",
  "/me/financial": "Financeiro",
  "/me/plans": "Planos",
  "/me/subscription": "Assinatura",
  "/onboarding/preferences": "Configurar preferências",

  "/admin": "Painel Admin",
  "/admin/profile": "Meu perfil",
  "/admin/gestao-paises": "Gestão de Países",
  "/admin/gestao-continentes": "Gestão de Continentes",
  "/admin/gestao-ligas": "Gestão de Ligas",
  "/admin/gestao-clubes": "Gestão de Clubes",
  "/admin/gestao-jogadores": "Gestão de Jogadores",
  "/admin/usuarios": "Usuários",
  "/admin/new-user": "Novo usuário",
  "/admin/gestao-planos": "Gestão de Planos",
  "/admin/gestao-planos/novo": "Novo Plano",
  "/admin/notifications": "Notificações",
  "/admin/banners": "Banners",
  "/admin/regions": "Regiões",
  "/admin/currencies": "Moedas",
  "/admin/faq": "FAQ",
  "/admin/upload/ligas": "Upload de Ligas",
  "/admin/upload/teams": "Upload de Times",
  "/admin/upload/players": "Upload de Jogadores",
  "/admin/upload/matches": "Upload de Partidas",
  "/admin/insights/usuarios": "Insights · Usuários",
  "/admin/insights/clubes": "Insights · Clubes",
  "/admin/insights/ligas": "Insights · Ligas",
  "/admin/insights/financeiro": "Insights · Financeiro",
  "/admin/insights/planos": "Insights · Planos",
  "/admin/insights/importacoes": "Insights · Importações",
  "/admin/insights/uso": "Insights · Uso",
  "/admin/insights/performance": "Insights · Performance",
};

// Each entry: { pattern, fetch: async (id) => string | null }
// Patterns checked in order — first match wins
const DYNAMIC_ROUTES = [
  {
    pattern: /^\/admin\/gestao-planos\/([^/]+)$/,
    fetch: null,
    fallback: "Editar Plano",
  },
  {
    pattern: /^\/admin\/usuarios\/([^/]+)$/,
    fetch: null,
    fallback: "Detalhes do usuário",
  },
  {
    pattern: /^\/admin\/regions\/([^/]+)\/financial-indicators$/,
    fetch: null,
    fallback: "Indicadores Financeiros",
  },
  {
    pattern: /^\/admin\/regions\/([^/]+)\/common-terms$/,
    fetch: null,
    fallback: "Termos Comuns",
  },
  {
    pattern: /^\/admin\/regions\/([^/]+)$/,
    fetch: null,
    fallback: "Detalhe da Região",
  },
  {
    pattern: /^\/dashboard\/clubs\/finance\/([^/]+)$/,
    fetch: async (id) => {
      const { data } = await api.get(`/dashboard/clubs/${id}/info`);
      return data?.club?.name ? `${data.club.name} · Finanças` : null;
    },
    fallback: "Finanças do clube",
  },
  {
    pattern: /^\/dashboard\/clubs\/competitions\/([^/]+)$/,
    fetch: async (id) => {
      const { data } = await api.get(`/dashboard/clubs/${id}/info`);
      return data?.club?.name ? `${data.club.name} · Competições` : null;
    },
    fallback: "Competições do clube",
  },
  {
    pattern: /^\/dashboard\/clubs\/club-players\/([^/]+)$/,
    fetch: async (id) => {
      const { data } = await api.get(`/dashboard/clubs/${id}/info`);
      return data?.club?.name ? `${data.club.name} · Elenco` : null;
    },
    fallback: "Elenco do clube",
  },
  {
    pattern: /^\/dashboard\/clubs\/(\d+)(?:\/[^/]+)?$/,
    fetch: async (id) => {
      const { data } = await api.get(`/dashboard/clubs/${id}/info`);
      return data?.club?.name ?? null;
    },
    fallback: "Clube",
  },
  {
    pattern: /^\/dashboard\/countries\/([^/]+)$/,
    fetch: async (id) => {
      const { data } = await api.get(`/dashboard/countries/${id}`);
      return data?.country?.name ?? null;
    },
    fallback: "País",
  },
  {
    pattern: /^\/dashboard\/league\/([^/]+)$/,
    fetch: async (id) => {
      const { data } = await api.get(`/dashboard/leagues/${id}/info`);
      return data?.league?.name ?? null;
    },
    fallback: "Liga",
  },
  {
    pattern: /^\/dashboard\/players\/([^/]+)$/,
    fetch: async (id) => {
      const { data } = await api.get(`/dashboard/players/${id}`);
      return data?.player?.full_name ?? null;
    },
    fallback: "Jogador",
  },
  {
    pattern: /^\/dashboard\/matches\/([^/]+)$/,
    fetch: async (id) => {
      const { data } = await api.get(`/dashboard/matches/${id}`);
      if (data?.home?.name && data?.away?.name) {
        return `${data.home.name} x ${data.away.name}`;
      }
      return null;
    },
    fallback: "Partida",
  },
];

function setTitle(title) {
  document.title = title ? `${title} • ${SUFFIX}` : SUFFIX;
}

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    // Static match
    if (STATIC_TITLES[pathname]) {
      setTitle(STATIC_TITLES[pathname]);
      return;
    }

    // Dynamic match
    for (const route of DYNAMIC_ROUTES) {
      const match = pathname.match(route.pattern);
      if (!match) continue;

      const id = match[1];

      // Set fallback immediately so the tab isn't blank
      setTitle(route.fallback);

      if (route.fetch) {
        // Capture pathname at call time — ignore result if user navigated away
        const capturedPath = pathname;
        route.fetch(id)
          .then((name) => {
            if (name && document.location.pathname === capturedPath) {
              setTitle(name);
            }
          })
          .catch(() => {/* keep fallback */});
      }

      return;
    }

    // Unknown route
    setTitle(null);
  }, [pathname]);

  return null;
}
