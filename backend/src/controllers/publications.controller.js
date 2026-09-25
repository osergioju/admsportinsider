import db from "../config/db.js";
import { resolveClubModuleData, collectModuleCodes } from "../services/clubModules.service.js";
import { resolveFederationId } from "../services/federationModules.service.js";
import { resolveLeagueId } from "../services/leagueModules.service.js";

const PAGE_KEYS = ["home", "clubs", "competitions", "federations"];
const BLOCK_TYPES = ["text", "chart", "external_link", "number", "ad", "carousel", "club_chart", "federation_chart", "league_chart"];

// Zonas: "default" (e as da Home), "club:<id>" (layout próprio de um clube, só na página clubs)
// "federation:<id>" (só na página federations) ou "league:<id>" (layout próprio de uma competição, só em competitions)
// Indicadores usados pelo layout padrão embutido no frontend (utils/clubDefaultLayout.js), que vale
// enquanto nenhum layout for salvo. Mantidos aqui pra a resposta já vir com os dados (1 requisição).
const DEFAULT_CLUB_MODULE_CODES = ["revenue", "loans_debt", "tax_debt", "payroll_debt", "other_debt", "net_debt", "net_income"];

const ZONE_RE = /^(default|hero|finance|body|club:\d{1,9}|finance-club:\d{1,9}|federation:\d{1,9}|league:\d{1,9})$/;
const ENTITY_ZONE_PAGE = { "club:": "clubs", "finance-club:": "clubs", "federation:": "federations", "league:": "competitions" };
function isValidZone(pageKey, zone) {
  if (!ZONE_RE.test(zone)) return false;
  // zona de entidade só vale na página da própria entidade
  const prefix = Object.keys(ENTITY_ZONE_PAGE).find((p) => zone.startsWith(p));
  return !prefix || ENTITY_ZONE_PAGE[prefix] === pageKey;
}

function emptyTree() {
  return { type: "stack", direction: "column", children: [] };
}

