import db from "../config/db.js";

// Mapeia posição em inglês → PT-BR (como o ClubPlayers espera)
function mapPositionPT(pos) {
  if (!pos) return "Meio-campista";
  if (/Goalkeeper/i.test(pos)) return "Goleiro";
  if (/Left.?Back|Right.?Back|Lateral|Wing.?Back/i.test(pos)) return "Lateral";
  if (/Back|Defender|Centre|Center/i.test(pos)) return "Zagueiro";
  if (/Midfielder|Midfield/i.test(pos)) return "Meio-campista";
  if (/Forward|Winger|Striker|Attacker/i.test(pos)) return "Atacante";
  // já em PT
  const ptPositions = ["Goleiro", "Lateral", "Zagueiro", "Meio-campista", "Atacante"];
  if (ptPositions.includes(pos)) return pos;
  return "Meio-campista";
}

function calcAge(birthday) {
  if (!birthday) return null;
  const today = new Date();
  const bday = new Date(birthday);
  let age = today.getFullYear() - bday.getFullYear();
  if (today < new Date(today.getFullYear(), bday.getMonth(), bday.getDate())) age--;
  return age;
}

function computeForm(matches, clubId) {
  return matches.map(m => {
    const isHome = m.home_club_id === clubId;
    const myGoals = isHome ? m.home_goals : m.away_goals;
    const oppGoals = isHome ? m.away_goals : m.home_goals;
    if (myGoals > oppGoals) return "W";
    if (myGoals < oppGoals) return "L";
    return "D";
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/clubs/:id/sports/competitions?season=YYYY
// ─────────────────────────────────────────────────────────────────────────────
export async function getClubCompetitions(req, res) {
  const clubId = Number(req.params.id);

  // If no season provided, use the latest season that actually has data for this club
  let season = Number(req.query.season) || 0;
  if (!season) {
    const latestRes = await db.query(`
      SELECT MAX(s.year) AS year
      FROM club_competition_stats ccs
      JOIN competition_seasons cs ON cs.id_competition_season = ccs.id_competition_season
      JOIN seasons s ON s.id_season = cs.id_season
      WHERE ccs.id_club = $1
    `, [clubId]);
    season = latestRes.rows[0]?.year ?? new Date().getFullYear();
  }

  try {
    const compRes = await db.query(`
      SELECT cs.id_competition_season, l.id_league, l.name AS league_name,
             l.logo_url, l.format, l.structure_json, cs.id_season, s.year,
             co.id_country, co.name AS country_name, co.flag_url AS country_flag
      FROM club_competition_stats ccs
      JOIN competition_seasons cs ON cs.id_competition_season = ccs.id_competition_season
      JOIN leagues l ON l.id_league = cs.id_league
      JOIN seasons s ON s.id_season = cs.id_season
      LEFT JOIN countries co ON co.id_country = l.id_country
      WHERE ccs.id_club = $1 AND s.year = $2
    `, [clubId, season]);

    // Available seasons for selector
    const seasonsRes = await db.query(`
      SELECT DISTINCT s.year
      FROM club_competition_stats ccs
      JOIN competition_seasons cs ON cs.id_competition_season = ccs.id_competition_season
      JOIN seasons s ON s.id_season = cs.id_season
      WHERE ccs.id_club = $1
      ORDER BY s.year DESC
    `, [clubId]);

    // ── Batch: busca todos os dados de uma vez, sem N+1 ────────────────────
    const compSeasonIds = compRes.rows.map(c => c.id_competition_season);
    const leagueIds     = compRes.rows.map(c => c.id_league);
    const seasonIds     = compRes.rows.map(c => c.id_season);

    // Identifica comps knockout antes de disparar as queries
    const knockoutSet = new Set(
      compRes.rows
        .filter(comp => {
          const fmt = comp.structure_json?.[String(season)]?.tipo || comp.format || "";
          return !["pontos_corridos", "pontos_corridos_turno_unico", "grupos", "apertura_clausura"].includes(fmt);
        })
        .map(c => c.id_competition_season)
    );
    const koComps  = compRes.rows.filter(c => knockoutSet.has(c.id_competition_season));
    const koLeagueIds  = koComps.map(c => c.id_league);
    const koSeasonIds  = koComps.map(c => c.id_season);

    const queries = [
      // 1. Standings de todas as competições em batch
      db.query(`
        SELECT ccs.id_competition_season,
          c.id_club, c.name AS club_name, c.crest_url, c.slug AS club_slug, c.hidden AS club_hidden,
          ccs.position_total, ccs.position_home, ccs.position_away,
          ccs.points,
          ccs.matches_total, ccs.matches_home, ccs.matches_away,
          ccs.wins_total,   ccs.wins_home,   ccs.wins_away,
          ccs.draws_total,  ccs.draws_home,  ccs.draws_away,
          ccs.losses_total, ccs.losses_home, ccs.losses_away,
          ccs.goals_for_total,     ccs.goals_for_home,     ccs.goals_for_away,
          ccs.goals_against_total, ccs.goals_against_home, ccs.goals_against_away,
          ccs.goal_difference, ccs.win_percentage
        FROM club_competition_stats ccs
        JOIN clubs c ON c.id_club = ccs.id_club
        WHERE ccs.id_competition_season = ANY($1::int[])
        ORDER BY ccs.id_competition_season, ccs.position_total ASC NULLS LAST
      `, [compSeasonIds]),

      // 2. Stats do clube em todas as competições
      db.query(`
        SELECT ccs.*
        FROM club_competition_stats ccs
        WHERE ccs.id_competition_season = ANY($1::int[]) AND ccs.id_club = $2
      `, [compSeasonIds, clubId]),

      // 3. Partidas do clube em todas as competições
      db.query(`
        SELECT m.id_match, m.id_league, m.id_season, m.game_week, m.match_date,
               m.home_goals, m.away_goals, m.status,
               hc.id_club AS home_id, hc.name AS home_name, hc.crest_url AS home_crest, hc.slug AS home_slug, hc.hidden AS home_hidden,
               ac.id_club AS away_id, ac.name AS away_name, ac.crest_url AS away_crest, ac.slug AS away_slug, ac.hidden AS away_hidden,
               ms.home_goals_ht, ms.away_goals_ht
        FROM matches m
        JOIN clubs hc ON hc.id_club = m.home_club_id
        JOIN clubs ac ON ac.id_club = m.away_club_id
        LEFT JOIN match_stats ms ON ms.id_match = m.id_match
        WHERE (m.home_club_id = $1 OR m.away_club_id = $1)
          AND (m.id_league, m.id_season) IN (SELECT unnest($2::int[]), unnest($3::int[]))
        ORDER BY m.id_league, m.id_season, m.game_week ASC NULLS LAST, m.match_date ASC
      `, [clubId, leagueIds, seasonIds]),

      // 4. Form (últimas 5 partidas por competição via window)
      db.query(`
        SELECT id_league, id_season, home_club_id, away_club_id, home_goals, away_goals FROM (
          SELECT m.id_league, m.id_season, m.home_club_id, m.away_club_id, m.home_goals, m.away_goals,
                 ROW_NUMBER() OVER (PARTITION BY m.id_league, m.id_season ORDER BY m.game_week DESC NULLS LAST) AS rn
          FROM matches m
          WHERE (m.home_club_id = $1 OR m.away_club_id = $1)
            AND m.home_goals IS NOT NULL
            AND (m.id_league, m.id_season) IN (SELECT unnest($2::int[]), unnest($3::int[]))
        ) sub WHERE rn <= 5
      `, [clubId, leagueIds, seasonIds]),
    ];

    // 5. Partidas completas das comps knockout (se houver)
    if (koComps.length > 0) {
      queries.push(db.query(`
        SELECT m.id_match, m.id_league, m.id_season, m.game_week, m.match_date, m.home_goals, m.away_goals,
               hc.id_club AS home_id, hc.name AS home_name, hc.crest_url AS home_crest, hc.slug AS home_slug, hc.hidden AS home_hidden,
               ac.id_club AS away_id, ac.name AS away_name, ac.crest_url AS away_crest, ac.slug AS away_slug, ac.hidden AS away_hidden
        FROM matches m
        JOIN clubs hc ON hc.id_club = m.home_club_id
        JOIN clubs ac ON ac.id_club = m.away_club_id
        WHERE (m.id_league, m.id_season) IN (SELECT unnest($1::int[]), unnest($2::int[]))
        ORDER BY m.id_league, m.id_season, m.game_week ASC NULLS LAST, m.match_date ASC
      `, [koLeagueIds, koSeasonIds]));
    }

    const results = await Promise.all(queries);
    const [standingsAll, statsAll, matchesAll, formAll, koMatchesAll] = results;

    // Indexa resultados por chave para lookup O(1)
    const standingsByComp = Map.groupBy
      ? Map.groupBy(standingsAll.rows, r => r.id_competition_season)
      : standingsAll.rows.reduce((m, r) => { const k = r.id_competition_season; if (!m.has(k)) m.set(k, []); m.get(k).push(r); return m; }, new Map());

    const statsByComp = new Map(statsAll.rows.map(r => [r.id_competition_season, r]));

    const matchesByComp = matchesAll.rows.reduce((m, r) => {
      const k = `${r.id_league}_${r.id_season}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
      return m;
    }, new Map());

    const formByComp = formAll.rows.reduce((m, r) => {
      const k = `${r.id_league}_${r.id_season}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
      return m;
    }, new Map());

    const koMatchesByComp = (koMatchesAll?.rows ?? []).reduce((m, r) => {
      const k = `${r.id_league}_${r.id_season}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
      return m;
    }, new Map());

    // ── Monta resposta agrupando dados em memória ──────────────────────────
    const competitions = [];

    for (const comp of compRes.rows) {
      const compKey = `${comp.id_league}_${comp.id_season}`;
      const standingsRows = standingsByComp.get(comp.id_competition_season) ?? [];
      const cs = statsByComp.get(comp.id_competition_season) ?? {};
      const compMatches = matchesByComp.get(compKey) ?? [];
      const form = computeForm(formByComp.get(compKey) ?? [], clubId);

      const matchesByWeek = {};
      for (const m of compMatches) {
        const w = m.game_week ?? 0;
        if (!matchesByWeek[w]) matchesByWeek[w] = [];
        matchesByWeek[w].push({
          id: m.id_match,
          date: m.match_date,
          home: { id: m.home_id, name: m.home_name, crest: m.home_crest, slug: m.home_slug, hidden: m.home_hidden ?? false },
          away: { id: m.away_id, name: m.away_name, crest: m.away_crest, slug: m.away_slug, hidden: m.away_hidden ?? false },
          home_goals: m.home_goals,
          away_goals: m.away_goals,
          home_goals_ht: m.home_goals_ht,
          away_goals_ht: m.away_goals_ht,
          status: m.status,
          is_home: m.home_id === clubId,
        });
      }
      const matchesGrouped = Object.entries(matchesByWeek)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([week, games]) => ({ week: Number(week), games }));

      let leagueMatchesGrouped = [];
      if (knockoutSet.has(comp.id_competition_season)) {
        const allByWeek = {};
        for (const m of koMatchesByComp.get(compKey) ?? []) {
          const w = m.game_week ?? 0;
          if (!allByWeek[w]) allByWeek[w] = [];
          allByWeek[w].push({
            id: m.id_match,
            date: m.match_date,
            home: { id: m.home_id, name: m.home_name, crest: m.home_crest, slug: m.home_slug, hidden: m.home_hidden ?? false },
            away: { id: m.away_id, name: m.away_name, crest: m.away_crest, slug: m.away_slug, hidden: m.away_hidden ?? false },
            home_goals: m.home_goals,
            away_goals: m.away_goals,
          });
        }
        leagueMatchesGrouped = Object.entries(allByWeek)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([week, games]) => ({ week: Number(week), games }));
      }

      const buildRow = (r, posF, wF, dF, lF, gpF, gcF, mF) => ({
        id: r.id_club,
        name: r.club_name,
        crest: r.crest_url,
        slug: r.club_slug ?? null,
        hidden: r.club_hidden ?? false,
        pos: r[posF],
        pts: posF === 'position_total' ? (r.points ?? r[wF] * 3 + r[dF]) : (r[wF] * 3 + r[dF]),
        j: r[mF],
        v: r[wF],
        e: r[dF],
        d: r[lF],
        gp: r[gpF],
        gc: r[gcF],
        sg: (r[gpF] ?? 0) - (r[gcF] ?? 0),
        pct: r[mF] > 0 ? Math.round(((r[wF] * 3 + r[dF]) / (r[mF] * 3)) * 100) : 0,
        form: r.id_club === clubId ? form : [],
        isMain: r.id_club === clubId,
      });

      const n = v => v ?? null;

      competitions.push({
        id: comp.id_competition_season,
        id_league: comp.id_league,
        name: comp.league_name,
        logo_url: comp.logo_url,
        format: comp.format,
        structure_json: comp.structure_json,
        country: { id: comp.id_country, name: comp.country_name, flag: comp.country_flag },

        standings: {
          total: standingsRows.map(r => buildRow(r, 'position_total', 'wins_total', 'draws_total', 'losses_total', 'goals_for_total', 'goals_against_total', 'matches_total')),
          home: standingsRows.filter(r => r.position_home).sort((a, b) => (a.position_home ?? 999) - (b.position_home ?? 999)).map(r => buildRow(r, 'position_home', 'wins_home', 'draws_home', 'losses_home', 'goals_for_home', 'goals_against_home', 'matches_home')),
          away: standingsRows.filter(r => r.position_away).sort((a, b) => (a.position_away ?? 999) - (b.position_away ?? 999)).map(r => buildRow(r, 'position_away', 'wins_away', 'draws_away', 'losses_away', 'goals_for_away', 'goals_against_away', 'matches_away')),
        },

        summary: {
          pos: cs.position_total,
          pts: cs.points,
          wins: cs.wins_total,
          draws: cs.draws_total,
          losses: cs.losses_total,
          gp: cs.goals_for_total,
          gc: cs.goals_against_total,
          sg: cs.goal_difference,
          matches: cs.matches_total,
          xg_for: cs.xg_for_avg,
          ppg: cs.points_per_game,
        },

        esportivo: {
          total: { shots: n(cs.shots_total), shots_ot: n(cs.shots_on_target_total), possession: n(cs.possession_total), clean_sheets: n(cs.clean_sheets_total), corners: n(cs.corners_total), gp: n(cs.goals_for_total), gc: n(cs.goals_against_total), xg_for: n(cs.xg_for_avg), xg_against: n(cs.xg_against_avg), btts_pct: n(cs.btts_percentage), over25_pct: n(cs.over25_percentage), cs_pct: n(cs.clean_sheet_percentage), ppg: n(cs.points_per_game), matches: n(cs.matches_total) },
          home: { shots: n(cs.shots_home), shots_ot: n(cs.shots_on_target_home), possession: n(cs.possession_home), clean_sheets: n(cs.clean_sheets_home), corners: n(cs.corners_home), gp: n(cs.goals_for_home), gc: n(cs.goals_against_home), matches: n(cs.matches_home) },
          away: { shots: n(cs.shots_away), shots_ot: n(cs.shots_on_target_away), possession: n(cs.possession_away), clean_sheets: n(cs.clean_sheets_away), corners: n(cs.corners_away), gp: n(cs.goals_for_away), gc: n(cs.goals_against_away), matches: n(cs.matches_away) },
        },

        halfTime: {
          total: { winning: n(cs.ht_winning_total), drawing: n(cs.ht_drawing_total), losing: n(cs.ht_losing_total), gs: n(cs.ht_goals_scored_total), gc: n(cs.ht_goals_conceded_total) },
          home: { winning: n(cs.ht_winning_home), drawing: n(cs.ht_drawing_home), losing: n(cs.ht_losing_home), gs: n(cs.ht_goals_scored_home), gc: n(cs.ht_goals_conceded_home) },
          away: { winning: n(cs.ht_winning_away), drawing: n(cs.ht_drawing_away), losing: n(cs.ht_losing_away), gs: n(cs.ht_goals_scored_away), gc: n(cs.ht_goals_conceded_away) },
        },

        discipline: {
          total: { fouls: n(cs.fouls_total), yellow: n(cs.yellow_cards), red: n(cs.red_cards) },
          home: { fouls: n(cs.fouls_home), yellow: n(cs.yellow_cards_home), red: n(cs.red_cards_home) },
          away: { fouls: n(cs.fouls_away), yellow: n(cs.yellow_cards_away), red: n(cs.red_cards_away) },
        },

        matches: matchesGrouped,
        leagueMatches: leagueMatchesGrouped,
        form,
      });
    }

    res.json({ competitions, season, availableSeasons: seasonsRes.rows.map(r => r.year) });
  } catch (err) {
    console.error("[getClubCompetitions]", err);
    res.status(500).json({ error: "Erro ao buscar competições" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/players/countries
// Países com contagem de jogadores (para a tela de navegação por país)
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlayerCountries(req, res) {
  try {
    const result = await db.query(`
      SELECT
        co.id_country AS id,
        co.name,
        co.flag_url,
        COUNT(DISTINCT p.id_player) AS players_count
      FROM countries co
      JOIN players p ON p.nationality = co.id_country
      GROUP BY co.id_country, co.name, co.flag_url
      ORDER BY COUNT(DISTINCT p.id_player) DESC, co.name ASC
    `);
    return res.json({ countries: result.rows });
  } catch (err) {
    console.error("[getPlayerCountries]", err);
    return res.status(500).json({ error: "Erro ao buscar países de jogadores" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/players?search=&position=&nationality=&page=1
// Listagem global de jogadores com busca, filtros e paginação
// ─────────────────────────────────────────────────────────────────────────────
export async function searchPlayers(req, res) {
  const search = (req.query.search || "").trim();
  const position = (req.query.position || "").trim(); // PT: Goleiro, Zagueiro, etc.
  const nationality = (req.query.nationality || "").trim();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  try {
    const baseQuery = `
      WITH player_data AS (
        SELECT
          p.id_player,
          p.full_name,
          p.birthday,
          CASE
            WHEN p.position ILIKE '%Goalkeeper%'                         THEN 'Goleiro'
            WHEN p.position ~* 'Left.?Back|Right.?Back|Wing.?Back'       THEN 'Lateral'
            WHEN p.position ~* 'Back|Defender|Centre|Center'             THEN 'Zagueiro'
            WHEN p.position ~* 'Midfielder|Midfield'                     THEN 'Meio-campista'
            WHEN p.position ~* 'Forward|Winger|Striker|Attacker'         THEN 'Atacante'
            ELSE 'Meio-campista'
          END AS position_pt,
          co.name     AS nationality,
          co.flag_url,
          c.name      AS club_name,
          c.crest_url,
          lat.market_value,
          lat.goals,
          lat.assists,
          lat.rating
        FROM players p
        LEFT JOIN countries co ON co.id_country = p.nationality
        LEFT JOIN LATERAL (
          SELECT
            ps2.market_value,
            cls2.id_club,
            pst2.goals,
            pst2.assists,
            pst2.rating
          FROM player_seasons ps2
          JOIN club_league_seasons cls2 ON cls2.id_club_league_season = ps2.id_club_league_season
          JOIN seasons s2              ON s2.id_season = cls2.id_season
          LEFT JOIN player_stats pst2  ON pst2.id_player_season = ps2.id_player_season
          WHERE ps2.id_player = p.id_player
          ORDER BY s2.year DESC
          LIMIT 1
        ) lat ON true
        LEFT JOIN clubs c ON c.id_club = lat.id_club
      )
      SELECT pd.*, p2.photo_url FROM player_data pd
      JOIN players p2 ON p2.id_player = pd.id_player
      WHERE
        ($1 = '' OR pd.full_name ILIKE '%' || $1 || '%')
        AND ($2 = '' OR pd.position_pt = $2)
        AND ($3 = '' OR pd.nationality ILIKE '%' || $3 || '%')
    `;

    const [dataRes, countRes] = await Promise.all([
      db.query(`${baseQuery} ORDER BY full_name ASC LIMIT $4 OFFSET $5`,
        [search, position, nationality, limit, offset]),
      db.query(`SELECT COUNT(*) FROM (${baseQuery}) sub`,
        [search, position, nationality]),
    ]);

    const total = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      players: dataRes.rows.map(p => ({
        id: p.id_player,
        name: p.full_name,
        age: calcAge(p.birthday),
        position: p.position_pt,
        nationality: p.nationality || "—",
        flag_url: p.flag_url,
        club_name: p.club_name || null,
        crest_url: p.crest_url || null,
        photo_url: p.photo_url || null,
        market_value: p.market_value,
        goals: p.goals ?? null,
        assists: p.assists ?? null,
        rating: p.rating != null ? Number(p.rating).toFixed(1) : null,
      })),
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (err) {
    console.error("[searchPlayers]", err);
    res.status(500).json({ error: "Erro ao buscar jogadores" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/clubs/:id/sports/players?season=YYYY
// ─────────────────────────────────────────────────────────────────────────────
export async function getClubPlayers(req, res) {
  const clubId = Number(req.params.id);
  let season = Number(req.query.season) || 0;
  if (!season) {
    const latestRes = await db.query(`
      SELECT MAX(s.year) AS year
      FROM player_seasons ps
      JOIN club_league_seasons cls ON cls.id_club_league_season = ps.id_club_league_season
      JOIN seasons s ON s.id_season = cls.id_season
      WHERE cls.id_club = $1
    `, [clubId]);
    season = latestRes.rows[0]?.year ?? new Date().getFullYear();
  }

  try {
    const result = await db.query(`
      SELECT * FROM (
        SELECT DISTINCT ON (p.id_player)
          p.id_player,
          p.full_name,
          p.birthday,
          p.position,
          p.photo_url,
          co.name AS nationality,
          co.flag_url,
          ps.shirt_number,
          ps.market_value,
          s.year
        FROM player_seasons ps
        JOIN players p ON p.id_player = ps.id_player
        JOIN club_league_seasons cls ON cls.id_club_league_season = ps.id_club_league_season
        JOIN seasons s ON s.id_season = cls.id_season
        LEFT JOIN countries co ON co.id_country = p.nationality
        WHERE cls.id_club = $1 AND s.year = $2
        ORDER BY p.id_player, ps.shirt_number ASC NULLS LAST
      ) sub
      ORDER BY shirt_number ASC NULLS LAST
    `, [clubId, season]);

    const players = result.rows.map(p => ({
      id: p.id_player,
      name: p.full_name,
      position: mapPositionPT(p.position),
      number: p.shirt_number,
      age: calcAge(p.birthday),
      nationality: p.nationality || "—",
      flag_url: p.flag_url,
      photo_url: p.photo_url,
      market_value: p.market_value,
    }));

    // Anos disponíveis (para o seletor de temporada)
    const yearsRes = await db.query(`
      SELECT DISTINCT s.year
      FROM player_seasons ps
      JOIN club_league_seasons cls ON cls.id_club_league_season = ps.id_club_league_season
      JOIN seasons s ON s.id_season = cls.id_season
      WHERE cls.id_club = $1
      ORDER BY s.year DESC
    `, [clubId]);

    res.json({
      players,
      season,
      availableSeasons: yearsRes.rows.map(r => r.year),
    });
  } catch (err) {
    console.error("[getClubPlayers]", err);
    res.status(500).json({ error: "Erro ao buscar jogadores" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/players/:id?season=YYYY
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlayerDetail(req, res) {
  const playerId = Number(req.params.id);
  const season = req.query.season ? Number(req.query.season) : null;

  try {
    const playerRes = await db.query(`
      SELECT p.id_player, p.full_name, p.birthday, p.position, p.photo_url,
             co.name AS nationality, co.flag_url
      FROM players p
      LEFT JOIN countries co ON co.id_country = p.nationality
      WHERE p.id_player = $1
    `, [playerId]);

    if (!playerRes.rows.length) {
      return res.status(404).json({ error: "Jogador não encontrado" });
    }

    const p = playerRes.rows[0];

    const seasonFilter = season ? `AND s.year = ${Number(season)}` : "";

    const seasonsRes = await db.query(`
      SELECT
        ps.id_player_season,
        ps.shirt_number,
        ps.market_value,
        ps.salary,
        c.id_club,
        c.name       AS club_name,
        c.crest_url,
        c.slug       AS club_slug,
        l.id_league,
        l.name       AS league_name,
        s.year,
        pst.goals,
        pst.assists,
        pst.shots,
        pst.shots_on_target,
        pst.passes,
        pst.tackles,
        pst.duels,
        pst.xg,
        pst.rating,
        pst.minutes_total,
        pst.matches_total,
        pst.matches_started,
        pst.goals_home,
        pst.goals_away,
        pst.assists_home,
        pst.assists_away,
        pst.penalties_scored,
        pst.penalties_missed,
        pst.clean_sheets_total,
        pst.clean_sheets_home,
        pst.clean_sheets_away,
        pst.yellow_cards,
        pst.red_cards,
        pst.shot_accuracy_pct,
        pst.pass_completion_rate,
        pst.short_passes,
        pst.long_passes,
        pst.key_passes,
        pst.interceptions,
        pst.crosses_total,
        pst.dribbles_total,
        pst.dribbles_successful,
        pst.duels_won_pct,
        pst.saves_total,
        pst.inside_box_saves,
        pst.offsides,
        pst.fouls_committed,
        pst.minutes_home,
        pst.minutes_away,
        pst.minutes_per_match,
        pst.matches_home,
        pst.matches_away,
        pst.shots_on_target_per90,
        pst.shots_on_target_per90_pct,
        pst.pass_completion_rate_pct,
        pst.interceptions_per90
      FROM player_seasons ps
      JOIN club_league_seasons cls ON cls.id_club_league_season = ps.id_club_league_season
      JOIN clubs   c ON c.id_club   = cls.id_club
      JOIN leagues l ON l.id_league = cls.id_league
      JOIN seasons s ON s.id_season = cls.id_season
      LEFT JOIN player_stats pst ON pst.id_player_season = ps.id_player_season
      WHERE ps.id_player = $1 ${seasonFilter}
      ORDER BY s.year DESC
    `, [playerId]);

    // Anos disponíveis
    const yearsRes = await db.query(`
      SELECT DISTINCT s.year
      FROM player_seasons ps
      JOIN club_league_seasons cls ON cls.id_club_league_season = ps.id_club_league_season
      JOIN seasons s ON s.id_season = cls.id_season
      WHERE ps.id_player = $1
      ORDER BY s.year DESC
    `, [playerId]);

    res.json({
      player: {
        id_player: p.id_player,
        full_name: p.full_name,
        birthday: p.birthday,
        age: calcAge(p.birthday),
        nationality: p.nationality,
        flag_url: p.flag_url,
        photo_url: p.photo_url || null,
        position: mapPositionPT(p.position),
        position_original: p.position,
      },
      seasons: seasonsRes.rows.map(row => ({
        year: row.year,
        shirt_number: row.shirt_number,
        market_value: row.market_value,
        club: { id: row.id_club, name: row.club_name, crest_url: row.crest_url, slug: row.club_slug ?? null },
        league: { id: row.id_league, name: row.league_name },
        stats: {
          goals: row.goals ?? 0,
          assists: row.assists ?? 0,
          shots: row.shots ?? 0,
          shots_on_target: row.shots_on_target ?? 0,
          passes: row.passes ?? 0,
          tackles: row.tackles ?? 0,
          duels: row.duels ?? 0,
          xg: row.xg ?? 0,
          rating: row.rating ?? null,
          minutes_total: row.minutes_total ?? null,
          matches_total: row.matches_total ?? null,
          matches_started: row.matches_started ?? null,
          goals_home: row.goals_home ?? null,
          goals_away: row.goals_away ?? null,
          assists_home: row.assists_home ?? null,
          assists_away: row.assists_away ?? null,
          penalties_scored: row.penalties_scored ?? null,
          penalties_missed: row.penalties_missed ?? null,
          clean_sheets_total: row.clean_sheets_total ?? null,
          clean_sheets_home: row.clean_sheets_home ?? null,
          clean_sheets_away: row.clean_sheets_away ?? null,
          yellow_cards: row.yellow_cards ?? null,
          red_cards: row.red_cards ?? null,
          shot_accuracy_pct: row.shot_accuracy_pct ?? null,
          pass_completion_rate: row.pass_completion_rate ?? null,
          short_passes: row.short_passes ?? null,
          long_passes: row.long_passes ?? null,
          key_passes: row.key_passes ?? null,
          interceptions: row.interceptions ?? null,
          crosses_total: row.crosses_total ?? null,
          dribbles_total: row.dribbles_total ?? null,
          dribbles_successful: row.dribbles_successful ?? null,
          duels_won_pct: row.duels_won_pct ?? null,
          saves_total: row.saves_total ?? null,
          inside_box_saves: row.inside_box_saves ?? null,
          offsides: row.offsides ?? null,
          fouls_committed: row.fouls_committed ?? null,
          minutes_home: row.minutes_home ?? null,
          minutes_away: row.minutes_away ?? null,
          minutes_per_match: row.minutes_per_match ?? null,
          matches_home: row.matches_home ?? null,
          matches_away: row.matches_away ?? null,
          shots_on_target_per90: row.shots_on_target_per90 ?? null,
          shots_on_target_per90_pct: row.shots_on_target_per90_pct ?? null,
          pass_completion_rate_pct: row.pass_completion_rate_pct ?? null,
          interceptions_per90: row.interceptions_per90 ?? null,
        },
      })),
      availableSeasons: yearsRes.rows.map(r => r.year),
    });
  } catch (err) {
    console.error("[getPlayerDetail]", err);
    res.status(500).json({ error: "Erro ao buscar jogador" });
  }
}

// Computa classificação a partir de partidas brutas (usado no Apertura/Clausura)
function computePhaseStandings(rawRows) {
  const clubs = new Map();
  const get = (id, name, crest, slug) => {
    if (!clubs.has(id)) clubs.set(id, { id, name, crest, slug: slug ?? null, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 });
    return clubs.get(id);
  };
  for (const m of rawRows) {
    if (m.home_goals == null || m.away_goals == null) continue;
    const hg = Number(m.home_goals), ag = Number(m.away_goals);
    const h = get(m.home_id, m.home_name, m.home_crest, m.home_slug);
    const a = get(m.away_id, m.away_name, m.away_crest, m.away_slug);
    h.j++; a.j++; h.gp += hg; h.gc += ag; a.gp += ag; a.gc += hg;
    if (hg > ag) { h.v++; a.d++; } else if (hg < ag) { a.v++; h.d++; } else { h.e++; a.e++; }
  }
  return [...clubs.values()]
    .map(c => ({ ...c, pts: c.v * 3 + c.e, sg: c.gp - c.gc, pct: c.j > 0 ? Math.round(((c.v * 3 + c.e) / (c.j * 3)) * 100) : 0 }))
    .sort((a, b) => (b.pts - a.pts) || (b.sg - a.sg) || (b.gp - a.gp))
    .map((c, i) => ({ ...c, pos: i + 1 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/leagues/:id/sports?season=YYYY
// Classificação + partidas de uma liga por temporada
// ─────────────────────────────────────────────────────────────────────────────
export async function getLeagueSports(req, res) {
  const leagueId = Number(req.params.id);
  let season = Number(req.query.season) || 0;
  if (!season) {
    const latestRes = await db.query(`
      SELECT MAX(s.year) AS year
      FROM competition_seasons cs
      JOIN seasons s ON s.id_season = cs.id_season
      WHERE cs.id_league = $1
    `, [leagueId]);
    season = latestRes.rows[0]?.year ?? new Date().getFullYear();
  }

  try {
    const leagueRes = await db.query(`
      SELECT l.id_league, l.name, l.format, l.organizer, l.logo_url,
             l.structure_json,
             c.name AS country_name, c.flag_url
      FROM leagues l
      LEFT JOIN countries c ON c.id_country = l.id_country
      WHERE l.id_league = $1
    `, [leagueId]);
    if (!leagueRes.rows.length) return res.status(404).json({ error: 'Liga não encontrada' });
    const league = leagueRes.rows[0];

    const seasonsRes = await db.query(`
      SELECT DISTINCT s.year FROM competition_seasons cs
      JOIN seasons s ON s.id_season = cs.id_season
      WHERE cs.id_league = $1 ORDER BY s.year DESC
    `, [leagueId]);
    const seasons = seasonsRes.rows.map(r => r.year);

    const csRes = await db.query(`
      SELECT cs.id_competition_season, cs.id_season
      FROM competition_seasons cs
      JOIN seasons s ON s.id_season = cs.id_season
      WHERE cs.id_league = $1 AND s.year = $2
    `, [leagueId, season]);

    if (!csRes.rows.length) {
      return res.json({ league, seasons, season, standings: { total: [], home: [], away: [] }, matches: [] });
    }
    const { id_competition_season: idCS, id_season: idSeason } = csRes.rows[0];

    // Detecta formato da temporada (per-season tem prioridade)
    const seasonConfig = league.structure_json?.[String(season)] ?? null;
    const fmt = seasonConfig?.tipo || league.format || 'pontos_corridos';
    const isAperturaClausura = fmt === 'apertura_clausura';

    // Busca fases configuradas (compatível com estrutura antiga "fases" e nova "torneios")
    const configuredFases = seasonConfig?.fases ?? [];
    // Para apertura_clausura com novo formato: deriva os torneios
    const configuredTorneios = seasonConfig?.torneios ?? null; // [{ key, nome, fases }]
    const acTorneioKeys = configuredTorneios
      ? configuredTorneios.map(t => t.key)
      : configuredFases.map(f =>
        (f.nome || '').toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
      );
    const isMultiFase = isAperturaClausura || (configuredFases.length > 1 && ['misto', 'personalizado', 'apertura_clausura'].includes(fmt));

    // Para apertura_clausura: normaliza qualquer phase_key para o torneio pai
    // Ex: "Apertura" → "apertura", "apertura_fase_de_grupos" → "apertura", "fase_1" → melhor match
    const normalizeToTorneio = isAperturaClausura ? (phaseKey) => {
      if (!phaseKey) return null;
      const lower = phaseKey.toLowerCase();
      const torneioKeys = acTorneioKeys.length ? acTorneioKeys : ['clausura', 'apertura'];
      // Match exato
      if (torneioKeys.includes(lower)) return lower;
      // Phase_key começa com torneio key (ex: apertura_fase_de_grupos → apertura)
      for (const tk of torneioKeys) {
        if (lower.startsWith(tk + '_') || lower === tk) return tk;
      }
      // Match parcial (ex: "Apertura" → "apertura" quando acTorneioKeys = ["apertura","clausura"])
      for (const tk of torneioKeys) {
        if (lower.includes(tk) || tk.includes(lower)) return tk;
      }
      return lower; // retorna normalizado mas sem match
    } : null;

    // Busca partidas brutas (sempre necessário) — inclui phase_key
    // LEFT JOIN em clubs E countries: competições de seleções (Copa do Mundo)
    // usam home/away_country_id; a federação do país é o vínculo navegável
    const matchesRes = await db.query(`
      SELECT m.id_match, m.game_week, m.match_date, m.home_goals, m.away_goals, m.status,
             m.phase_key,
             COALESCE(m.winner_club_id, m.winner_country_id) AS winner_id,
             COALESCE(hc.id_club, hco.id_country) AS home_id,
             COALESCE(hc.name, hco.name) AS home_name,
             COALESCE(hc.crest_url, hco.flag_url) AS home_crest,
             hc.slug AS home_slug, hc.hidden AS home_hidden,
             (m.home_country_id IS NOT NULL) AS home_is_country,
             hf.slug AS home_federation_slug, hf.acronym AS home_federation_acronym, hf.active AS home_federation_active,
             COALESCE(ac.id_club, aco.id_country) AS away_id,
             COALESCE(ac.name, aco.name) AS away_name,
             COALESCE(ac.crest_url, aco.flag_url) AS away_crest,
             ac.slug AS away_slug, ac.hidden AS away_hidden,
             (m.away_country_id IS NOT NULL) AS away_is_country,
             af.slug AS away_federation_slug, af.acronym AS away_federation_acronym, af.active AS away_federation_active,
             ms.home_goals_ht, ms.away_goals_ht
      FROM matches m
      LEFT JOIN clubs hc ON hc.id_club = m.home_club_id
      LEFT JOIN clubs ac ON ac.id_club = m.away_club_id
      LEFT JOIN countries hco ON hco.id_country = m.home_country_id
      LEFT JOIN countries aco ON aco.id_country = m.away_country_id
      LEFT JOIN federations hf ON hf.id_country = m.home_country_id AND hf.sphere = 'nacional'
      LEFT JOIN federations af ON af.id_country = m.away_country_id AND af.sphere = 'nacional'
      LEFT JOIN match_stats ms ON ms.id_match = m.id_match
      WHERE m.id_league = $1 AND m.id_season = $2
      ORDER BY m.game_week ASC NULLS LAST, m.match_date ASC
    `, [leagueId, idSeason]);

    // Verifica se as partidas já foram mapeadas via phase_key (fonte de verdade)
    // Um mapeamento é considerado "confirmado" se ≥50% das partidas com data têm phase_key
    const withDate = matchesRes.rows.filter(m => m.match_date);
    const withPhaseKey = withDate.filter(m => m.phase_key);
    const phaseKeyConfirmed = withDate.length > 0 && (withPhaseKey.length / withDate.length) >= 0.5;

    // Calcula phase das partidas:
    // Para apertura_clausura: SEMPRE usa detecção temporal para o split apertura/clausura.
    // Phase_keys como "fase_1" ou "partidas_interzonais" são sub-fases dentro de um torneio,
    // não o torneio em si — só datas garantem o split correto.
    // Para outros formatos: usa phase_key se confirmado, senão undefined.
    let resolvePhase;

    if (isAperturaClausura) {
      const torneioKeys = acTorneioKeys.length >= 2 ? acTorneioKeys : ['apertura', 'clausura'];
      const torneioKeysLower = torneioKeys.map(k => k.toLowerCase());
      const key0 = torneioKeys[0];
      const key1 = torneioKeys[1];

      console.log(`\n========== [getLeagueSports] AC DIAGNOSTIC ==========`);
      console.log(`League=${leagueId} Season=${season} Torneios=${JSON.stringify(torneioKeys)}`);
      console.log(`configuredTorneios:`, JSON.stringify((configuredTorneios ?? []).map(t => ({ key: t.key, nome: t.nome, startDate: t.startDate, numFases: t.fases?.length })), null, 2));
      console.log(`Total matches: ${matchesRes.rows.length}, com data: ${matchesRes.rows.filter(m => m.match_date).length}`);
      const phaseKeyStats = {};
      for (const m of matchesRes.rows) {
        const k = m.phase_key ?? 'null';
        phaseKeyStats[k] = (phaseKeyStats[k] ?? 0) + 1;
      }
      console.log(`phase_key distribution:`, JSON.stringify(phaseKeyStats, null, 2));

      // Tenta bater phase_key direto com torneio key (ex: "Apertura" → "apertura")
      const directPhaseMatch = (pk) => {
        if (!pk) return null;
        const lower = pk.toLowerCase();
        for (const tk of torneioKeysLower) {
          if (lower === tk) return tk;
          if (lower.startsWith(tk + '_')) return tk;
        }
        return null;
      };

      // 1) PRIMÁRIO: startDate configurado
      // Funciona com 2 datas (ambos configurados) ou 1 data no torneio POSTERIOR (key1/clausura).
      // Se apenas o torneio inicial (key0) tem data, não é suficiente para determinar onde o segundo começa
      // → cai no fallback temporal.
      const torneiosComData = (configuredTorneios ?? []).filter(t => t.startDate);
      // Considera utilizável se: >=2 datas, ou a única data é de um torneio que NÃO seja key0
      const usableStartDates = torneiosComData.length >= 2
        || (torneiosComData.length === 1 && torneiosComData[0].key !== key0);

      if (usableStartDates) {
        // Torneio sem startDate recebe todas as partidas ANTES da primeira data configurada (= é o inicial)
        const noDateKey = torneioKeys.find(k => !torneiosComData.some(t => t.key === k)) ?? key0;
        const sorted = [...torneiosComData].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        console.log(`[AC] Usando startDate. noDateKey=${noDateKey}, sorted=${JSON.stringify(sorted.map(t => ({ key: t.key, startDate: t.startDate })))}`);
        resolvePhase = (m) => {
          const direct = directPhaseMatch(m.phase_key);
          if (direct) return direct;
          if (!m.match_date) return noDateKey;
          const ms = new Date(m.match_date).getTime();
          let assigned = noDateKey;
          for (const t of sorted) {
            if (ms >= new Date(t.startDate).getTime()) assigned = t.key;
          }
          return assigned;
        };
      } else {
        // 2) FALLBACK: maior gap temporal (> 15 dias)
        const sortedByDate = matchesRes.rows
          .filter(r => r.match_date)
          .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
        const MIN_GAP_MS = 15 * 24 * 3600 * 1000;
        let maxGapMs = 0;
        let splitDate = null;
        for (let i = 1; i < sortedByDate.length; i++) {
          const gap = new Date(sortedByDate[i].match_date) - new Date(sortedByDate[i - 1].match_date);
          if (gap > maxGapMs && gap >= MIN_GAP_MS) {
            maxGapMs = gap;
            splitDate = sortedByDate[i].match_date;
          }
        }
        console.log(`[AC] Usando temporal gap. splitDate=${splitDate}, maxGap=${Math.round(maxGapMs / 86400000)}d`);

        resolvePhase = (m) => {
          const direct = directPhaseMatch(m.phase_key);
          if (direct) return direct;
          if (!splitDate) return key0;
          return m.match_date && new Date(m.match_date) >= new Date(splitDate) ? key1 : key0;
        };
      }
    } else if (phaseKeyConfirmed) {
      resolvePhase = (m) => m.phase_key ?? undefined;
    } else {
      resolvePhase = () => undefined;
    }

    // Classificação
    let standings;
    if (isAperturaClausura) {
      // Agrupa por torneio (phase já está normalizado para torneio key)
      const byTorneio = {};
      for (const m of matchesRes.rows) {
        const tk = resolvePhase(m) ?? 'sem_fase';
        if (!byTorneio[tk]) byTorneio[tk] = [];
        byTorneio[tk].push(m);
      }
      const splitResult = Object.fromEntries(Object.entries(byTorneio).map(([k, v]) => [k, v.length]));
      console.log(`[AC] Split result:`, JSON.stringify(splitResult));

      const torneioKeys = acTorneioKeys.length >= 2
        ? acTorneioKeys
        : ['apertura', 'clausura'];

      standings = {};
      for (const tk of torneioKeys) {
        standings[tk] = computePhaseStandings(byTorneio[tk] ?? []);
      }
    } else {
      const standingsRes = await db.query(`
        SELECT
          COALESCE(c.id_club, co.id_country) AS id_club,
          COALESCE(c.name, co.name) AS club_name,
          COALESCE(c.crest_url, co.flag_url) AS crest_url,
          c.slug AS club_slug, c.hidden AS club_hidden,
          (ccs.id_country IS NOT NULL) AS is_country,
          f.slug AS federation_slug, f.acronym AS federation_acronym, f.active AS federation_active,
          ccs.position_total, ccs.position_home, ccs.position_away,
          ccs.points,
          ccs.matches_total, ccs.matches_home, ccs.matches_away,
          ccs.wins_total,   ccs.wins_home,   ccs.wins_away,
          ccs.draws_total,  ccs.draws_home,  ccs.draws_away,
          ccs.losses_total, ccs.losses_home, ccs.losses_away,
          ccs.goals_for_total,     ccs.goals_for_home,     ccs.goals_for_away,
          ccs.goals_against_total, ccs.goals_against_home, ccs.goals_against_away,
          ccs.goal_difference, ccs.win_percentage
        FROM club_competition_stats ccs
        LEFT JOIN clubs c ON c.id_club = ccs.id_club
        LEFT JOIN countries co ON co.id_country = ccs.id_country
        LEFT JOIN federations f ON f.id_country = ccs.id_country AND f.sphere = 'nacional'
        WHERE ccs.id_competition_season = $1
        ORDER BY
          CASE WHEN ccs.position_total = 0 OR ccs.position_total IS NULL THEN 1 ELSE 0 END,
          ccs.position_total ASC NULLS LAST,
          (ccs.wins_total * 3 + ccs.draws_total) DESC NULLS LAST,
          ccs.goal_difference DESC NULLS LAST,
          ccs.goals_for_total DESC NULLS LAST
      `, [idCS]);

      const mkRow = (r, posF, wF, dF, lF, gpF, gcF, mF) => ({
        id: r.id_club, name: r.club_name, crest: r.crest_url, slug: r.club_slug ?? null, hidden: r.club_hidden ?? false,
        is_country: r.is_country ?? false,
        federation_slug: r.federation_slug ?? null, federation_acronym: r.federation_acronym ?? null,
        federation_active: r.federation_active ?? false,
        pos: r[posF] || null,
        pts: r[wF] * 3 + r[dF],
        j: r[mF], v: r[wF], e: r[dF], d: r[lF],
        gp: r[gpF], gc: r[gcF],
        sg: (r[gpF] ?? 0) - (r[gcF] ?? 0),
        pct: r[mF] > 0 ? Math.round(((r[wF] * 3 + r[dF]) / (r[mF] * 3)) * 100) : 0,
      });

      const sortByPos = (field) => (a, b) => ((a[field] || 999) - (b[field] || 999));

      standings = {
        total: standingsRes.rows.map(r => mkRow(r, 'position_total', 'wins_total', 'draws_total', 'losses_total', 'goals_for_total', 'goals_against_total', 'matches_total')),
        home: [...standingsRes.rows].sort(sortByPos('position_home')).map(r => mkRow(r, 'position_home', 'wins_home', 'draws_home', 'losses_home', 'goals_for_home', 'goals_against_home', 'matches_home')),
        away: [...standingsRes.rows].sort(sortByPos('position_away')).map(r => mkRow(r, 'position_away', 'wins_away', 'draws_away', 'losses_away', 'goals_for_away', 'goals_against_away', 'matches_away')),
      };
    }

    // Agrupa partidas por rodada, adicionando phase resolvida
    const byWeek = {};
    for (const m of matchesRes.rows) {
      const w = m.game_week ?? 0;
      if (!byWeek[w]) byWeek[w] = [];
      byWeek[w].push({
        id: m.id_match, date: m.match_date, status: m.status,
        phase: resolvePhase(m),
        winner_id: m.winner_id ?? null,
        home: { id: m.home_id, name: m.home_name, crest: m.home_crest, slug: m.home_slug ?? null, hidden: m.home_hidden ?? false, is_country: m.home_is_country ?? false, federation_slug: m.home_federation_slug ?? null, federation_acronym: m.home_federation_acronym ?? null, federation_active: m.home_federation_active ?? false },
        away: { id: m.away_id, name: m.away_name, crest: m.away_crest, slug: m.away_slug ?? null, hidden: m.away_hidden ?? false, is_country: m.away_is_country ?? false, federation_slug: m.away_federation_slug ?? null, federation_acronym: m.away_federation_acronym ?? null, federation_active: m.away_federation_active ?? false },
        home_goals: m.home_goals, away_goals: m.away_goals,
        home_goals_ht: m.home_goals_ht, away_goals_ht: m.away_goals_ht,
      });
    }
    const matches = Object.entries(byWeek)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([week, games]) => ({ week: Number(week), games }));

    // Sinaliza se as fases foram confirmadas pelo admin ou ainda são inferência
    const phaseMappingStatus = isMultiFase
      ? (phaseKeyConfirmed ? 'confirmed' : 'inferred')
      : 'na';

    // Atribuições de grupos (Grupo A / B) para apertura_clausura
    let groupClubs = {};
    if (isAperturaClausura) {
      const gcRes = await db.query(`
        SELECT phase_key, group_key, id_club
        FROM competition_group_clubs
        WHERE id_league = $1 AND id_season = $2
        ORDER BY slot_order ASC, id_club ASC
      `, [leagueId, idSeason]);
      for (const row of gcRes.rows) {
        if (!groupClubs[row.phase_key]) groupClubs[row.phase_key] = {};
        if (!groupClubs[row.phase_key][row.group_key]) groupClubs[row.phase_key][row.group_key] = [];
        groupClubs[row.phase_key][row.group_key].push(row.id_club);
      }
    }

    // ── Disciplinar agregado por time na temporada ───────────────────────────
    // Expande cada partida em dois lados (mandante/visitante) e resolve o time
    // como clube OU país (seleções) — funciona para os dois modos
    const disciplineRes = await db.query(`
      SELECT
        COALESCE(c.id_club, co.id_country) AS id_club,
        COALESCE(c.name, co.name) AS club_name,
        COALESCE(c.crest_url, co.flag_url) AS crest_url,
        c.slug AS club_slug,
        (MAX(side.country_id) IS NOT NULL) AS is_country,
        MAX(f.slug) AS federation_slug,
        BOOL_OR(f.active) AS federation_active,
        COUNT(DISTINCT m.id_match)::int AS matches_played,
        COALESCE(SUM(side.fouls), 0)::int AS fouls,
        COALESCE(SUM(side.yellows), 0)::int AS yellow_cards,
        COALESCE(SUM(side.reds), 0)::int AS red_cards
      FROM matches m
      LEFT JOIN match_stats ms ON ms.id_match = m.id_match
      CROSS JOIN LATERAL (
        VALUES (m.home_club_id, m.home_country_id, ms.home_fouls, ms.home_yellow_cards, ms.home_red_cards),
               (m.away_club_id, m.away_country_id, ms.away_fouls, ms.away_yellow_cards, ms.away_red_cards)
      ) AS side(club_id, country_id, fouls, yellows, reds)
      LEFT JOIN clubs c ON c.id_club = side.club_id
      LEFT JOIN countries co ON co.id_country = side.country_id
      LEFT JOIN federations f ON f.id_country = side.country_id AND f.sphere = 'nacional'
      WHERE m.id_league = $1 AND m.id_season = $2
        AND (side.club_id IS NOT NULL OR side.country_id IS NOT NULL)
      GROUP BY 1, 2, 3, 4
      HAVING COUNT(DISTINCT m.id_match) > 0
      ORDER BY yellow_cards DESC NULLS LAST, red_cards DESC NULLS LAST
    `, [leagueId, idSeason]);

    const discipline = disciplineRes.rows.map(r => ({
      id: r.id_club,
      name: r.club_name,
      crest: r.crest_url,
      slug: r.club_slug ?? null,
      is_country: r.is_country ?? false,
      federation_slug: r.federation_slug ?? null,
      federation_active: r.federation_active ?? false,
      matches: r.matches_played,
      fouls: r.fouls,
      yellow: r.yellow_cards,
      red: r.red_cards,
    }));

    // ── Estatísticas por time (Ofensivo / Defensivo / Controle) ───────────────
    // Lê direto de club_competition_stats da temporada (clube OU país/seleção)
    const teamStatsRes = await db.query(`
      SELECT
        COALESCE(c.id_club, co.id_country) AS id,
        COALESCE(c.name, co.name) AS name,
        COALESCE(c.crest_url, co.flag_url) AS crest,
        c.slug AS club_slug, c.hidden AS club_hidden,
        (ccs.id_country IS NOT NULL) AS is_country,
        f.slug AS federation_slug, f.active AS federation_active,
        ccs.matches_total, ccs.goals_for_total, ccs.goals_against_total,
        ccs.shots_total, ccs.shots_on_target_total,
        ccs.xg_for_avg, ccs.xg_against_avg,
        ccs.goals_scored_per_match, ccs.goals_conceded_per_match,
        ccs.clean_sheets_total, ccs.clean_sheet_percentage,
        ccs.possession_total, ccs.first_team_to_score_count,
        ccs.ht_winning_total, ccs.ht_drawing_total, ccs.ht_losing_total,
        ccs.wins_total, ccs.draws_total, ccs.losses_total
      FROM club_competition_stats ccs
      LEFT JOIN clubs c ON c.id_club = ccs.id_club
      LEFT JOIN countries co ON co.id_country = ccs.id_country
      LEFT JOIN federations f ON f.id_country = ccs.id_country AND f.sphere = 'nacional'
      WHERE ccs.id_competition_season = $1
        AND (ccs.id_club IS NOT NULL OR ccs.id_country IS NOT NULL)
    `, [idCS]);

    const numOrNull = v => (v == null ? null : Number(v));
    const teamStats = teamStatsRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      crest: r.crest,
      slug: r.club_slug ?? null,
      hidden: r.club_hidden ?? false,
      is_country: r.is_country ?? false,
      federation_slug: r.federation_slug ?? null,
      federation_active: r.federation_active ?? false,
      matches_played: numOrNull(r.matches_total),
      goals_scored: numOrNull(r.goals_for_total),
      goals_conceded: numOrNull(r.goals_against_total),
      shots: numOrNull(r.shots_total),
      shots_on_target: numOrNull(r.shots_on_target_total),
      xg_for: numOrNull(r.xg_for_avg),
      xg_against: numOrNull(r.xg_against_avg),
      goals_scored_per_match: numOrNull(r.goals_scored_per_match),
      goals_conceded_per_match: numOrNull(r.goals_conceded_per_match),
      clean_sheets: numOrNull(r.clean_sheets_total),
      clean_sheet_percentage: numOrNull(r.clean_sheet_percentage),
      possession: numOrNull(r.possession_total),
      first_to_score: numOrNull(r.first_team_to_score_count),
      leading_at_half_time: numOrNull(r.ht_winning_total),
      draw_at_half_time: numOrNull(r.ht_drawing_total),
      losing_at_half_time: numOrNull(r.ht_losing_total),
      wins: numOrNull(r.wins_total),
      draws: numOrNull(r.draws_total),
      losses: numOrNull(r.losses_total),
    }));

    // ── Estatísticas individuais (Artilharia / Assistências) ──────────────────
    const playersStatsRes = await db.query(`
      SELECT
        p.id_player, p.full_name,
        c.id_club, c.name AS club_name, c.crest_url AS club_crest, c.slug AS club_slug, c.hidden AS club_hidden,
        pst.minutes_total, pst.goals, pst.assists,
        pst.penalties_scored, pst.penalties_missed
      FROM player_seasons ps
      JOIN club_league_seasons cls ON cls.id_club_league_season = ps.id_club_league_season
      JOIN players p ON p.id_player = ps.id_player
      JOIN clubs c ON c.id_club = cls.id_club
      LEFT JOIN player_stats pst ON pst.id_player_season = ps.id_player_season
      WHERE cls.id_league = $1 AND cls.id_season = $2
    `, [leagueId, idSeason]);

    const players = playersStatsRes.rows.map(r => ({
      id: r.id_player,
      name: r.full_name,
      club: { id: r.id_club, name: r.club_name, crest: r.club_crest, slug: r.club_slug ?? null, hidden: r.club_hidden ?? false },
      minutes_played: numOrNull(r.minutes_total),
      goals: numOrNull(r.goals),
      assists: numOrNull(r.assists),
      penalty_goals: numOrNull(r.penalties_scored),
      penalty_misses: numOrNull(r.penalties_missed),
    }));

    res.json({ league, seasons, season, standings, matches, discipline, teamStats, players, phaseMappingStatus, groupClubs });
  } catch (err) {
    console.error('[getLeagueSports]', err);
    res.status(500).json({ error: 'Erro ao buscar dados da liga' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/matches/:id
// Detalhe completo de uma partida
// ─────────────────────────────────────────────────────────────────────────────
export async function getMatchDetail(req, res) {
  const matchId = Number(req.params.id);
  try {
    const r = (await db.query(`
      SELECT m.id_match, m.game_week, m.match_date, m.home_goals, m.away_goals, m.status,
             m.attendance, m.referee, m.stadium_name,
             COALESCE(hc.id_club, hco.id_country) AS home_id,
             COALESCE(hc.name, hco.name) AS home_name,
             COALESCE(hc.crest_url, hco.flag_url) AS home_crest,
             hc.slug AS home_slug, hc.hidden AS home_hidden,
             COALESCE(ac.id_club, aco.id_country) AS away_id,
             COALESCE(ac.name, aco.name) AS away_name,
             COALESCE(ac.crest_url, aco.flag_url) AS away_crest,
             ac.slug AS away_slug, ac.hidden AS away_hidden,
             l.id_league, l.name AS league_name, s.year AS season,
             ms.home_shots, ms.away_shots,
             ms.home_shots_on_target, ms.away_shots_on_target,
             ms.home_possession, ms.away_possession,
             ms.home_corners, ms.away_corners,
             ms.home_fouls, ms.away_fouls,
             ms.home_yellow_cards, ms.away_yellow_cards,
             ms.home_red_cards, ms.away_red_cards,
             ms.home_xg_pre, ms.away_xg_pre,
             ms.home_goals_ht, ms.away_goals_ht
      FROM matches m
      LEFT JOIN clubs hc ON hc.id_club = m.home_club_id
      LEFT JOIN clubs ac ON ac.id_club = m.away_club_id
      LEFT JOIN countries hco ON hco.id_country = m.home_country_id
      LEFT JOIN countries aco ON aco.id_country = m.away_country_id
      JOIN leagues l ON l.id_league = m.id_league
      JOIN seasons s ON s.id_season = m.id_season
      LEFT JOIN match_stats ms ON ms.id_match = m.id_match
      WHERE m.id_match = $1
    `, [matchId])).rows[0];

    if (!r) return res.status(404).json({ error: 'Partida não encontrada' });

    res.json({
      id: r.id_match, game_week: r.game_week, date: r.match_date, status: r.status,
      league: { id: r.id_league, name: r.league_name }, season: r.season,
      home: { id: r.home_id, name: r.home_name, crest: r.home_crest, slug: r.home_slug ?? null, hidden: r.home_hidden ?? false },
      away: { id: r.away_id, name: r.away_name, crest: r.away_crest, slug: r.away_slug ?? null, hidden: r.away_hidden ?? false },
      score: { home: r.home_goals, away: r.away_goals },
      score_ht: { home: r.home_goals_ht, away: r.away_goals_ht },
      info: { attendance: r.attendance, referee: r.referee, stadium: r.stadium_name },
      stats: {
        home_shots: r.home_shots, away_shots: r.away_shots,
        home_shots_on_target: r.home_shots_on_target, away_shots_on_target: r.away_shots_on_target,
        home_possession: r.home_possession, away_possession: r.away_possession,
        home_corners: r.home_corners, away_corners: r.away_corners,
        home_xg_pre: r.home_xg_pre, away_xg_pre: r.away_xg_pre,
        home_fouls: r.home_fouls, away_fouls: r.away_fouls,
        home_yellow_cards: r.home_yellow_cards, away_yellow_cards: r.away_yellow_cards,
        home_red_cards: r.home_red_cards, away_red_cards: r.away_red_cards,
      },
    });
  } catch (err) {
    console.error('[getMatchDetail]', err);
    res.status(500).json({ error: 'Erro ao buscar partida' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/leagues/:id/attendance?season=YYYY
// Página de Público e Renda: big numbers por edição (edition_financials) +
// partidas da temporada com público e estádio (ordenável no front)
// ─────────────────────────────────────────────────────────────────────────────
export async function getLeagueAttendance(req, res) {
  const leagueId = Number(req.params.id);
  const season = Number(req.query.season) || null;

  try {
    // Big numbers de TODAS as edições numa chamada — comparação é client-side.
    // Chave normalizada sem o prefixo da competição: 'world-cup_attendance-total' → 'attendance-total'
    const indRes = await db.query(`
      SELECT fi.code, ef.year, SUM(ef.value) AS value
      FROM edition_financials ef
      JOIN competition_editions ce ON ce.id_edition = ef.id_edition
      JOIN financial_indicators fi ON fi.id = ef.id_indicator
      WHERE ce.id_league = $1
        AND (fi.code LIKE '%attendance%' OR fi.code LIKE '%ticketing%' OR fi.code LIKE '%number-matches')
      GROUP BY fi.code, ef.year
      ORDER BY ef.year
    `, [leagueId]);

    const indicators = {}; // { ano: { 'attendance-total': v, ... } }
    for (const r of indRes.rows) {
      const key = r.code.includes('_') ? r.code.slice(r.code.indexOf('_') + 1) : r.code;
      if (!indicators[r.year]) indicators[r.year] = {};
      indicators[r.year][key] = parseFloat(r.value);
    }

    // Temporadas disponíveis: união de edições com indicadores e anos com partidas
    const matchYearsRes = await db.query(`
      SELECT DISTINCT s.year FROM matches m
      JOIN seasons s ON s.id_season = m.id_season
      WHERE m.id_league = $1
    `, [leagueId]);
    const seasons = [...new Set([
      ...Object.keys(indicators).map(Number),
      ...matchYearsRes.rows.map(r => r.year),
    ])].sort((a, b) => b - a);

    // Partidas da temporada pedida — com público e estádio
    let matches = [];
    if (season) {
      const sRes = await db.query(`SELECT id_season FROM seasons WHERE year = $1`, [season]);
      if (sRes.rows.length) {
        const mRes = await db.query(`
          SELECT m.id_match, m.match_date, m.game_week, m.home_goals, m.away_goals,
                 m.attendance, m.stadium_name,
                 COALESCE(hc.name, hco.name) AS home_name,
                 COALESCE(hc.crest_url, hco.flag_url) AS home_crest,
                 hc.slug AS home_slug,
                 hf.slug AS home_federation_slug,
                 COALESCE(ac.name, aco.name) AS away_name,
                 COALESCE(ac.crest_url, aco.flag_url) AS away_crest,
                 ac.slug AS away_slug,
                 af.slug AS away_federation_slug
          FROM matches m
          LEFT JOIN clubs hc ON hc.id_club = m.home_club_id
          LEFT JOIN clubs ac ON ac.id_club = m.away_club_id
          LEFT JOIN countries hco ON hco.id_country = m.home_country_id
          LEFT JOIN countries aco ON aco.id_country = m.away_country_id
          LEFT JOIN federations hf ON hf.id_country = m.home_country_id AND hf.sphere = 'nacional'
          LEFT JOIN federations af ON af.id_country = m.away_country_id AND af.sphere = 'nacional'
          WHERE m.id_league = $1 AND m.id_season = $2
          ORDER BY m.match_date ASC NULLS LAST, m.id_match
        `, [leagueId, sRes.rows[0].id_season]);
        matches = mRes.rows;
      }
    }

    res.json({ seasons, indicators, season, matches });
  } catch (err) {
    console.error('[getLeagueAttendance]', err);
    res.status(500).json({ error: 'Erro ao buscar público e renda' });
  }
}
