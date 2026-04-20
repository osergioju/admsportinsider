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
      JOIN countries co ON co.id_country = l.id_country
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

    const competitions = [];

    for (const comp of compRes.rows) {
      // Full standings with home/away splits
      const standingsRes = await db.query(`
        SELECT c.id_club, c.name AS club_name, c.crest_url,
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
        WHERE ccs.id_competition_season = $1
        ORDER BY ccs.position_total ASC NULLS LAST
      `, [comp.id_competition_season]);

      // Last 5 matches for form
      const formRes = await db.query(`
        SELECT home_club_id, away_club_id, home_goals, away_goals
        FROM matches
        WHERE id_league = $1 AND id_season = $2
          AND (home_club_id = $3 OR away_club_id = $3)
          AND home_goals IS NOT NULL
        ORDER BY game_week DESC LIMIT 5
      `, [comp.id_league, comp.id_season, clubId]);
      const form = computeForm(formRes.rows, clubId);

      // Club stats (all splits)
      const statsRes = await db.query(`
        SELECT ccs.*
        FROM club_competition_stats ccs
        WHERE ccs.id_competition_season = $1 AND ccs.id_club = $2
      `, [comp.id_competition_season, clubId]);
      const cs = statsRes.rows[0] || {};

      // All matches of this club in this competition
      const matchesRes = await db.query(`
        SELECT m.id_match, m.game_week, m.match_date, m.home_goals, m.away_goals, m.status,
               hc.id_club AS home_id, hc.name AS home_name, hc.crest_url AS home_crest,
               ac.id_club AS away_id, ac.name AS away_name, ac.crest_url AS away_crest,
               ms.home_goals_ht, ms.away_goals_ht
        FROM matches m
        JOIN clubs hc ON hc.id_club = m.home_club_id
        JOIN clubs ac ON ac.id_club = m.away_club_id
        LEFT JOIN match_stats ms ON ms.id_match = m.id_match
        WHERE m.id_league = $1 AND m.id_season = $2
          AND (m.home_club_id = $3 OR m.away_club_id = $3)
        ORDER BY m.game_week ASC NULLS LAST, m.match_date ASC
      `, [comp.id_league, comp.id_season, clubId]);

      const matchesByWeek = {};
      for (const m of matchesRes.rows) {
        const w = m.game_week ?? 0;
        if (!matchesByWeek[w]) matchesByWeek[w] = [];
        matchesByWeek[w].push({
          id: m.id_match,
          date: m.match_date,
          home: { id: m.home_id, name: m.home_name, crest: m.home_crest },
          away: { id: m.away_id, name: m.away_name, crest: m.away_crest },
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

      const buildRow = (r, posF, wF, dF, lF, gpF, gcF, mF) => ({
        id: r.id_club,
        name: r.club_name,
        crest: r.crest_url,
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
          total: standingsRes.rows.map(r => buildRow(r, 'position_total', 'wins_total', 'draws_total', 'losses_total', 'goals_for_total', 'goals_against_total', 'matches_total')),
          home: standingsRes.rows.filter(r => r.position_home).sort((a, b) => (a.position_home ?? 999) - (b.position_home ?? 999)).map(r => buildRow(r, 'position_home', 'wins_home', 'draws_home', 'losses_home', 'goals_for_home', 'goals_against_home', 'matches_home')),
          away: standingsRes.rows.filter(r => r.position_away).sort((a, b) => (a.position_away ?? 999) - (b.position_away ?? 999)).map(r => buildRow(r, 'position_away', 'wins_away', 'draws_away', 'losses_away', 'goals_for_away', 'goals_against_away', 'matches_away')),
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
      SELECT
        p.id_player,
        p.full_name,
        p.birthday,
        p.position,
        co.name     AS nationality,
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
      ORDER BY ps.shirt_number ASC NULLS LAST
    `, [clubId, season]);

    const players = result.rows.map(p => ({
      id: p.id_player,
      name: p.full_name,
      position: mapPositionPT(p.position),
      number: p.shirt_number,
      age: calcAge(p.birthday),
      nationality: p.nationality || "—",
      flag_url: p.flag_url,
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
        club: { id: row.id_club, name: row.club_name, crest_url: row.crest_url },
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
  const get = (id, name, crest) => {
    if (!clubs.has(id)) clubs.set(id, { id, name, crest, j:0, v:0, e:0, d:0, gp:0, gc:0 });
    return clubs.get(id);
  };
  for (const m of rawRows) {
    if (m.home_goals == null || m.away_goals == null) continue;
    const hg = Number(m.home_goals), ag = Number(m.away_goals);
    const h = get(m.home_id, m.home_name, m.home_crest);
    const a = get(m.away_id, m.away_name, m.away_crest);
    h.j++; a.j++; h.gp += hg; h.gc += ag; a.gp += ag; a.gc += hg;
    if (hg > ag) { h.v++; a.d++; } else if (hg < ag) { a.v++; h.d++; } else { h.e++; a.e++; }
  }
  return [...clubs.values()]
    .map(c => ({ ...c, pts: c.v*3+c.e, sg: c.gp-c.gc, pct: c.j>0 ? Math.round(((c.v*3+c.e)/(c.j*3))*100) : 0 }))
    .sort((a, b) => (b.pts-a.pts) || (b.sg-a.sg) || (b.gp-a.gp))
    .map((c, i) => ({ ...c, pos: i+1 }));
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
      JOIN countries c ON c.id_country = l.id_country
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

    // Busca partidas brutas (sempre necessário)
    const matchesRes = await db.query(`
      SELECT m.id_match, m.game_week, m.match_date, m.home_goals, m.away_goals, m.status,
             hc.id_club AS home_id, hc.name AS home_name, hc.crest_url AS home_crest,
             ac.id_club AS away_id, ac.name AS away_name, ac.crest_url AS away_crest,
             ms.home_goals_ht, ms.away_goals_ht
      FROM matches m
      JOIN clubs hc ON hc.id_club = m.home_club_id
      JOIN clubs ac ON ac.id_club = m.away_club_id
      LEFT JOIN match_stats ms ON ms.id_match = m.id_match
      WHERE m.id_league = $1 AND m.id_season = $2
      ORDER BY m.game_week ASC NULLS LAST, m.match_date ASC
    `, [leagueId, idSeason]);

    // Detecta ponto de corte Apertura/Clausura por gap temporal > 45 dias
    let splitDate = null;
    if (isAperturaClausura) {
      const sorted = matchesRes.rows
        .filter(r => r.match_date)
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
      const GAP_MS = 45 * 24 * 3600 * 1000;
      for (let i = 1; i < sorted.length; i++) {
        if (new Date(sorted[i].match_date) - new Date(sorted[i-1].match_date) > GAP_MS) {
          splitDate = sorted[i].match_date;
          break;
        }
      }
    }

    // Classificação
    let standings;
    if (isAperturaClausura) {
      const clausuraRows = splitDate
        ? matchesRes.rows.filter(m => !m.match_date || new Date(m.match_date) < new Date(splitDate))
        : matchesRes.rows;
      const aperturaRows = splitDate
        ? matchesRes.rows.filter(m => m.match_date && new Date(m.match_date) >= new Date(splitDate))
        : [];
      standings = {
        clausura: computePhaseStandings(clausuraRows),
        apertura: computePhaseStandings(aperturaRows),
      };
    } else {
      const standingsRes = await db.query(`
        SELECT c.id_club, c.name AS club_name, c.crest_url,
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
        WHERE ccs.id_competition_season = $1
        ORDER BY
          -- posição 0 = não preenchida, cai no fallback por pontos
          CASE WHEN ccs.position_total = 0 OR ccs.position_total IS NULL THEN 1 ELSE 0 END,
          ccs.position_total ASC NULLS LAST,
          (ccs.wins_total * 3 + ccs.draws_total) DESC NULLS LAST,
          ccs.goal_difference DESC NULLS LAST,
          ccs.goals_for_total DESC NULLS LAST
      `, [idCS]);

      // pos=0 é tratado como null → StandingsTable usa o índice como fallback
      const mkRow = (r, posF, wF, dF, lF, gpF, gcF, mF) => ({
        id: r.id_club, name: r.club_name, crest: r.crest_url,
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

    // Agrupa partidas por rodada, adicionando fase para apertura_clausura
    const byWeek = {};
    for (const m of matchesRes.rows) {
      const w = m.game_week ?? 0;
      if (!byWeek[w]) byWeek[w] = [];
      const phase = isAperturaClausura && splitDate
        ? (m.match_date && new Date(m.match_date) >= new Date(splitDate) ? 'apertura' : 'clausura')
        : undefined;
      byWeek[w].push({
        id: m.id_match, date: m.match_date, status: m.status, phase,
        home: { id: m.home_id, name: m.home_name, crest: m.home_crest },
        away: { id: m.away_id, name: m.away_name, crest: m.away_crest },
        home_goals: m.home_goals, away_goals: m.away_goals,
        home_goals_ht: m.home_goals_ht, away_goals_ht: m.away_goals_ht,
      });
    }
    const matches = Object.entries(byWeek)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([week, games]) => ({ week: Number(week), games }));

    // ── Disciplinar agregado por clube na temporada ──────────────────────────
    const disciplineRes = await db.query(`
      SELECT
        c.id_club,
        c.name  AS club_name,
        c.crest_url,
        COUNT(DISTINCT m.id_match)::int AS matches_played,
        COALESCE(SUM(
          CASE WHEN m.home_club_id = c.id_club
               THEN ms.home_fouls ELSE ms.away_fouls END
        ), 0)::int AS fouls,
        COALESCE(SUM(
          CASE WHEN m.home_club_id = c.id_club
               THEN ms.home_yellow_cards ELSE ms.away_yellow_cards END
        ), 0)::int AS yellow_cards,
        COALESCE(SUM(
          CASE WHEN m.home_club_id = c.id_club
               THEN ms.home_red_cards ELSE ms.away_red_cards END
        ), 0)::int AS red_cards
      FROM clubs c
      JOIN matches m
        ON m.home_club_id = c.id_club OR m.away_club_id = c.id_club
      LEFT JOIN match_stats ms ON ms.id_match = m.id_match
      WHERE m.id_league = $1 AND m.id_season = $2
      GROUP BY c.id_club, c.name, c.crest_url
      HAVING COUNT(DISTINCT m.id_match) > 0
      ORDER BY yellow_cards DESC NULLS LAST, red_cards DESC NULLS LAST
    `, [leagueId, idSeason]);

    const discipline = disciplineRes.rows.map(r => ({
      id: r.id_club,
      name: r.club_name,
      crest: r.crest_url,
      matches: r.matches_played,
      fouls: r.fouls,
      yellow: r.yellow_cards,
      red: r.red_cards,
    }));

    res.json({ league, seasons, season, standings, matches, discipline });
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
             hc.id_club AS home_id, hc.name AS home_name, hc.crest_url AS home_crest,
             ac.id_club AS away_id, ac.name AS away_name, ac.crest_url AS away_crest,
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
      JOIN clubs hc ON hc.id_club = m.home_club_id
      JOIN clubs ac ON ac.id_club = m.away_club_id
      JOIN leagues l ON l.id_league = m.id_league
      JOIN seasons s ON s.id_season = m.id_season
      LEFT JOIN match_stats ms ON ms.id_match = m.id_match
      WHERE m.id_match = $1
    `, [matchId])).rows[0];

    if (!r) return res.status(404).json({ error: 'Partida não encontrada' });

    res.json({
      id: r.id_match, game_week: r.game_week, date: r.match_date, status: r.status,
      league: { id: r.id_league, name: r.league_name }, season: r.season,
      home: { id: r.home_id, name: r.home_name, crest: r.home_crest },
      away: { id: r.away_id, name: r.away_name, crest: r.away_crest },
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
