import db from "../config/db.js";

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function getMaintenanceOverview(req, res) {
  try {
    const [countries, leagues, federations] = await Promise.all([
      db.query(`
        SELECT co.id_country, co.name, co.flag_url, co.active,
          COUNT(DISTINCT cl.id_club)   FILTER (WHERE cl.active)  AS clubs_active,
          COUNT(DISTINCT cl.id_club)   FILTER (WHERE NOT cl.active) AS clubs_inactive,
          COUNT(DISTINCT l.id_league)  FILTER (WHERE l.active)   AS leagues_active,
          COUNT(DISTINCT l.id_league)  FILTER (WHERE NOT l.active) AS leagues_inactive
        FROM countries co
        LEFT JOIN clubs cl   ON cl.id_country  = co.id_country
        LEFT JOIN leagues l  ON l.id_country   = co.id_country
        GROUP BY co.id_country, co.name, co.flag_url, co.active
        ORDER BY co.name ASC
      `),
      db.query(`
        SELECT l.id_league, l.name, l.slug, l.active,
          c.name AS country_name, c.flag_url,
          ct.name AS continent_name,
          f.acronym AS federation_acronym
        FROM leagues l
        LEFT JOIN countries c    ON c.id_country   = l.id_country
        LEFT JOIN continents ct  ON ct.id_continent = l.id_continent
        LEFT JOIN federations f  ON f.id_federation = l.id_federation
        ORDER BY l.name ASC
      `),
      db.query(`
        SELECT f.id_federation, f.name, f.acronym, f.slug, f.active, f.sphere,
          COUNT(l.id_league) FILTER (WHERE l.active)     AS leagues_active,
          COUNT(l.id_league) FILTER (WHERE NOT l.active) AS leagues_inactive
        FROM federations f
        LEFT JOIN leagues l ON l.id_federation = f.id_federation
        GROUP BY f.id_federation
        ORDER BY
          CASE f.sphere WHEN 'global' THEN 0 WHEN 'continental' THEN 1 ELSE 2 END,
          f.name ASC
      `),
    ]);

    return res.json({
      countries:   countries.rows,
      leagues:     leagues.rows,
      federations: federations.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao carregar overview de manutenção" });
  }
}

// ─── Toggle País (cascata: clubs + ligas) ─────────────────────────────────────

export async function toggleCountry(req, res) {
  const { id } = req.params;
  const { active, cascade = true } = req.body;

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE countries SET active=$1 WHERE id_country=$2", [active, id]);

    if (cascade) {
      await client.query("UPDATE clubs   SET active=$1 WHERE id_country=$2", [active, id]);
      await client.query("UPDATE leagues SET active=$1 WHERE id_country=$2", [active, id]);
    }

    const affected = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM clubs   WHERE id_country=$1) AS clubs,
        (SELECT COUNT(*) FROM leagues WHERE id_country=$1) AS leagues
    `, [id]);

    await client.query("COMMIT");
    return res.json({ success: true, active, affected: affected.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Erro ao alternar país" });
  } finally {
    client.release();
  }
}

// ─── Toggle Liga ──────────────────────────────────────────────────────────────

export async function toggleLeague(req, res) {
  const { id } = req.params;
  const { active } = req.body;
  try {
    await db.query("UPDATE leagues SET active=$1 WHERE id_league=$2", [active, id]);
    return res.json({ success: true, active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao alternar liga" });
  }
}

// ─── Toggle Federação (cascata: ligas) ───────────────────────────────────────

export async function toggleFederation(req, res) {
  const { id } = req.params;
  const { active, cascade = true } = req.body;

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE federations SET active=$1 WHERE id_federation=$2", [active, id]);
    if (cascade) {
      await client.query("UPDATE leagues SET active=$1 WHERE id_federation=$2", [active, id]);
    }
    await client.query("COMMIT");
    return res.json({ success: true, active });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Erro ao alternar federação" });
  } finally {
    client.release();
  }
}

// ─── Bulk toggle ──────────────────────────────────────────────────────────────

export async function bulkToggle(req, res) {
  const { type, ids, active } = req.body;
  if (!["country","league","federation"].includes(type)) {
    return res.status(400).json({ message: "Tipo inválido" });
  }

  const tableMap = { country: "countries", league: "leagues", federation: "federations" };
  const idMap    = { country: "id_country", league: "id_league", federation: "id_federation" };

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE ${tableMap[type]} SET active=$1 WHERE ${idMap[type]} = ANY($2)`,
      [active, ids]
    );
    if (type === "country") {
      await client.query("UPDATE clubs   SET active=$1 WHERE id_country  = ANY($2)", [active, ids]);
      await client.query("UPDATE leagues SET active=$1 WHERE id_country  = ANY($2)", [active, ids]);
    }
    if (type === "federation") {
      await client.query("UPDATE leagues SET active=$1 WHERE id_federation = ANY($2)", [active, ids]);
    }
    await client.query("COMMIT");
    return res.json({ success: true, count: ids.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Erro no bulk toggle" });
  } finally {
    client.release();
  }
}

// ─── Manutenção do Sistema (feature flags de páginas/menus do usuário) ────────
// Catálogo fixo em código; o banco (system_features) guarda apenas overrides.
// Chave com "." é subitem — desativar o pai esconde os filhos em cascata no front.

export const SYSTEM_FEATURES = [
  // Menu principal
  { key: "competitions",           label: "Competições",          group: "Menu principal", parent: null },
  { key: "competitions.favorites", label: "Favoritos",            group: "Menu principal", parent: "competitions" },
  { key: "clubs",                  label: "Clubes",               group: "Menu principal", parent: null },
  { key: "clubs.favorites",        label: "Favoritos",            group: "Menu principal", parent: "clubs" },
  { key: "federations",            label: "Federações",           group: "Menu principal", parent: null },
  { key: "federations.favorites",  label: "Favoritas",            group: "Menu principal", parent: "federations" },
  { key: "countries",              label: "Países",               group: "Menu principal", parent: null },
  { key: "reports",                label: "Relatórios",           group: "Menu principal", parent: null },
  // Minha conta
  { key: "profile",                label: "Perfil",               group: "Minha conta", parent: null },
  { key: "profile.personal",       label: "Informações pessoais", group: "Minha conta", parent: "profile" },
  { key: "profile.preferences",    label: "Preferências",         group: "Minha conta", parent: "profile" },
  { key: "profile.subscriptions",  label: "Plano e assinatura",   group: "Minha conta", parent: "profile" },
  { key: "profile.delete",         label: "Apagar conta",         group: "Minha conta", parent: "profile" },
  { key: "financial",              label: "Financeiro",           group: "Minha conta", parent: null },
  // Suporte
  { key: "faq",                    label: "Perguntas frequentes", group: "Suporte", parent: null },
  { key: "contact",                label: "Fale conosco",         group: "Suporte", parent: null },
];

async function loadFeatureStates() {
  const r = await db.query("SELECT key, active FROM system_features");
  const overrides = Object.fromEntries(r.rows.map(x => [x.key, x.active]));
  const map = {};
  for (const f of SYSTEM_FEATURES) map[f.key] = overrides[f.key] ?? true;
  return map;
}

// GET /public/system-features — consumido pelo app do usuário
export async function getPublicSystemFeatures(req, res) {
  try {
    return res.json({ features: await loadFeatureStates() });
  } catch (err) {
    console.error("Erro ao buscar system features:", err);
    // Em erro, devolve tudo ativo para nunca derrubar o app
    return res.json({ features: {} });
  }
}

// GET /admin/maintenance/system — catálogo completo para o painel
export async function getSystemFeatures(req, res) {
  try {
    const states = await loadFeatureStates();
    return res.json({
      features: SYSTEM_FEATURES.map(f => ({ ...f, active: states[f.key] })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar funcionalidades do sistema" });
  }
}

// PUT /admin/maintenance/system/:key  { active }
export async function toggleSystemFeature(req, res) {
  const { key } = req.params;
  const { active } = req.body;
  if (!SYSTEM_FEATURES.some(f => f.key === key)) {
    return res.status(404).json({ message: "Funcionalidade desconhecida" });
  }
  if (typeof active !== "boolean") {
    return res.status(400).json({ message: "Campo 'active' deve ser booleano" });
  }
  try {
    await db.query(
      `INSERT INTO system_features (key, active, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET active = EXCLUDED.active, updated_at = NOW()`,
      [key, active]
    );
    return res.json({ key, active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao alternar funcionalidade" });
  }
}