// Valida recursivamente a forma da árvore antes de salvar — evita persistir
// JSON malformado que quebraria a resolução/renderização depois.
function isValidNode(node) {
  if (!node || typeof node !== "object") return false;
  if (node.type === "stack") {
    return (
      ["row", "column"].includes(node.direction) &&
      Array.isArray(node.children) &&
      node.children.every(isValidNode)
    );
  }
  if (node.type === "block") {
    return BLOCK_TYPES.includes(node.block_type);
  }
  return false;
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
export async function getLayout(req, res) {
  const { pageKey, zone } = req.params;
  if (!PAGE_KEYS.includes(pageKey)) return res.status(400).json({ message: "Página inválida" });
  if (!isValidZone(pageKey, zone)) return res.status(400).json({ message: "Zona inválida" });

  try {
    const result = await db.query(`SELECT tree FROM page_layouts WHERE page_key = $1 AND zone = $2`, [pageKey, zone]);
    // exists=false deixa o editor oferecer um ponto de partida (ex.: layout padrão de clube)
    return res.json({ tree: result.rows[0]?.tree || emptyTree(), exists: result.rows.length > 0 });
  } catch (error) {
    console.error("Erro ao buscar layout:", error);
    return res.status(500).json({ message: "Erro ao buscar layout" });
  }
}

export async function saveLayout(req, res) {
  const { pageKey, zone } = req.params;
  const { tree } = req.body;

  if (!PAGE_KEYS.includes(pageKey)) return res.status(400).json({ message: "Página inválida" });
  if (!isValidZone(pageKey, zone)) return res.status(400).json({ message: "Zona inválida" });
  if (!isValidNode(tree)) return res.status(400).json({ message: "Estrutura de layout inválida" });

  try {
    await db.query(
      `INSERT INTO page_layouts (page_key, zone, tree)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (page_key, zone) DO UPDATE SET tree = EXCLUDED.tree, updated_at = NOW()`,
      [pageKey, zone, JSON.stringify(tree)]
    );
    return res.json({ message: "Layout salvo com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar layout:", error);
    return res.status(500).json({ message: "Erro ao salvar layout" });
  }
}

// ─── LEITURA (dashboard, autenticado) ─────────────────────────────────────────
// Resolve a árvore: coleta todos os chart_id/banner_id referenciados nas folhas,
// busca em lote, e anexa os dados resolvidos em cada folha (ou remove a folha
// se a referência não existir mais — mesmo comportamento defensivo do LEFT JOIN
// que a versão anterior baseada em page_slots já tinha).
function collectRefs(node, chartIds, bannerIds) {
  if (node.type === "stack") {
    node.children.forEach((child) => collectRefs(child, chartIds, bannerIds));
  } else if (node.type === "block") {
    if (node.chart_id) chartIds.add(node.chart_id);
    if (node.banner_id) bannerIds.add(node.banner_id);
  }
}

function resolveNode(node, chartsById, bannersById) {
  if (node.type === "stack") {
    const children = node.children
      .map((child) => resolveNode(child, chartsById, bannersById))
      .filter(Boolean);
    return { ...node, children };
  }

  // block
  if (node.status !== "active") return null;
  if (node.block_type === "chart") {
    const chart = chartsById.get(node.chart_id);
    if (!chart) return null;
    return { ...node, chart_title: chart.title, chart_type: chart.chart_type, source_params: chart.source_params, filters_enabled: chart.filters_enabled };
  }
  if (node.block_type === "ad") {
    const banner = bannersById.get(node.banner_id);
    if (!banner) return null;
    return {
      ...node,
      banner_title: banner.title,
      image_desktop_url: banner.image_desktop_url,
      image_mobile_url: banner.image_mobile_url,
      link_url: banner.link_url,
      banner_format: banner.format,
    };
  }
  return node;
}

// Lê a árvore salva de (pageKey, zone) e resolve refs (chart/banner). null = nunca foi salva.
async function resolveZoneTree(pageKey, zone) {
  const result = await db.query(`SELECT tree FROM page_layouts WHERE page_key = $1 AND zone = $2`, [pageKey, zone]);
  if (!result.rows.length) return null;
  const tree = result.rows[0].tree;

  const chartIds = new Set();
  const bannerIds = new Set();
  collectRefs(tree, chartIds, bannerIds);

  const chartsById = new Map();
  const bannersById = new Map();

  if (chartIds.size) {
    const charts = await db.query(
      `SELECT id, title, chart_type, source_params, filters_enabled FROM chart_definitions WHERE id = ANY($1) AND status != 'archived'`,
      [[...chartIds]]
    );
    charts.rows.forEach((c) => chartsById.set(c.id, c));
  }
  if (bannerIds.size) {
    const banners = await db.query(
      `SELECT id_banner, title, image_desktop_url, image_mobile_url, link_url, format FROM banners WHERE id_banner = ANY($1)`,
      [[...bannerIds]]
    );
    banners.rows.forEach((b) => bannersById.set(b.id_banner, b));
  }

  return resolveNode(tree, chartsById, bannersById) || emptyTree();
}

export async function getResolvedLayout(req, res) {
  const { pageKey, zone } = req.params;
  if (!PAGE_KEYS.includes(pageKey)) return res.status(400).json({ message: "Página inválida" });
  if (!isValidZone(pageKey, zone)) return res.status(400).json({ message: "Zona inválida" });

  try {
    const tree = (await resolveZoneTree(pageKey, zone)) || emptyTree();
    return res.json({ tree });
  } catch (error) {
    console.error("Erro ao resolver layout:", error);
    return res.status(500).json({ message: "Erro ao buscar conteúdo da página" });
  }
}

// Página de UM clube: usa o layout próprio (zone "club:<id>") se existir; senão o padrão
// ("default"). Se nenhum foi salvo, devolve tree=null e o frontend usa o layout padrão embutido.
// Já embute os dados financeiros que os blocos precisam (1 consulta, vale pra SSR também).
export async function getResolvedClubLayout(req, res) {
  const clubId = Number(req.params.id);
  if (!Number.isInteger(clubId) || clubId <= 0) return res.status(400).json({ message: "Clube inválido" });

  // ?page=finance → página FINANCEIRA do clube (zonas "finance-club:<id>" / "finance"); padrão = página inicial
  const isFinance = req.query.page === "finance";
  const ownZone = isFinance ? `finance-club:${clubId}` : `club:${clubId}`;
  const defaultZone = isFinance ? "finance" : "default";

  try {
    let tree = await resolveZoneTree("clubs", ownZone);
    let source = tree ? "club" : null;
    if (!tree) {
      tree = await resolveZoneTree("clubs", defaultZone);
      source = tree ? "default" : null;
    }

    // Financeira: os gráficos buscam o próprio dado (endpoint por gráfico) — nada embutido aqui.
    // Inicial: já embute os dados dos blocos (1 requisição, vale pro SSR).
    const module_data = isFinance
      ? null
      : await resolveClubModuleData(clubId, tree ? collectModuleCodes(tree) : DEFAULT_CLUB_MODULE_CODES);
    return res.json({ tree, source, module_data });
  } catch (error) {
    console.error("Erro ao resolver layout do clube:", error);
    return res.status(500).json({ message: "Erro ao buscar conteúdo da página do clube" });
  }
}

// Página de UMA federação: layout próprio (zone "federation:<id>") ou o padrão; tree=null → o frontend
// usa o padrão embutido. Os dados (por ciclo, na moeda escolhida) vêm de /federations/:slug/module-data.
export async function getResolvedFederationLayout(req, res) {
  try {
    const federationId = await resolveFederationId(req.params.slug);
    if (!federationId) return res.status(404).json({ message: "Federação não encontrada" });

    let tree = await resolveZoneTree("federations", `federation:${federationId}`);
    let source = tree ? "federation" : null;
    if (!tree) {
      tree = await resolveZoneTree("federations", "default");
      source = tree ? "default" : null;
    }
    return res.json({ tree, source });
  } catch (error) {
    console.error("Erro ao resolver layout da federação:", error);
    return res.status(500).json({ message: "Erro ao buscar conteúdo da página da federação" });
  }
}

// Página de UMA competição: layout próprio (zone "league:<id>") ou o padrão; tree=null → o frontend
// usa o padrão embutido. Os dados vêm de /leagues/:id/module-data.
export async function getResolvedLeagueLayout(req, res) {
  try {
    const leagueId = await resolveLeagueId(req.params.id);
    if (!leagueId) return res.status(404).json({ message: "Competição não encontrada" });

    let tree = await resolveZoneTree("competitions", `league:${leagueId}`);
    let source = tree ? "league" : null;
    if (!tree) {
      tree = await resolveZoneTree("competitions", "default");
      source = tree ? "default" : null;
    }
    return res.json({ tree, source });
  } catch (error) {
    console.error("Erro ao resolver layout da competição:", error);
    return res.status(500).json({ message: "Erro ao buscar conteúdo da página da competição" });
  }
}

// ─── ADMIN: layouts próprios de clube ─────────────────────────────────────────
export async function listClubLayouts(req, res) {
  const prefix = req.query.section === "finance" ? "finance-club:" : "club:";
  try {
    const result = await db.query(`
      SELECT pl.zone, c.id_club AS id, c.name, pl.updated_at
      FROM page_layouts pl
      JOIN clubs c ON pl.zone = $1::text || c.id_club::text
      WHERE pl.page_key = 'clubs'
      ORDER BY c.name ASC
    `, [prefix]);
    return res.json({ layouts: result.rows });
  } catch (error) {
    console.error("Erro ao listar layouts de clube:", error);
    return res.status(500).json({ message: "Erro ao listar layouts de clube" });
  }
}

export async function listFederationLayouts(req, res) {
  try {
    const result = await db.query(`
      SELECT pl.zone, f.id_federation AS id, COALESCE(f.acronym, f.name) AS name, pl.updated_at
      FROM page_layouts pl
      JOIN federations f ON pl.zone = 'federation:' || f.id_federation
      WHERE pl.page_key = 'federations'
      ORDER BY name ASC
    `);
    return res.json({ layouts: result.rows });
  } catch (error) {
    console.error("Erro ao listar layouts de federação:", error);
    return res.status(500).json({ message: "Erro ao listar layouts de federação" });
  }
}

export async function listLeagueLayouts(req, res) {
  try {
    const result = await db.query(`
      SELECT pl.zone, l.id_league AS id, l.name, pl.updated_at
      FROM page_layouts pl
      JOIN leagues l ON pl.zone = 'league:' || l.id_league
      WHERE pl.page_key = 'competitions'
      ORDER BY l.name ASC
    `);
    return res.json({ layouts: result.rows });
  } catch (error) {
    console.error("Erro ao listar layouts de competição:", error);
    return res.status(500).json({ message: "Erro ao listar layouts de competição" });
  }
}

// Remove o layout salvo. Em zona "club:<id>"/"federation:<id>" isso faz a entidade voltar a usar o padrão.
export async function deleteLayout(req, res) {
  const { pageKey, zone } = req.params;
  if (!PAGE_KEYS.includes(pageKey) || !isValidZone(pageKey, zone)) {
    return res.status(400).json({ message: "Página ou zona inválida" });
  }
  if (!["club:", "finance-club:", "federation:", "league:"].some((p) => zone.startsWith(p))) {
    return res.status(400).json({ message: "Só é possível remover layouts próprios de clube, federação ou competição" });
  }
  try {
    await db.query(`DELETE FROM page_layouts WHERE page_key = $1 AND zone = $2`, [pageKey, zone]);
    return res.json({ message: "Layout próprio removido. Voltou a usar o padrão." });
  } catch (error) {
    console.error("Erro ao remover layout:", error);
    return res.status(500).json({ message: "Erro ao remover layout" });
  }
}
