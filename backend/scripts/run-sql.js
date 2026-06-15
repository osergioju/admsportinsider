// Roda um arquivo .sql usando a MESMA conexão do backend (src/config/db.js → .env).
// Uso (de dentro de backend/):
//   node scripts/run-sql.js ../schema/12_add_legal_sections.sql
import fs from "fs";
import path from "path";
import db from "../src/config/db.js";

const arg = process.argv[2];
if (!arg) {
  console.error("Uso: node scripts/run-sql.js <caminho/arquivo.sql>");
  process.exit(1);
}

const file = path.resolve(process.cwd(), arg);

try {
  const sql = fs.readFileSync(file, "utf-8");
  await db.query(sql);
  console.log(`✅ SQL aplicado com sucesso: ${file}`);
  process.exit(0);
} catch (err) {
  console.error(`❌ Erro ao aplicar ${file}:`, err.message);
  process.exit(1);
}
