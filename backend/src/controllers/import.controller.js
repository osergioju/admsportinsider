import xlsx from "xlsx";
import slugify from "slugify";
import db from "../config/db.js";
import allCountries from "world-countries";

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

// Normaliza formatos de temporada para um ano inteiro (usa o ano final).
// "2023/2024" → 2024 | "2023/24" → 2024 | "23/24" → 2024 | "2024" → 2024
function parseSeasonYear(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  // "2023/2024" ou "2023-2024" → usa o segundo (ano final)
  const full = str.match(/^(\d{4})[\/\-](\d{4})$/);
  if (full) return Number(full[2]);
  // "2023/24" ou "2023-24" → expande o segundo
  const mixed = str.match(/^(\d{4})[\/\-](\d{2})$/);
  if (mixed) {
    const base = Math.floor(Number(mixed[1]) / 100) * 100;
    return base + Number(mixed[2]);
  }
  // "23/24" ou "23-24" → expande ambos, retorna o segundo
  const short = str.match(/^(\d{2})[\/\-](\d{2})$/);
  if (short) {
    const y = Number(short[2]);
    return y >= 90 ? 1900 + y : 2000 + y;
  }
  const n = Number(str);
  return isNaN(n) ? null : n;
}

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

function normalizeStr(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }

export async function importMatches(req, res) {
  const client = await db.connect();

  try {
    const idLeague = Number(req.body.league);
    const clubMappings = req.body.clubMappings ? JSON.parse(req.body.clubMappings) : {};

    const workbook = readWorkbook(req.file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null });

    // Se o CSV tem coluna "season" (ex: "2024/2025"), usa parseSeasonYear → 2025
    // Senão usa o ano enviado pelo frontend (já detectado pelo preview)
    const csvSeasonRaw = rows[0]?.season ?? null;
    const seasonYear = csvSeasonRaw ? parseSeasonYear(csvSeasonRaw) : parseSeasonYear(req.body.season);

    if (!idLeague || !seasonYear) {
      return res.status(400).json({ error: "Liga e temporada são obrigatórias" });
    }

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

    const leagueCountryForMatches = await client.query(
      `SELECT id_country FROM leagues WHERE id_league = $1`, [idLeague]
    );
    const matchesLeagueCountry = leagueCountryForMatches.rows[0]?.id_country ?? null;

    const clubsRes = matchesLeagueCountry
      ? await client.query(`
          SELECT c.id_club, c.name, c.short_name, c.description, c.slug
          FROM clubs c WHERE c.id_country = $1 OR c.hidden = true
        `, [matchesLeagueCountry])
      : await client.query(`
          SELECT c.id_club, c.name, c.short_name, c.description, c.slug
          FROM clubs c WHERE c.active = true
        `);

    const aliasesResM = await client.query(`SELECT alias_norm, id_club FROM club_aliases`);
    const clubIdSetM = new Set(clubsRes.rows.map(c => c.id_club));

    const clubsByName = new Map(); // slug, name, short_name → id
    const clubsByDesc = new Map(); // description → id
    for (const club of clubsRes.rows) {
      if (club.slug) clubsByName.set(club.slug, club.id_club);
      clubsByName.set(slugify(club.name, { lower: true, strict: true }), club.id_club);
      if (club.short_name) clubsByName.set(slugify(club.short_name, { lower: true, strict: true }), club.id_club);
      if (club.description) clubsByDesc.set(slugify(club.description, { lower: true, strict: true }), club.id_club);
    }
    // Aliases filtrados ao pool atual (respeita escopo de país)
    for (const { alias_norm, id_club } of aliasesResM.rows) {
      if (clubIdSetM.has(id_club) && !clubsByName.has(alias_norm)) clubsByName.set(alias_norm, id_club);
    }

    const resolveClub = (csvName) => {
      if (!csvName) return null;
      const s = slugify(csvName, { lower: true, strict: true });
      return clubsByName.get(s) || clubsByDesc.get(s) || null;
    };

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

      let homeClubId = resolveClub(homeName) ?? (clubMappings[homeName] != null ? Number(clubMappings[homeName]) : null);
      let awayClubId = resolveClub(awayName) ?? (clubMappings[awayName] != null ? Number(clubMappings[awayName]) : null);

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
    // Deduplica rowsWithGW pela chave de conflito (id_league, id_season, home, away, game_week)
    // para evitar "ON CONFLICT DO UPDATE cannot affect row a second time"
    const dedupWithGW = new Map();
    for (const r of matchRows.filter(r => r[10] != null)) {
      const key = `${r[0]}_${r[1]}_${r[2]}_${r[3]}_${r[10]}`;
      dedupWithGW.set(key, r); // última linha ganha
    }
    const rowsWithGW = [...dedupWithGW.values()];
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
      const statsRows = chunkRows.map((r, i) => [matchIds[i], ...r.slice(MATCH_COLS)]);
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
    // Deduplica pelo timestamp + clubes para evitar duplicatas dentro do chunk
    const dedupWithoutGW = new Map();
    for (const r of rowsWithoutGW) {
      const key = r[4] != null
        ? `${r[0]}_${r[1]}_${r[2]}_${r[3]}_${r[4]}`
        : `${r[0]}_${r[1]}_${r[2]}_${r[3]}_${Math.random()}`; // sem timestamp: trata como única
      dedupWithoutGW.set(key, r);
    }
    const rowsWithoutGWDeduped = [...dedupWithoutGW.values()];

    for (const chunkRows of chunk(rowsWithoutGWDeduped, 100)) {
      // Separa linhas com e sem timestamp (sem timestamp não tem como deduplicar → INSERT simples)
      const withTs = chunkRows.filter(r => r[4] != null); // match_timestamp = col 4
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

    // Salva aliases para mapeamentos manuais (clubMappings = { csvName: idClub })
    let aliasResult = { saved: [], conflicts: [] };
    if (Object.keys(clubMappings).length > 0) {
      try { aliasResult = await saveClubAliases(clubMappings); }
      catch (err) { console.error("[importMatches] alias save error:", err); }
    }

    res.json({
      success: true,
      inserted,
      skipped: skippedReasons.length,
      total: rows.length,
      aliases: { saved: aliasResult.saved.length, conflicts: aliasResult.conflicts },
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
    const countriesTransRes = await client.query(`SELECT id_country, name AS translated_name FROM country_translations`);
    const clubAliasesRes = await client.query(`SELECT alias_norm, id_club FROM club_aliases`);
    const clubAliasMap = new Map(clubAliasesRes.rows.map(r => [r.alias_norm, r.id_club]));
    const countriesMap = new Map(countriesRes.rows.map(c => [c.name, c.id_country]));
    const normalizeStr = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const countriesMapNorm = new Map(countriesRes.rows.map(c => [normalizeStr(c.name), c.id_country]));
    for (const tr of countriesTransRes.rows) {
      const normKey = normalizeStr(tr.translated_name);
      if (!countriesMapNorm.has(normKey)) countriesMapNorm.set(normKey, tr.id_country);
    }

    /* ------------------------------------------------------------------
       CACHE CLUB SEASONS
       Se leagueId fornecido: chave = "clube__ano" (sem nome da liga)
       Caso contrário: chave legada = "clube__liga__ano"
    ------------------------------------------------------------------ */

    const clubSeasonMap = new Map();

    if (idLeague) {
      const cls = await client.query(`
        SELECT cls.id_club_league_season, c.name AS club, c.slug, c.description, s.year AS season
        FROM club_league_seasons cls
        JOIN clubs   c ON c.id_club   = cls.id_club
        JOIN seasons s ON s.id_season = cls.id_season
        WHERE cls.id_league = $1
      `, [idLeague]);
      for (const r of cls.rows) {
        const yr = r.season;
        clubSeasonMap.set(`${r.club}__${yr}`, r.id_club_league_season);
        clubSeasonMap.set(`${slugify(r.club, { lower: true, strict: true })}__${yr}`, r.id_club_league_season);
        if (r.slug) clubSeasonMap.set(`${r.slug}__${yr}`, r.id_club_league_season);
        if (r.description) clubSeasonMap.set(`${slugify(r.description, { lower: true, strict: true })}__${yr}`, r.id_club_league_season);
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
              const raw = r["Current Club"].trim();
              const dbName = clubMappings[raw] ?? raw;
              return `${dbName}||${r.season}`;
            })
        )].map(k => { const [n, s] = k.split("||"); return { dbName: n, seasonYear: parseSeasonYear(s) }; });

        // Filtra só os que ainda não estão no mapa (verifica slug também)
        const missing = csvPairs.filter(({ dbName, seasonYear }) => {
          const slug = slugify(dbName, { lower: true, strict: true });
          return !clubSeasonMap.has(`${dbName}__${seasonYear}`) && !clubSeasonMap.has(`${slug}__${seasonYear}`);
        });

        if (missing.length > 0) {
          const allSeasonYears = [...new Set(missing.map(m => m.seasonYear))];

          // Busca id_club usando slug/description matching
          const allClubsForLink = await client.query(
            `SELECT id_club, name, slug, description FROM clubs WHERE active = true`
          );
          const lkByName = new Map();
          const lkByDesc = new Map();
          for (const c of allClubsForLink.rows) {
            lkByName.set(slugify(c.name, { lower: true, strict: true }), c.id_club);
            if (c.slug) lkByName.set(c.slug, c.id_club);
            if (c.description) lkByDesc.set(slugify(c.description, { lower: true, strict: true }), c.id_club);
          }
          // Aliases também valem para auto-link
          for (const [aliasNorm, idClub] of clubAliasMap.entries()) {
            if (!lkByName.has(aliasNorm)) lkByName.set(aliasNorm, idClub);
          }
          const resolveClubForLink = (name) => {
            const s = slugify(name, { lower: true, strict: true });
            return lkByName.get(s) || lkByDesc.get(s) || null;
          };
          const clubNameToId = new Map(missing.map(m => [m.dbName, resolveClubForLink(m.dbName)]));

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
            const slugKey = slugify(dbName, { lower: true, strict: true });
            const mapKey = `${dbName}__${seasonYear}`;
            const slugMapKey = `${slugKey}__${seasonYear}`;
            if (clubSeasonMap.has(mapKey) || clubSeasonMap.has(slugMapKey)) continue;

            const idClub = clubNameToId.get(dbName);
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
            clubSeasonMap.set(slugMapKey, clsRes.rows[0].id_club_league_season);
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
      const idCountry = resolvedNat
        ? (countriesMap.get(resolvedNat) || countriesMapNorm.get(normalizeStr(resolvedNat)) || null)
        : null;

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
      const clubSeasonYear = parseSeasonYear(row.season);
      let idClubLeagueSeason;
      if (idLeague) {
        const slug = slugify(resolvedClub, { lower: true, strict: true });
        idClubLeagueSeason = clubSeasonMap.get(`${resolvedClub}__${clubSeasonYear}`)
          ?? clubSeasonMap.get(`${slug}__${clubSeasonYear}`);
      } else {
        idClubLeagueSeason = clubSeasonMap.get(`${resolvedClub}__${row.league}__${clubSeasonYear}`);
      }
      const clubSeasonKey = idLeague
        ? `${resolvedClub}__${clubSeasonYear}`
        : `${resolvedClub}__${row.league}__${clubSeasonYear}`;

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
        // new split + per-90 columns
        toInt(row.minutes_played_home),
        toInt(row.minutes_played_away),
        toNumber(row.min_per_match) || null,
        toInt(row.appearances_home),
        toInt(row.appearances_away),
        toNumber(row.shots_on_target_per_90_overall) || null,
        toNumber(row.shots_on_target_per90_percentile_overall) || null,
        toNumber(row.pass_completion_rate_percentile_overall) || null,
        toNumber(row.interceptions_per_90_overall) || null,
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
      const values = buildValues(chunkRows.length, 47); // 1 id + 9 base + 28 extended + 9 new split/per-90
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
          offsides, fouls_committed,
          minutes_home, minutes_away, minutes_per_match,
          matches_home, matches_away,
          shots_on_target_per90, shots_on_target_per90_pct,
          pass_completion_rate_pct, interceptions_per90
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
              fouls_committed    = EXCLUDED.fouls_committed,
              minutes_home              = EXCLUDED.minutes_home,
              minutes_away              = EXCLUDED.minutes_away,
              minutes_per_match         = EXCLUDED.minutes_per_match,
              matches_home              = EXCLUDED.matches_home,
              matches_away              = EXCLUDED.matches_away,
              shots_on_target_per90     = EXCLUDED.shots_on_target_per90,
              shots_on_target_per90_pct = EXCLUDED.shots_on_target_per90_pct,
              pass_completion_rate_pct  = EXCLUDED.pass_completion_rate_pct,
              interceptions_per90       = EXCLUDED.interceptions_per90
      `, params);
    }

    await client.query("COMMIT");

    /* ------------------------------------------------------------------
       SALVAR ALIASES — fora da transação, não bloqueia o import
       clubMappings para players é { csvName: dbClubName } — converte para { csvName: idClub }
    ------------------------------------------------------------------ */
    let aliasResultP = { saved: [], conflicts: [] };
    if (Object.keys(clubMappings).length > 0) {
      try {
        const allClubsForAlias = await db.query(`SELECT id_club, name, slug FROM clubs WHERE active = true`);
        const clubSlugToId = new Map();
        for (const c of allClubsForAlias.rows) {
          clubSlugToId.set(slugify(c.name, { lower: true, strict: true }), c.id_club);
          if (c.slug) clubSlugToId.set(c.slug, c.id_club);
        }
        const csvToIdMap = {};
        for (const [csvName, dbName] of Object.entries(clubMappings)) {
          const idClub = clubSlugToId.get(slugify(dbName, { lower: true, strict: true }));
          if (idClub) csvToIdMap[csvName] = idClub;
        }
        aliasResultP = await saveClubAliases(csvToIdMap);
      } catch (err) {
        console.error("[importPlayers] alias save error:", err);
      }
    }

    res.json({
      success: true,
      players: playersData.length,
      seasons: dedupedSeasonData.length,
      stats: statsToInsert.length,
      aliases: { saved: aliasResultP.saved.length, conflicts: aliasResultP.conflicts },
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
    const seasonYear = parseSeasonYear(req.body.season);
    const clubMappings = req.body.clubMappings ? JSON.parse(req.body.clubMappings) : {};
    const countryMappings = req.body.countryMappings ? JSON.parse(req.body.countryMappings) : null;
    const isCountryMode = countryMappings !== null;
    // clubMappings: { "csvCommonName": dbClubId } — modo clubes
    // countryMappings: { "csvCommonName": id_country } — modo países (Copa do Mundo etc.)

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
       CLUBS CACHE — todos os clubes do país da liga (ou todos se continental)
    ------------------------------------------------------------------ */

    const leagueCountryRes = await client.query(
      `SELECT id_country FROM leagues WHERE id_league = $1`,
      [idLeague]
    );
    const leagueCountry = leagueCountryRes.rows[0]?.id_country ?? null;

    const clubsRes = leagueCountry
      ? await client.query(`
          SELECT c.id_club, c.name, c.short_name, c.description, c.slug, co.name AS country_name
          FROM clubs c
          LEFT JOIN countries co ON co.id_country = c.id_country
          WHERE c.id_country = $1 OR c.hidden = true
        `, [leagueCountry])
      : await client.query(`
          SELECT c.id_club, c.name, c.short_name, c.description, c.slug, co.name AS country_name
          FROM clubs c
          LEFT JOIN countries co ON co.id_country = c.id_country
          WHERE c.active = true
        `);

    const aliasesResT = await client.query(`SELECT alias_norm, id_club FROM club_aliases`);
    const clubIdSetT = new Set(clubsRes.rows.map(c => c.id_club));

    const clubsByName = new Map();
    const clubsByDesc = new Map();
    for (const c of clubsRes.rows) {
      if (c.slug) clubsByName.set(c.slug, c.id_club);
      clubsByName.set(slugify(c.name, { lower: true, strict: true }), c.id_club);
      if (c.short_name) clubsByName.set(slugify(c.short_name, { lower: true, strict: true }), c.id_club);
      if (c.description) clubsByDesc.set(slugify(c.description, { lower: true, strict: true }), c.id_club);
    }
    for (const { alias_norm, id_club } of aliasesResT.rows) {
      if (clubIdSetT.has(id_club) && !clubsByName.has(alias_norm)) clubsByName.set(alias_norm, id_club);
    }

    // Para ligas continentais: resolvers por país para evitar falso-positivo
    // (ex: "Nacional" Uruguai vs "Nacional" Paraguai)
    const importCountryResolvers = new Map();
    if (!leagueCountry) {
      const byCountry = new Map();
      for (const c of clubsRes.rows) {
        const key = (c.country_name ?? "").toLowerCase();
        if (!byCountry.has(key)) byCountry.set(key, []);
        byCountry.get(key).push(c);
      }
      for (const [key, clubs] of byCountry) {
        const cm = new Map();
        const dm = new Map();
        for (const c of clubs) {
          if (c.slug) cm.set(c.slug, c.id_club);
          cm.set(slugify(c.name, { lower: true, strict: true }), c.id_club);
          if (c.short_name) cm.set(slugify(c.short_name, { lower: true, strict: true }), c.id_club);
          if (c.description) dm.set(slugify(c.description, { lower: true, strict: true }), c.id_club);
        }
        const clubIdSetC = new Set(clubs.map(c => c.id_club));
        for (const { alias_norm, id_club } of aliasesResT.rows) {
          if (clubIdSetC.has(id_club) && !cm.has(alias_norm)) cm.set(alias_norm, id_club);
        }
        importCountryResolvers.set(key, (name) => {
          if (!name) return null;
          const s = slugify(name, { lower: true, strict: true });
          return cm.get(s) ?? dm.get(s) ?? null;
        });
      }
    }

    /* ------------------------------------------------------------------
       MODO PAÍSES — resolve times como entradas da tabela countries
    ------------------------------------------------------------------ */
    let resolveCountry = null;
    if (isCountryMode) {
      const [cRes, ctRes] = await Promise.all([
        client.query(`SELECT id_country, name FROM countries`),
        client.query(`SELECT id_country, name AS translated_name FROM country_translations`),
      ]);
      const cnMap = new Map();
      for (const c of cRes.rows) cnMap.set(normalizeStr(c.name), c.id_country);
      for (const tr of ctRes.rows) {
        const k = normalizeStr(tr.translated_name);
        if (!cnMap.has(k)) cnMap.set(k, tr.id_country);
      }
      resolveCountry = (name) => (name ? cnMap.get(normalizeStr(name)) ?? null : null);
    }

    /* ------------------------------------------------------------------
       PREPARE ROWS
    ------------------------------------------------------------------ */

    const statsRows = [];
    const skipped = [];
    const matchedClubIds = [];
    const resolvedLog = []; // para debug

    for (const row of rows) {
      const commonName = row["common_name"] || "";
      const teamName = row["team_name"] || "";
      const csvCountryKey = (row["country"] || "").toLowerCase();

      let teamId = null; // id_club (modo clubes) ou id_country (modo países)

      if (isCountryMode) {
        teamId = resolveCountry(commonName)
          ?? resolveCountry(row["country"] || "")
          ?? resolveCountry(teamName)
          ?? null;
        if (!teamId) {
          const manualKey = countryMappings[commonName] != null ? commonName : teamName;
          if (countryMappings[manualKey] != null) teamId = Number(countryMappings[manualKey]);
        }
        if (!teamId) {
          skipped.push(commonName || teamName);
          continue;
        }
      } else {
        const commonSlug = slugify(commonName, { lower: true, strict: true });
        const teamSlug = slugify(teamName, { lower: true, strict: true });
        let idClub = null;
        let resolvedVia = null;

        // 1. Para ligas continentais: tenta primeiro pelo país do CSV (evita falso-positivo)
        if (!leagueCountry && csvCountryKey) {
          const countryResolve = importCountryResolvers.get(csvCountryKey);
          if (countryResolve) {
            idClub = countryResolve(commonName) ?? countryResolve(teamName) ?? null;
            if (idClub) resolvedVia = "country_restricted";
          }
        }

        // 2. Fallback: pool completo
        if (!idClub) {
          idClub = clubsByName.get(commonSlug)
            || clubsByName.get(teamSlug)
            || clubsByDesc.get(commonSlug)
            || clubsByDesc.get(teamSlug)
            || null;
          if (idClub) resolvedVia = "full_pool";
        }

        // 3. Mapeamento manual enviado pelo usuário
        if (!idClub) {
          const manualKey = clubMappings[commonName] != null ? commonName : teamName;
          if (clubMappings[manualKey] != null) {
            idClub = Number(clubMappings[manualKey]);
            resolvedVia = "manual_mapping";
          }
        }

        if (!idClub) {
          skipped.push(commonName || teamName);
          console.warn(`[importTeams] ⚠️  não encontrado: common="${commonName}" team="${teamName}"`);
          continue;
        }

        resolvedLog.push({ common: commonName, team: teamName, idClub, via: resolvedVia });
        matchedClubIds.push(idClub);
        teamId = idClub;
      }

      statsRows.push([
        idCompetitionSeason,
        teamId,
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

    if (!isCountryMode && matchedClubIds.length > 0) {
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

    if (!isCountryMode) {
      console.log(`[importTeams] ✅ ${resolvedLog.length} clube(s) resolvido(s), ${skipped.length} ignorado(s):`);
      for (const r of resolvedLog) {
        console.log(`  ${r.via === "manual_mapping" ? "🔧" : "🔍"} "${r.common || r.team}" → id_club=${r.idClub} (via ${r.via})`);
      }
      const descUpdates = resolvedLog.filter(r => r.common && r.team && r.common !== r.team);
      for (const { idClub, common } of descUpdates) {
        await client.query(
          `UPDATE clubs SET description = $1 WHERE id_club = $2 AND (description IS NULL OR description = '')`,
          [common, idClub]
        );
      }
    }

    /* ------------------------------------------------------------------
       DEDUPLICA antes do INSERT (último row vence, igual ao importMatches)
    ------------------------------------------------------------------ */

    const dedupMap = new Map(); // "compSeason__idClub" → row
    for (const row of statsRows) {
      const key = `${row[0]}__${row[1]}`;
      if (dedupMap.has(key)) {
        console.warn(`[importTeams] ⚠️  duplicata detectada (id_competition_season=${row[0]} id_club=${row[1]}), mantendo última ocorrência`);
      }
      dedupMap.set(key, row);
    }
    const dedupedStatsRows = [...dedupMap.values()];

    /* ------------------------------------------------------------------
       BULK UPSERT club_competition_stats
    ------------------------------------------------------------------ */

    const COL_COUNT = dedupedStatsRows[0]?.length ?? 0;
    let inserted = 0;

    const teamIdCol = isCountryMode ? "id_country" : "id_club";
    const conflictClause = isCountryMode
      ? "(id_competition_season, id_country) WHERE id_country IS NOT NULL"
      : "(id_competition_season, id_club) WHERE id_club IS NOT NULL";

    for (const chunkRows of chunk(dedupedStatsRows, 50)) {
      const values = buildValues(chunkRows.length, COL_COUNT);
      const params = chunkRows.flat();

      await client.query(`
        INSERT INTO club_competition_stats (
          id_competition_season, ${teamIdCol},
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
        ON CONFLICT ${conflictClause} DO UPDATE SET
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

    // Salva aliases para mapeamentos manuais (apenas no modo clubes)
    let aliasResultT = { saved: [], conflicts: [] };
    if (!isCountryMode && Object.keys(clubMappings).length > 0) {
      try { aliasResultT = await saveClubAliases(clubMappings); }
      catch (err) { console.error("[importTeams] alias save error:", err); }
    }

    res.json({
      success: true,
      inserted,
      skipped: skipped.length,
      skippedTeams: skipped,
      aliases: { saved: aliasResultT.saved.length, conflicts: aliasResultT.conflicts },
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

// Salva aliases novos após import bem-sucedido (fora de transação, não-fatal)
// csvToIdMap: { [csvName]: idClub (number) }
async function saveClubAliases(csvToIdMap) {
  const entries = Object.entries(csvToIdMap)
    .filter(([, idClub]) => !!idClub)
    .map(([csvName, idClub]) => ({
      csvName,
      idClub: Number(idClub),
      aliasNorm: slugify(csvName, { lower: true, strict: true }),
    }));

  if (!entries.length) return { saved: [], conflicts: [] };

  // 1 query para buscar todos os aliases existentes de uma vez
  const aliasNorms = entries.map(e => e.aliasNorm);
  const existingRes = await db.query(
    `SELECT alias_norm, id_club FROM club_aliases WHERE alias_norm = ANY($1::text[])`,
    [aliasNorms]
  );
  const existingMap = new Map(existingRes.rows.map(r => [r.alias_norm, r.id_club]));

  const toInsert = [];
  const saved = [];
  const conflicts = [];

  for (const { csvName, idClub, aliasNorm } of entries) {
    if (existingMap.has(aliasNorm)) {
      if (existingMap.get(aliasNorm) !== idClub) {
        conflicts.push({ csvName, idClub, conflictClubId: existingMap.get(aliasNorm) });
      }
      continue;
    }
    toInsert.push([idClub, csvName, aliasNorm]);
    saved.push({ csvName, idClub });
  }

  // 1 INSERT batch para todos os novos aliases
  if (toInsert.length > 0) {
    const params = [];
    const placeholders = toInsert.map((r, i) => {
      params.push(...r);
      return `($${i*3+1},$${i*3+2},$${i*3+3})`;
    });
    await db.query(
      `INSERT INTO club_aliases (id_club, alias_raw, alias_norm)
       VALUES ${placeholders.join(",")}
       ON CONFLICT (alias_norm) DO NOTHING`,
      params
    );
  }

  return { saved, conflicts };
}

// Lookup unificado: slug → name → short_name → description (mesma lógica nos três previews)
function buildClubLookup(clubs, aliasMap = null) {
  const clubIdSet = new Set(clubs.map(c => c.id_club));
  const m = new Map();
  for (const c of clubs) {
    if (c.slug) m.set(c.slug, c.id_club);
    m.set(slugify(c.name, { lower: true, strict: true }), c.id_club);
    if (c.short_name) m.set(slugify(c.short_name, { lower: true, strict: true }), c.id_club);
    if (c.description) m.set(slugify(c.description, { lower: true, strict: true }), c.id_club);
  }
  // Aliases só valem para clubes no pool atual (respeita escopo de país)
  if (aliasMap) {
    for (const [aliasNorm, idClub] of aliasMap.entries()) {
      if (clubIdSet.has(idClub) && !m.has(aliasNorm)) m.set(aliasNorm, idClub);
    }
  }
  return (name) => {
    if (!name) return null;
    return m.get(slugify(name, { lower: true, strict: true })) ?? null;
  };
}

export async function previewTeams(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });

    const workbook = readWorkbook(req.file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null });

    if (!rows.length) return res.status(400).json({ error: "Arquivo sem dados" });

    const csvSeason = rows[0].season || null;
    const csvSeasonYear = parseSeasonYear(csvSeason);

    // Busca todos os clubes primeiro para detectar o país correto no banco via slug
    const [allClubsRes, aliasesResPT] = await Promise.all([
      db.query(`
        SELECT c.id_club, c.name, c.short_name, c.description, c.slug, c.crest_url, c.hidden, co.name AS country_name
        FROM clubs c
        LEFT JOIN countries co ON co.id_country = c.id_country
        WHERE c.active = true
        ORDER BY co.name ASC, c.name ASC
      `),
      db.query(`SELECT alias_norm, id_club FROM club_aliases`),
    ]);
    const clubAliasMapPT = new Map(aliasesResPT.rows.map(r => [r.alias_norm, r.id_club]));

    const resolveAll = buildClubLookup(allClubsRes.rows, clubAliasMapPT);
    const clubById   = new Map(allClubsRes.rows.map(c => [c.id_club, c]));

    // Etapa 1: detecta país usando TODOS os clubes (votação por maioria)
    const allTeamNames = [...new Set(
      rows.map(r => r.common_name || r.team_name).filter(Boolean)
    )];
    const countryCount = new Map();
    for (const name of allTeamNames) {
      const id = resolveAll(name);
      const found = id ? clubById.get(id) : null;
      if (found?.country_name) {
        countryCount.set(found.country_name, (countryCount.get(found.country_name) ?? 0) + 1);
      }
    }
    // Só é verdadeiramente multi-país se nenhum país tem ≥60% dos times resolvidos
    // (evita falso-positivo quando homônimos de outros países contaminam a contagem)
    const totalResolved = [...countryCount.values()].reduce((a, b) => a + b, 0);
    const topCount = Math.max(0, ...[...countryCount.values()]);
    const isMultiCountry = countryCount.size > 1 && (totalResolved === 0 || topCount / totalResolved < 0.6);

    // Detecta o país dominante (maior número de times encontrados)
    const uniqueCsvCountries = [...new Set(rows.map(r => r.country).filter(Boolean))];
    const csvCountry = uniqueCsvCountries.length === 1 ? uniqueCsvCountries[0] : null;
    let detectedCountry = csvCountry;
    if (!detectedCountry || !countryCount.has(detectedCountry)) {
      let maxCount = 0;
      for (const [country, cnt] of countryCount.entries()) {
        if (cnt > maxCount) { maxCount = cnt; detectedCountry = country; }
      }
    }
    if (!detectedCountry && countryCount.size === 1) {
      detectedCountry = [...countryCount.keys()][0];
    }

    // Busca ligas — sempre filtra por país dominante; fallback para todas as ligas
    let leaguesRes;
    if (detectedCountry) {
      leaguesRes = await db.query(`
        SELECT l.id_league, l.name, c.name AS country_name, ct.name AS continent_name
        FROM leagues l
        LEFT JOIN countries c ON c.id_country = l.id_country
        LEFT JOIN continents ct ON ct.id_continent = l.id_continent
        WHERE LOWER(c.name) = LOWER($1) AND l.active = true
        ORDER BY l.name ASC
      `, [detectedCountry]);
    }

    // Busca todas as ligas (para o toggle "ver todas")
    const allLeaguesRes = await db.query(`
      SELECT l.id_league, l.name, c.name AS country_name, ct.name AS continent_name
      FROM leagues l
      LEFT JOIN countries c ON c.id_country = l.id_country
      LEFT JOIN continents ct ON ct.id_continent = l.id_continent
      WHERE l.active = true
      ORDER BY c.name ASC NULLS LAST, ct.name ASC NULLS LAST, l.name ASC
    `);

    if (!detectedCountry || !leaguesRes?.rows.length) {
      leaguesRes = { rows: allLeaguesRes.rows };
    }

    const allClubs = allClubsRes.rows;

    // Etapa 2: lookup restrito ao país detectado — evita homônimos de outros países
    // Clubes ocultos (sem país) entram sempre, independente do país detectado
    const matchPool  = (detectedCountry && !isMultiCountry)
      ? allClubs.filter(c => c.country_name === detectedCountry || c.hidden)
      : allClubs;
    const resolveClub = buildClubLookup(matchPool, clubAliasMapPT);

    // Para competições multi-país: resolver por país do CSV antes do pool global.
    // Evita falso-positivo como "Nacional" (Uruguai) matchando "Nacional" (Paraguai).
    const countryResolvers = new Map(); // country_name.lower → resolver restrito
    if (isMultiCountry) {
      const byCountry = new Map();
      for (const c of allClubs) {
        const key = (c.country_name ?? "").toLowerCase();
        if (!byCountry.has(key)) byCountry.set(key, []);
        byCountry.get(key).push(c);
      }
      for (const [key, clubs] of byCountry) {
        countryResolvers.set(key, buildClubLookup(clubs, clubAliasMapPT));
      }
    }

    const foundTeams = [];
    const notFoundTeams = [];
    const notFoundTeamsData = []; // [{name, country_name}] — para exibir bandeira no front
    const nameToClubId = new Map(); // csvDisplayName → id_club (para detectar conflitos)

    // Chave de exibição: common_name se disponível, senão team_name
    const teamNames = [...new Set(
      rows.map(r => r.common_name || r.team_name || "").filter(Boolean)
    )];

    // country do CSV por nome de exibição (coluna "country" do arquivo de times)
    const csvTeamCountry = {};
    for (const row of rows) {
      const name = row.common_name || row.team_name;
      if (name && row.country) csvTeamCountry[name] = row.country;
    }

    for (const displayName of teamNames) {
      const srcRow = rows.find(r => (r.common_name || r.team_name) === displayName) ?? {};
      let idClub = null;

      // Tenta primeiro pelo país do CSV (evita falso-positivo em competições continentais)
      if (isMultiCountry) {
        const csvCountry = (csvTeamCountry[displayName] ?? "").toLowerCase();
        const countryResolver = csvCountry ? countryResolvers.get(csvCountry) : null;
        if (countryResolver) {
          idClub = countryResolver(srcRow.common_name) ?? countryResolver(srcRow.team_name) ?? null;
        }
      }

      // Fallback: pool completo (nacional ou continental sem country no CSV)
      if (!idClub) {
        idClub = resolveClub(srcRow.common_name) ?? resolveClub(srcRow.team_name) ?? null;
      }

      if (idClub) {
        foundTeams.push(displayName);
        nameToClubId.set(displayName, idClub);
      } else {
        notFoundTeams.push(displayName);
        notFoundTeamsData.push({ name: displayName, country_name: csvTeamCountry[displayName] ?? null });
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
          id_club: idClub,
          club_name: club?.name ?? String(idClub),
          crest_url: club?.crest_url ?? null,
          csv_names: names,
          csv_names_data: names.map(n => ({ name: n, country_name: csvTeamCountry[n] ?? null })),
        });
      }
    }

    // ── Detecta se os times são países (Copa do Mundo, etc.) ──────────────
    let countryMode = false;
    let foundCountries = [];
    let notFoundCountriesData = [];
    {
      const [cRes, ctRes] = await Promise.all([
        db.query(`SELECT id_country, name FROM countries`),
        db.query(`SELECT id_country, name AS translated_name FROM country_translations`),
      ]);
      const cnMap = new Map();
      for (const c of cRes.rows) cnMap.set(normalizeStr(c.name), c.id_country);
      for (const tr of ctRes.rows) {
        const k = normalizeStr(tr.translated_name);
        if (!cnMap.has(k)) cnMap.set(k, tr.id_country);
      }
      const resolveC = (name) => (name ? cnMap.get(normalizeStr(name)) ?? null : null);

      for (const displayName of teamNames) {
        const srcRow = rows.find(r => (r.common_name || r.team_name) === displayName) ?? {};
        const idC = resolveC(srcRow.common_name) ?? resolveC(srcRow.country) ?? resolveC(srcRow.team_name) ?? null;
        if (idC) foundCountries.push(displayName);
        else notFoundCountriesData.push({ name: displayName, country_name: srcRow.country ?? null });
      }
      countryMode = foundCountries.length > foundTeams.length && foundCountries.length > 0;
    }

    res.json({
      csvCountry, csvSeason, csvSeasonYear, isMultiCountry,
      leagues: leaguesRes.rows,
      allLeagues: allLeaguesRes.rows,
      foundTeams, notFoundTeams, notFoundTeamsData,
      duplicateConflicts,
      countryMode, foundCountries, notFoundCountriesData,
      allClubs: allClubs.map(c => ({
        id_club: c.id_club,
        name: c.name,
        slug: c.slug,
        crest_url: c.crest_url,
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

    // 1. Se o CSV tem coluna "season" (ex: "2024/2025"), usa parseSeasonYear → 2025
    // 2. Senão, pega o ANO MÁXIMO encontrado nas datas das partidas
    let detectedYear = null;
    const csvSeasonRaw = rows[0]?.season ?? null;
    if (csvSeasonRaw) {
      detectedYear = parseSeasonYear(csvSeasonRaw);
    } else {
      for (const row of rows) {
        let yr = null;
        if (row.timestamp && Number(row.timestamp)) {
          yr = new Date(Number(row.timestamp) * 1000).getFullYear();
        } else if (row.date_GMT) {
          const parsed = new Date(row.date_GMT.replace(" - ", " "));
          if (!isNaN(parsed)) yr = parsed.getFullYear();
        }
        if (yr && yr > (detectedYear ?? 0)) detectedYear = yr;
      }
    }

    // Verifica quais times do CSV existem no banco (por slug)
    const uniqueTeamNames = [...new Set([
      ...rows.map(r => r.home_team_name).filter(Boolean),
      ...rows.map(r => r.away_team_name).filter(Boolean),
    ])];

    const [allClubsRes, aliasesResPM] = await Promise.all([
      db.query(`
        SELECT c.id_club, c.name, c.short_name, c.description, c.slug, c.crest_url, c.hidden, co.name AS country_name
        FROM clubs c
        LEFT JOIN countries co ON co.id_country = c.id_country
        WHERE c.active = true
        ORDER BY co.name ASC, c.name ASC
      `),
      db.query(`SELECT alias_norm, id_club FROM club_aliases`),
    ]);
    const clubAliasMapPM = new Map(aliasesResPM.rows.map(r => [r.alias_norm, r.id_club]));

    const resolveAll = buildClubLookup(allClubsRes.rows, clubAliasMapPM);
    const clubById   = new Map(allClubsRes.rows.map(c => [c.id_club, c]));

    // Etapa 1: detecta país usando TODOS os clubes (votação por maioria)
    const countryCount = new Map();
    for (const name of uniqueTeamNames) {
      const id = resolveAll(name);
      const found = id ? clubById.get(id) : null;
      if (found?.country_name) {
        countryCount.set(found.country_name, (countryCount.get(found.country_name) ?? 0) + 1);
      }
    }
    const totalResolvedM = [...countryCount.values()].reduce((a, b) => a + b, 0);
    const topCountM = Math.max(0, ...[...countryCount.values()]);
    const isMultiCountry = countryCount.size > 1 && (totalResolvedM === 0 || topCountM / totalResolvedM < 0.6);

    // Detecta o país dominante (maior número de times encontrados)
    const csvCountryFromRows = rows[0]?.country_name || rows[0]?.country || null;
    let detectedCountry = csvCountryFromRows;
    if (!detectedCountry || !countryCount.has(detectedCountry)) {
      let maxCount = 0;
      for (const [country, cnt] of countryCount.entries()) {
        if (cnt > maxCount) { maxCount = cnt; detectedCountry = country; }
      }
    }
    if (!detectedCountry && countryCount.size === 1) {
      detectedCountry = [...countryCount.keys()][0];
    }

    const ALL_LEAGUES_QUERY = `
      SELECT l.id_league, l.name, c.id_country, c.name AS country_name, ct.name AS continent_name
      FROM leagues l
      LEFT JOIN countries c ON c.id_country = l.id_country
      LEFT JOIN continents ct ON ct.id_continent = l.id_continent
      WHERE l.active = true
      ORDER BY c.name ASC NULLS LAST, ct.name ASC NULLS LAST, l.name ASC
    `;

    // Para competições multi-país (continentais/globais), exibe todas as ligas diretamente.
    // Para competições nacionais, filtra pelo país dominante com fallback para todas.
    let leaguesRes;
    if (isMultiCountry) {
      leaguesRes = await db.query(ALL_LEAGUES_QUERY);
    } else if (detectedCountry) {
      leaguesRes = await db.query(`
        SELECT l.id_league, l.name, c.id_country, c.name AS country_name, ct.name AS continent_name
        FROM leagues l
        LEFT JOIN countries c ON c.id_country = l.id_country
        LEFT JOIN continents ct ON ct.id_continent = l.id_continent
        WHERE l.active = true AND LOWER(c.name) = LOWER($1)
        ORDER BY l.name ASC
      `, [detectedCountry]);
      if (!leaguesRes.rows.length) leaguesRes = await db.query(ALL_LEAGUES_QUERY);
    } else {
      leaguesRes = await db.query(ALL_LEAGUES_QUERY);
    }

    // Etapa 2: lookup restrito ao país detectado — evita homônimos de outros países
    // Clubes ocultos (sem país) entram sempre, independente do país detectado
    const matchPool = (detectedCountry && !isMultiCountry)
      ? allClubsRes.rows.filter(c => c.country_name === detectedCountry || c.hidden)
      : allClubsRes.rows;
    const resolveClub = buildClubLookup(matchPool, clubAliasMapPM);

    // country por time do CSV (home_team_country / away_team_country se existir)
    const csvMatchTeamCountry = {};
    for (const row of rows) {
      if (row.home_team_name && row.home_team_country) csvMatchTeamCountry[row.home_team_name] = row.home_team_country;
      if (row.away_team_name && row.away_team_country) csvMatchTeamCountry[row.away_team_name] = row.away_team_country;
    }

    const foundTeams = [];
    const notFoundTeams = [];
    const notFoundTeamsData = [];
    for (const name of uniqueTeamNames) {
      if (resolveClub(name)) foundTeams.push(name);
      else {
        notFoundTeams.push(name);
        notFoundTeamsData.push({ name, country_name: csvMatchTeamCountry[name] ?? null });
      }
    }

    res.json({
      detectedYear, rowCount: rows.length, isMultiCountry,
      leagues: leaguesRes.rows,
      foundTeams, notFoundTeams, notFoundTeamsData,
      allClubs: allClubsRes.rows.map(c => ({
        id_club: c.id_club,
        name: c.name,
        slug: c.slug,
        crest_url: c.crest_url,
        country_name: c.country_name ?? "—",
      })),
    });
  } catch (err) {
    console.error("[previewMatches]", err);
    res.status(500).json({ error: "Erro ao analisar arquivo" });
  }
}

// Suggestion para nacionalidades — verifica nome pt-BR, inglês e demônimo en
function buildNatSuggestion(csvNat) {
  const normalized = csvNat.toLowerCase().trim();
  const wcEntry = allCountries.find((wc) => {
    const ptbr = wc.translations?.por?.common?.toLowerCase() ?? "";
    const ptbrOff = wc.translations?.por?.official?.toLowerCase() ?? "";
    const en = wc.name.common?.toLowerCase() ?? "";
    const demonymM = wc.demonyms?.eng?.m?.toLowerCase() ?? "";
    const demonymF = wc.demonyms?.eng?.f?.toLowerCase() ?? "";
    return ptbr === normalized || ptbrOff === normalized || en === normalized
      || demonymM === normalized || demonymF === normalized;
  });
  if (!wcEntry) return null;
  return {
    namePtBr: wcEntry.translations?.por?.common ?? wcEntry.name.common,
    nameEn: wcEntry.name.common,
    cca2: wcEntry.cca2,
    flag: `https://flagcdn.com/${wcEntry.cca2.toLowerCase()}.svg`,
  };
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
    const csvSeasonYear = parseSeasonYear(csvSeason);
    const csvClubs = [...new Set(rows.map(r => r["Current Club"]).filter(Boolean))].sort();
    const csvNationalities = [...new Set(rows.map(r => r.nationality).filter(Boolean))].sort();

    // Clubes — inclui todos os campos de matching
    const [clubsRes, aliasesRes] = await Promise.all([
      db.query(`
        SELECT c.id_club, c.name, c.short_name, c.slug, c.description, c.crest_url, c.hidden, co.name AS country_name
        FROM clubs c
        LEFT JOIN countries co ON co.id_country = c.id_country
        WHERE c.active = true
        ORDER BY c.name ASC
      `),
      db.query(`SELECT alias_norm, id_club FROM club_aliases`),
    ]);
    const clubAliasMap = new Map(aliasesRes.rows.map(r => [r.alias_norm, r.id_club]));

    const resolveAll = buildClubLookup(clubsRes.rows, clubAliasMap);
    const clubById   = new Map(clubsRes.rows.map(c => [c.id_club, c]));

    // Etapa 1: detecta país usando TODOS os clubes (votação por maioria)
    const countryCount = new Map();
    for (const clubName of csvClubs) {
      const id = resolveAll(clubName);
      const found = id ? clubById.get(id) : null;
      if (found?.country_name) {
        countryCount.set(found.country_name, (countryCount.get(found.country_name) ?? 0) + 1);
      }
    }
    const totalResolvedP = [...countryCount.values()].reduce((a, b) => a + b, 0);
    const topCountP = Math.max(0, ...[...countryCount.values()]);
    const isMultiCountry = countryCount.size > 1 && (totalResolvedP === 0 || topCountP / totalResolvedP < 0.6);

    // Detecta o país dominante (maior número de clubes encontrados)
    let detectedCountry = rows[0]?.country_name || rows[0]?.country || null;
    if (!detectedCountry || !countryCount.has(detectedCountry)) {
      let maxCount = 0;
      for (const [country, cnt] of countryCount.entries()) {
        if (cnt > maxCount) { maxCount = cnt; detectedCountry = country; }
      }
    }
    if (!detectedCountry && countryCount.size === 1) {
      detectedCountry = [...countryCount.keys()][0];
    }

    // Etapa 2: lookup restrito ao país detectado — evita homônimos de outros países
    // Clubes ocultos (sem país) entram sempre, independente do país detectado
    const matchPool = (detectedCountry && !isMultiCountry)
      ? clubsRes.rows.filter(c => c.country_name === detectedCountry || c.hidden)
      : clubsRes.rows;
    const resolveClubId = buildClubLookup(matchPool, clubAliasMap);

    const foundClubs    = csvClubs.filter(n => resolveClubId(n));
    const notFoundClubs = csvClubs.filter(n => !resolveClubId(n));

    // Países — inclui flag_url para o SearchableSelect com bandeiras
    const [countriesRes, natTransRes] = await Promise.all([
      db.query(`SELECT id_country, name, flag_url FROM countries ORDER BY name ASC`),
      db.query(`SELECT id_country, name AS translated_name FROM country_translations`),
    ]);
    const normalize = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const countryNameById = new Map(countriesRes.rows.map(c => [c.id_country, c.name]));
    const dbCountryByNorm = new Map(countriesRes.rows.map(c => [normalize(c.name), c.name]));
    for (const tr of natTransRes.rows) {
      const normKey = normalize(tr.translated_name);
      if (!dbCountryByNorm.has(normKey)) {
        const canonical = countryNameById.get(tr.id_country);
        if (canonical) dbCountryByNorm.set(normKey, canonical);
      }
    }

    const foundNationalities = csvNationalities.filter(n => dbCountryByNorm.has(normalize(n)));
    const notFoundNationalities = csvNationalities.filter(n => !dbCountryByNorm.has(normalize(n)));

    // Sugestões world-countries para nacionalidades não encontradas (inclui demônimos en)
    const notFoundNationalitiesData = notFoundNationalities.map(csvNat => ({
      csvName: csvNat,
      suggestion: buildNatSuggestion(csvNat),
    }));

    // Ligas — sempre filtra por país dominante; fallback para todas as ligas
    let leaguesRes;
    if (detectedCountry) {
      leaguesRes = await db.query(`
        SELECT l.id_league, l.name, c.name AS country_name, ct.name AS continent_name
        FROM leagues l
        LEFT JOIN countries c ON c.id_country = l.id_country
        LEFT JOIN continents ct ON ct.id_continent = l.id_continent
        WHERE l.active = true AND LOWER(c.name) = LOWER($1)
        ORDER BY l.name ASC
      `, [detectedCountry]);
    }

    if (!detectedCountry || !leaguesRes?.rows.length) {
      leaguesRes = await db.query(`
        SELECT l.id_league, l.name, c.name AS country_name, ct.name AS continent_name
        FROM leagues l
        LEFT JOIN countries c ON c.id_country = l.id_country
        LEFT JOIN continents ct ON ct.id_continent = l.id_continent
        WHERE l.active = true
        ORDER BY c.name ASC NULLS LAST, ct.name ASC NULLS LAST, l.name ASC
      `);
    }

    const foundLeague = leaguesRes.rows.find(l => l.name === csvLeague) || null;

    res.json({
      csvLeague,
      csvSeason,
      csvSeasonYear,
      isMultiCountry,
      foundLeague,
      foundClubs,
      notFoundClubs,
      allLeagues: leaguesRes.rows,
      allClubs: clubsRes.rows,
      foundNationalities,
      notFoundNationalities,
      notFoundNationalitiesData,
      allCountries: countriesRes.rows,
    });
  } catch (err) {
    console.error("[previewPlayers]", err);
    res.status(500).json({ error: "Erro ao analisar arquivo" });
  }
}

// ─────────────────────────────────────────────
// BULK LEAGUES IMPORT (CSV ponto-e-vírgula)
// ─────────────────────────────────────────────

// Dado um nome pt-BR do CSV, tenta encontrar no world-countries e retornar
// o payload de sugestão (flag, nomes, cca2) para o frontend pré-preencher
// o mini-modal de cadastro inline.
function buildLeagueSuggestion(csvName) {
  const normalized = csvName.toLowerCase().trim();
  const wcEntry = allCountries.find((wc) => {
    const ptbr = wc.translations?.por?.common?.toLowerCase() ?? "";
    const ptbrOff = wc.translations?.por?.official?.toLowerCase() ?? "";
    const en = wc.name.common?.toLowerCase() ?? "";
    return ptbr === normalized || ptbrOff === normalized || en === normalized;
  });
  if (!wcEntry) return null;
  return {
    namePtBr: wcEntry.translations?.por?.common ?? wcEntry.name.common,
    nameEn: wcEntry.name.common,
    cca2: wcEntry.cca2,
    flag: `https://flagcdn.com/${wcEntry.cca2.toLowerCase()}.svg`,
  };
}

// Colunas CSV: A=Slug, B=Esfera, C=Nível, D=Escudo, E=País, F=Continente,
//              G=Confederação, H=Competição, I=Nome completo, J=Fórmula(ignorada),
//              K=Organizador, L=Nome da entidade(ignorada)
function parseLeagueCSV(buffer) {
  const text = buffer.toString("utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const slug = cols[0]?.trim() || null;
    if (!slug) continue;

    const rawCountry = cols[4]?.trim() || null;

    rows.push({
      slug,
      esfera: cols[1]?.trim() || null,
      tier: cols[2]?.trim() || null,
      has_logo: cols[3]?.trim() === "VERDADEIRO",
      country_name: rawCountry === "N/A" ? null : rawCountry,
      continent: cols[5]?.trim() || null,
      confederation: cols[6]?.trim() || null,
      competition_name: cols[7]?.trim() || null,
      name: cols[8]?.trim() || null,
      // cols[9] = Fórmula de disputa → ignorada
      organizer: cols[10]?.trim() || null,
      // cols[11] = Nome da entidade → ignorada
    });
  }
  return rows;
}

// Resolve id_country para uma linha: tenta override manual, depois lookup por nome
function resolveCountry(csvName, dbNameMap, overrideMap) {
  const manual = overrideMap[csvName];
  if (manual) return Number(manual);
  return dbNameMap.get(csvName.toLowerCase().trim()) ?? null;
}

export async function previewLeaguesBulk(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado." });

    // countryMap: { "Bolivia": "5", "Estados Unidos": "12" } — mapeamento manual do front
    const overrideMap = req.body.countryMap ? JSON.parse(req.body.countryMap) : {};

    const rows = parseLeagueCSV(req.file.buffer);

    const [countriesRes, leaguesRes] = await Promise.all([
      db.query(`SELECT id_country, name, flag_url FROM countries WHERE active = true ORDER BY name`),
      db.query(`SELECT name, id_country FROM leagues`),
    ]);

    const dbNameMap = new Map(
      countriesRes.rows.map((c) => [c.name.toLowerCase().trim(), c.id_country])
    );
    const leagueSet = new Set(
      leaguesRes.rows.map((l) => `${l.name.toLowerCase().trim()}|${l.id_country}`)
    );

    // Países únicos do CSV (exclui null = ligas continentais) + status de resolução
    const uniqueCsvCountries = [...new Set(rows.map((r) => r.country_name).filter(Boolean))];
    const countriesForMapping = uniqueCsvCountries.map((csvName) => {
      const id_country = resolveCountry(csvName, dbNameMap, overrideMap);
      const autoResolved = !!dbNameMap.get(csvName.toLowerCase().trim());
      const registerSuggestion = id_country ? null : buildLeagueSuggestion(csvName);
      return { csvName, id_country, autoResolved, status: id_country ? "ok" : "notfound", registerSuggestion };
    });

    const summary = {
      total: rows.filter((r) => r.name).length,
      insert: 0,
      update: 0,
      error: 0,
    };

    for (const row of rows) {
      if (!row.name) continue;
      const id_country = row.country_name
        ? resolveCountry(row.country_name, dbNameMap, overrideMap)
        : null;
      if (row.country_name && !id_country) { summary.error++; continue; }
      if (leagueSet.has(`${row.name.toLowerCase().trim()}|${id_country}`)) { summary.update++; } else { summary.insert++; }
    }

    return res.json({
      countriesForMapping,
      allDbCountries: countriesRes.rows,
      summary,
    });
  } catch (err) {
    console.error("[previewLeaguesBulk]", err);
    res.status(500).json({ error: "Erro ao analisar o arquivo." });
  }
}

export async function importLeaguesBulk(req, res) {
  if (!req.file) return res.status(400).json({ error: "Arquivo não enviado." });

  const overrideMap = req.body.countryMap ? JSON.parse(req.body.countryMap) : {};
  const rows = parseLeagueCSV(req.file.buffer);

  const countriesRes = await db.query(
    `SELECT id_country, name FROM countries WHERE active = true`
  );
  const dbNameMap = new Map(
    countriesRes.rows.map((c) => [c.name.toLowerCase().trim(), c.id_country])
  );

  const client = await db.connect();
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      if (!row.name) { results.skipped++; continue; }

      const id_country = row.country_name
        ? resolveCountry(row.country_name, dbNameMap, overrideMap)
        : null;

      if (row.country_name && !id_country) {
        results.errors.push({ name: row.name, reason: `País não encontrado: "${row.country_name}"` });
        continue;
      }

      const logo_url = row.has_logo && row.slug
        ? `https://pro.sportinsider.com.br/uploads/ligas/${row.slug}.png`
        : null;

      const structure_json = JSON.stringify({
        ...(row.esfera ? { esfera: row.esfera } : {}),
        ...(row.continent ? { continent: row.continent } : {}),
        ...(row.confederation ? { confederation: row.confederation } : {}),
        ...(row.competition_name ? { competition_name: row.competition_name } : {}),
      });

      const result = await client.query(
        `INSERT INTO leagues (id_country, name, organizer, slug, tier, structure_json, logo_url)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         ON CONFLICT (name, id_country) DO UPDATE SET
           organizer      = EXCLUDED.organizer,
           slug           = EXCLUDED.slug,
           tier           = EXCLUDED.tier,
           structure_json = EXCLUDED.structure_json,
           logo_url       = COALESCE(EXCLUDED.logo_url, leagues.logo_url)
         RETURNING (xmax = 0) AS inserted`,
        [id_country, row.name, row.organizer, row.slug, row.tier, structure_json, logo_url]
      );

      if (result.rows[0]?.inserted) { results.inserted++; } else { results.updated++; }
    }

    await client.query("COMMIT");
    return res.json({ ...results, total: rows.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[importLeaguesBulk]", err);
    return res.status(500).json({ error: "Erro na importação em massa." });
  } finally {
    client.release();
  }
}

export async function deleteMatches(req, res) {
  const idLeague = Number(req.params.leagueId);
  const seasonYear = Number(req.params.year);
  if (!idLeague || !seasonYear) return res.status(400).json({ error: "Liga e ano são obrigatórios" });

  try {
    const seasonRes = await db.query(
      `SELECT id_season FROM seasons WHERE year = $1`,
      [seasonYear]
    );
    if (!seasonRes.rows.length) return res.status(404).json({ error: "Temporada não encontrada" });

    const idSeason = seasonRes.rows[0].id_season;

    const matchIds = await db.query(
      `SELECT id_match FROM matches WHERE id_league = $1 AND id_season = $2`,
      [idLeague, idSeason]
    );
    if (!matchIds.rows.length) return res.status(404).json({ error: "Nenhuma partida encontrada para essa liga/ano" });

    const ids = matchIds.rows.map(r => r.id_match);
    await db.query(`DELETE FROM match_stats WHERE id_match = ANY($1)`, [ids]);
    const del = await db.query(`DELETE FROM matches WHERE id_match = ANY($1)`, [ids]);

    return res.json({ deleted: del.rowCount });
  } catch (err) {
    console.error("[deleteMatches]", err);
    return res.status(500).json({ error: "Erro ao apagar partidas" });
  }
}

export async function deleteTeamStats(req, res) {
  const idLeague = Number(req.params.leagueId);
  const seasonYear = Number(req.params.year);
  if (!idLeague || !seasonYear) return res.status(400).json({ error: "Liga e ano são obrigatórios" });

  try {
    const csRes = await db.query(
      `SELECT cs.id_competition_season
       FROM competition_seasons cs
       JOIN seasons s ON s.id_season = cs.id_season
       WHERE cs.id_league = $1 AND s.year = $2`,
      [idLeague, seasonYear]
    );
    if (!csRes.rows.length) return res.status(404).json({ error: "Nenhuma temporada encontrada para essa liga/ano" });

    const idCS = csRes.rows[0].id_competition_season;
    const del = await db.query(
      `DELETE FROM club_competition_stats WHERE id_competition_season = $1`,
      [idCS]
    );
    return res.json({ deleted: del.rowCount, id_competition_season: idCS });
  } catch (err) {
    console.error("[deleteTeamStats]", err);
    return res.status(500).json({ error: "Erro ao apagar stats" });
  }
}
