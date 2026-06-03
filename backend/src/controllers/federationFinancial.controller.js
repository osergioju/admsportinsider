import db from "../config/db.js";
import XLSX from "xlsx";

const META_COLS = 4; // cols 0-3: code, level, ?, name
const SKIP_COL  = 4; // col 4 é template/referência — ignorar

function parseSheet(buffer, sheetName) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" não encontrada. Disponíveis: ${wb.SheetNames.join(", ")}`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
}

function buildEditions(rows) {
  const slugRow    = rows[1];
  const currRow    = rows[2];
  const yearRow    = rows[3];
  const statusRow  = rows[5];
  const editionRow = rows[0];

  // Primeira coluna com slug real (contém "_" e não é template)
  let dataStart = -1;
  for (let c = META_COLS + 1; c < slugRow.length; c++) {
    const s = slugRow[c];
    if (s && typeof s === "string" && s.includes("_") && s !== "brazil_abc") {
      dataStart = c;
      break;
    }
  }
  if (dataStart === -1) throw new Error("Nenhuma edição encontrada no arquivo.");

  const editions = {};
  for (let c = dataStart; c < slugRow.length; c++) {
    const slug = slugRow[c];
    if (!slug || typeof slug !== "string" || !slug.includes("_")) continue;
    if (!editions[slug]) {
      editions[slug] = { slug, name: null, currency: currRow[c] || "USD", cols: [], years: [], statuses: [] };
    }
    if (!editions[slug].name) {
      const n = editionRow[c];
      if (n && typeof n === "string") editions[slug].name = n;
    }
    editions[slug].cols.push(c);
    editions[slug].years.push(yearRow[c]);
    editions[slug].statuses.push((statusRow?.[c] || "realizado").toLowerCase());
  }

  return { editions: Object.values(editions), dataStart };
}

function buildIndicators(rows, dataStart) {
  return rows.slice(7).filter(r => {
    const code = r[0];
    return code && typeof code === "string" && !code.startsWith("#") && code.trim() !== "";
  }).map(r => ({
    code:  r[0].trim(),
    level: r[1] ?? 1,
    name:  r[3] ?? r[0],
    values: r, // full row — values indexed by col
  }));
}

// ─── Preview ──────────────────────────────────────────────────────────────────

