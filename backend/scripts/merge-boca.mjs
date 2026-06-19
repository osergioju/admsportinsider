/**
 * Boca Juniors: o importador atribuiu jogos do Boca ARGENTINO ao homônimo
 * "Boca Juniors de Cali" (Colômbia, id 20249) — que não tem dados próprios, só
 * essas partidas (Intercontinental 2007 + Libertadores 2021-2025).
 * Mescla 20249 → 6228 (Boca argentino real, com histórico+escudo, mas inativo).
 *
 * node scripts/merge-boca.mjs --dry-run | (sem flag p/ executar)
 */
import slugify from "slugify";
import pool from "../src/config/db.js";

const DRY = process.argv.includes("--dry-run");
const FROM_ID = 20249, TO_ID = 6228, FROM_NAME = "Boca Juniors";

const client = await pool.connect();
try {
  await client.query("BEGIN");

  // club_league_seasons (+ player_seasons) — 20249 tem 0, mas mantém o padrão
  for (const row of (await client.query(`SELECT id_club_league_season, id_league, id_season FROM club_league_seasons WHERE id_club=$1`, [FROM_ID])).rows) {
    const ex = (await client.query(`SELECT id_club_league_season FROM club_league_seasons WHERE id_club=$1 AND id_league=$2 AND id_season=$3`, [TO_ID, row.id_league, row.id_season])).rows;
    if (ex.length) {
      const target = ex[0].id_club_league_season, source = row.id_club_league_season;
      await client.query(`DELETE FROM player_seasons WHERE id_club_league_season=$1 AND id_player IN (SELECT id_player FROM player_seasons WHERE id_club_league_season=$2)`, [source, target]);
      await client.query(`UPDATE player_seasons SET id_club_league_season=$1 WHERE id_club_league_season=$2`, [target, source]);
      await client.query(`DELETE FROM club_league_seasons WHERE id_club_league_season=$1`, [source]);
    } else {
      await client.query(`UPDATE club_league_seasons SET id_club=$1 WHERE id_club_league_season=$2`, [TO_ID, row.id_club_league_season]);
    }
  }
  for (const row of (await client.query(`SELECT id_league, year FROM club_seasons WHERE id_club=$1`, [FROM_ID])).rows) {
    const conflict = (await client.query(`SELECT 1 FROM club_seasons WHERE id_club=$1 AND id_league=$2 AND year=$3`, [TO_ID, row.id_league, row.year])).rows;
    if (conflict.length) await client.query(`DELETE FROM club_seasons WHERE id_club=$1 AND id_league=$2 AND year=$3`, [FROM_ID, row.id_league, row.year]);
    else await client.query(`UPDATE club_seasons SET id_club=$1 WHERE id_club=$2 AND id_league=$3 AND year=$4`, [TO_ID, FROM_ID, row.id_league, row.year]);
  }
  for (const row of (await client.query(`SELECT id_competition_season FROM club_competition_stats WHERE id_club=$1`, [FROM_ID])).rows) {
    const conflict = (await client.query(`SELECT 1 FROM club_competition_stats WHERE id_club=$1 AND id_competition_season=$2`, [TO_ID, row.id_competition_season])).rows;
    if (conflict.length) await client.query(`DELETE FROM club_competition_stats WHERE id_club=$1 AND id_competition_season=$2`, [FROM_ID, row.id_competition_season]);
    else await client.query(`UPDATE club_competition_stats SET id_club=$1 WHERE id_club=$2 AND id_competition_season=$3`, [TO_ID, FROM_ID, row.id_competition_season]);
  }
  const h = await client.query(`UPDATE matches SET home_club_id=$1 WHERE home_club_id=$2`, [TO_ID, FROM_ID]);
  const a = await client.query(`UPDATE matches SET away_club_id=$1 WHERE away_club_id=$2`, [TO_ID, FROM_ID]);
  await client.query(`DELETE FROM club_aliases WHERE id_club=$1 AND alias_norm IN (SELECT alias_norm FROM club_aliases WHERE id_club=$2)`, [FROM_ID, TO_ID]);
  await client.query(`UPDATE club_aliases SET id_club=$1 WHERE id_club=$2`, [TO_ID, FROM_ID]);
  const aliasNorm = slugify(FROM_NAME, { lower: true, strict: true });
  await client.query(`INSERT INTO club_aliases (alias_raw, alias_norm, id_club) VALUES ($1,$2,$3) ON CONFLICT (alias_norm) DO NOTHING`, [FROM_NAME, aliasNorm, TO_ID]);
  await client.query(`UPDATE clubs SET active=true WHERE id_club=$1`, [TO_ID]);
  await client.query(`UPDATE clubs SET active=false WHERE id_club=$1`, [FROM_ID]);

  console.log(`Boca: ${FROM_ID} → ${TO_ID} | matches ${h.rowCount}H+${a.rowCount}A | alias '${aliasNorm}'→${TO_ID} | reativado ${TO_ID}, desativado ${FROM_ID}`);

  if (DRY) { await client.query("ROLLBACK"); console.log("(DRY-RUN: rollback, nada gravado)"); }
  else { await client.query("COMMIT"); console.log("✓ merge concluído."); }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("✗ rollback:", e.message); process.exitCode = 1;
} finally {
  client.release(); await pool.end();
}
