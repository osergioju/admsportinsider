/**
 * Roda um arquivo SQL de migration no banco.
 * Uso: node run-migration.js src/migrations/nome-do-arquivo.sql
 */

import pool from "./src/config/db.js";
import { readFileSync } from "fs";
import { resolve } from "path";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node run-migration.js src/migrations/nome.sql");
  process.exit(1);
}

const sql = readFileSync(resolve(file), "utf8");
const client = await pool.connect();

try {
  console.log(`Rodando: ${file}`);
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log("✅ Migration aplicada com sucesso.");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("❌ Erro:", err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
