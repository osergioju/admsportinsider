import xlsx from "xlsx";
import slugify from "slugify";
import db from "../config/db.js";

const toNumber = (v) => {
  if (!v || v === "N/A") return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const toInt = (value) => {
  if (value === null || value === undefined) return null;
  if (value === "N/A") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const chunk = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

// CSV files sent as buffer are read as Latin-1 by xlsx by default.
// This helper forces UTF-8 decoding for CSV so accented chars (ã, ê, etc.) are preserved.
function readWorkbook(file) {
  const isCSV = file.mimetype === "text/csv"
    || file.mimetype === "application/csv"
    || file.originalname.toLowerCase().endsWith(".csv");

  if (isCSV) {
    return xlsx.read(file.buffer.toString("utf8"), { type: "string" });
  }
  return xlsx.read(file.buffer, { type: "buffer", cellDates: true });
}

// Builds a parameterized VALUES string for bulk inserts.
// e.g. buildValues(3, 2) → "($1,$2,$3),($4,$5,$6)"
function buildValues(rowCount, colCount) {
  return Array.from({ length: rowCount }, (_, i) => {
    const base = i * colCount;
    const cols = Array.from({ length: colCount }, (__, j) => `$${base + j + 1}`);
    return `(${cols.join(",")})`;
  }).join(",");
}

export async function importMatches(req, res) {
  const client = await db.connect();

  try {
    const idLeague = Number(req.body.league);
    const seasonYear = Number(req.body.season);
    const clubMappings = req.body.clubMappings ? JSON.parse(req.body.clubMappings) : {};
    // clubMappings: { "csvTeamName": dbClubId }

    if (!idLeague || !seasonYear) {
      return res.status(400).json({ error: "Liga e temporada são obrigatórias" });
    }

    const workbook = readWorkbook(req.file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null });

    await client.query("BEGIN");

    /* ------------------------------------------------------------------
       SEASON
    ------------------------------------------------------------------ */

    let seasonRes = await client.query(
      `SELECT id_season FROM seasons WHERE year = $1`,
      [seasonYear]
    );

    let idSeason;

    if (!seasonRes.rows.length) {
      const newSeason = await client.query(
        `INSERT INTO seasons (year) VALUES ($1) RETURNING id_season`,
        [seasonYear]
      );
      idSeason = newSeason.rows[0].id_season;
    } else {
      idSeason = seasonRes.rows[0].id_season;
    }

    /* ------------------------------------------------------------------
       CLUBS CACHE — filtered to this league to avoid full-table scan
    ------------------------------------------------------------------ */

    const clubsRes = await client.query(`
      SELECT c.id_club, c.name, c.slug
      FROM clubs c
      WHERE c.id_country = (SELECT id_country FROM leagues WHERE id_league = $1)
    `, [idLeague]);

    const clubsMap = new Map();
    for (const club of clubsRes.rows) {
      const slug = club.slug || slugify(club.name, { lower: true, strict: true });
      clubsMap.set(slug, club.id_club);
    }

    /* ------------------------------------------------------------------
       PREPARE ROWS
    ------------------------------------------------------------------ */

    const matchRows = [];
    const skippedReasons = [];

    for (const row of rows) {
      const homeName = row["home_team_name"];
      const awayName = row["away_team_name"];

      if (!homeName || !awayName) {
        skippedReasons.push({ reason: "missing_team_name", row: homeName || awayName });
        continue;
      }

      const homeSlug = slugify(homeName, { lower: true, strict: true });
      const awaySlug = slugify(awayName, { lower: true, strict: true });

      let homeClubId = clubsMap.get(homeSlug);
      if (!homeClubId && clubMappings[homeName] != null) homeClubId = Number(clubMappings[homeName]);

      let awayClubId = clubsMap.get(awaySlug);
      if (!awayClubId && clubMappings[awayName] != null) awayClubId = Number(clubMappings[awayName]);

      if (!homeClubId || !awayClubId) {
        skippedReasons.push({ reason: "club_not_found", home: homeName, away: awayName });
        continue;
      }

      let matchTimestamp = null;
      let matchDate = null;

      if (row["timestamp"]) {
        matchTimestamp = Number(row["timestamp"]);
        matchDate = new Date(matchTimestamp * 1000);
      } else if (row["date_GMT"]) {
        const normalized = row["date_GMT"].replace(" - ", " ");
        const parsed = new Date(normalized);
        if (!isNaN(parsed)) {
          matchDate = parsed;
          matchTimestamp = Math.floor(parsed.getTime() / 1000);
        }
      }

      matchRows.push([
        idLeague,
        idSeason,
        homeClubId,
        awayClubId,
        matchTimestamp,
        matchDate,
        row["status"] || null,
        toInt(row["attendance"]),
        row["referee"] || null,
        row["stadium_name"] || null,
        toInt(row["Game Week"]),
        Number(row["home_team_goal_count"] || 0),
        Number(row["away_team_goal_count"] || 0),
        // stats columns (index 13–30)
        toInt(row["home_team_shots"]),
        toInt(row["away_team_shots"]),
        toInt(row["home_team_shots_on_target"]),
        toInt(row["away_team_shots_on_target"]),
        toInt(row["home_team_possession"]),
        toInt(row["away_team_possession"]),
        toInt(row["home_team_corner_count"]),
        toInt(row["away_team_corner_count"]),
        toInt(row["home_team_fouls"]),
        toInt(row["away_team_fouls"]),
        toInt(row["home_team_yellow_cards"]),
        toInt(row["away_team_yellow_cards"]),
        toInt(row["home_team_red_cards"]),
        toInt(row["away_team_red_cards"]),
        // extended stats
        toNumber(row["Home Team Pre-Match xG"]) || null,
        toNumber(row["Away Team Pre-Match xG"]) || null,
        toInt(row["home_team_goal_count_half_time"]),
        toInt(row["away_team_goal_count_half_time"]),
      ]);
    }

    /* ------------------------------------------------------------------
       BULK INSERT matches + match_stats
       — rows com game_week usam a constraint uq_match
       — rows sem game_week (mata-mata, copa) usam o índice parcial por timestamp
    ------------------------------------------------------------------ */

    let inserted = 0;

    const MATCH_COLS = 13;
    const STATS_COLS = 18; // 14 base + 4 extended (xG pre, ht goals)

    // Separa em dois grupos para usar o conflict target correto
    const rowsWithGW    = matchRows.filter(r => r[10] != null); // game_week = col 10
    const rowsWithoutGW = matchRows.filter(r => r[10] == null);

    const MATCH_UPDATE = `
      match_timestamp = EXCLUDED.match_timestamp,
      match_date      = EXCLUDED.match_date,
      home_goals      = EXCLUDED.home_goals,
      away_goals      = EXCLUDED.away_goals,
      status          = EXCLUDED.status,
      attendance      = EXCLUDED.attendance,
      referee         = EXCLUDED.referee,
      stadium_name    = EXCLUDED.stadium_name
    `;

    const insertMatchChunk = async (chunkRows, conflictClause) => {
      const matchParams = chunkRows.map(r => r.slice(0, MATCH_COLS)).flat();
      const matchValues = buildValues(chunkRows.length, MATCH_COLS);

      const res = await client.query(`
        INSERT INTO matches (
          id_league, id_season, home_club_id, away_club_id,
          match_timestamp, match_date, status, attendance,
          referee, stadium_name, game_week, home_goals, away_goals
        )
        VALUES ${matchValues}
        ${conflictClause}
        RETURNING id_match
      `, matchParams);

      return res.rows.map(r => r.id_match);
    };

    const insertStatsChunk = async (chunkRows, matchIds) => {
      const statsRows   = chunkRows.map((r, i) => [matchIds[i], ...r.slice(MATCH_COLS)]);
      const statsParams = statsRows.flat();
      const statsValues = buildValues(statsRows.length, STATS_COLS + 1);

      await client.query(`
        INSERT INTO match_stats (
          id_match,
          home_shots, away_shots,
          home_shots_on_target, away_shots_on_target,
          home_possession, away_possession,
          home_corners, away_corners,
          home_fouls, away_fouls,
          home_yellow_cards, away_yellow_cards,
          home_red_cards, away_red_cards,
          home_xg_pre, away_xg_pre,
          home_goals_ht, away_goals_ht
        )
        VALUES ${statsValues}
        ON CONFLICT (id_match) DO UPDATE SET
          home_shots             = EXCLUDED.home_shots,
          away_shots             = EXCLUDED.away_shots,
          home_shots_on_target   = EXCLUDED.home_shots_on_target,
          away_shots_on_target   = EXCLUDED.away_shots_on_target,
          home_possession        = EXCLUDED.home_possession,
          away_possession        = EXCLUDED.away_possession,
          home_corners           = EXCLUDED.home_corners,
          away_corners           = EXCLUDED.away_corners,
          home_fouls             = EXCLUDED.home_fouls,
          away_fouls             = EXCLUDED.away_fouls,
          home_yellow_cards      = EXCLUDED.home_yellow_cards,
          away_yellow_cards      = EXCLUDED.away_yellow_cards,
          home_red_cards         = EXCLUDED.home_red_cards,
          away_red_cards         = EXCLUDED.away_red_cards,
          home_xg_pre            = EXCLUDED.home_xg_pre,
          away_xg_pre            = EXCLUDED.away_xg_pre,
          home_goals_ht          = EXCLUDED.home_goals_ht,
          away_goals_ht          = EXCLUDED.away_goals_ht
      `, statsParams);
    };

    // Grupo 1: com game_week → constraint uq_match
    for (const chunkRows of chunk(rowsWithGW, 100)) {
      const conflict = `ON CONFLICT (id_league, id_season, home_club_id, away_club_id, game_week) DO UPDATE SET ${MATCH_UPDATE}`;
      const matchIds = await insertMatchChunk(chunkRows, conflict);
      await insertStatsChunk(chunkRows, matchIds);
      inserted += chunkRows.length;
    }

    // Grupo 2: sem game_week (mata-mata/copa) → índice parcial por timestamp
    for (const chunkRows of chunk(rowsWithoutGW, 100)) {
      // Separa linhas com e sem timestamp (sem timestamp não tem como deduplicar → INSERT simples)
      const withTs    = chunkRows.filter(r => r[4] != null); // match_timestamp = col 4
      const withoutTs = chunkRows.filter(r => r[4] == null);

      if (withTs.length) {
        // Sem game_week: usa DO NOTHING para segurança.
        // Para upsert completo em reimport, criar o índice em migration_match_timestamp_index.sql
        const matchIds = await insertMatchChunk(withTs, `ON CONFLICT DO NOTHING`);
        await insertStatsChunk(withTs, matchIds);
        inserted += withTs.length;
      }

      if (withoutTs.length) {
        // Nenhuma chave disponível — insere com ON CONFLICT DO NOTHING para evitar erro
        const conflict = `ON CONFLICT DO NOTHING`;
        const matchIds = await insertMatchChunk(withoutTs, conflict);
        await insertStatsChunk(withoutTs, matchIds);
        inserted += withoutTs.length;
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      inserted,
      skipped: skippedReasons.length,
      total: rows.length,
      skippedDetails: skippedReasons
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[importMatches]", error);
    res.status(500).json({ success: false, error: "Erro ao importar partidas" });
  } finally {
    client.release();
  }
}

function normalizeDate(value) {
  if (!value || value === "N/A") return null;

  if (typeof value === "string") {
    const trimmed = value.trim();

    // ISO já pronto: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const parts = trimmed.split("/");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD  — formato do CSV 2024
        const [y, m, d] = parts;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      } else {
        // DD/MM/YYYY  — formato do CSV 2025
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
    }
  }

  // número Excel (serial date)
  if (typeof value === "number") {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }

  // Date object (caso raro)
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return null;
}

export async function importPlayers(req, res) {
  const client = await db.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = readWorkbook(req.file);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, {
      raw: true,
      defval: null,
      blankrows: false
    });

    // leagueId: se fornecido, filtra club_league_seasons por liga e usa mapeamento de nomes
    const idLeague = req.body.leagueId ? Number(req.body.leagueId) : null;
    const clubMappings = req.body.clubMappings ? JSON.parse(req.body.clubMappings) : {};
    const nationalityMappings = req.body.nationalityMappings ? JSON.parse(req.body.nationalityMappings) : {};

    await client.query("BEGIN");

    /* ------------------------------------------------------------------
       CACHE COUNTRIES
    ------------------------------------------------------------------ */

    const countriesRes = await client.query(`SELECT id_country, name FROM countries`);
    const countriesMap = new Map(countriesRes.rows.map(c => [c.name, c.id_country]));

    /* ------------------------------------------------------------------
       CACHE CLUB SEASONS
       Se leagueId fornecido: chave = "clube__ano" (sem nome da liga)
       Caso contrário: chave legada = "clube__liga__ano"
    ------------------------------------------------------------------ */

    const clubSeasonMap = new Map();

    if (idLeague) {
      const cls = await client.query(`
        SELECT cls.id_club_league_season, c.name AS club, s.year AS season
        FROM club_league_seasons cls
        JOIN clubs   c ON c.id_club   = cls.id_club
        JOIN seasons s ON s.id_season = cls.id_season
        WHERE cls.id_league = $1
      `, [idLeague]);
      for (const r of cls.rows) {
        clubSeasonMap.set(`${r.club}__${r.season}`, r.id_club_league_season);
      }

      /* ------------------------------------------------------------------
         AUTO-LINK: para cada par (clube, temporada) do CSV que não tem
         club_league_seasons, cria a entrada — tanto para clubes mapeados
         (clubMappings) quanto para clubes com nome já correto no banco.
      ------------------------------------------------------------------ */
      {
        // Resolve todos os nomes de clube do CSV para nomes no banco
        const csvPairs = [...new Set(
          rows
            .filter(r => r["Current Club"] && r.season)
            .map(r => {
              const raw     = r["Current Club"].trim();
              const dbName  = clubMappings[raw] ?? raw;
              return `${dbName}||${r.season}`;
            })
        )].map(k => { const [n, s] = k.split("||"); return { dbName: n, seasonYear: Number(s) }; });

        // Filtra só os que ainda não estão no mapa
        const missing = csvPairs.filter(({ dbName, seasonYear }) => !clubSeasonMap.has(`${dbName}__${seasonYear}`));

        if (missing.length > 0) {
          const allDbNames    = [...new Set(missing.map(m => m.dbName))];
          const allSeasonYears = [...new Set(missing.map(m => m.seasonYear))];

          // Busca id_club pelos nomes
          const clubLookup = await client.query(
            `SELECT id_club, name FROM clubs WHERE name = ANY($1)`,
            [allDbNames]
          );
          const clubNameToId = new Map(clubLookup.rows.map(c => [c.name, c.id_club]));

          // Cache de id_season por ano
          const seasonIdCache = new Map();
          for (const seasonYear of allSeasonYears) {
            const sRes = await client.query(
              `INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO UPDATE SET year = EXCLUDED.year RETURNING id_season`,
              [seasonYear]
            );
            seasonIdCache.set(seasonYear, sRes.rows[0].id_season);

            await client.query(
              `INSERT INTO competition_seasons (id_league, id_season) VALUES ($1, $2) ON CONFLICT (id_league, id_season) DO NOTHING`,
              [idLeague, sRes.rows[0].id_season]
            );
          }

          for (const { dbName, seasonYear } of missing) {
            const mapKey  = `${dbName}__${seasonYear}`;
            if (clubSeasonMap.has(mapKey)) continue;

            const idClub  = clubNameToId.get(dbName);
            const idSeason = seasonIdCache.get(seasonYear);
            if (!idClub || !idSeason) continue;

            await client.query(
              `INSERT INTO club_seasons (id_club, id_league, year, division) VALUES ($1, $2, $3, $4) ON CONFLICT (id_club, id_league, year) DO NOTHING`,
              [idClub, idLeague, seasonYear, "1"]
            );

            const clsRes = await client.query(
              `INSERT INTO club_league_seasons (id_club, id_league, id_season) VALUES ($1, $2, $3) ON CONFLICT (id_club, id_league, id_season) DO UPDATE SET id_club = EXCLUDED.id_club RETURNING id_club_league_season`,
              [idClub, idLeague, idSeason]
            );

            clubSeasonMap.set(mapKey, clsRes.rows[0].id_club_league_season);
            console.log(`[importPlayers] auto-created CLS: ${mapKey}`);
          }
        }
      }
    } else {
      const cls = await client.query(`
        SELECT
          cls.id_club_league_season,
          c.name  AS club,
          l.name  AS league,
          s.year  AS season
        FROM club_league_seasons cls
        JOIN clubs   c ON c.id_club    = cls.id_club
        JOIN leagues l ON l.id_league  = cls.id_league
        JOIN seasons s ON s.id_season  = cls.id_season
      `);
      for (const r of cls.rows) {
        clubSeasonMap.set(`${r.club}__${r.league}__${r.season}`, r.id_club_league_season);
      }
    }

    /* ------------------------------------------------------------------
       PREPARE PLAYERS — deduplicate by full_name (unique constraint)
    ------------------------------------------------------------------ */

    const playersData = [];
    const seenPlayers = new Set();

    for (const row of rows) {
      if (!row.full_name) continue;

      const birthday = normalizeDate(row.birthday_GMT);

      const dedupKey = row.full_name;
      if (seenPlayers.has(dedupKey)) continue;
      seenPlayers.add(dedupKey);

      const rawNat = row.nationality || null;
      const resolvedNat = rawNat ? (nationalityMappings[rawNat] ?? rawNat) : null;
      const idCountry = resolvedNat ? (countriesMap.get(resolvedNat) || null) : null;

      playersData.push([
        row.full_name,
        birthday,
        idCountry,
        row.position || null
      ]);
    }

    /* ------------------------------------------------------------------
       BULK INSERT PLAYERS
    ------------------------------------------------------------------ */

    // players.created_at has DEFAULT now() — pass only 4 columns
    for (const chunkRows of chunk(playersData, 500)) {
      const values = buildValues(chunkRows.length, 4);
      const params = chunkRows.flat();
      await client.query(`
        INSERT INTO players (full_name, birthday, nationality, position)
        VALUES ${values}
        ON CONFLICT (full_name) DO UPDATE
          SET birthday    = COALESCE(EXCLUDED.birthday,    players.birthday),
              position    = COALESCE(EXCLUDED.position,    players.position),
              nationality = COALESCE(EXCLUDED.nationality, players.nationality)
      `, params);
    }

    const insertedPlayersRes = await client.query(`
      SELECT id_player, full_name, TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday FROM players
    `);
    const playersMap = new Map();
    for (const p of insertedPlayersRes.rows) {
      playersMap.set(p.full_name, p.id_player);
    }

    /* ------------------------------------------------------------------
       PREPARE PLAYER SEASONS + STATS
    ------------------------------------------------------------------ */

    const playerSeasonData = [];
    const playerStatsData = [];
    let skippedNoPlayer = 0;
    let skippedNoClubSeason = 0;

    // Debug collectors
    const debugNoPlayer = [];    // { full_name, birthday_raw, birthday_norm, playerKey }
    const debugNoClubSeason = []; // { full_name, rawClub, resolvedClub, clubSeasonKey }

    console.log(`\n[importPlayers] clubSeasonMap keys (${clubSeasonMap.size}):`);
    for (const k of clubSeasonMap.keys()) console.log("  CLS:", k);
    console.log(`[importPlayers] clubMappings:`, clubMappings);
    console.log(`[importPlayers] total CSV rows: ${rows.length}`);

    for (const row of rows) {
      if (!row.full_name) continue;

      const birthday = normalizeDate(row.birthday_GMT);
      const playerKey = row.full_name;
      const idPlayer = playersMap.get(playerKey);

      // Resolve nome do clube: usa mapeamento do usuário se fornecido
      const rawClub = row["Current Club"];
      const resolvedClub = clubMappings[rawClub] ?? rawClub;
      const clubSeasonKey = idLeague
        ? `${resolvedClub}__${row.season}`
        : `${resolvedClub}__${row.league}__${row.season}`;
      const idClubLeagueSeason = clubSeasonMap.get(clubSeasonKey);

      if (!idPlayer) {
        skippedNoPlayer++;
        if (debugNoPlayer.length < 20) {
          debugNoPlayer.push({ full_name: row.full_name, birthday_raw: row.birthday_GMT, birthday_norm: birthday, playerKey });
          console.log(`[importPlayers] noPlayer: key="${playerKey}" | raw_birthday="${row.birthday_GMT}"`);
        }
        continue;
      }
      if (!idClubLeagueSeason) {
        skippedNoClubSeason++;
        if (debugNoClubSeason.length < 20) {
          debugNoClubSeason.push({ full_name: row.full_name, rawClub, resolvedClub, clubSeasonKey, season: row.season });
          console.log(`[importPlayers] noClubSeason: player="${row.full_name}" | rawClub="${rawClub}" | resolved="${resolvedClub}" | key="${clubSeasonKey}"`);
        }
        continue;
      }

      playerSeasonData.push([
        idPlayer,
        idClubLeagueSeason,
        toInt(row.shirt_number) || null,
        toNumber(row.market_value) || null,
        toNumber(row.annual_salary_eur) || null
      ]);

      playerStatsData.push([
        toNumber(row.goals_overall),
        toNumber(row.assists_overall),
        toNumber(row.shots_total_overall),
        toNumber(row.shots_on_target_total_overall),
        toNumber(row.passes_total_overall),
        toNumber(row.tackles_total_overall),
        toNumber(row.duels_total_overall),
        toNumber(row.xg_total_overall),
        toNumber(row.average_rating_overall),
        // extended columns
        toInt(row.minutes_played_overall),
        toInt(row.appearances_overall),
        toInt(row.games_started),
        toInt(row.goals_home_overall),
        toInt(row.goals_away_overall),
        toInt(row.assists_home_overall),
        toInt(row.assists_away_overall),
        toInt(row.pen_scored_total_overall),
        toInt(row.pen_missed_total_overall),
        toInt(row.clean_sheets_overall),
        toInt(row.clean_sheets_home_overall),
        toInt(row.clean_sheets_away_overall),
        toInt(row.yellow_cards_overall),
        toInt(row.red_cards_overall),
        toNumber(row.shot_accuraccy_percentage_overall) || null, // typo in CSV source
        toNumber(row.pass_completion_rate_overall) || null,
        toInt(row.short_passes_total_overall),
        toInt(row.long_passes_total_overall),
        toInt(row.key_passes_total_overall),
        toInt(row.interceptions_total_overall),
        toInt(row.crosses_total_overall),
        toInt(row.dribbles_total_overall),
        toInt(row.dribbles_successful_total_overall),
        toNumber(row.duels_won_percentage_overall) || null,
        toInt(row.saves_total_overall),
        toInt(row.inside_box_saves_total_overall),
        toInt(row.offsides_total_overall),
        toInt(row.fouls_committed_total_overall),
      ]);
    }

    /* ------------------------------------------------------------------
       DEDUPLICATE player_seasons — same (id_player, id_club_league_season)
       can appear multiple times in one CSV; keep last occurrence to avoid
       "ON CONFLICT DO UPDATE command cannot affect row a second time"
    ------------------------------------------------------------------ */

    const dedupMap = new Map(); // key → { seasonRow, statsRow }
    for (let i = 0; i < playerSeasonData.length; i++) {
      const [idPlayer, idCLS] = playerSeasonData[i];
      dedupMap.set(`${idPlayer}__${idCLS}`, { seasonRow: playerSeasonData[i], statsRow: playerStatsData[i] });
    }
    const dedupedSeasonData = [];
    const dedupedStatsData = [];
    for (const { seasonRow, statsRow } of dedupMap.values()) {
      dedupedSeasonData.push(seasonRow);
      dedupedStatsData.push(statsRow);
    }

    /* ------------------------------------------------------------------
       BULK INSERT player_seasons — RETURNING garante o id mesmo em conflito
    ------------------------------------------------------------------ */

    const playerSeasonIdMap = new Map(); // key: "idPlayer__idCLS" → id_player_season

    for (const chunkRows of chunk(dedupedSeasonData, 500)) {
      const values = buildValues(chunkRows.length, 5);
      const params = chunkRows.flat();

      const result = await client.query(`
        INSERT INTO player_seasons
          (id_player, id_club_league_season, shirt_number, market_value, salary)
        VALUES ${values}
        ON CONFLICT (id_player, id_club_league_season) DO UPDATE
          SET shirt_number = EXCLUDED.shirt_number,
              market_value = EXCLUDED.market_value,
              salary       = EXCLUDED.salary
        RETURNING id_player_season, id_player, id_club_league_season
      `, params);

      for (const r of result.rows) {
        playerSeasonIdMap.set(`${r.id_player}__${r.id_club_league_season}`, r.id_player_season);
      }
    }

    /* ------------------------------------------------------------------
       BULK INSERT player_stats — atualiza em reimport
    ------------------------------------------------------------------ */

    const statsToInsert = [];

    for (let i = 0; i < dedupedSeasonData.length; i++) {
      const [idPlayer, idCLS] = dedupedSeasonData[i];
      const id_player_season = playerSeasonIdMap.get(`${idPlayer}__${idCLS}`);
      if (!id_player_season) continue;
      statsToInsert.push([id_player_season, ...dedupedStatsData[i]]);
    }

    for (const chunkRows of chunk(statsToInsert, 200)) {
      const values = buildValues(chunkRows.length, 38); // 1 id + 9 base + 28 extended
      const params = chunkRows.flat();

      await client.query(`
        INSERT INTO player_stats (
          id_player_season,
          goals, assists, shots, shots_on_target,
          passes, tackles, duels, xg, rating,
          minutes_total, matches_total, matches_started,
          goals_home, goals_away,
          assists_home, assists_away,
          penalties_scored, penalties_missed,
          clean_sheets_total, clean_sheets_home, clean_sheets_away,
          yellow_cards, red_cards,
          shot_accuracy_pct, pass_completion_rate,
          short_passes, long_passes, key_passes,
          interceptions, crosses_total,
          dribbles_total, dribbles_successful,
          duels_won_pct,
          saves_total, inside_box_saves,
          offsides, fouls_committed
        )
        VALUES ${values}
        ON CONFLICT (id_player_season) DO UPDATE
          SET goals              = EXCLUDED.goals,
              assists            = EXCLUDED.assists,
              shots              = EXCLUDED.shots,
              shots_on_target    = EXCLUDED.shots_on_target,
              passes             = EXCLUDED.passes,
              tackles            = EXCLUDED.tackles,
              duels              = EXCLUDED.duels,
              xg                 = EXCLUDED.xg,
              rating             = EXCLUDED.rating,
              minutes_total      = EXCLUDED.minutes_total,
              matches_total      = EXCLUDED.matches_total,
              matches_started    = EXCLUDED.matches_started,
              goals_home         = EXCLUDED.goals_home,
              goals_away         = EXCLUDED.goals_away,
              assists_home       = EXCLUDED.assists_home,
              assists_away       = EXCLUDED.assists_away,
              penalties_scored   = EXCLUDED.penalties_scored,
              penalties_missed   = EXCLUDED.penalties_missed,
              clean_sheets_total = EXCLUDED.clean_sheets_total,
              clean_sheets_home  = EXCLUDED.clean_sheets_home,
              clean_sheets_away  = EXCLUDED.clean_sheets_away,
              yellow_cards       = EXCLUDED.yellow_cards,
              red_cards          = EXCLUDED.red_cards,
              shot_accuracy_pct  = EXCLUDED.shot_accuracy_pct,
              pass_completion_rate = EXCLUDED.pass_completion_rate,
              short_passes       = EXCLUDED.short_passes,
              long_passes        = EXCLUDED.long_passes,
              key_passes         = EXCLUDED.key_passes,
              interceptions      = EXCLUDED.interceptions,
              crosses_total      = EXCLUDED.crosses_total,
              dribbles_total     = EXCLUDED.dribbles_total,
              dribbles_successful = EXCLUDED.dribbles_successful,
              duels_won_pct      = EXCLUDED.duels_won_pct,
              saves_total        = EXCLUDED.saves_total,
              inside_box_saves   = EXCLUDED.inside_box_saves,
              offsides           = EXCLUDED.offsides,
              fouls_committed    = EXCLUDED.fouls_committed
      `, params);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      players: playersData.length,
      seasons: dedupedSeasonData.length,
      stats: statsToInsert.length,
      skipped: {
        noClubSeason: skippedNoClubSeason,
        noPlayer: skippedNoPlayer,
      },
      debug: {
        clubSeasonMapSize: clubSeasonMap.size,
        clubSeasonMapKeys: [...clubSeasonMap.keys()],
        clubMappingsReceived: clubMappings,
        sampleNoPlayer: debugNoPlayer,
        sampleNoClubSeason: debugNoClubSeason,
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[importPlayers]", err);
    res.status(500).json({ error: "Erro no import players", detail: err.message });
  } finally {
    client.release();
  }
}

export async function importTeams(req, res) {
  const client = await db.connect();

  try {
    const idLeague = Number(req.body.league);
    const seasonYear = Number(req.body.season);
    const clubMappings = req.body.clubMappings ? JSON.parse(req.body.clubMappings) : {};
    // clubMappings: { "csvCommonName": dbClubId }

    if (!idLeague || !seasonYear) {
      return res.status(400).json({ error: "Liga e temporada são obrigatórias" });
    }

    const workbook = readWorkbook(req.file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null });

    await client.query("BEGIN");

    /* ------------------------------------------------------------------
       GARANTE seasons — cria se não existir
    ------------------------------------------------------------------ */

    const seasonRes = await client.query(
      `INSERT INTO seasons (year) VALUES ($1)
       ON CONFLICT (year) DO UPDATE SET year = EXCLUDED.year
       RETURNING id_season`,
      [seasonYear]
    );
    const idSeason = seasonRes.rows[0].id_season;

    /* ------------------------------------------------------------------
       GARANTE competition_seasons — cria se não existir
    ------------------------------------------------------------------ */

    const compSeasonRes = await client.query(
      `INSERT INTO competition_seasons (id_league, id_season) VALUES ($1, $2)
       ON CONFLICT (id_league, id_season) DO UPDATE SET id_league = EXCLUDED.id_league
       RETURNING id_competition_season`,
      [idLeague, idSeason]
    );
    const idCompetitionSeason = compSeasonRes.rows[0].id_competition_season;

    /* ------------------------------------------------------------------
       CLUBS CACHE — todos os clubes do país da liga
    ------------------------------------------------------------------ */

    const clubsRes = await client.query(`
      SELECT c.id_club, c.name, c.slug
      FROM clubs c
      WHERE c.id_country = (SELECT id_country FROM leagues WHERE id_league = $1)
    `, [idLeague]);

    const clubsMap = new Map();
    for (const c of clubsRes.rows) {
      if (c.slug) clubsMap.set(c.slug, c.id_club);
      clubsMap.set(slugify(c.name, { lower: true, strict: true }), c.id_club);
    }

    /* ------------------------------------------------------------------
       PREPARE ROWS
    ------------------------------------------------------------------ */

    const statsRows = [];
    const skipped = [];
    const matchedClubIds = [];
    const resolvedLog = []; // para debug

    for (const row of rows) {
      const csvKey = row["common_name"] || row["team_name"] || "";
      const slug = slugify(csvKey, { lower: true, strict: true });
      let idClub = clubsMap.get(slug);
      let resolvedVia = "slug";

      // Fallback: mapeamento manual enviado pelo usuário
      if (!idClub && clubMappings[csvKey] != null) {
        idClub = Number(clubMappings[csvKey]);
        resolvedVia = "manual_mapping";
      }

      if (!idClub) {
        skipped.push(row["team_name"]);
        console.warn(`[importTeams] ⚠️  não encontrado: "${csvKey}" (slug: "${slug}")`);
        continue;
      }

      resolvedLog.push({ csvKey, idClub, via: resolvedVia });
      matchedClubIds.push(idClub);

      statsRows.push([
        idCompetitionSeason,
        idClub,
        toInt(row["league_position"]),
        toInt(row["league_position_home"]),
        toInt(row["league_position_away"]),
        //toInt(row["points_per_game"] * row["matches_played"] || null), // total points
        toInt(Math.round(row["points_per_game"] * row["matches_played"]) || null),
        toInt(row["matches_played"]),
        toInt(row["matches_played_home"]),
        toInt(row["matches_played_away"]),
        toInt(row["wins"]),
        toInt(row["wins_home"]),
        toInt(row["wins_away"]),
        toInt(row["draws"]),
        toInt(row["draws_home"]),
        toInt(row["draws_away"]),
        toInt(row["losses"]),
        toInt(row["losses_home"]),
        toInt(row["losses_away"]),
        toInt(row["goals_scored"]),
        toInt(row["goals_scored_home"]),
        toInt(row["goals_scored_away"]),
        toInt(row["goals_conceded"]),
        toInt(row["goals_conceded_home"]),
        toInt(row["goals_conceded_away"]),
        toInt(row["goal_difference"]),
        toInt(row["shots"]),
        toInt(row["shots_home"]),
        toInt(row["shots_away"]),
        toInt(row["shots_on_target"]),
        toInt(row["shots_on_target_home"]),
        toInt(row["shots_on_target_away"]),
        toNumber(row["average_possession"]) || null,
        toNumber(row["average_possession_home"]) || null,
        toNumber(row["average_possession_away"]) || null,
        toInt(row["clean_sheets"]),
        toInt(row["clean_sheets_home"]),
        toInt(row["clean_sheets_away"]),
        toInt(row["fouls"]),
        toInt(row["fouls_home"]),
        toInt(row["fouls_away"]),
        toInt(row["cards_total"]),       // yellow_cards (total cards from CSV)
        null,                            // red_cards — not separately in CSV total
        // expanded columns
        toNumber(row["points_per_game"]) || null,
        toNumber(row["points_per_game_home"]) || null,
        toNumber(row["points_per_game_away"]) || null,
        toInt(row["corners_total"]),
        toInt(row["corners_total_home"]),
        toInt(row["corners_total_away"]),
        toInt(row["btts_count"]),
        toInt(row["btts_count_home"]),
        toInt(row["btts_count_away"]),
        toNumber(row["btts_percentage"]) || null,
        toInt(row["over15_count"]),
        toInt(row["over25_count"]),
        toInt(row["over35_count"]),
        toNumber(row["over15_percentage"]) || null,
        toNumber(row["over25_percentage"]) || null,
        toNumber(row["over35_percentage"]) || null,
        toNumber(row["xg_for_avg_overall"]) || null,
        toNumber(row["xg_against_avg_overall"]) || null,
        toNumber(row["goals_scored_per_match"]) || null,
        toNumber(row["goals_conceded_per_match"]) || null,
        toNumber(row["corners_per_match"]) || null,
        toNumber(row["win_percentage"]) || null,
        toNumber(row["draw_percentage_overall"]) || null,
        toNumber(row["loss_percentage_ovearll"]) || null,  // typo in CSV source
        toNumber(row["clean_sheet_percentage"]) || null,
        toInt(row["performance_rank"]),
        // half-time result columns
        toInt(row["leading_at_half_time"]),
        toInt(row["leading_at_half_time_home"]),
        toInt(row["leading_at_half_time_away"]),
        toInt(row["draw_at_half_time"]),
        toInt(row["draw_at_half_time_home"]),
        toInt(row["draw_at_half_time_away"]),
        toInt(row["losing_at_half_time"]),
        toInt(row["losing_at_half_time_home"]),
        toInt(row["losing_at_half_time_away"]),
        toInt(row["goals_scored_half_time"]),
        toInt(row["goals_scored_half_time_home"]),
        toInt(row["goals_scored_half_time_away"]),
        toInt(row["goals_conceded_half_time"]),
        toInt(row["goals_conceded_half_time_home"]),
        toInt(row["goals_conceded_half_time_away"]),
      ]);
    }

    /* ------------------------------------------------------------------
       GARANTE club_seasons e club_league_seasons para cada clube encontrado
       Isso permite que importPlayers funcione depois sem configuração extra
    ------------------------------------------------------------------ */

    if (matchedClubIds.length > 0) {
      // club_seasons — liga clube ao ano da liga
      const csValues = buildValues(matchedClubIds.length, 4);
      const csParams = matchedClubIds.flatMap(id => [id, idLeague, seasonYear, "1"]);

      await client.query(`
        INSERT INTO club_seasons (id_club, id_league, year, division)
        VALUES ${csValues}
        ON CONFLICT (id_club, id_league, year) DO NOTHING
      `, csParams);

      // club_league_seasons — necessário para importPlayers
      const clsValues = buildValues(matchedClubIds.length, 3);
      const clsParams = matchedClubIds.flatMap(id => [id, idLeague, idSeason]);

      await client.query(`
        INSERT INTO club_league_seasons (id_club, id_league, id_season)
        VALUES ${clsValues}
        ON CONFLICT (id_club, id_league, id_season) DO NOTHING
      `, clsParams);
    }

    /* ------------------------------------------------------------------
       LOG de resolução CSV → id_club
    ------------------------------------------------------------------ */

    console.log(`[importTeams] ✅ ${resolvedLog.length} clube(s) resolvido(s), ${skipped.length} ignorado(s):`);
    for (const r of resolvedLog) {
      console.log(`  ${r.via === "manual_mapping" ? "🔧" : "🔍"} "${r.csvKey}" → id_club=${r.idClub} (via ${r.via})`);
    }

    /* ------------------------------------------------------------------
       DETECTA duplicatas antes do INSERT para logar claramente
    ------------------------------------------------------------------ */

    const seenKeys = new Map(); // "compSeason__idClub" → csvName
    const dupsFound = [];

    for (const row of statsRows) {
      const key = `${row[0]}__${row[1]}`;
      if (seenKeys.has(key)) {
        dupsFound.push({ key, first: seenKeys.get(key), second: row[2] ?? "?" });
      } else {
        seenKeys.set(key, row[2] ?? "?");
      }
    }

    if (dupsFound.length > 0) {
      console.error(`[importTeams] ❌ ${dupsFound.length} linha(s) duplicada(s) detectada(s) antes do INSERT:`);
      for (const d of dupsFound) {
        console.error(`  → id_competition_season=${d.key.split("__")[0]} id_club=${d.key.split("__")[1]}`);
      }
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: "Duplicatas detectadas no arquivo",
        duplicates: dupsFound.map(d => ({
          id_competition_season: d.key.split("__")[0],
          id_club:               d.key.split("__")[1],
        })),
      });
    }

    /* ------------------------------------------------------------------
       BULK UPSERT club_competition_stats
    ------------------------------------------------------------------ */

    const COL_COUNT = statsRows[0]?.length ?? 0;
    let inserted = 0;

    for (const chunkRows of chunk(statsRows, 50)) {
      const values = buildValues(chunkRows.length, COL_COUNT);
      const params = chunkRows.flat();

      await client.query(`
        INSERT INTO club_competition_stats (
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
          ht_goals_conceded_total, ht_goals_conceded_home, ht_goals_conceded_away
        )
        VALUES ${values}
        ON CONFLICT (id_competition_season, id_club) DO UPDATE SET
          position_total       = EXCLUDED.position_total,
          position_home        = EXCLUDED.position_home,
          position_away        = EXCLUDED.position_away,
          points               = EXCLUDED.points,
          matches_total        = EXCLUDED.matches_total,
          wins_total           = EXCLUDED.wins_total,
          draws_total          = EXCLUDED.draws_total,
          losses_total         = EXCLUDED.losses_total,
          goals_for_total      = EXCLUDED.goals_for_total,
          goals_against_total  = EXCLUDED.goals_against_total,
          goal_difference      = EXCLUDED.goal_difference,
          shots_total          = EXCLUDED.shots_total,
          shots_on_target_total= EXCLUDED.shots_on_target_total,
          possession_total     = EXCLUDED.possession_total,
          clean_sheets_total   = EXCLUDED.clean_sheets_total,
          fouls_total          = EXCLUDED.fouls_total,
          yellow_cards         = EXCLUDED.yellow_cards,
          points_per_game      = EXCLUDED.points_per_game,
          corners_total        = EXCLUDED.corners_total,
          btts_count           = EXCLUDED.btts_count,
          btts_percentage      = EXCLUDED.btts_percentage,
          over15_count         = EXCLUDED.over15_count,
          over25_count         = EXCLUDED.over25_count,
          over35_count         = EXCLUDED.over35_count,
          over15_percentage    = EXCLUDED.over15_percentage,
          over25_percentage    = EXCLUDED.over25_percentage,
          over35_percentage    = EXCLUDED.over35_percentage,
          xg_for_avg           = EXCLUDED.xg_for_avg,
          xg_against_avg       = EXCLUDED.xg_against_avg,
          goals_scored_per_match   = EXCLUDED.goals_scored_per_match,
          goals_conceded_per_match = EXCLUDED.goals_conceded_per_match,
          win_percentage       = EXCLUDED.win_percentage,
          draw_percentage      = EXCLUDED.draw_percentage,
          loss_percentage      = EXCLUDED.loss_percentage,
          clean_sheet_percentage = EXCLUDED.clean_sheet_percentage,
          performance_rank     = EXCLUDED.performance_rank,
          ht_winning_total     = EXCLUDED.ht_winning_total,
          ht_winning_home      = EXCLUDED.ht_winning_home,
          ht_winning_away      = EXCLUDED.ht_winning_away,
          ht_drawing_total     = EXCLUDED.ht_drawing_total,
          ht_drawing_home      = EXCLUDED.ht_drawing_home,
          ht_drawing_away      = EXCLUDED.ht_drawing_away,
          ht_losing_total      = EXCLUDED.ht_losing_total,
          ht_losing_home       = EXCLUDED.ht_losing_home,
          ht_losing_away       = EXCLUDED.ht_losing_away,
          ht_goals_scored_total    = EXCLUDED.ht_goals_scored_total,
          ht_goals_scored_home     = EXCLUDED.ht_goals_scored_home,
          ht_goals_scored_away     = EXCLUDED.ht_goals_scored_away,
          ht_goals_conceded_total  = EXCLUDED.ht_goals_conceded_total,
          ht_goals_conceded_home   = EXCLUDED.ht_goals_conceded_home,
          ht_goals_conceded_away   = EXCLUDED.ht_goals_conceded_away
      `, params);

      inserted += chunkRows.length;
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      inserted,
      skipped: skipped.length,
      skippedTeams: skipped,
      season: { id: idSeason, year: seasonYear },
      competitionSeason: { id: idCompetitionSeason },
      clubsLinked: matchedClubIds.length
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[importTeams]", error);
    res.status(500).json({ success: false, error: "Erro ao importar times", detail: error.message });
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW ENDPOINTS — analisam o CSV antes do import real
// ─────────────────────────────────────────────────────────────────────────────

export async function previewTeams(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });

    const workbook = readWorkbook(req.file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null });

    if (!rows.length) return res.status(400).json({ error: "Arquivo sem dados" });

    const csvCountry = rows[0].country || null;
    const csvSeason = rows[0].season || null;

    // Busca ligas do país detectado; se não achar, retorna todas
    let leaguesRes = await db.query(`
      SELECT l.id_league, l.name, c.name AS country_name
      FROM leagues l
      JOIN countries c ON c.id_country = l.id_country
      WHERE LOWER(c.name) = LOWER($1) AND l.active = true
      ORDER BY l.name ASC
    `, [csvCountry || ""]);

    if (!leaguesRes.rows.length) {
      leaguesRes = await db.query(`
        SELECT l.id_league, l.name, c.name AS country_name
        FROM leagues l
        JOIN countries c ON c.id_country = l.id_country
        WHERE l.active = true
        ORDER BY c.name ASC, l.name ASC
      `);
    }

    // Verifica quais times do CSV existem no banco (por slug)
    const teamNames = rows
      .map(r => r.common_name || r.team_name || "")
      .filter(Boolean);

    // Busca todos os clubes (com país e escudo) para o mapeamento
    const allClubsRes = await db.query(`
      SELECT c.id_club, c.name, c.slug, c.crest_url, co.name AS country_name
      FROM clubs c
      LEFT JOIN countries co ON co.id_country = c.id_country
      WHERE c.active = true
      ORDER BY co.name ASC, c.name ASC
    `);

    const allClubs = allClubsRes.rows;

    // Para verificar found/notFound: prioriza clubes do país do CSV se houver
    const clubsForCheck = csvCountry
      ? allClubs.filter(c => c.country_name?.toLowerCase() === csvCountry.toLowerCase())
      : allClubs;
    const checkPool = clubsForCheck.length > 0 ? clubsForCheck : allClubs;

    const slugToId = new Map();
    for (const c of checkPool) {
      if (c.slug) slugToId.set(c.slug, c.id_club);
      slugToId.set(slugify(c.name, { lower: true, strict: true }), c.id_club);
    }

    const foundTeams    = [];
    const notFoundTeams = [];
    const nameToClubId  = new Map(); // csvName → id_club (para detectar conflitos)

    for (const name of teamNames) {
      const slug   = slugify(name, { lower: true, strict: true });
      const idClub = slugToId.get(slug);
      if (idClub) {
        foundTeams.push(name);
        nameToClubId.set(name, idClub);
      } else {
        notFoundTeams.push(name);
      }
    }

    // Detecta conflitos: múltiplos nomes CSV resolvendo para o mesmo id_club
    const clubIdToNames = new Map();
    for (const [name, idClub] of nameToClubId) {
      if (!clubIdToNames.has(idClub)) clubIdToNames.set(idClub, []);
      clubIdToNames.get(idClub).push(name);
    }

    const duplicateConflicts = [];
    for (const [idClub, names] of clubIdToNames) {
      if (names.length > 1) {
        const club = allClubs.find(c => c.id_club === idClub);
        duplicateConflicts.push({
          id_club:   idClub,
          club_name: club?.name ?? String(idClub),
          crest_url: club?.crest_url ?? null,
          csv_names: names,
        });
      }
    }

    res.json({
      csvCountry, csvSeason, leagues: leaguesRes.rows,
      foundTeams, notFoundTeams,
      duplicateConflicts,
      allClubs: allClubs.map(c => ({
        id_club:      c.id_club,
        name:         c.name,
        crest_url:    c.crest_url,
        country_name: c.country_name ?? "—",
      })),
    });
  } catch (err) {
    console.error("[previewTeams]", err);
    res.status(500).json({ error: "Erro ao analisar arquivo" });
  }
}

