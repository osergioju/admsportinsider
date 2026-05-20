/**
 * Adiciona a coluna winner_club_id à tabela matches.
 * Usada para registrar o vencedor em partidas que terminam em empate
 * mas têm um vencedor definido (prorrogação / pênaltis).
 *
 * Executar: node add-winner-club-id.js
 */
import pool from "./src/config/db.js";

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE matches
      ADD COLUMN IF NOT EXISTS winner_club_id INTEGER REFERENCES clubs(id_club)
    `);
    console.log("✓ Coluna winner_club_id adicionada (ou já existia).");
  } catch (err) {
    console.error("✗ Erro:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
