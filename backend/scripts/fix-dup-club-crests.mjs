/**
 * Conserta escudos de clube que não aparecem porque foram subidos num clube
 * DUPLICADO. Em todas as ligas 11/12 (Mundial/Intercontinental) há pares:
 *   - clube USADO nos jogos (sem crest, sem país)
 *   - GÊMEO criado depois (com crest + país) mas SEM nenhum dado esportivo
 *
 * Como o gêmeo não tem dados, não há merge: copiamos crest_url (e id_country,
 * se faltar) do gêmeo → clube usado e DESATIVAMOS o gêmeo vazio.
 *
 * Seguro: só age quando o gêmeo tem ZERO dados (matches/ccs/cls/player_seasons).
 * Backup automático antes de qualquer UPDATE.
 *
 * Uso (no servidor):
 *   node scripts/fix-dup-club-crests.mjs --dry-run   # só mostra
 *   node scripts/fix-dup-club-crests.mjs             # executa
 */
import fs from "fs";
import path from "path";
import pool from "../src/config/db.js";

const DRY = process.argv.includes("--dry-run");
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function twinDataCount(id) {
  const q = async (sql) => (await pool.query(sql, [id])).rows[0].n;
  return (
    await q(`SELECT COUNT(*)::int n FROM matches WHERE home_club_id=$1 OR away_club_id=$1`) +
    await q(`SELECT COUNT(*)::int n FROM club_competition_stats WHERE id_club=$1`) +
    await q(`SELECT COUNT(*)::int n FROM club_league_seasons WHERE id_club=$1`) +
    await q(`SELECT COUNT(*)::int n FROM player_seasons ps JOIN club_league_seasons cls ON cls.id_club_league_season=ps.id_club_league_season WHERE cls.id_club=$1`)
  );
}

async function main() {
  console.log(`modo = ${DRY ? "DRY-RUN" : "EXECUÇÃO"}\n`);

  // Clubes usados em jogos das ligas 11/12, SEM crest
  const used = await pool.query(`
    SELECT DISTINCT c.id_club, c.name, c.slug, c.id_country, c.crest_url
    FROM matches m
    JOIN clubs c ON c.id_club IN (m.home_club_id, m.away_club_id)
    WHERE m.id_league IN (11, 12) AND (c.crest_url IS NULL OR c.crest_url = '')`);

  const all = await pool.query(`SELECT id_club, name, id_country, crest_url, active FROM clubs`);
  const byNorm = new Map();
  for (const c of all.rows) {
    const k = norm(c.name);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(c);
  }

  const actions = [];
  const ambiguous = [];

  for (const u of used.rows) {
    const twins = (byNorm.get(norm(u.name)) || []).filter((t) => t.id_club !== u.id_club && t.crest_url);
    if (!twins.length) continue;
    if (twins.length > 1) { ambiguous.push({ used: u, twins }); continue; }
    const twin = twins[0];
    const cnt = await twinDataCount(twin.id_club);
    if (cnt > 0) { ambiguous.push({ used: u, twins, reason: `gêmeo tem ${cnt} registros de dados` }); continue; }
    actions.push({ used: u, twin });
  }

  console.log(`Pares a consertar: ${actions.length}`);
  for (const a of actions) {
    console.log(`  • ${a.used.name}: crest do gêmeo ${a.twin.id_club} → usado ${a.used.id_club}; desativa ${a.twin.id_club}`);
  }
  if (ambiguous.length) {
    console.log(`\nAmbíguos (NÃO tocados, revisar à mão): ${ambiguous.length}`);
    for (const a of ambiguous) console.log(`  • ${a.used.name} (id ${a.used.id_club}) — ${a.reason || `${a.twins.length} gêmeos`}`);
  }

  if (DRY || !actions.length) { await pool.end(); return; }

  // Backup
  const backupRows = [];
  for (const a of actions) {
    backupRows.push({ id_club: a.used.id_club, role: "used", crest_url: a.used.crest_url, id_country: a.used.id_country });
    const tw = all.rows.find((c) => c.id_club === a.twin.id_club);
    backupRows.push({ id_club: a.twin.id_club, role: "twin", crest_url: tw.crest_url, id_country: tw.id_country, active: tw.active });
  }
  const backupFile = path.resolve(process.cwd(), `backup_dup_club_crests_${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupRows, null, 2));
  console.log(`\nBackup: ${backupFile}`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const a of actions) {
      // Só o escudo. NÃO copiamos id_country: o gêmeo tem o mesmo nome+país e a
      // constraint uq_club_name_country bloquearia dois "Sepahan" no mesmo país.
      await client.query(
        `UPDATE clubs SET crest_url = $1 WHERE id_club = $2 AND (crest_url IS NULL OR crest_url = '')`,
        [a.twin.crest_url, a.used.id_club]
      );
      await client.query(`UPDATE clubs SET active = false WHERE id_club = $1`, [a.twin.id_club]);
    }
    await client.query("COMMIT");
    console.log(`\n✓ ${actions.length} pares consertados.`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("✗ rollback:", e.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