export async function previewMatches(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });

    const workbook = readWorkbook(req.file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null });

    if (!rows.length) return res.status(400).json({ error: "Arquivo sem dados" });

    // Auto-detecta ano a partir da primeira data válida
    let detectedYear = null;
    for (const row of rows) {
      if (row.timestamp && Number(row.timestamp)) {
        detectedYear = new Date(Number(row.timestamp) * 1000).getFullYear();
        break;
      } else if (row.date_GMT) {
        const parsed = new Date(row.date_GMT.replace(" - ", " "));
        if (!isNaN(parsed)) { detectedYear = parsed.getFullYear(); break; }
      }
    }

    const leaguesRes = await db.query(`
      SELECT l.id_league, l.name, c.id_country, c.name AS country_name
      FROM leagues l
      JOIN countries c ON c.id_country = l.id_country
      WHERE l.active = true
      ORDER BY c.name ASC, l.name ASC
    `);

    // Verifica quais times do CSV existem no banco (por slug)
    const uniqueTeamNames = [...new Set([
      ...rows.map(r => r.home_team_name).filter(Boolean),
      ...rows.map(r => r.away_team_name).filter(Boolean),
    ])];

    const allClubsRes = await db.query(`
      SELECT c.id_club, c.name, c.slug, c.crest_url, co.name AS country_name
      FROM clubs c
      LEFT JOIN countries co ON co.id_country = c.id_country
      WHERE c.active = true
      ORDER BY co.name ASC, c.name ASC
    `);

    const slugToId = new Map();
    for (const c of allClubsRes.rows) {
      if (c.slug) slugToId.set(c.slug, c.id_club);
      slugToId.set(slugify(c.name, { lower: true, strict: true }), c.id_club);
    }

    const foundTeams = [];
    const notFoundTeams = [];
    for (const name of uniqueTeamNames) {
      const slug = slugify(name, { lower: true, strict: true });
      if (slugToId.has(slug)) foundTeams.push(name);
      else notFoundTeams.push(name);
    }

    res.json({
      detectedYear, rowCount: rows.length, leagues: leaguesRes.rows,
      foundTeams, notFoundTeams,
      allClubs: allClubsRes.rows.map(c => ({
        id_club:      c.id_club,
        name:         c.name,
        crest_url:    c.crest_url,
        country_name: c.country_name ?? "—",
      })),
    });
  } catch (err) {
    console.error("[previewMatches]", err);
    res.status(500).json({ error: "Erro ao analisar arquivo" });
  }
}

