/**
 * Segunda passada: pares de clube duplicado com NOME diferente (não casaram no
 * fix automático por nome). Mapeamento explícito e validado à mão.
 *   [usado_nos_jogos, fonte_com_crest]
 * Copia crest_url p/ o clube usado; desativa a fonte só se ela tiver ZERO dados.
 *
 * node scripts/fix-dup-club-crests-named.mjs --dry-run | (sem flag p/ executar)
 */
import fs from "fs";
import path from "path";
import pool from "../src/config/db.js";

const DRY = process.argv.includes("--dry-run");

const PAIRS = [
  [21341, 26177], // Pyramids FC  ← Pyramids (egypt_pyramids)
  [24381, 26175], // ES Sétif     ← Sétif (algeria_setif)
  [24892, 26192], // Sydney FC    ← Sydney (australia_sydney)
  [26165, 26184], // CD Saprissa  ← Deportivo Saprissa (costa-rica)
  [21338, 26170], // ES Tunis     ← Espérance de Tunis (26170 tem jogos → NÃO desativa)
];

async function dataCount(id) {
  const q = async (sql) => (await pool.query(sql, [id])).rows[0].n;
  return (
    await q(`SELECT COUNT(*)::int n FROM matches WHERE home_club_id=$1 OR away_club_id=$1`) +
    await q(`SELECT COUNT(*)::int n FROM club_competition_stats WHERE id_club=$1`) +
    await q(`SELECT COUNT(*)::int n FROM club_league_seasons WHERE id_club=$1`)
  );
}

const backup = [];
const client = await pool.connect();
try {
  if (!DRY) await client.query("BEGIN");
  for (const [used, src] of PAIRS) {
    const row = await client.query(`SELECT id_club,name,crest_url,active FROM clubs WHERE id_club IN ($1,$2)`, [used, src]);
    const map = Object.fromEntries(row.rows.map(r => [r.id_club, r]));
    const u = map[used], s = map[src];
    if (!u || !s) { console.log(`  ! par ${used}/${src} não encontrado`); continue; }
    const srcCnt = await dataCount(src);
    const willDeactivate = srcCnt === 0;
    console.log(`  • ${u.name} (${used}) ← crest de ${s.name} (${src})${u.crest_url ? " [usado já tinha crest, pula]" : ""}; fonte ${willDeactivate ? "desativa" : `MANTÉM (${srcCnt} dados)`}`);
    if (DRY) continue;
    backup.push({ id_club: used, crest_url: u.crest_url }, { id_club: src, active: s.active });
    await client.query(`UPDATE clubs SET crest_url=$1 WHERE id_club=$2 AND (crest_url IS NULL OR crest_url='')`, [s.crest_url, used]);
    if (willDeactivate) await client.query(`UPDATE clubs SET active=false WHERE id_club=$1`, [src]);
  }
  if (!DRY) {
    await client.query("COMMIT");
    const f = path.resolve(process.cwd(), `backup_dup_club_crests_named_${new Date().toISOString().slice(0,10)}.json`);
    fs.writeFileSync(f, JSON.stringify(backup, null, 2));
    console.log(`\n✓ feito. Backup: ${f}`);
  }
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("✗", e.message); process.exitCode = 1;
} finally {
  client.release(); await pool.end();
}
