import db from "../config/db.js";
import slugify from "slugify";

// ─────────────────────────────────────────────────────────────────────────────
// Import de dados esportivos via API FootyStats (tela /admin/api/importar).
//
// Fluxo: país → competição da API ↔ liga da plataforma (leagues.api_league_name)
//        → temporada (season_id da API) → mapeamento de clubes (clubs.api_club_id)
//        → preview (dry-run, nada é gravado) → import real (partidas, stats de
//        clubes e jogadores), com modo upsert ou só-inserir.
//
// Uma vez que um clube/jogador tem o api_*_id gravado, os próximos imports
// resolvem por ID — nome só é usado como sugestão no mapeamento inicial.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "footystats_api_token";
const BASE = "https://api.football-data-api.com";

async function getToken() {
  const r = await db.query("SELECT value FROM app_settings WHERE key = $1", [TOKEN_KEY]);
  return r.rows[0]?.value ?? null;
}

async function fsGet(token, path, params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `&${k}=${encodeURIComponent(v)}`)
    .join("");
  const url = `${BASE}/${path}?key=${encodeURIComponent(token)}${qs}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const body = await resp.json().catch(() => null);
  if (!resp.ok || body?.success === false) {
    const msg = body?.message || `FootyStats respondeu HTTP ${resp.status} em /${path}`;
    const err = new Error(Array.isArray(msg) ? msg.join("; ") : msg);
    err.isApiError = true;
    throw err;
  }
  return body;
}

// Busca todas as páginas de um endpoint paginado (league-matches, league-players)
async function fsGetAll(token, path, params = {}) {
  const all = [];
  let page = 1, maxPage = 1;
  do {
    const body = await fsGet(token, path, { ...params, page });
    all.push(...(Array.isArray(body?.data) ? body.data : []));
    maxPage = Number(body?.pager?.max_page) || 1;
    page++;
  } while (page <= maxPage && page <= 50); // trava de segurança
  return all;
}

const toInt = (v) => {
  if (v === null || v === undefined || v === "" || v === "N/A") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};
const toNum = (v) => {
  if (v === null || v === undefined || v === "" || v === "N/A") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};
function buildValues(rowCount, colCount) {
  const rows = [];
  for (let r = 0; r < rowCount; r++) {
    const cols = [];
    for (let c = 0; c < colCount; c++) cols.push(`$${r * colCount + c + 1}`);
    rows.push(`(${cols.join(", ")})`);
  }
  return rows.join(", ");
}
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const slug = (s) => slugify(String(s ?? ""), { lower: true, strict: true });

// FootyStats: ano simples (2025) ou temporada cruzada de 8 dígitos (20252026).
function seasonLabel(y) {
  const s = String(y ?? "");
  return s.length === 8 ? `${s.slice(0, 4)}/${s.slice(6, 8)}` : s;
}
// Ano padrão gravado em seasons.year: o ano FINAL (mesma convenção do CSV,
// que usa o 2º ano do nome do arquivo "2025-to-2026").
function seasonDefaultYear(y) {
  const s = String(y ?? "");
  return s.length === 8 ? Number(s.slice(4, 8)) : Number(s);
}
function unixToDateStr(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return null;
  return new Date(n * 1000).toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/api-import/leagues
// Competições da API (chosen) + ligas da plataforma + vínculos atuais.
// ─────────────────────────────────────────────────────────────────────────────
export async function getImportLeagues(req, res) {
  try {
    const token = await getToken();
    if (!token) return res.status(400).json({ message: "Nenhum token da API salvo. Configure em /admin/api." });

    const [body, platRes] = await Promise.all([
      fsGet(token, "league-list", { chosen_leagues_only: "true" }),
      db.query(`
        SELECT l.id_league, l.name, l.team_type, l.api_league_name, l.api_league_country,
               co.name AS country_name
        FROM leagues l
        LEFT JOIN countries co ON co.id_country = l.id_country
        ORDER BY l.name
      `),
    ]);

    const mappedBy = new Map(); // "name||country" → { id_league, name }
    for (const l of platRes.rows) {
      if (l.api_league_name) {
        mappedBy.set(`${l.api_league_name}||${l.api_league_country ?? ""}`, { id_league: l.id_league, name: l.name });
      }
    }

    const apiLeagues = (Array.isArray(body?.data) ? body.data : [])
      .map((item) => {
        const name = item?.league_name || item?.name || "—";
        const country = item?.country || "—";
        const mapped = mappedBy.get(`${name}||${country}`) ?? null;
        return {
          name,
          country,
          image: item?.image ?? null,
          seasons: (Array.isArray(item?.season) ? item.season : [])
            .map((s) => ({ id: s?.id, year: s?.year, label: seasonLabel(s?.year), defaultYear: seasonDefaultYear(s?.year) }))
            .filter((s) => s.id != null)
            .sort((a, b) => Number(b.year) - Number(a.year)),
          mappedLeague: mapped,
        };
      })
      .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

    const platformLeagues = platRes.rows.map((l) => ({
      id_league: l.id_league,
      name: l.name,
      country: l.country_name,
      team_type: l.team_type,
      api_league_name: l.api_league_name,
      api_league_country: l.api_league_country,
    }));

    res.json({ ok: true, apiLeagues, platformLeagues });
  } catch (err) {
    console.error("[getImportLeagues]", err);
    res.status(err.isApiError ? 502 : 500).json({ message: err.isApiError ? err.message : "Erro ao listar competições da API." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/api-import/map-league  { idLeague, apiName, apiCountry }
// idLeague null/vazio → desfaz o vínculo dessa competição da API.
// ─────────────────────────────────────────────────────────────────────────────
export async function mapImportLeague(req, res) {
  const { idLeague, apiName, apiCountry } = req.body ?? {};
  if (!apiName || !apiCountry) return res.status(400).json({ message: "Informe apiName e apiCountry." });
  try {
    // Remove o vínculo de quem estiver segurando essa competição hoje
    await db.query(
      `UPDATE leagues SET api_league_name = NULL, api_league_country = NULL
       WHERE api_league_name = $1 AND api_league_country = $2`,
      [apiName, apiCountry]
    );
    if (idLeague) {
      await db.query(
        `UPDATE leagues SET api_league_name = $1, api_league_country = $2 WHERE id_league = $3`,
        [apiName, apiCountry, Number(idLeague)]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[mapImportLeague]", err);
    res.status(500).json({ message: "Erro ao salvar vínculo da liga." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/api-import/teams?season_id=X&league_id=Y
// Times da temporada na API + sugestão de clube da plataforma para cada um.
// Sugestão: 1º por api_club_id já gravado, 2º por nome/slug/alias.
// ─────────────────────────────────────────────────────────────────────────────
export async function getImportTeams(req, res) {
  try {
    const leagueId = Number(req.query.league_id);
    // Aceita várias temporadas (season_ids=1,2,3): os times viram a UNIÃO das
    // temporadas, dedup por id da API — elencos mudam com acesso/rebaixamento.
    const seasonIds = String(req.query.season_ids ?? req.query.season_id ?? "")
      .split(",").map(Number).filter(Boolean);
    if (!seasonIds.length || !leagueId) return res.status(400).json({ message: "Informe season_ids e league_id." });

    const token = await getToken();
    if (!token) return res.status(400).json({ message: "Nenhum token da API salvo." });

    const teamsById = new Map();
    for (const sid of seasonIds) {
      for (const t of await fsGetAll(token, "league-teams", { season_id: sid })) {
        if (t?.id != null && !teamsById.has(Number(t.id))) teamsById.set(Number(t.id), t);
      }
    }
    const teams = [...teamsById.values()];

    const lc = await db.query(`SELECT id_country FROM leagues WHERE id_league = $1`, [leagueId]);
    const leagueCountry = lc.rows[0]?.id_country ?? null;

    // Clubes candidatos: do país da liga (ou todos, se liga continental) — sem
    // filtro de active (admin enxerga tudo; active = só visibilidade pública).
    const clubsRes = leagueCountry
      ? await db.query(`
          SELECT c.id_club, c.name, c.short_name, c.description, c.slug, c.api_club_id, c.crest_url,
                 co.name AS country_name
          FROM clubs c LEFT JOIN countries co ON co.id_country = c.id_country
          WHERE c.id_country = $1 OR c.hidden = true
          ORDER BY c.name`, [leagueCountry])
      : await db.query(`
          SELECT c.id_club, c.name, c.short_name, c.description, c.slug, c.api_club_id, c.crest_url,
                 co.name AS country_name
          FROM clubs c LEFT JOIN countries co ON co.id_country = c.id_country
          ORDER BY c.name`);

    // Quem já está mapeado por ID pode ser de outro país (ex: clube movido) —
    // busca global por api_club_id garante que o vínculo apareça sempre.
    const apiIds = teams.map((t) => t?.id).filter((v) => v != null);
    const byApiIdRes = apiIds.length
      ? await db.query(`SELECT id_club, name, api_club_id, crest_url FROM clubs WHERE api_club_id = ANY($1)`, [apiIds])
      : { rows: [] };
    const byApiId = new Map(byApiIdRes.rows.map((c) => [Number(c.api_club_id), c]));

    const aliasesRes = await db.query(`SELECT alias_norm, id_club FROM club_aliases`);
    const clubIdSet = new Set(clubsRes.rows.map((c) => c.id_club));
    const clubById = new Map(clubsRes.rows.map((c) => [c.id_club, c]));

    const byName = new Map();
    for (const c of clubsRes.rows) {
      if (c.slug) byName.set(c.slug, c.id_club);
      byName.set(slug(c.name), c.id_club);
      if (c.short_name) byName.set(slug(c.short_name), c.id_club);
      if (c.description) byName.set(slug(c.description), c.id_club);
    }
    for (const { alias_norm, id_club } of aliasesRes.rows) {
      if (clubIdSet.has(id_club) && !byName.has(alias_norm)) byName.set(alias_norm, id_club);
    }

    const result = teams.map((t) => {
      const apiId = Number(t?.id);
      let suggestion = null;
      const already = byApiId.get(apiId);
      if (already) {
        suggestion = { id_club: already.id_club, name: already.name, via: "api_id" };
      } else {
        const candidates = [t?.name, t?.cleanName, t?.english_name, t?.shortHand, t?.full_name];
        for (const cand of candidates) {
          if (!cand) continue;
          const idClub = byName.get(slug(cand));
          if (idClub) {
            suggestion = { id_club: idClub, name: clubById.get(idClub)?.name ?? cand, via: "name" };
            break;
          }
        }
      }
      return {
        apiId,
        name: t?.name ?? "—",
        cleanName: t?.cleanName ?? null,
        image: t?.image ?? null,
        country: t?.country ?? null,
        suggestion,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      ok: true,
      leagueCountryId: leagueCountry,
      teams: result,
      clubs: clubsRes.rows.map((c) => ({
        id_club: c.id_club, name: c.name, country_name: c.country_name, api_club_id: c.api_club_id,
      })),
    });
  } catch (err) {
    console.error("[getImportTeams]", err);
    res.status(err.isApiError ? 502 : 500).json({ message: err.isApiError ? err.message : "Erro ao listar times da API." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/api-import/map-clubs
// { mappings: [{ apiId, idClub }], creations: [{ apiId, name, crestUrl, idCountry }] }
// Grava clubs.api_club_id. Criação: se já existir clube com mesmo nome+país,
// aproveita o existente (só grava o api_club_id) em vez de duplicar.
// ─────────────────────────────────────────────────────────────────────────────
export async function mapImportClubs(req, res) {
  const mappings = Array.isArray(req.body?.mappings) ? req.body.mappings : [];
  const creations = Array.isArray(req.body?.creations) ? req.body.creations : [];
  if (!mappings.length && !creations.length) {
    return res.status(400).json({ message: "Nada para salvar." });
  }
  let client;
  try {
    client = await db.connect();
    await client.query("BEGIN");

    const saved = [];
    const created = [];
    const errors = [];

    for (const m of mappings) {
      const apiId = Number(m?.apiId);
      const idClub = Number(m?.idClub);
      if (!apiId || !idClub) { errors.push({ apiId: m?.apiId, error: "apiId/idClub inválidos" }); continue; }
      // Libera o api_club_id se outro clube o estiver segurando (remapeamento)
      await client.query(`UPDATE clubs SET api_club_id = NULL WHERE api_club_id = $1 AND id_club <> $2`, [apiId, idClub]);
      const r = await client.query(`UPDATE clubs SET api_club_id = $1 WHERE id_club = $2 RETURNING id_club, name`, [apiId, idClub]);
      if (r.rows[0]) saved.push({ apiId, ...r.rows[0] });
      else errors.push({ apiId, error: `Clube ${idClub} não encontrado` });
    }

    for (const c of creations) {
      const apiId = Number(c?.apiId);
      const name = String(c?.name ?? "").trim();
      const idCountry = c?.idCountry ? Number(c.idCountry) : null;
      const crestUrl = c?.crestUrl || null;
      if (!apiId || !name || !idCountry) {
        errors.push({ apiId: c?.apiId, error: "Criação exige apiId, name e idCountry" });
        continue;
      }
      // Já existe com esse nome no país? Usa o existente (evita clube gêmeo).
      const existing = await client.query(
        `SELECT id_club, name FROM clubs WHERE lower(name) = lower($1) AND id_country = $2`,
        [name, idCountry]
      );
      if (existing.rows[0]) {
        const idClub = existing.rows[0].id_club;
        await client.query(`UPDATE clubs SET api_club_id = NULL WHERE api_club_id = $1 AND id_club <> $2`, [apiId, idClub]);
        await client.query(
          `UPDATE clubs SET api_club_id = $1, crest_url = COALESCE(crest_url, $2) WHERE id_club = $3`,
          [apiId, crestUrl, idClub]
        );
        saved.push({ apiId, id_club: idClub, name: existing.rows[0].name, reused: true });
        continue;
      }
      // Slug único: base ou base-2, base-3…
      const baseSlug = slug(name) || `clube-${apiId}`;
      let finalSlug = baseSlug;
      for (let i = 2; i <= 20; i++) {
        const taken = await client.query(`SELECT 1 FROM clubs WHERE slug = $1`, [finalSlug]);
        if (!taken.rows.length) break;
        finalSlug = `${baseSlug}-${i}`;
      }
      await client.query(`UPDATE clubs SET api_club_id = NULL WHERE api_club_id = $1`, [apiId]);
      const ins = await client.query(
        `INSERT INTO clubs (name, id_country, crest_url, slug, api_club_id, active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id_club, name`,
        [name, idCountry, crestUrl, finalSlug, apiId]
      );
      created.push({ apiId, ...ins.rows[0] });
    }

    await client.query("COMMIT");
    res.json({ ok: true, saved, created, errors });
  } catch (err) {
    if (client) { try { await client.query("ROLLBACK"); } catch { /* já caiu */ } }
    console.error("[mapImportClubs]", err);
    res.status(500).json({ message: "Erro ao salvar mapeamento de clubes.", detail: err.message });
  } finally {
    if (client) client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Coleta e resolução comuns a preview e run
// ─────────────────────────────────────────────────────────────────────────────
async function collectData({ token, seasonId, targets, includeIncomplete }) {
  const wantMatches = !!targets?.matches;
  const wantTeamStats = !!targets?.teamStats;
  const wantPlayers = !!targets?.players;

  // Times sempre (base do mapeamento); stats só se o alvo pedir
  const teams = await fsGetAll(token, "league-teams", {
    season_id: seasonId,
    ...(wantTeamStats ? { include: "stats" } : {}),
  });

  const matches = wantMatches
    ? await fsGetAll(token, "league-matches", { season_id: seasonId, max_per_page: 500 })
    : [];
  const players = wantPlayers
    ? await fsGetAll(token, "league-players", { season_id: seasonId, include: "stats" })
    : [];

  // Todos os api ids de time referenciados pelos dados selecionados
  const teamNameByApiId = new Map();
  for (const t of teams) if (t?.id != null) teamNameByApiId.set(Number(t.id), { name: t.name ?? "—", image: t.image ?? null });

  const referencedIds = new Set(teams.map((t) => Number(t.id)));
  for (const m of matches) {
    if (m?.homeID != null) {
      referencedIds.add(Number(m.homeID));
      if (!teamNameByApiId.has(Number(m.homeID))) teamNameByApiId.set(Number(m.homeID), { name: m.home_name ?? `time ${m.homeID}`, image: m.home_image ?? null });
    }
    if (m?.awayID != null) {
      referencedIds.add(Number(m.awayID));
      if (!teamNameByApiId.has(Number(m.awayID))) teamNameByApiId.set(Number(m.awayID), { name: m.away_name ?? `time ${m.awayID}`, image: m.away_image ?? null });
    }
  }
  for (const p of players) if (p?.club_team_id != null && Number(p.club_team_id) > 0) referencedIds.add(Number(p.club_team_id));

  // Resolve api_club_id → id_club
  const idsArr = [...referencedIds];
  const mapRes = idsArr.length
    ? await db.query(`SELECT id_club, api_club_id FROM clubs WHERE api_club_id = ANY($1)`, [idsArr])
    : { rows: [] };
  const clubByApiId = new Map(mapRes.rows.map((r) => [Number(r.api_club_id), r.id_club]));

  const unmappedTeams = idsArr
    .filter((id) => !clubByApiId.has(id))
    .map((id) => ({ apiId: id, ...(teamNameByApiId.get(id) ?? { name: `time ${id}`, image: null }) }));

  // Filtro de status das partidas
  const usableMatches = includeIncomplete ? matches : matches.filter((m) => m?.status === "complete");

  return { teams, matches, usableMatches, players, clubByApiId, unmappedTeams };
}

function buildMatchRow(m, idLeague, idSeason, clubByApiId) {
  const homeId = clubByApiId.get(Number(m.homeID));
  const awayId = clubByApiId.get(Number(m.awayID));
  if (!homeId || !awayId) return null;
  const ts = Number(m.date_unix) > 0 ? Number(m.date_unix) : null;
  const gw = toInt(m.game_week);
  const attendance = toInt(m.attendance);
  return [
    idLeague, idSeason, homeId, awayId,
    ts, ts ? new Date(ts * 1000) : null,
    m.status ?? null,
    attendance != null && attendance >= 0 ? attendance : null,
    null, // referee (API manda só refereeID)
    m.stadium_name || null,
    gw != null && gw > 0 ? gw : null,
    toInt(m.homeGoalCount) ?? 0,
    toInt(m.awayGoalCount) ?? 0,
    // stats (13–30) — mesmo layout do importMatches
    toInt(m.team_a_shots), toInt(m.team_b_shots),
    toInt(m.team_a_shotsOnTarget), toInt(m.team_b_shotsOnTarget),
    toInt(m.team_a_possession), toInt(m.team_b_possession),
    toInt(m.team_a_corners), toInt(m.team_b_corners),
    toInt(m.team_a_fouls), toInt(m.team_b_fouls),
    toInt(m.team_a_yellow_cards), toInt(m.team_b_yellow_cards),
    toInt(m.team_a_red_cards), toInt(m.team_b_red_cards),
    toNum(m.team_a_xg_prematch), toNum(m.team_b_xg_prematch),
    toInt(m.ht_goals_team_a), toInt(m.ht_goals_team_b),
  ];
}

// stats de time da API → linha de club_competition_stats (ordem do importTeams)
function buildTeamStatsRow(t, idCompetitionSeason, idClub) {
  const s = t?.stats ?? {};
  const matchesPlayed = toInt(s.seasonMatchesPlayed_overall);
  const ppg = toNum(s.seasonPPG_overall);
  const points = matchesPlayed != null && ppg != null ? Math.round(ppg * matchesPlayed) : null;
  return [
    idCompetitionSeason, idClub,
    toInt(s.leaguePosition_overall), toInt(s.leaguePosition_home), toInt(s.leaguePosition_away),
    points,
    matchesPlayed, toInt(s.seasonMatchesPlayed_home), toInt(s.seasonMatchesPlayed_away),
    toInt(s.seasonWinsNum_overall), toInt(s.seasonWinsNum_home), toInt(s.seasonWinsNum_away),
    toInt(s.seasonDrawsNum_overall), toInt(s.seasonDrawsNum_home), toInt(s.seasonDrawsNum_away),
    toInt(s.seasonLossesNum_overall), toInt(s.seasonLossesNum_home), toInt(s.seasonLossesNum_away),
    toInt(s.seasonScoredNum_overall), toInt(s.seasonScoredNum_home), toInt(s.seasonScoredNum_away),
    toInt(s.seasonConcededNum_overall), toInt(s.seasonConcededNum_home), toInt(s.seasonConcededNum_away),
    toInt(s.seasonGoalDifference_overall),
    toInt(s.shotsTotal_overall), toInt(s.shotsTotal_home), toInt(s.shotsTotal_away),
    toInt(s.shotsOnTargetTotal_overall), toInt(s.shotsOnTargetTotal_home), toInt(s.shotsOnTargetTotal_away),
    toNum(s.possessionAVG_overall), toNum(s.possessionAVG_home), toNum(s.possessionAVG_away),
    toInt(s.seasonCS_overall), toInt(s.seasonCS_home), toInt(s.seasonCS_away),
    toInt(s.foulsTotal_overall), toInt(s.foulsTotal_home), toInt(s.foulsTotal_away),
    toInt(s.cardsTotal_overall), // yellow_cards = total de cartões (mesma semântica do CSV cards_total)
    null,                        // red_cards — não vem separado
    ppg, toNum(s.seasonPPG_home), toNum(s.seasonPPG_away),
    toInt(s.cornersTotal_overall), toInt(s.cornersTotal_home), toInt(s.cornersTotal_away),
    toInt(s.seasonBTTS_overall), toInt(s.seasonBTTS_home), toInt(s.seasonBTTS_away),
    toNum(s.seasonBTTSPercentage_overall),
    toInt(s.seasonOver15Num_overall), toInt(s.seasonOver25Num_overall), toInt(s.seasonOver35Num_overall),
    toNum(s.seasonOver15Percentage_overall), toNum(s.seasonOver25Percentage_overall), toNum(s.seasonOver35Percentage_overall),
    toNum(s.xg_for_avg_overall), toNum(s.xg_against_avg_overall),
    toNum(s.seasonScoredAVG_overall), toNum(s.seasonConcededAVG_overall), toNum(s.cornersAVG_overall),
    toNum(s.winPercentage_overall), toNum(s.drawPercentage_overall), toNum(s.losePercentage_overall),
    toNum(s.seasonCSPercentage_overall), toInt(t.performance_rank),
    toInt(s.leadingAtHT_overall), toInt(s.leadingAtHT_home), toInt(s.leadingAtHT_away),
    toInt(s.drawingAtHT_overall), toInt(s.drawingAtHT_home), toInt(s.drawingAtHT_away),
    toInt(s.trailingAtHT_overall), toInt(s.trailingAtHT_home), toInt(s.trailingAtHT_away),
    toInt(s.scoredGoalsHT_overall), toInt(s.scoredGoalsHT_home), toInt(s.scoredGoalsHT_away),
    toInt(s.concededGoalsHT_overall), toInt(s.concededGoalsHT_home), toInt(s.concededGoalsHT_away),
    toInt(s.firstGoalScored_overall),
  ];
}

// Normaliza o corpo para uma lista de temporadas.
// Novo formato: { seasons: [{ seasonId, seasonYear, label }] }
// Legado (uma só): { seasonId, seasonYear }
function normalizeSeasons(body) {
  if (Array.isArray(body?.seasons)) {
    return body.seasons
      .map((s) => ({ seasonId: Number(s?.seasonId), seasonYear: Number(s?.seasonYear), label: s?.label ?? null }))
      .filter((s) => s.seasonId && s.seasonYear);
  }
  const seasonId = Number(body?.seasonId);
  const seasonYear = Number(body?.seasonYear);
  return seasonId && seasonYear ? [{ seasonId, seasonYear, label: null }] : [];
}

// Duas temporadas da API gravando no MESMO ano da plataforma = colisão de dados
function findDuplicateYears(seasons) {
  const seen = new Set(), dup = new Set();
  for (const s of seasons) {
    if (seen.has(s.seasonYear)) dup.add(s.seasonYear);
    seen.add(s.seasonYear);
  }
  return [...dup];
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/api-import/preview
// { leagueId, seasons:[{seasonId,seasonYear,label}], targets, includeIncomplete }
// DRY-RUN: nada é gravado. Mostra o que o run faria, temporada a temporada.
// ─────────────────────────────────────────────────────────────────────────────
async function previewOneSeason({ leagueId, season, targets, data }) {
  // Season/competition_season podem ainda não existir — nesse caso tudo é novo
  const sRes = await db.query(`SELECT id_season FROM seasons WHERE year = $1`, [season.seasonYear]);
  const idSeason = sRes.rows[0]?.id_season ?? null;

  const out = {
    seasonId: season.seasonId,
    seasonYear: season.seasonYear,
    label: season.label ?? String(season.seasonYear),
    unmappedCount: data.unmappedTeams.length,
  };

  if (targets.matches) {
      let existingByGw = new Set();
      let existingByTs = new Set();
      if (idSeason) {
        const ex = await db.query(
          `SELECT home_club_id, away_club_id, game_week, match_timestamp
           FROM matches WHERE id_league = $1 AND id_season = $2`,
          [leagueId, idSeason]
        );
        for (const r of ex.rows) {
          if (r.game_week != null) existingByGw.add(`${r.home_club_id}_${r.away_club_id}_${r.game_week}`);
          if (r.match_timestamp != null) existingByTs.add(`${r.home_club_id}_${r.away_club_id}_${r.match_timestamp}`);
        }
      }
      let toInsert = 0, toUpdate = 0, unresolved = 0;
      for (const m of data.usableMatches) {
        const row = buildMatchRow(m, leagueId, idSeason ?? 0, data.clubByApiId);
        if (!row) { unresolved++; continue; }
        const [, , homeId, awayId, ts, , , , , , gw] = row;
        const hit = (gw != null && existingByGw.has(`${homeId}_${awayId}_${gw}`)) ||
                    (gw == null && ts != null && existingByTs.has(`${homeId}_${awayId}_${ts}`));
        if (hit) toUpdate++; else toInsert++;
      }
      out.matches = {
        totalApi: data.matches.length,
        complete: data.matches.filter((m) => m?.status === "complete").length,
        considered: data.usableMatches.length,
        toInsert, toUpdate,
        unresolvedTeams: unresolved,
      };
    }

    if (targets.teamStats) {
      let existing = 0;
      if (idSeason) {
        const cs = await db.query(
          `SELECT cs.id_competition_season FROM competition_seasons cs
           WHERE cs.id_league = $1 AND cs.id_season = $2`,
          [leagueId, idSeason]
        );
        const idCS = cs.rows[0]?.id_competition_season;
        if (idCS) {
          const c = await db.query(
            `SELECT COUNT(*)::int AS n FROM club_competition_stats WHERE id_competition_season = $1 AND id_club IS NOT NULL`,
            [idCS]
          );
          existing = c.rows[0].n;
        }
      }
      const withStats = data.teams.filter((t) => t?.stats && data.clubByApiId.has(Number(t.id))).length;
      out.teamStats = { teamsApi: data.teams.length, withStats, existingRows: existing };
    }

    if (targets.players) {
      const apiIds = data.players.map((p) => Number(p?.id)).filter(Boolean);
      let byApiId = 0;
      if (apiIds.length) {
        const r = await db.query(`SELECT COUNT(*)::int AS n FROM players WHERE api_player_id = ANY($1)`, [apiIds]);
        byApiId = r.rows[0].n;
      }
      const names = [...new Set(data.players.map((p) => p?.full_name).filter(Boolean))];
      let byName = 0;
      if (names.length) {
        const r = await db.query(
          `SELECT COUNT(*)::int AS n FROM players WHERE api_player_id IS NULL AND full_name = ANY($1)`,
          [names]
        );
        byName = r.rows[0].n;
      }
      const noClub = data.players.filter((p) => !(Number(p?.club_team_id) > 0)).length;
      out.players = {
        totalApi: data.players.length,
        matchedByApiId: byApiId,
        matchedByName: byName,
        newPlayers: Math.max(data.players.length - byApiId - byName, 0),
        withoutClub: noClub,
      };
    }

    return out;
}

export async function previewImport(req, res) {
  try {
    const leagueId = Number(req.body?.leagueId);
    const seasons = normalizeSeasons(req.body);
    const targets = req.body?.targets ?? {};
    const includeIncomplete = !!req.body?.includeIncomplete;
    if (!leagueId || !seasons.length) {
      return res.status(400).json({ message: "Informe leagueId e ao menos uma temporada (seasonId + seasonYear)." });
    }
    const dupYears = findDuplicateYears(seasons);
    if (dupYears.length) {
      return res.status(400).json({ message: `Ano repetido entre as temporadas selecionadas: ${dupYears.join(", ")}. Ajuste os anos antes de continuar.` });
    }
    const token = await getToken();
    if (!token) return res.status(400).json({ message: "Nenhum token da API salvo." });

    // Uma temporada por vez: coleta da API (só leitura) + comparação com a base
    const unmappedById = new Map();
    const seasonPreviews = [];
    for (const s of seasons) {
      const data = await collectData({ token, seasonId: s.seasonId, targets, includeIncomplete });
      for (const u of data.unmappedTeams) if (!unmappedById.has(u.apiId)) unmappedById.set(u.apiId, u);
      seasonPreviews.push(await previewOneSeason({ leagueId, season: s, targets, data }));
    }

    res.json({
      ok: true,
      dryRun: true,
      unmappedTeams: [...unmappedById.values()],
      canRun: unmappedById.size === 0,
      seasons: seasonPreviews,
    });
  } catch (err) {
    console.error("[previewImport]", err);
    res.status(err.isApiError ? 502 : 500).json({ message: err.isApiError ? err.message : "Erro ao gerar pré-visualização.", detail: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/api-import/run
// { leagueId, seasons:[{seasonId,seasonYear,label}], targets, includeIncomplete, mode }
// mode: 'upsert' (insere novas + atualiza existentes) | 'insert_only'
// Bloqueia (409) se houver time referenciado sem mapeamento — nunca pula calado.
// Grava temporada por temporada, cada uma em transação própria: se uma falhar,
// as anteriores permanecem gravadas e as seguintes continuam.
// ─────────────────────────────────────────────────────────────────────────────
export async function runImport(req, res) {
  try {
    const leagueId = Number(req.body?.leagueId);
    const seasons = normalizeSeasons(req.body);
    const targets = req.body?.targets ?? {};
    const includeIncomplete = !!req.body?.includeIncomplete;
    const mode = req.body?.mode === "insert_only" ? "insert_only" : "upsert";
    if (!leagueId || !seasons.length) {
      return res.status(400).json({ message: "Informe leagueId e ao menos uma temporada (seasonId + seasonYear)." });
    }
    if (!targets.matches && !targets.teamStats && !targets.players) {
      return res.status(400).json({ message: "Selecione ao menos um alvo (partidas, stats ou jogadores)." });
    }
    const dupYears = findDuplicateYears(seasons);
    if (dupYears.length) {
      return res.status(400).json({ message: `Ano repetido entre as temporadas selecionadas: ${dupYears.join(", ")}. Ajuste os anos antes de importar.` });
    }
    const token = await getToken();
    if (!token) return res.status(400).json({ message: "Nenhum token da API salvo." });

    console.log(`[apiImport] INÍCIO liga=${leagueId} temporadas=${seasons.map((s) => `${s.seasonId}→${s.seasonYear}`).join(",")} alvos=${JSON.stringify(targets)} modo=${mode}`);

    // FASE 1 — coleta tudo da API (só leitura) e valida o mapeamento de TODAS
    // as temporadas ANTES de gravar qualquer coisa. Time sem mapa nunca é
    // pulado em silêncio: devolve a lista e o front volta pro mapeamento.
    const collected = [];
    const unmappedById = new Map();
    for (const s of seasons) {
      const data = await collectData({ token, seasonId: s.seasonId, targets, includeIncomplete });
      for (const u of data.unmappedTeams) if (!unmappedById.has(u.apiId)) unmappedById.set(u.apiId, u);
      collected.push({ season: s, data });
    }
    if (unmappedById.size > 0) {
      return res.status(409).json({
        ok: false,
        message: `${unmappedById.size} time(s) da API sem clube mapeado. Mapeie ou cadastre antes de importar.`,
        unmappedTeams: [...unmappedById.values()],
      });
    }

    // FASE 2 — grava cada temporada em transação própria
    const results = [];
    let allOk = true;
    for (const { season, data } of collected) {
      try {
        const r = await writeOneSeason({ leagueId, seasonYear: season.seasonYear, targets, mode, data });
        results.push({ seasonId: season.seasonId, seasonYear: season.seasonYear, label: season.label ?? String(season.seasonYear), ok: true, ...r });
        console.log(`[apiImport] OK temporada ${season.seasonYear}:`, JSON.stringify(r));
      } catch (err) {
        allOk = false;
        console.error(`[apiImport] FALHA temporada ${season.seasonYear}:`, err);
        results.push({ seasonId: season.seasonId, seasonYear: season.seasonYear, label: season.label ?? String(season.seasonYear), ok: false, error: err.message });
      }
    }

    res.json({ ok: allOk, mode, seasons: results });
  } catch (err) {
    console.error("[apiImport] FALHA:", err);
    res.status(err.isApiError ? 502 : 500).json({ ok: false, message: err.isApiError ? err.message : "Erro ao importar dados da API.", detail: err.message });
  }
}

// Grava UMA temporada (transação própria). Assume clubes já validados pelo run.
async function writeOneSeason({ leagueId, seasonYear, targets, mode, data }) {
  let client;
  try {
    client = await db.connect();
    await client.query("BEGIN");

    // SEASON + competition_seasons (mesma mecânica do import CSV)
    const sRes = await client.query(
      `INSERT INTO seasons (year) VALUES ($1)
       ON CONFLICT (year) DO UPDATE SET year = EXCLUDED.year RETURNING id_season`,
      [seasonYear]
    );
    const idSeason = sRes.rows[0].id_season;
    const csRes = await client.query(
      `INSERT INTO competition_seasons (id_league, id_season) VALUES ($1, $2)
       ON CONFLICT (id_league, id_season) DO UPDATE SET id_league = EXCLUDED.id_league
       RETURNING id_competition_season`,
      [leagueId, idSeason]
    );
    const idCompetitionSeason = csRes.rows[0].id_competition_season;

    const result = {};

    // Clubes da temporada (dos times da API) — garante club_seasons/club_league_seasons
    const seasonClubIds = [...new Set(
      data.teams.map((t) => data.clubByApiId.get(Number(t.id))).filter(Boolean)
    )];
    const clsIdByClub = new Map();
    if (seasonClubIds.length) {
      const csV = buildValues(seasonClubIds.length, 4);
      await client.query(
        `INSERT INTO club_seasons (id_club, id_league, year, division) VALUES ${csV}
         ON CONFLICT (id_club, id_league, year) DO NOTHING`,
        seasonClubIds.flatMap((id) => [id, leagueId, seasonYear, "1"])
      );
      const clsV = buildValues(seasonClubIds.length, 3);
      const clsRes = await client.query(
        `INSERT INTO club_league_seasons (id_club, id_league, id_season) VALUES ${clsV}
         ON CONFLICT (id_club, id_league, id_season) DO UPDATE SET id_club = EXCLUDED.id_club
         RETURNING id_club_league_season, id_club`,
        seasonClubIds.flatMap((id) => [id, leagueId, idSeason])
      );
      for (const r of clsRes.rows) clsIdByClub.set(r.id_club, r.id_club_league_season);
    }

    /* ───────────── PARTIDAS ───────────── */
    if (targets.matches) {
      const rows = data.usableMatches
        .map((m) => buildMatchRow(m, leagueId, idSeason, data.clubByApiId))
        .filter(Boolean);

      const MATCH_COLS = 13;
      const MATCH_UPDATE = `
        match_timestamp = EXCLUDED.match_timestamp,
        match_date      = EXCLUDED.match_date,
        home_goals      = EXCLUDED.home_goals,
        away_goals      = EXCLUDED.away_goals,
        status          = EXCLUDED.status,
        attendance      = EXCLUDED.attendance,
        stadium_name    = EXCLUDED.stadium_name
      `;
      const conflictWithGW = mode === "upsert"
        ? `ON CONFLICT (id_league, id_season, home_club_id, away_club_id, game_week) DO UPDATE SET ${MATCH_UPDATE}`
        : `ON CONFLICT (id_league, id_season, home_club_id, away_club_id, game_week) DO NOTHING`;
      const conflictNoGW = mode === "upsert"
        ? `ON CONFLICT (id_league, id_season, home_club_id, away_club_id, match_timestamp) WHERE game_week IS NULL AND match_timestamp IS NOT NULL DO UPDATE SET ${MATCH_UPDATE}`
        : `ON CONFLICT (id_league, id_season, home_club_id, away_club_id, match_timestamp) WHERE game_week IS NULL AND match_timestamp IS NOT NULL DO NOTHING`;

      // Dedup pela chave de conflito (última ganha), igual ao import CSV
      const dedupGw = new Map();
      const dedupTs = new Map();
      const noKey = [];
      for (const r of rows) {
        if (r[10] != null) dedupGw.set(`${r[2]}_${r[3]}_${r[10]}`, r);
        else if (r[4] != null) dedupTs.set(`${r[2]}_${r[3]}_${r[4]}`, r);
        else noKey.push(r);
      }
      const rowsGw = [...dedupGw.values()];
      const rowsTs = [...dedupTs.values()];

      const insertChunkRows = async (chunkRows, conflictClause) => {
        const params = chunkRows.map((r) => r.slice(0, MATCH_COLS)).flat();
        const values = buildValues(chunkRows.length, MATCH_COLS);
        const r = await client.query(
          `INSERT INTO matches (
             id_league, id_season, home_club_id, away_club_id,
             match_timestamp, match_date, status, attendance,
             referee, stadium_name, game_week, home_goals, away_goals
           ) VALUES ${values} ${conflictClause}
           RETURNING id_match, home_club_id, away_club_id, game_week, match_timestamp`,
          params
        );
        return r.rows;
      };

      // id_match por chave natural (cobre linhas que o DO NOTHING não devolve)
      const fetchIds = async (chunkRows) => {
        const ids = [];
        for (const r of chunkRows) {
          const q = r[10] != null
            ? await client.query(
                `SELECT id_match FROM matches WHERE id_league=$1 AND id_season=$2 AND home_club_id=$3 AND away_club_id=$4 AND game_week=$5 LIMIT 1`,
                [r[0], r[1], r[2], r[3], r[10]]
              )
            : await client.query(
                `SELECT id_match FROM matches WHERE id_league=$1 AND id_season=$2 AND home_club_id=$3 AND away_club_id=$4 AND match_timestamp=$5 LIMIT 1`,
                [r[0], r[1], r[2], r[3], r[4]]
              );
          ids.push(q.rows[0]?.id_match ?? null);
        }
        return ids;
      };

      const STATS_COLS = 18;
      const upsertStats = async (chunkRows, matchIds) => {
        const pairs = chunkRows.map((r, i) => [r, matchIds[i]]).filter(([, id]) => id != null);
        if (!pairs.length) return 0;
        const statsRows = pairs.map(([r, id]) => [id, ...r.slice(MATCH_COLS)]);
        const values = buildValues(statsRows.length, STATS_COLS + 1);
        await client.query(
          `INSERT INTO match_stats (
             id_match,
             home_shots, away_shots, home_shots_on_target, away_shots_on_target,
             home_possession, away_possession, home_corners, away_corners,
             home_fouls, away_fouls, home_yellow_cards, away_yellow_cards,
             home_red_cards, away_red_cards, home_xg_pre, away_xg_pre,
             home_goals_ht, away_goals_ht
           ) VALUES ${values}
           ON CONFLICT (id_match) DO UPDATE SET
             home_shots = EXCLUDED.home_shots, away_shots = EXCLUDED.away_shots,
             home_shots_on_target = EXCLUDED.home_shots_on_target, away_shots_on_target = EXCLUDED.away_shots_on_target,
             home_possession = EXCLUDED.home_possession, away_possession = EXCLUDED.away_possession,
             home_corners = EXCLUDED.home_corners, away_corners = EXCLUDED.away_corners,
             home_fouls = EXCLUDED.home_fouls, away_fouls = EXCLUDED.away_fouls,
             home_yellow_cards = EXCLUDED.home_yellow_cards, away_yellow_cards = EXCLUDED.away_yellow_cards,
             home_red_cards = EXCLUDED.home_red_cards, away_red_cards = EXCLUDED.away_red_cards,
             home_xg_pre = EXCLUDED.home_xg_pre, away_xg_pre = EXCLUDED.away_xg_pre,
             home_goals_ht = EXCLUDED.home_goals_ht, away_goals_ht = EXCLUDED.away_goals_ht`,
          statsRows.flat()
        );
        return pairs.length;
      };

      let written = 0;
      for (const c of chunk(rowsGw, 100)) {
        await insertChunkRows(c, conflictWithGW);
        const ids = await fetchIds(c);
        written += await upsertStats(c, ids);
      }
      for (const c of chunk(rowsTs, 100)) {
        await insertChunkRows(c, conflictNoGW);
        const ids = await fetchIds(c);
        written += await upsertStats(c, ids);
      }
      // Sem gw e sem timestamp: sem chave natural — só insere (raro)
      for (const c of chunk(noKey, 100)) {
        const inserted = await insertChunkRows(c, "ON CONFLICT DO NOTHING");
        written += inserted.length;
      }

      result.matches = {
        consideredApi: data.usableMatches.length,
        written,
        skippedIncomplete: includeIncomplete ? 0 : data.matches.length - data.usableMatches.length,
      };
    }

    /* ───────────── STATS DE CLUBES ───────────── */
    if (targets.teamStats) {
      const statsRows = [];
      for (const t of data.teams) {
        const idClub = data.clubByApiId.get(Number(t.id));
        if (!idClub || !t?.stats) continue;
        statsRows.push(buildTeamStatsRow(t, idCompetitionSeason, idClub));
      }
      const COLS = statsRows[0]?.length ?? 0;
      for (const c of chunk(statsRows, 50)) {
        const values = buildValues(c.length, COLS);
        await client.query(
          `INSERT INTO club_competition_stats (
            id_competition_season, id_club,
            position_total, position_home, position_away,
            points,
            matches_total, matches_home, matches_away,
            wins_total, wins_home, wins_away,
            draws_total, draws_home, draws_away,
            losses_total, losses_home, losses_away,
            goals_for_total, goals_for_home, goals_for_away,
            goals_against_total, goals_against_home, goals_against_away,
            goal_difference,
            shots_total, shots_home, shots_away,
            shots_on_target_total, shots_on_target_home, shots_on_target_away,
            possession_total, possession_home, possession_away,
            clean_sheets_total, clean_sheets_home, clean_sheets_away,
            fouls_total, fouls_home, fouls_away,
            yellow_cards, red_cards,
            points_per_game, points_per_game_home, points_per_game_away,
            corners_total, corners_home, corners_away,
            btts_count, btts_count_home, btts_count_away, btts_percentage,
            over15_count, over25_count, over35_count,
            over15_percentage, over25_percentage, over35_percentage,
            xg_for_avg, xg_against_avg,
            goals_scored_per_match, goals_conceded_per_match, corners_per_match,
            win_percentage, draw_percentage, loss_percentage,
            clean_sheet_percentage, performance_rank,
            ht_winning_total, ht_winning_home, ht_winning_away,
            ht_drawing_total, ht_drawing_home, ht_drawing_away,
            ht_losing_total, ht_losing_home, ht_losing_away,
            ht_goals_scored_total, ht_goals_scored_home, ht_goals_scored_away,
            ht_goals_conceded_total, ht_goals_conceded_home, ht_goals_conceded_away,
            first_team_to_score_count
          ) VALUES ${values}
          ON CONFLICT (id_competition_season, id_club) WHERE id_club IS NOT NULL DO UPDATE SET
            position_total = EXCLUDED.position_total, position_home = EXCLUDED.position_home, position_away = EXCLUDED.position_away,
            points = EXCLUDED.points,
            matches_total = EXCLUDED.matches_total, matches_home = EXCLUDED.matches_home, matches_away = EXCLUDED.matches_away,
            wins_total = EXCLUDED.wins_total, wins_home = EXCLUDED.wins_home, wins_away = EXCLUDED.wins_away,
            draws_total = EXCLUDED.draws_total, draws_home = EXCLUDED.draws_home, draws_away = EXCLUDED.draws_away,
            losses_total = EXCLUDED.losses_total, losses_home = EXCLUDED.losses_home, losses_away = EXCLUDED.losses_away,
            goals_for_total = EXCLUDED.goals_for_total, goals_for_home = EXCLUDED.goals_for_home, goals_for_away = EXCLUDED.goals_for_away,
            goals_against_total = EXCLUDED.goals_against_total, goals_against_home = EXCLUDED.goals_against_home, goals_against_away = EXCLUDED.goals_against_away,
            goal_difference = EXCLUDED.goal_difference,
            shots_total = EXCLUDED.shots_total, shots_home = EXCLUDED.shots_home, shots_away = EXCLUDED.shots_away,
            shots_on_target_total = EXCLUDED.shots_on_target_total, shots_on_target_home = EXCLUDED.shots_on_target_home, shots_on_target_away = EXCLUDED.shots_on_target_away,
            possession_total = EXCLUDED.possession_total, possession_home = EXCLUDED.possession_home, possession_away = EXCLUDED.possession_away,
            clean_sheets_total = EXCLUDED.clean_sheets_total, clean_sheets_home = EXCLUDED.clean_sheets_home, clean_sheets_away = EXCLUDED.clean_sheets_away,
            fouls_total = EXCLUDED.fouls_total, fouls_home = EXCLUDED.fouls_home, fouls_away = EXCLUDED.fouls_away,
            yellow_cards = EXCLUDED.yellow_cards, red_cards = EXCLUDED.red_cards,
            points_per_game = EXCLUDED.points_per_game, points_per_game_home = EXCLUDED.points_per_game_home, points_per_game_away = EXCLUDED.points_per_game_away,
            corners_total = EXCLUDED.corners_total, corners_home = EXCLUDED.corners_home, corners_away = EXCLUDED.corners_away,
            btts_count = EXCLUDED.btts_count, btts_count_home = EXCLUDED.btts_count_home, btts_count_away = EXCLUDED.btts_count_away,
            btts_percentage = EXCLUDED.btts_percentage,
            over15_count = EXCLUDED.over15_count, over25_count = EXCLUDED.over25_count, over35_count = EXCLUDED.over35_count,
            over15_percentage = EXCLUDED.over15_percentage, over25_percentage = EXCLUDED.over25_percentage, over35_percentage = EXCLUDED.over35_percentage,
            xg_for_avg = EXCLUDED.xg_for_avg, xg_against_avg = EXCLUDED.xg_against_avg,
            goals_scored_per_match = EXCLUDED.goals_scored_per_match, goals_conceded_per_match = EXCLUDED.goals_conceded_per_match,
            corners_per_match = EXCLUDED.corners_per_match,
            win_percentage = EXCLUDED.win_percentage, draw_percentage = EXCLUDED.draw_percentage, loss_percentage = EXCLUDED.loss_percentage,
            clean_sheet_percentage = EXCLUDED.clean_sheet_percentage, performance_rank = EXCLUDED.performance_rank,
            ht_winning_total = EXCLUDED.ht_winning_total, ht_winning_home = EXCLUDED.ht_winning_home, ht_winning_away = EXCLUDED.ht_winning_away,
            ht_drawing_total = EXCLUDED.ht_drawing_total, ht_drawing_home = EXCLUDED.ht_drawing_home, ht_drawing_away = EXCLUDED.ht_drawing_away,
            ht_losing_total = EXCLUDED.ht_losing_total, ht_losing_home = EXCLUDED.ht_losing_home, ht_losing_away = EXCLUDED.ht_losing_away,
            ht_goals_scored_total = EXCLUDED.ht_goals_scored_total, ht_goals_scored_home = EXCLUDED.ht_goals_scored_home, ht_goals_scored_away = EXCLUDED.ht_goals_scored_away,
            ht_goals_conceded_total = EXCLUDED.ht_goals_conceded_total, ht_goals_conceded_home = EXCLUDED.ht_goals_conceded_home, ht_goals_conceded_away = EXCLUDED.ht_goals_conceded_away,
            first_team_to_score_count = EXCLUDED.first_team_to_score_count`,
          c.flat()
        );
      }
      result.teamStats = { written: statsRows.length };
    }

    /* ───────────── JOGADORES ───────────── */
    if (targets.players) {
      // Nacionalidade: resolve por nome (countries + traduções)
      const [cRes, ctRes] = await Promise.all([
        client.query(`SELECT id_country, name FROM countries`),
        client.query(`SELECT id_country, name AS tname FROM country_translations`),
      ]);
      const countryByNorm = new Map(cRes.rows.map((c) => [norm(c.name), c.id_country]));
      for (const t of ctRes.rows) {
        const k = norm(t.tname);
        if (!countryByNorm.has(k)) countryByNorm.set(k, t.id_country);
      }

      // Dedup por api id (o mesmo jogador não repete dentro da temporada)
      const seen = new Set();
      const apiPlayers = [];
      for (const p of data.players) {
        const apiId = Number(p?.id);
        if (!apiId || seen.has(apiId) || !p?.full_name) continue;
        seen.add(apiId);
        apiPlayers.push(p);
      }

      // Upsert de players: casa por api_player_id primeiro; senão por full_name.
      // Nunca sobrescreve dado bom com null (COALESCE).
      const byApiIdRes = await client.query(
        `SELECT id_player, api_player_id FROM players WHERE api_player_id = ANY($1)`,
        [apiPlayers.map((p) => Number(p.id))]
      );
      const playerIdByApi = new Map(byApiIdRes.rows.map((r) => [Number(r.api_player_id), r.id_player]));

      let playersNew = 0, playersLinked = 0;
      for (const c of chunk(apiPlayers.filter((p) => !playerIdByApi.has(Number(p.id))), 200)) {
        for (const p of c) {
          const birthday = unixToDateStr(p.birthday);
          const idCountry = p.nationality ? (countryByNorm.get(norm(p.nationality)) ?? null) : null;
          const r = await client.query(
            `INSERT INTO players (full_name, birthday, nationality, position, api_player_id)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (full_name) DO UPDATE SET
               api_player_id = COALESCE(players.api_player_id, EXCLUDED.api_player_id),
               birthday      = COALESCE(players.birthday, EXCLUDED.birthday),
               nationality   = COALESCE(players.nationality, EXCLUDED.nationality),
               position      = COALESCE(players.position, EXCLUDED.position)
             RETURNING id_player, (xmax = 0) AS is_new, api_player_id`,
            [p.full_name, birthday, idCountry, p.position || null, Number(p.id)]
          );
          const row = r.rows[0];
          // Se o full_name já pertencia a OUTRO api_player_id, não vincula stats
          // errados: só usa o id se o api_player_id final for o deste jogador.
          if (Number(row.api_player_id) === Number(p.id)) {
            playerIdByApi.set(Number(p.id), row.id_player);
            if (row.is_new) playersNew++; else playersLinked++;
          }
        }
      }

      // player_seasons + player_stats
      const seasonRows = [];
      const statsRows = [];
      let skippedNoClub = 0, skippedNamePlayer = 0;
      for (const p of apiPlayers) {
        const idPlayer = playerIdByApi.get(Number(p.id));
        if (!idPlayer) { skippedNamePlayer++; continue; }
        const clubApi = Number(p.club_team_id);
        const idClub = clubApi > 0 ? data.clubByApiId.get(clubApi) : null;
        const idCLS = idClub ? clsIdByClub.get(idClub) : null;
        if (!idCLS) { skippedNoClub++; continue; }
        seasonRows.push([idPlayer, idCLS]);
        statsRows.push([
          toNum(p.goals_overall), toNum(p.assists_overall),
          toInt(p.minutes_played_overall), toInt(p.appearances_overall),
          toInt(p.goals_home), toInt(p.goals_away),
          toInt(p.assists_home), toInt(p.assists_away),
          toInt(p.penalty_goals), toInt(p.penalty_misses),
          toInt(p.clean_sheets_overall), toInt(p.clean_sheets_home), toInt(p.clean_sheets_away),
          toInt(p.yellow_cards_overall), toInt(p.red_cards_overall),
          toInt(p.minutes_played_home), toInt(p.minutes_played_away),
          toNum(p.min_per_match),
          toInt(p.appearances_home), toInt(p.appearances_away),
        ]);
      }

      const psIdByKey = new Map();
      for (const c of chunk(seasonRows, 500)) {
        const values = buildValues(c.length, 2);
        const r = await client.query(
          `INSERT INTO player_seasons (id_player, id_club_league_season)
           VALUES ${values}
           ON CONFLICT (id_player, id_club_league_season) WHERE id_club_league_season IS NOT NULL
           DO UPDATE SET id_player = EXCLUDED.id_player
           RETURNING id_player_season, id_player, id_club_league_season`,
          c.flat()
        );
        for (const row of r.rows) psIdByKey.set(`${row.id_player}__${row.id_club_league_season}`, row.id_player_season);
      }

      const statsToInsert = [];
      for (let i = 0; i < seasonRows.length; i++) {
        const key = `${seasonRows[i][0]}__${seasonRows[i][1]}`;
        const idPS = psIdByKey.get(key);
        if (idPS) statsToInsert.push([idPS, ...statsRows[i]]);
      }
      for (const c of chunk(statsToInsert, 200)) {
        const values = buildValues(c.length, 21);
        await client.query(
          `INSERT INTO player_stats (
             id_player_season,
             goals, assists, minutes_total, matches_total,
             goals_home, goals_away, assists_home, assists_away,
             penalties_scored, penalties_missed,
             clean_sheets_total, clean_sheets_home, clean_sheets_away,
             yellow_cards, red_cards,
             minutes_home, minutes_away, minutes_per_match,
             matches_home, matches_away
           ) VALUES ${values}
           ON CONFLICT (id_player_season) DO UPDATE SET
             goals = EXCLUDED.goals, assists = EXCLUDED.assists,
             minutes_total = EXCLUDED.minutes_total, matches_total = EXCLUDED.matches_total,
             goals_home = EXCLUDED.goals_home, goals_away = EXCLUDED.goals_away,
             assists_home = EXCLUDED.assists_home, assists_away = EXCLUDED.assists_away,
             penalties_scored = EXCLUDED.penalties_scored, penalties_missed = EXCLUDED.penalties_missed,
             clean_sheets_total = EXCLUDED.clean_sheets_total, clean_sheets_home = EXCLUDED.clean_sheets_home, clean_sheets_away = EXCLUDED.clean_sheets_away,
             yellow_cards = EXCLUDED.yellow_cards, red_cards = EXCLUDED.red_cards,
             minutes_home = EXCLUDED.minutes_home, minutes_away = EXCLUDED.minutes_away,
             minutes_per_match = EXCLUDED.minutes_per_match,
             matches_home = EXCLUDED.matches_home, matches_away = EXCLUDED.matches_away`,
          c.flat()
        );
      }

      result.players = {
        totalApi: data.players.length,
        new: playersNew,
        linkedExisting: playersLinked,
        seasons: seasonRows.length,
        stats: statsToInsert.length,
        skippedNoClub,
        skippedNameConflict: skippedNamePlayer,
      };
    }

    await client.query("COMMIT");
    return result;
  } catch (err) {
    if (client) { try { await client.query("ROLLBACK"); } catch (e) { console.error("[writeOneSeason] ROLLBACK falhou:", e.message); } }
    throw err;
  } finally {
    if (client) client.release();
  }
}
