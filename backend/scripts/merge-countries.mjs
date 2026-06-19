/**
 * Mescla países DUPLICADOS num único registro. Repoint de todas as FKs → país
 * canônico, trata country_translations (unique id_country+locale), DELETA o
 * duplicado e corrige a grafia pt-BR do canônico.
 *
 *   Nova Caledônia: 502 → 423 (rename "Nova Caledônia")
 *   Papua Nova Guiné: 501 → 442
 *   Curaçao: 498 → 314 (rename "Curaçao")  [a federação 172 está no 498]
 *
 * node scripts/merge-countries.mjs --dry-run | (sem flag p/ executar)
 */
import fs from "fs";
import path from "path";
import pool from "../src/config/db.js";

const DRY = process.argv.includes("--dry-run");

const PAIRS = [
  { from: 502, to: 423, rename: "Nova Caledônia" },
  { from: 501, to: 442, rename: null },
  { from: 498, to: 314, rename: "Curaçao" },
];

// (tabela, coluna) que referenciam countries por id
const FK_COLS = [
  ["clubs", "id_country"],
  ["players", "nationality"],
  ["country_league_seasons", "id_country"],
  ["club_competition_stats", "id_country"],
  ["competitions", "id_country"],
  ["leagues", "id_country"],
  ["federations", "id_country"],
  ["matches", "home_country_id"],
  ["matches", "away_country_id"],
  ["matches", "winner_country_id"],
  ["currencies", "id_country"],
];

const client = await pool.connect();
try {
  await client.query("BEGIN");

  // backup dos registros envolvidos
  const ids = PAIRS.flatMap((p) => [p.from, p.to]);
  const backup = {
    countries: (await client.query(`SELECT * FROM countries WHERE id_country = ANY($1)`, [ids])).rows,
    translations: (await client.query(`SELECT * FROM country_translations WHERE id_country = ANY($1)`, [ids])).rows,
  };

  for (const { from, to, rename } of PAIRS) {
    const moves = [];
    for (const [table, col] of FK_COLS) {
      const r = await client.query(`UPDATE ${table} SET ${col}=$1 WHERE ${col}=$2`, [to, from]);
      if (r.rowCount) moves.push(`${table}.${col}=${r.rowCount}`);
    }
    // country_translations: repoint só os locales que o destino ainda não tem; resto deleta
    await client.query(
      `UPDATE country_translations ct SET id_country=$1
       WHERE ct.id_country=$2
         AND NOT EXISTS (SELECT 1 FROM country_translations t2 WHERE t2.id_country=$1 AND t2.locale=ct.locale)`,
      [to, from]
    );
    const delT = await client.query(`DELETE FROM country_translations WHERE id_country=$1`, [from]);
    if (delT.rowCount) moves.push(`translations_descartadas=${delT.rowCount}`);

    // apaga o duplicado (libera o nome único) e corrige a grafia do canônico
    await client.query(`DELETE FROM countries WHERE id_country=$1`, [from]);
    if (rename) await client.query(`UPDATE countries SET name=$1 WHERE id_country=$2`, [rename, to]);

    console.log(`  • ${from} → ${to}${rename ? ` (rename "${rename}")` : ""} | ${moves.join(", ") || "nada a mover"} | duplicado ${from} apagado`);
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log("\n(DRY-RUN: rollback, nada gravado)");
  } else {
    const f = path.resolve(process.cwd(), `backup_dup_countries_${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(f, JSON.stringify(backup, null, 2));
    await client.query("COMMIT");
    console.log(`\n✓ países mesclados. Backup: ${f}`);
  }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("✗ rollback:", e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