export async function previewFederationFinancial(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado." });
    const sheetName = req.body.sheet || "Fifa";
    const rows = parseSheet(req.file.buffer, sheetName);
    const { editions } = buildEditions(rows);
    const indicators = buildIndicators(rows);

    // Verifica quais edições já existem
    const existingSlugs = new Set();
    if (editions.length) {
      const r = await db.query(
        `SELECT slug FROM competition_editions WHERE slug = ANY($1)`,
        [editions.map(e => e.slug)]
      );
      r.rows.forEach(row => existingSlugs.add(row.slug));
    }

    return res.json({
      sheetName,
      editions: editions.map(e => ({
        slug: e.slug,
        name: e.name,
        currency: e.currency,
        years: e.years,
        exists: existingSlugs.has(e.slug),
        rows: indicators.filter(i => {
          // conta valores não-nulos para essa edição
          return e.cols.some(c => i.values[c] != null && i.values[c] !== "N/A" && i.values[c] !== "");
        }).length,
      })),
      totalIndicators: indicators.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Erro ao processar arquivo." });
  }
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importFederationFinancial(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado." });

    const sheetName = req.body.sheet || "Fifa";
    const id_league = req.body.id_league ? parseInt(req.body.id_league) : null;
    const rows = parseSheet(req.file.buffer, sheetName);
    const { editions, dataStart } = buildEditions(rows);
    const indicators = buildIndicators(rows, dataStart);

    const client = await db.connect();
    let totalRows = 0;
    let editionIds = {};

    try {
      await client.query("BEGIN");

      // 1. Bulk upsert dos indicadores — deduplica por código
      const uniqueInds = Array.from(new Map(indicators.map(i => [i.code, i])).values());
      const indValues = uniqueInds.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(",");
      const indParams = uniqueInds.flatMap(ind => [ind.code, ind.name, ind.level]);
      const indResult = await client.query(
        `INSERT INTO financial_indicators (code, name_pt, level)
         VALUES ${indValues}
         ON CONFLICT (code) DO UPDATE SET name_pt = EXCLUDED.name_pt
         RETURNING id, code`,
        indParams
      );
      const indicatorIdByCode = {};
      indResult.rows.forEach(r => { indicatorIdByCode[r.code] = r.id; });

      // 2. Upsert edições (poucas, query simples)
      for (const ed of editions) {
        const editionYear = ed.years.length ? Math.max(...ed.years.filter(Boolean)) : null;
        const r = await client.query(
          `INSERT INTO competition_editions (slug, name, id_league, edition_year, currency)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (slug) DO UPDATE
             SET name = EXCLUDED.name,
                 id_league = COALESCE(EXCLUDED.id_league, competition_editions.id_league),
                 edition_year = EXCLUDED.edition_year,
                 currency = EXCLUDED.currency
           RETURNING id_edition`,
          [ed.slug, ed.name, id_league, editionYear, ed.currency]
        );
        editionIds[ed.slug] = r.rows[0].id_edition;
      }

      // 3. Monta todos os registros financeiros em memória
      const financialRows = [];
      for (const ed of editions) {
        const id_edition = editionIds[ed.slug];
        for (const ind of indicators) {
          const id_indicator = indicatorIdByCode[ind.code];
          if (!id_indicator) continue;
          for (let i = 0; i < ed.cols.length; i++) {
            const raw  = ind.values[ed.cols[i]];
            const year = ed.years[i];
            if (raw == null || raw === "N/A" || raw === "" || year == null) continue;
            const numVal = typeof raw === "number" ? raw : parseFloat(String(raw).replace(",", "."));
            if (isNaN(numVal)) continue;
            financialRows.push([id_edition, id_indicator, year, numVal, ed.statuses[i] || "realizado"]);
          }
        }
      }

      // 4. Deduplica — mantém o último valor por (id_edition, id_indicator, year)
      const deduped = new Map();
      for (const row of financialRows) {
        deduped.set(`${row[0]}|${row[1]}|${row[2]}`, row);
      }
      const uniqueRows = Array.from(deduped.values());

      // 5. Bulk upsert em lotes de 500
      const BATCH = 500;
      for (let offset = 0; offset < uniqueRows.length; offset += BATCH) {
        const batch = uniqueRows.slice(offset, offset + BATCH);
        const vals  = batch.map((_, i) => `($${i*5+1},$${i*5+2},$${i*5+3},$${i*5+4},$${i*5+5})`).join(",");
        await client.query(
          `INSERT INTO edition_financials (id_edition, id_indicator, year, value, status)
           VALUES ${vals}
           ON CONFLICT (id_edition, id_indicator, year)
           DO UPDATE SET value = EXCLUDED.value, status = EXCLUDED.status`,
          batch.flat()
        );
        totalRows += batch.length;
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return res.json({
      message: "Importação concluída com sucesso!",
      editions: Object.keys(editionIds).length,
      rows: totalRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Erro ao importar." });
  }
}

// ─── Financeiros por ciclo (página da federação) ─────────────────────────────
// Receitas/Custos/Lucro = SUM dos 4 anos convertidos individualmente
// Dívida = valor do último ano do ciclo convertido

export async function getFederationCycleFinancials(req, res) {
  const { slug } = req.params;
  const toCurrency = req.query.to || "USD";

  try {
    // Resolve federação → liga
    const fedRow = await db.query(
      `SELECT f.id_federation, f.financial_league_id FROM federations f
       WHERE f.slug = $1 AND f.active = true LIMIT 1`,
      [slug]
    );
    if (!fedRow.rows.length) return res.status(404).json({ message: "Federação não encontrada" });

    const financialLeagueId = fedRow.rows[0].financial_league_id;
    if (!financialLeagueId) return res.json({ editions: [] });

    const leagueRow = await db.query(
      `SELECT id_league, currency_code FROM leagues WHERE id_league = $1`,
      [financialLeagueId]
    );
    if (!leagueRow.rows.length) return res.json({ editions: [] });

    const id_league   = leagueRow.rows[0].id_league;
    const fromCurrency = leagueRow.rows[0].currency_code || "USD";

    // CTE de câmbio: melhor taxa disponível por ano
    const result = await db.query(`
      WITH rate_cte AS (
        SELECT DISTINCT ON (EXTRACT(YEAR FROM period)::int)
          EXTRACT(YEAR FROM period)::int AS year,
          rate
        FROM currency_rates
        WHERE base_currency = $2
          AND reference_currency = $3
        ORDER BY EXTRACT(YEAR FROM period)::int, period DESC
      ),
      -- Soma anual convertida por edição
      annual_sums AS (
        SELECT
          ce.id_edition,
          ce.slug,
          ce.name,
          ce.edition_year,
          fi.code,
          SUM(ef.value * COALESCE(r.rate, 1)) AS converted_sum,
          SUM(ef.value) AS raw_sum
        FROM edition_financials ef
        JOIN competition_editions ce ON ce.id_edition = ef.id_edition
        JOIN financial_indicators fi ON fi.id = ef.id_indicator
        LEFT JOIN rate_cte r ON r.year = ef.year
        WHERE ce.id_league = $1
          AND fi.code IN ('revenue','costs','net_income')
        GROUP BY ce.id_edition, ce.slug, ce.name, ce.edition_year, fi.code
      ),
      -- Dívida: último ano do ciclo (edition_year)
      debt_last AS (
        SELECT
          ce.id_edition,
          ef.value * COALESCE(r.rate, 1) AS converted_value,
          ef.value AS raw_value
        FROM edition_financials ef
        JOIN competition_editions ce ON ce.id_edition = ef.id_edition
        JOIN financial_indicators fi ON fi.id = ef.id_indicator
        LEFT JOIN rate_cte r ON r.year = ef.year
        WHERE ce.id_league = $1
          AND fi.code = 'net_debt'
          AND ef.year = ce.edition_year
      )
      SELECT
        a.slug, a.name, a.edition_year,
        MAX(CASE WHEN a.code='revenue'    THEN a.raw_sum END)       AS revenue,
        MAX(CASE WHEN a.code='revenue'    THEN a.converted_sum END)  AS revenue_converted,
        MAX(CASE WHEN a.code='costs'      THEN a.raw_sum END)        AS costs,
        MAX(CASE WHEN a.code='costs'      THEN a.converted_sum END)  AS costs_converted,
        MAX(CASE WHEN a.code='net_income' THEN a.raw_sum END)        AS net_income,
        MAX(CASE WHEN a.code='net_income' THEN a.converted_sum END)  AS net_income_converted,
        MAX(d.raw_value)       AS net_debt,
        MAX(d.converted_value) AS net_debt_converted
      FROM annual_sums a
      LEFT JOIN debt_last d ON d.id_edition = a.id_edition
      GROUP BY a.slug, a.name, a.edition_year
      ORDER BY a.edition_year ASC
    `, [id_league, fromCurrency, toCurrency]);

    return res.json({
      fromCurrency,
      toCurrency,
      editions: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// ─── Ciclos por liga (para /dashboard/competitions/finance/:id) ──────────────

export async function getLeagueCycleFinancials(req, res) {
  const { id }        = req.params;
  const toCurrency    = req.query.to || "USD";

  try {
    const fromRow = await db.query(
      `SELECT currency_code FROM leagues WHERE id_league = $1`, [id]
    );
    const fromCurrency = fromRow.rows[0]?.currency_code || "USD";

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT DISTINCT ON (EXTRACT(YEAR FROM period)::int)
          EXTRACT(YEAR FROM period)::int AS year, rate
        FROM currency_rates
        WHERE base_currency = $2 AND reference_currency = $3
        ORDER BY EXTRACT(YEAR FROM period)::int, period DESC
      ),
      annual_sums AS (
        SELECT ce.id_edition, ce.slug, ce.name, ce.edition_year, fi.code,
          SUM(ef.value * COALESCE(r.rate, 1)) AS converted_sum,
          SUM(ef.value) AS raw_sum
        FROM edition_financials ef
        JOIN competition_editions ce ON ce.id_edition = ef.id_edition
        JOIN financial_indicators fi ON fi.id = ef.id_indicator
        LEFT JOIN rate_cte r ON r.year = ef.year
        WHERE ce.id_league = $1
          AND fi.code IN ('revenue','costs','net_income')
        GROUP BY ce.id_edition, ce.slug, ce.name, ce.edition_year, fi.code
      ),
      debt_last AS (
        SELECT ce.id_edition,
          ef.value * COALESCE(r.rate, 1) AS converted_value,
          ef.value AS raw_value
        FROM edition_financials ef
        JOIN competition_editions ce ON ce.id_edition = ef.id_edition
        JOIN financial_indicators fi ON fi.id = ef.id_indicator
        LEFT JOIN rate_cte r ON r.year = ef.year
        WHERE ce.id_league = $1
          AND fi.code = 'net_debt'
          AND ef.year = ce.edition_year
      )
      SELECT a.slug, a.name, a.edition_year,
        MAX(CASE WHEN a.code='revenue'    THEN a.raw_sum  END) AS revenue,
        MAX(CASE WHEN a.code='revenue'    THEN a.converted_sum END) AS revenue_converted,
        MAX(CASE WHEN a.code='costs'      THEN a.raw_sum  END) AS costs,
        MAX(CASE WHEN a.code='costs'      THEN a.converted_sum END) AS costs_converted,
        MAX(CASE WHEN a.code='net_income' THEN a.raw_sum  END) AS net_income,
        MAX(CASE WHEN a.code='net_income' THEN a.converted_sum END) AS net_income_converted,
        MAX(d.raw_value)       AS net_debt,
        MAX(d.converted_value) AS net_debt_converted
      FROM annual_sums a
      LEFT JOIN debt_last d ON d.id_edition = a.id_edition
      GROUP BY a.slug, a.name, a.edition_year
      ORDER BY a.edition_year ASC
    `, [id, fromCurrency, toCurrency]);

    return res.json({ fromCurrency, toCurrency, editions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// ─── Lista edições por liga ───────────────────────────────────────────────────

export async function getEditionsByLeague(req, res) {
  const { id } = req.params;
  try {
    const r = await db.query(
      `SELECT id_edition, slug, name, edition_year, currency
       FROM competition_editions
       WHERE id_league = $1 AND active = true
       ORDER BY edition_year DESC`,
      [id]
    );
    return res.json({ editions: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar edições." });
  }
}