export async function previewPlayers(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });

    const workbook = readWorkbook(req.file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: true, defval: null, blankrows: false });

    if (!rows.length) return res.status(400).json({ error: "Arquivo sem dados" });

    const csvLeague = rows.find(r => r.league)?.league || null;
    const csvSeason = rows.find(r => r.season)?.season || null;
    const csvClubs = [...new Set(rows.map(r => r["Current Club"]).filter(Boolean))].sort();
    const csvNationalities = [...new Set(rows.map(r => r.nationality).filter(Boolean))].sort();

    // Clubes no banco
    const clubsRes = await db.query(`SELECT id_club, name FROM clubs WHERE active = true ORDER BY name ASC`);
    const dbClubNames = new Set(clubsRes.rows.map(c => c.name));

    const foundClubs = csvClubs.filter(n => dbClubNames.has(n));
    const notFoundClubs = csvClubs.filter(n => !dbClubNames.has(n));

    // Países no banco
    const countriesRes = await db.query(`SELECT id_country, name FROM countries ORDER BY name ASC`);
    const dbCountryNames = new Set(countriesRes.rows.map(c => c.name));

    const foundNationalities = csvNationalities.filter(n => dbCountryNames.has(n));
    const notFoundNationalities = csvNationalities.filter(n => !dbCountryNames.has(n));

    // Ligas no banco
    const leaguesRes = await db.query(`
      SELECT l.id_league, l.name, c.name AS country_name
      FROM leagues l
      JOIN countries c ON c.id_country = l.id_country
      WHERE l.active = true
      ORDER BY l.name ASC
    `);

    const foundLeague = leaguesRes.rows.find(l => l.name === csvLeague) || null;

    res.json({
      csvLeague,
      csvSeason,
      foundLeague,
      foundClubs,
      notFoundClubs,
      allLeagues: leaguesRes.rows,
      allClubs: clubsRes.rows,
      foundNationalities,
      notFoundNationalities,
      allCountries: countriesRes.rows,
    });
  } catch (err) {
    console.error("[previewPlayers]", err);
    res.status(500).json({ error: "Erro ao analisar arquivo" });
  }
}
