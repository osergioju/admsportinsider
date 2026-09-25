import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import LayoutNodeView from "./LayoutNodeView";
import { ClubModuleContext } from "./ClubModuleContext";
import { collectModuleCodes } from "../../utils/clubModules";
import { makeDefaultClubTree, makeDefaultFederationTree, makeDefaultLeagueTree } from "../../utils/clubDefaultLayout";

// Área modular de uma página de entidade (clube, federação ou competição), abaixo do cabeçalho fixo.
//  - Modo público: busca o layout (próprio ou padrão). Sem layout salvo, ou se der erro, usa o
//    layout padrão embutido (as tiras originais da página).
//  - Modo pré-visualização (admin): recebe `tree` (rascunho ainda não salvo) e só busca os dados.
// Diferenças entre os tipos ficam em KINDS: endpoints, layout padrão e formato dos dados
// (clube/competição: série por ano; federação: por ciclo, na moeda `currency`).
const KINDS = {
  club: {
    layoutUrl: (key) => `/dashboard/clubs/${key}/layout`,
    dataUrl: (key) => `/dashboard/clubs/${key}/module-data`,
    infoUrl: (key) => `/dashboard/clubs/${key}/info`,
    pickInfo: (res) => res.data?.club || null,
    defaultTree: makeDefaultClubTree,
    defaultColor: "#1a1a2e",
    colorsOf: (e) => [e?.primary_color, e?.secondary_color, e?.tertiary_color],
    nameOf: (e) => e?.name,
  },
  // Página FINANCEIRA do clube: só gráficos do gerador (cada um busca o próprio dado). Sem layout
  // salvo não há padrão embutido: quem decide isso é a página (mostra a versão original).
  "club-finance": {
    layoutUrl: (key) => `/dashboard/clubs/${key}/layout?page=finance`,
    dataUrl: (key) => `/dashboard/clubs/${key}/module-data`,
    infoUrl: (key) => `/dashboard/clubs/${key}/info`,
    pickInfo: (res) => res.data?.club || null,
    defaultTree: null,
    usesModuleData: false,
    defaultColor: "#1a1a2e",
    colorsOf: (e) => [e?.primary_color, e?.secondary_color, e?.tertiary_color],
    nameOf: (e) => e?.name,
  },
  federation: {
    layoutUrl: (key) => `/dashboard/federations/${key}/layout`,
    dataUrl: (key) => `/dashboard/federations/${key}/module-data`,
    infoUrl: (key) => `/dashboard/federations/${key}`,
    pickInfo: (res) => res.data?.federation || null,
    defaultTree: makeDefaultFederationTree,
    defaultColor: "#7F33D9",
    colorsOf: (e) => [e?.primary_color, e?.secondary_color, e?.tertiary_color],
    nameOf: (e) => e?.acronym || e?.name,
  },
  // Competição: cores próprias, com a da federação organizadora como reserva
  league: {
    layoutUrl: (key) => `/dashboard/leagues/${key}/layout`,
    dataUrl: (key) => `/dashboard/leagues/${key}/module-data`,
    infoUrl: (key) => `/dashboard/leagues/${key}/info`,
    pickInfo: (res) => res.data?.league || null,
    defaultTree: makeDefaultLeagueTree,
    defaultColor: "#1a1a2e",
    colorsOf: (e) => [e?.primary_color || e?.fed_color1, e?.secondary_color || e?.fed_color2, e?.tertiary_color || e?.fed_color3],
    nameOf: (e) => e?.name,
  },
};

// Pré-visualização: mostra só o que a página publicada mostraria (sem rascunhos nem linhas vazias).
function pruneDrafts(node) {
  if (node.type === "stack") {
    const children = (node.children || []).map(pruneDrafts).filter(Boolean);
    return children.length ? { ...node, children } : null;
  }
  return node.status === "active" ? node : null;
}

function resolveColors(cfg, entity) {
  const [p, sec, ter] = cfg.colorsOf(entity);
  const c1 = p || cfg.defaultColor;
  const c2 = sec || c1;
  const c3 = ter || c2;
  return [c1, c2, c3];
}

// entityKey: id do clube | slug (ou id) da federação. `entity` (opcional) já traz nome/cores.
export default function EntityModules({ kind = "club", entityKey, entity, currency, tree: draftTree, initialLayout, className = "" }) {
  const cfg = KINDS[kind];
  const [layout, setLayout] = useState(initialLayout || null);
  const [fetchedData, setFetchedData] = useState(null);
  const [fetchedEntity, setFetchedEntity] = useState(null);
  const isPreview = !!draftTree;

  // Layout público
  useEffect(() => {
    if (isPreview || initialLayout) return;
    let cancelled = false;
    api
      .get(cfg.layoutUrl(entityKey))
      .then((res) => !cancelled && setLayout(res.data))
      .catch(() => !cancelled && setLayout({ tree: null, source: null, module_data: null }));
    return () => { cancelled = true; };
  }, [cfg, entityKey, isPreview, initialLayout]);

  // Sem layout salvo → padrão embutido (mantém a página como era antes do módulo existir)
  const tree = useMemo(() => {
    if (isPreview) return pruneDrafts(draftTree) || { id: "root", type: "stack", direction: "column", children: [] };
    if (!layout) return null;
    return layout.tree || cfg.defaultTree?.() || null;
  }, [cfg, isPreview, draftTree, layout]);

  const codesKey = useMemo(() => (tree ? collectModuleCodes(tree).sort().join(",") : ""), [tree]);

  // Dados: clube já recebe embutidos no layout (1 requisição, vale pro SSR); senão busca por código.
  const embeddedData = !isPreview ? layout?.module_data || null : null;
  const needsFetch = !!tree && !embeddedData && cfg.usesModuleData !== false;

  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .get(cfg.dataUrl(entityKey), { params: { codes: codesKey, ...(currency ? { to: currency } : {}) } })
        .then((res) => !cancelled && setFetchedData(res.data))
        .catch(() => !cancelled && setFetchedData(null));
    }, isPreview ? 350 : 0); // debounce só na pré-visualização (edição em tempo real)
    return () => { cancelled = true; clearTimeout(timer); };
  }, [cfg, needsFetch, isPreview, entityKey, codesKey, currency]);

  // Cores/nome (a pré-visualização do admin não recebe `entity` pronto)
  useEffect(() => {
    if (entity) return;
    let cancelled = false;
    api.get(cfg.infoUrl(entityKey)).then((res) => !cancelled && setFetchedEntity(cfg.pickInfo(res))).catch(() => {});
    return () => { cancelled = true; };
  }, [cfg, entity, entityKey]);

  const moduleData = embeddedData || fetchedData;
  const info = entity || fetchedEntity;

  const value = useMemo(
    () => ({
      clubId: entityKey,
      // "clubName" = nome da entidade da página (clube ou federação): é o que {{club}}/{{name}} imprimem
      clubName: cfg.nameOf(info) || moduleData?.entity_name || moduleData?.club_name || "",
      colors: resolveColors(cfg, info),
      moduleData,
    }),
    [entityKey, cfg, info, moduleData]
  );

  if (!tree) return null;

  return (
    <ClubModuleContext.Provider value={value}>
      <div className={className}>
        <LayoutNodeView node={tree} />
      </div>
    </ClubModuleContext.Provider>
  );
}
