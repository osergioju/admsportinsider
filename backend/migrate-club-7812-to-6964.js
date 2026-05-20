/**
 * Migra todos os dados do clube 7812 (al whada — errado)
 * para o clube 6964 (al wehda — correto) e desativa o 7812.
 *
 * Executar: node migrate-club-7812-to-6964.js
 */

import pool from "./src/config/db.js";

const FROM_ID = 7812;
const TO_ID   = 6964;

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ── 1. club_league_seasons ────────────────────────────────────────────────
    // Para cada cls do clube errado, verifica se o clube certo já tem o mesmo
    // (id_league, id_season). Se sim, redireciona player_seasons e deleta o duplicado.
    // Se não, simplesmente troca o id_club.

    const clsFrom = await client.query(
      `SELECT id_club_league_season, id_league, id_season
       FROM club_league_seasons WHERE id_club = $1`,
      [FROM_ID]
    );

    let clsMoved = 0, clsMerged = 0;

    for (const row of clsFrom.rows) {
      const existing = await client.query(
        `SELECT id_club_league_season FROM club_league_seasons
         WHERE id_club = $1 AND id_league = $2 AND id_season = $3`,
        [TO_ID, row.id_league, row.id_season]
      );

      if (existing.rows.length > 0) {
        // Clube certo já tem esse (league, season) → redireciona player_seasons
        const targetCls = existing.rows[0].id_club_league_season;
        const sourceCls = row.id_club_league_season;

        // player_seasons que seriam conflito (mesmo id_player já existe no cls destino)
        await client.query(`
          DELETE FROM player_seasons
          WHERE id_club_league_season = $1
          AND id_player IN (
            SELECT id_player FROM player_seasons WHERE id_club_league_season = $2
          )
        `, [sourceCls, targetCls]);

        // Restante vai para o cls do clube certo
        await client.query(
          `UPDATE player_seasons SET id_club_league_season = $1
           WHERE id_club_league_season = $2`,
          [targetCls, sourceCls]
        );

        await client.query(
          `DELETE FROM club_league_seasons WHERE id_club_league_season = $1`,
          [sourceCls]
        );
        clsMerged++;
      } else {
        // Clube certo não tem esse (league, season) → apenas troca o id_club
        await client.query(
          `UPDATE club_league_seasons SET id_club = $1
           WHERE id_club_league_season = $2`,
          [TO_ID, row.id_club_league_season]
        );
        clsMoved++;
      }
    }

    console.log(`club_league_seasons: ${clsMoved} movidos, ${clsMerged} mergeados`);

    // ── 2. club_seasons ───────────────────────────────────────────────────────
    const csFrom = await client.query(
      `SELECT id_club, id_league, year FROM club_seasons WHERE id_club = $1`,
      [FROM_ID]
    );

    let csMoved = 0, csSkipped = 0;
    for (const row of csFrom.rows) {
      const conflict = await client.query(
        `SELECT 1 FROM club_seasons WHERE id_club = $1 AND id_league = $2 AND year = $3`,
        [TO_ID, row.id_league, row.year]
      );
      if (conflict.rows.length > 0) {
        await client.query(
          `DELETE FROM club_seasons WHERE id_club = $1 AND id_league = $2 AND year = $3`,
          [FROM_ID, row.id_league, row.year]
        );
        csSkipped++;
      } else {
        await client.query(
          `UPDATE club_seasons SET id_club = $1
           WHERE id_club = $2 AND id_league = $3 AND year = $4`,
          [TO_ID, FROM_ID, row.id_league, row.year]
        );
        csMoved++;
      }
    }
    console.log(`club_seasons: ${csMoved} movidos, ${csSkipped} já existiam (removidos)`);

    // ── 3. club_competition_stats ─────────────────────────────────────────────
    const statsFrom = await client.query(
      `SELECT id_competition_season FROM club_competition_stats WHERE id_club = $1`,
      [FROM_ID]
    );

    let statsMoved = 0, statsSkipped = 0;
    for (const row of statsFrom.rows) {
      const conflict = await client.query(
        `SELECT 1 FROM club_competition_stats
         WHERE id_club = $1 AND id_competition_season = $2`,
        [TO_ID, row.id_competition_season]
      );
      if (conflict.rows.length > 0) {
        await client.query(
          `DELETE FROM club_competition_stats
           WHERE id_club = $1 AND id_competition_season = $2`,
          [FROM_ID, row.id_competition_season]
        );
        statsSkipped++;
      } else {
        await client.query(
          `UPDATE club_competition_stats SET id_club = $1
           WHERE id_club = $2 AND id_competition_season = $3`,
          [TO_ID, FROM_ID, row.id_competition_season]
        );
        statsMoved++;
      }
    }
    console.log(`club_competition_stats: ${statsMoved} movidos, ${statsSkipped} já existiam (removidos)`);

    // ── 4. matches ────────────────────────────────────────────────────────────
    const { rowCount: homeUpdated } = await client.query(
      `UPDATE matches SET home_club_id = $1 WHERE home_club_id = $2`,
      [TO_ID, FROM_ID]
    );
    const { rowCount: awayUpdated } = await client.query(
      `UPDATE matches SET away_club_id = $1 WHERE away_club_id = $2`,
      [TO_ID, FROM_ID]
    );
    console.log(`matches: ${homeUpdated} home + ${awayUpdated} away atualizados`);

    // ── 5. club_aliases ───────────────────────────────────────────────────────
    // Remove aliases duplicados antes de atualizar (alias_norm é unique)
    await client.query(`
      DELETE FROM club_aliases
      WHERE id_club = $1
      AND alias_norm IN (
        SELECT alias_norm FROM club_aliases WHERE id_club = $2
      )
    `, [FROM_ID, TO_ID]);

    const { rowCount: aliasUpdated } = await client.query(
      `UPDATE club_aliases SET id_club = $1 WHERE id_club = $2`,
      [TO_ID, FROM_ID]
    );
    console.log(`club_aliases: ${aliasUpdated} transferidos`);

    // ── 6. Desativa o clube errado ────────────────────────────────────────────
    await client.query(
      `UPDATE clubs SET active = false WHERE id_club = $1`,
      [FROM_ID]
    );
    console.log(`Clube ${FROM_ID} desativado`);

    await client.query("COMMIT");
    console.log("\n✓ Migração concluída com sucesso.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n✗ Erro — rollback feito:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
