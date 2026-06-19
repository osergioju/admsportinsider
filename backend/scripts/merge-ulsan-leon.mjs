/**
 * Mescla os clubes duplicados Ulsan e León nos seus registros CANÔNICOS
 * (que têm todo o histórico + escudo, mas estavam inativos).
 *
 *   Ulsan Hyundai (26171, usado nos jogos, ~vazio) → Ulsan HD (7057, canônico)
 *   LeÃ³n         (26169, usado nos jogos, ~vazio) → León    (6898, canônico, México)
 *
 * Move matches/cls/club_seasons/club_competition_stats/player_seasons/aliases do
 * dup → canônico, REATIVA o canônico, desativa o dup e cria alias do nome do dup
 * apontando p/ o canônico (evita recriar duplicata em imports futuros).
 *
 * node scripts/merge-ulsan-leon.mjs --dry-run | (sem flag p/ executar)
 */
import slugify from "slugify";
import pool from "../src/config/db.js";

const DRY = process.argv.includes("--dry-run");
const PAIRS = [
  { from: 26171, to: 7057, fromName: "Ulsan Hyundai" },
  { from: 26169, to: 6898, fromName: "León" }, // alias correto (sem mojibake)
];

async function mergeClub(client, FROM_ID, TO_ID, fromName) {
  // 1. club_league_seasons (+ player_seasons)
  const clsFrom = (await client.query(
    `SELECT id_club_league_season, id_league, id_season FROM club_league_seasons WHERE id_club=$1`, [FROM_ID])).rows;
  for (const row of clsFrom) {
    const ex = (await client.query(
      `SELECT id_club_league_season FROM club_league_seasons WHERE id_club=$1 AND id_league=$2 AND id_season=$3`,
      [TO_ID, row.id_league, row.id_season])).rows;
    if (ex.length) {
      const target = ex[0].id_club_league_season, source = row.id_club_league_season;
      await client.query(`DELETE FROM player_seasons WHERE id_club_league_season=$1 AND id_player IN (SELECT id_player FROM player_seasons WHERE id_club_league_season=$2)`, [source, target]);
      await client.query(`UPDATE player_seasons SET id_club_league_season=$1 WHERE id_club_league_season=$2`, [target, source]);
      await client.query(`DELETE FROM club_league_seasons WHERE id_club_league_season=$1`, [source]);
    } else {
      await client.query(`UPDATE club_league_seasons SET id_club=$1 WHERE id_club_league_season=$2`, [TO_ID, row.id_club_league_season]);
    }
  }
  // 2. club_seasons
  for (const row of (await client.query(`SELECT id_league, year FROM club_seasons WHERE id_club=$1`, [FROM_ID])).rows) {
    const conflict = (await client.query(`SELECT 1 FROM club_seasons WHERE id_club=$1 AND id_league=$2 AND year=$3`, [TO_ID, row.id_league, row.year])).rows;
    if (conflict.length) await client.query(`DELETE FROM club_seasons WHERE id_club=$1 AND id_league=$2 AND year=$3`, [FROM_ID, row.id_league, row.year]);
    else await client.query(`UPDATE club_seasons SET id_club=$1 WHERE id_club=$2 AND id_league=$3 AND year=$4`, [TO_ID, FROM_ID, row.id_league, row.year]);
  }
  // 3. club_competition_stats
  for (const row of (await client.query(`SELECT id_competition_season FROM club_competition_stats WHERE id_club=$1`, [FROM_ID])).rows) {
    const conflict = (await client.query(`SELECT 1 FROM club_competition_stats WHERE id_club=$1 AND id_competition_season=$2`, [TO_ID, row.id_competition_season])).rows;
    if (conflict.length) await client.query(`DELETE FROM club_competition_stats WHERE id_club=$1 AND id_competition_season=$2`, [FROM_ID, row.id_competition_season]);
    else await client.query(`UPDATE club_competition_stats SET id_club=$1 WHERE id_club=$2 AND id_competition_season=$3`, [TO_ID, FROM_ID, row.id_competition_season]);
  }
  // 4. matches
  const h = await client.query(`UPDATE matches SET home_club_id=$1 WHERE home_club_id=$2`, [TO_ID, FROM_ID]);
  const a = await client.query(`UPDATE matches SET away_club_id=$1 WHERE away_club_id=$2`, [TO_ID, FROM_ID]);
  // 5. club_aliases (transfere + cria alias do nome do dup)
  await client.query(`DELETE FROM club_aliases WHERE id_club=$1 AND alias_norm IN (SELECT alias_norm FROM club_aliases WHERE id_club=$2)`, [FROM_ID, TO_ID]);
  await client.query(`UPDATE club_aliases SET id_club=$1 WHERE id_club=$2`, [TO_ID, FROM_ID]);
  const aliasNorm = slugify(fromName, { lower: true, strict: true });
  await client.query(`INSERT INTO club_aliases (alias_raw, alias_norm, id_club) VALUES ($1,$2,$3) ON CONFLICT (alias_norm) DO NOTHING`, [fromName, aliasNorm, TO_ID]);
  // 6. reativa canônico, desativa dup
  await client.query(`UPDATE clubs SET active=true WHERE id_club=$1`, [TO_ID]);
  await client.query(`UPDATE clubs SET active=false WHERE id_club=$1`, [FROM_ID]);
  return { matchesHome: h.rowCount, matchesAway: a.rowCount, aliasNorm };
}

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const p of PAIRS) {
    const r = await mergeClub(client, p.from, p.to, p.fromName);
    console.log(`  • ${p.fromName}: ${p.from} → ${p.to} | matches ${r.matchesHome}H+${r.matchesAway}A | alias '${r.aliasNorm}'→${p.to} | reativado ${p.to}, desativado ${p.from}`);
  }
  if (DRY) { await client.query("ROLLBACK"); console.log("\n(DRY-RUN: rollback, nada gravado)"); }
  else { await client.query("COMMIT"); console.log("\n✓ merge concluído."); }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("✗ rollback:", e.message); process.exitCode = 1;
} finally {
  client.release(); await pool.end();
}
