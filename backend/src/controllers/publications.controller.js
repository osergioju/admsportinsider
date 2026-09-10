import db from "../config/db.js";

const PAGE_KEYS = ["home", "clubs", "competitions", "federations"];
const BLOCK_TYPES = ["text", "chart", "external_link", "number", "ad", "carousel"];

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

  try {
    const result = await db.query(`SELECT tree FROM page_layouts WHERE page_key = $1 AND zone = $2`, [pageKey, zone]);
    return res.json({ tree: result.rows[0]?.tree || emptyTree() });
  } catch (error) {
    console.error("Erro ao buscar layout:", error);
    return res.status(500).json({ message: "Erro ao buscar layout" });
  }
}

export async function saveLayout(req, res) {
  const { pageKey, zone } = req.params;
  const { tree } = req.body;

  if (!PAGE_KEYS.includes(pageKey)) return res.status(400).json({ message: "Página inválida" });
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
    return { ...node, chart_title: chart.title, chart_type: chart.chart_type, source_params: chart.source_params };
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

export async function getResolvedLayout(req, res) {
  const { pageKey, zone } = req.params;
  if (!PAGE_KEYS.includes(pageKey)) return res.status(400).json({ message: "Página inválida" });

  try {
    const result = await db.query(`SELECT tree FROM page_layouts WHERE page_key = $1 AND zone = $2`, [pageKey, zone]);
    const tree = result.rows[0]?.tree || emptyTree();

    const chartIds = new Set();
    const bannerIds = new Set();
    collectRefs(tree, chartIds, bannerIds);

    const chartsById = new Map();
    const bannersById = new Map();

    if (chartIds.size) {
      const charts = await db.query(
        `SELECT id, title, chart_type, source_params FROM chart_definitions WHERE id = ANY($1) AND status != 'archived'`,
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

    const resolved = resolveNode(tree, chartsById, bannersById) || emptyTree();
    return res.json({ tree: resolved });
  } catch (error) {
    console.error("Erro ao resolver layout:", error);
    return res.status(500).json({ message: "Erro ao buscar conteúdo da página" });
  }
}
