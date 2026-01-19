import XLSX from "xlsx";
import db from  from "../config/db.js";

function normalizeNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const cleaned = String(value)
    .replace(/\./g, "")   // remove pontos
    .replace(",", ".")    // troca vírgula por ponto
    .trim();

  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

async function getOrCreateLeagueMetric(metricName, order) {
  const found = await db.query(
    "SELECT id_metric FROM league_metrics WHERE metric_name = $1",
    [metricName]
  );

  if (found.rows.length > 0) return found.rows[0].id_metric;

  const inserted = await db.query(
    `INSERT INTO league_metrics (metric_name, metric_order)
     VALUES ($1, $2)
     RETURNING id_metric`,
    [metricName, order]
  );

  return inserted.rows[0].id_metric;
}

export async function importLeagueBalance({ countryId, leagueName, filePath }) {
  // 1. Criar ou pegar liga
  const leagueRes = await db.query(
    `INSERT INTO leagues (id_country, name)
     VALUES ($1, $2)
     ON CONFLICT (name, id_country) DO UPDATE SET name = EXCLUDED.name 
     RETURNING id_league`,
    [countryId, leagueName]
  );

  const leagueId = leagueRes.rows[0].id_league;

  // 2. Ler Excel
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });

  if (!rows || rows.length === 0) throw new Error("Planilha vazia");

  // 3. CABEÇALHO — anos (colunas C, D, E...)
  const header = rows[0];
  const years = header.slice(2).map((h) => Number(h)).filter((y) => !isNaN(y));

  // 4. Percorrer linhas a partir da linha 1
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const metricName = row[1]; // coluna B

    if (!metricName) continue; // ignora linha vazia

    // Criar / pegar métrica
    const idMetric = await getOrCreateLeagueMetric(metricName, i);

    // Percorrer valores dos anos
    for (let col = 0; col < years.length; col++) {
      const year = years[col];
      const valueRaw = row[col + 2]; // começa na coluna C
      const value = normalizeNumber(valueRaw);

      if (value === null) continue;

      await db.query(
        `INSERT INTO league_statements (id_league, id_metric, year, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_league, id_metric, year)
         DO UPDATE SET value = EXCLUDED.value`,
        [leagueId, idMetric, year, value]
      );
    }
  }

  return { success: true, leagueId };
}
