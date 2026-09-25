import { createContext, useContext } from "react";

// Página sendo editada ("home", "clubs"...) — o formulário de bloco e o menu de ações mudam
// conforme a página (ex.: módulos de gráfico do clube só existem em "clubs").
export const EditorContext = createContext({ pageKey: "home" });

export function useEditorPage() {
  return useContext(EditorContext).pageKey;
}

// Tipos de bloco oferecidos por página. Páginas de clube/federação não usam o "Gráfico" da Home
// (gráfico pré-cadastrado) — usam o "Gráfico do clube/da federação/da competição", que lê os dados da entidade da página.

// Páginas cujo layout pode ter versão própria por entidade (zona "club:<id>" / "federation:<id>")
export const ENTITY_PAGES = {
  clubs: { kind: "club", zonePrefix: "club:", defaultZone: "default", scope: "club", singular: "clube", plural: "clubes", article: "o", layoutsUrl: "/admin/club-layouts" },
  federations: { kind: "federation", zonePrefix: "federation:", defaultZone: "default", scope: "federation", singular: "federação", plural: "federações", article: "a", layoutsUrl: "/admin/federation-layouts" },
  competitions: { kind: "league", zonePrefix: "league:", defaultZone: "default", scope: "league", singular: "competição", plural: "competições", article: "a", layoutsUrl: "/admin/league-layouts" },
  // Página financeira do clube: mesmas zonas do clube, com prefixo/padrão próprios (page_key continua "clubs")
  "clubs-finance": { kind: "club-finance", zonePrefix: "finance-club:", defaultZone: "finance", scope: "club", singular: "clube", plural: "clubes", article: "o", layoutsUrl: "/admin/club-layouts?section=finance" },
};
export const BLOCK_TYPES_BY_PAGE = {
  clubs: ["club_chart", "number", "text", "carousel", "ad"],
  federations: ["federation_chart", "number", "text", "carousel", "ad"],
  competitions: ["league_chart", "number", "text", "carousel", "ad"],
  // Página FINANCEIRA do clube: gráficos do gerador (do tipo "clube da página") + texto/publicidade
  "clubs-finance": ["chart", "text", "number", "carousel", "ad"],
  default: ["text", "number", "ad", "chart", "external_link", "carousel"],
};
