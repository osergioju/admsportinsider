import xlsx from "xlsx";
import slugify from "slugify";
import db from  "../config/db.js";


const toNumber = (v) => {
  if (!v || v === "N/A") return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const chunk = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

function toInt(value) {
  if (value === null || value === undefined) return null;
  if (value === "N/A") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;

}

export async function importMatches(req, res) {

  const client = await db.connect();

  try {

    const idLeague = Number(req.body.league);
    const seasonYear = Number(req.body.season);

    if (!idLeague || !seasonYear) {
      return res.status(400).json({
        error: "Liga e temporada são obrigatórias"
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = xlsx.utils.sheet_to_json(sheet, {
      raw: false,
      defval: null
    });

    await client.query("BEGIN");

    /* -----------------------------
       GARANTE TEMPORADA
    ------------------------------ */

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

    /* -----------------------------
       CARREGA CLUBES (1 QUERY)
    ------------------------------ */

    const clubsRes = await client.query(`
      SELECT id_club, name, slug
      FROM clubs
    `);

    const clubsMap = new Map();

    for (const club of clubsRes.rows) {

      const slug = club.slug || slugify(club.name, { lower: true, strict: true });

      clubsMap.set(slug, club.id_club);

    }

    /* -----------------------------
       IMPORT
    ------------------------------ */

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {

      try {

        const homeName = row["home_team_name"];
        const awayName = row["away_team_name"];

        if (!homeName || !awayName) {
          skipped++;
          continue;
        }

        const homeSlug = slugify(homeName, { lower: true, strict: true });
        const awaySlug = slugify(awayName, { lower: true, strict: true });

        const homeClubId = clubsMap.get(homeSlug);
        const awayClubId = clubsMap.get(awaySlug);

        if (!homeClubId || !awayClubId) {
          skipped++;
          continue;
        }

        /* -----------------------------
           DATA / TIMESTAMP
        ------------------------------ */

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

        const homeGoals = Number(row["home_team_goal_count"] || 0);
        const awayGoals = Number(row["away_team_goal_count"] || 0);

        /* -----------------------------
           INSERT MATCH
        ------------------------------ */

        const matchRes = await client.query(
          `
          INSERT INTO matches (
            id_league,
            id_season,
            home_club_id,
            away_club_id,
            match_timestamp,
            match_date,
            status,
            attendance,
            referee,
            stadium_name,
            game_week,
            home_goals,
            away_goals
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          RETURNING id_match
          `,
          [
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
            homeGoals,
            awayGoals
          ]
        );

        const matchId = matchRes.rows[0].id_match;

        /* -----------------------------
           INSERT STATS
        ------------------------------ */

        await client.query(
          `
          INSERT INTO match_stats (
            id_match,
            home_shots,
            away_shots,
            home_shots_on_target,
            away_shots_on_target,
            home_possession,
            away_possession,
            home_corners,
            away_corners,
            home_fouls,
            away_fouls,
            home_yellow_cards,
            away_yellow_cards,
            home_red_cards,
            away_red_cards
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
          `,
          [
            matchId,
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
            toInt(row["away_team_red_cards"])
          ]
        );

        inserted++;

      } catch (err) {

        console.error("Erro na linha:", err);
        skipped++;

      }

    }

    await client.query("COMMIT");

    res.json({
      success: true,
      inserted,
      skipped,
      total: rows.length
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      success: false,
      error: "Erro ao importar partidas"
    });

  } finally {

    client.release();

  }

}

export async function importPlayers(req, res) {

  const client = await db.connect();

  try {

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    console.log("📂 Lendo CSV...");

    const workbook = xlsx.read(req.file.buffer, { 
      type: "buffer",
      raw: true,        // <-- não interpreta tipos
      cellDates: false  // <-- não converte datas
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = xlsx.utils.sheet_to_json(sheet, {
      raw: true,        // <-- mantém tudo como string
      defval: null,
      blankrows: false
    });

    console.log("📊 Linhas:", rows.length);

    await client.query("BEGIN");

    /* -----------------------------
       CACHE COUNTRIES
    ------------------------------ */

    const countriesRes = await client.query(`
      SELECT id_country,name FROM countries
    `);

    const countriesMap = new Map();
    for (const c of countriesRes.rows) {
      countriesMap.set(c.name, c.id_country);
    }

    /* -----------------------------
       CACHE CLUB SEASONS
    ------------------------------ */

    const clubSeasonRes = await client.query(`
      SELECT
      cls.id_club_league_season,
      c.name club,
      l.name league,
      s.year season
      FROM club_league_seasons cls
      JOIN clubs c ON c.id_club = cls.id_club
      JOIN leagues l ON l.id_league = cls.id_league
      JOIN seasons s ON s.id_season = cls.id_season
    `);

    const clubSeasonMap = new Map();

    for (const r of clubSeasonRes.rows) {
      const key = `${r.club}_${r.league}_${r.season}`;
      clubSeasonMap.set(key, r.id_club_league_season);
    }

    /* -----------------------------
       PREPARE PLAYERS
    ------------------------------ */

    const playersData = [];
    const seen = new Set();

    for (const row of rows) {

      if (!row.full_name) continue;

      if (seen.has(row.full_name)) continue;
      seen.add(row.full_name);

      let birthday = null;

      if (row.birthday_GMT && row.birthday_GMT !== 'N/A') {
        const parts = row.birthday_GMT.split("/");
        if (parts.length === 3) {
          const [d, m, y] = parts;
          birthday = `${y}-${m}-${d}`;
        }
      }
      
      const countryId =
        countriesMap.get(row.nationality) || null;

      playersData.push([
        row.full_name,
        birthday,
        countryId,
        row.position || null
      ]);

    }

    console.log("👤 Players únicos:", playersData.length);

    /* -----------------------------
       BULK INSERT PLAYERS
    ------------------------------ */

    const playersChunks = chunk(playersData, 1000);

    for (const chunkRows of playersChunks) {

      const values = [];
      const params = [];

      chunkRows.forEach((row,i) => {

        const base = i * 4;

        values.push(
          `($${base+1},$${base+2},$${base+3},$${base+4},NOW())`
        );

        params.push(...row);

      });

      await client.query(`
        INSERT INTO players
        (full_name,birthday,nationality,position,created_at)
        VALUES ${values.join(",")}
        ON CONFLICT (full_name) DO NOTHING
      `,params);

    }

    console.log("✅ Players inseridos");

    /* -----------------------------
       CACHE PLAYERS
    ------------------------------ */

    const playersRes = await client.query(`
      SELECT id_player,full_name FROM players
    `);

    const playersMap = new Map();

    for (const p of playersRes.rows) {
      playersMap.set(p.full_name,p.id_player);
    }

    /* -----------------------------
       PREPARE PLAYER SEASONS
    ------------------------------ */

    const playerSeasonData = [];
    const playerStatsData = [];

    for (const row of rows) {

      if (!row.full_name) continue;

      const idPlayer = playersMap.get(row.full_name);

      const clubSeasonKey =
        `${row["Current Club"]}_${row.league}_${row.season}`;

      const idClubLeagueSeason =
        clubSeasonMap.get(clubSeasonKey);

      if (!idPlayer || !idClubLeagueSeason) continue;

      playerSeasonData.push([
        idPlayer,
        idClubLeagueSeason,
        row.shirt_number || null,
        toNumber(row.market_value),
        toNumber(row.annual_salary_eur)
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
        toNumber(row.average_rating_overall)
      ]);

    }

    console.log("📊 Player seasons:", playerSeasonData.length);

    /* -----------------------------
       BULK PLAYER_SEASON
    ------------------------------ */

    const seasonChunks = chunk(playerSeasonData,1000);

    for (const chunkRows of seasonChunks) {

      const values=[];
      const params=[];

      chunkRows.forEach((row,i)=>{

        const base=i*5;

        values.push(
          `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},NOW())`
        );

        params.push(...row);

      });

      await client.query(`
        INSERT INTO player_season
        (id_player,id_club_league_season,shirt_number,market_value,salary,created_at)
        VALUES ${values.join(",")}
      `,params);

    }

    console.log("✅ Player seasons inseridos");

    await client.query("COMMIT");

    res.json({
      success:true,
      players:playersData.length,
      seasons:playerSeasonData.length
    });

  } catch(err){

    await client.query("ROLLBACK");

    console.error(err);

    res.status(500).json({
      error:"Erro no import players"
    });

  } finally {

    client.release();

  }

}