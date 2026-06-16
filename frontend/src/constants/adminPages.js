/**
 * Lista mestra de todas as permissões do painel admin.
 * Cada entry representa uma seção/conjunto de rotas.
 *
 * - key: identificador único enviado ao backend e armazenado em user.admin_permissions[]
 * - label: texto exibido no seletor de permissões em NovoUsuario
 * - group: agrupamento visual no seletor
 * - routes: prefixos de rota cobertos por esta permissão (usados em AdminPermissionRoute)
 */
export const ADMIN_PAGES = [
  // ── Modo Manutenção ──────────────────────────────────
  {
    key: "manutencao",
    label: "Modo Manutenção",
    group: "Gestão",
    routes: ["/admin/manutencao"],
  },

  // ── Gestão de dados ──────────────────────────────────
  {
    key: "gestao-dados",
    label: "Gestão (Países, Competições e Clubes)",
    group: "Gestão",
    routes: ["/admin/gestao-paises", "/admin/gestao-continentes", "/admin/gestao-federacoes", "/admin/gestao-ligas", "/admin/gestao-clubes"],
  },

  // ── Usuários ─────────────────────────────────────────
  {
    key: "usuarios",
    label: "Gestão de Usuários",
    group: "Usuários",
    routes: ["/admin/usuarios", "/admin/new-user"],
  },

  // ── Planos ───────────────────────────────────────────
  {
    key: "planos",
    label: "Gestão de Planos",
    group: "Planos",
    routes: ["/admin/gestao-planos"],
  },

  // ── Upload ───────────────────────────────────────────
  {
    key: "upload-financeiro",
    label: "Upload — Financeiro",
    group: "Dados",
    routes: ["/admin/upload/ligas"],
  },
  {
    key: "upload-times",
    label: "Upload — Times",
    group: "Dados",
    routes: ["/admin/upload/teams"],
  },
  {
    key: "upload-jogadores",
    label: "Upload — Jogadores",
    group: "Dados",
    routes: ["/admin/upload/players"],
  },
  {
    key: "upload-partidas",
    label: "Upload — Partidas",
    group: "Dados",
    routes: ["/admin/upload/matches"],
  },

  // ── Conteúdo ─────────────────────────────────────────
  {
    key: "banners",
    label: "Banners",
    group: "Conteúdo",
    routes: ["/admin/banners"],
  },
  {
    key: "notifications",
    label: "Notificações",
    group: "Conteúdo",
    routes: ["/admin/notifications"],
  },
  {
    key: "faq",
    label: "FAQ",
    group: "Conteúdo",
    routes: ["/admin/faq"],
  },
  {
    key: "legal",
    label: "Páginas Legais",
    group: "Conteúdo",
    routes: ["/admin/legal"],
  },
  {
    key: "update-notes",
    label: "Notas de Atualização",
    group: "Conteúdo",
    routes: ["/admin/update-notes"],
  },

  // ── Configuração ─────────────────────────────────────
  {
    key: "regions",
    label: "Idioma e Regiões",
    group: "Configuração",
    routes: ["/admin/regions"],
  },
  {
    key: "currencies",
    label: "Moedas",
    group: "Configuração",
    routes: ["/admin/currencies"],
  },

  // ── Insights ─────────────────────────────────────────
  {
    key: "insights-usuarios",
    label: "Insights — Usuários",
    group: "Insights",
    routes: ["/admin/insights/usuarios"],
  },
  {
    key: "insights-clubes",
    label: "Insights — Clubes",
    group: "Insights",
    routes: ["/admin/insights/clubes"],
  },
  {
    key: "insights-ligas",
    label: "Insights — Competições",
    group: "Insights",
    routes: ["/admin/insights/ligas"],
  },
  {
    key: "insights-financeiro",
    label: "Insights — Financeiro",
    group: "Insights",
    routes: ["/admin/insights/financeiro"],
  },
  {
    key: "insights-planos",
    label: "Insights — Planos",
    group: "Insights",
    routes: ["/admin/insights/planos"],
  },
  {
    key: "insights-importacoes",
    label: "Insights — Importações",
    group: "Insights",
    routes: ["/admin/insights/importacoes"],
  },
  {
    key: "insights-uso",
    label: "Insights — Uso do Sistema",
    group: "Insights",
    routes: ["/admin/insights/uso"],
  },
  {
    key: "insights-performance",
    label: "Insights — Performance",
    group: "Insights",
    routes: ["/admin/insights/performance"],
  },
];

/** Agrupa ADMIN_PAGES por campo `group` para renderização em checkboxes */
export function groupedAdminPages() {
  return ADMIN_PAGES.reduce((acc, page) => {
    if (!acc[page.group]) acc[page.group] = [];
    acc[page.group].push(page);
    return acc;
  }, {});
}
