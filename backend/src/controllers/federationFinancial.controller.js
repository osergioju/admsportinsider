import db from "../config/db.js";
import XLSX from "xlsx";

const META_COLS = 4; // cols 0-3: code, level, ?, name (layout clássico)
const SKIP_COL  = 4; // col 4 é template/referência — ignorar

// Status válidos para edition_financials; qualquer outra coisa (ex: linha
// "País-sede" ocupando a posição do status) vira "realizado"
const VALID_STATUS = new Set(["realizado", "previsto", "estimado", "projetado", "orcado", "orçado"]);

// Lista os nomes das abas do arquivo (bookSheets lê só os metadados, sem os dados)
export async function listFederationFinancialSheets(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "Arquivo não enviado." });
    const wb = XLSX.read(req.file.buffer, { type: "buffer", bookSheets: true });
    return res.json({ sheets: wb.SheetNames });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

function parseSheet(buffer, sheetName) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  let usedSheet = sheetName;
  let ws = wb.Sheets[sheetName];
  // Fallback: workbook com uma única aba usa essa aba (ex: "Planilha1")
  if (!ws && wb.SheetNames.length === 1) {
    usedSheet = wb.SheetNames[0];
    ws = wb.Sheets[usedSheet];
  }
  if (!ws) throw new Error(`Sheet "${sheetName}" não encontrada. Disponíveis: ${wb.SheetNames.join(", ")}`);
  return { rows: XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }), usedSheet };
}

// Detecta onde estão as colunas de meta a partir dos cabeçalhos da linha 1
// ("code", "Slug"). Layout clássico: code na col 0, label na col 3.
// Layout alternativo (Público e Renda): code na col 1, label na col 4.
function detectLayout(rows) {
  const headerRow = rows[1] ?? [];
  const findCol = (val) => headerRow.findIndex(c => typeof c === "string" && c.trim().toLowerCase() === val);
  const codeIdx = findCol("code");
  const labelIdx = findCol("slug");
  return {
    codeCol: codeIdx >= 0 ? codeIdx : 0,
    labelCol: labelIdx >= 0 ? labelIdx : 3,
  };
}

function buildEditions(rows, layout) {
  const slugRow    = rows[1];
  const currRow    = rows[2];
  const yearRow    = rows[3];
  const statusRow  = rows[5];
  const editionRow = rows[0];
  const labelCol   = layout?.labelCol ?? 3;

  // Primeira coluna com slug real (contém "_" e não é template)
  let dataStart = -1;
  for (let c = labelCol + 1; c < slugRow.length; c++) {
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
      // Ano da edição: header (linha 0) numérico, senão ano embutido no slug
      let headerYear = null;
      const h = editionRow[c];
      if (typeof h === "number" && h > 1900 && h < 2100) headerYear = h;
      else {
        // Último ano do slug: em ciclos tipo fifa_1999-2002 a edição é a do
        // ano FINAL (Copa de 2002), não o início do ciclo
        const m = String(slug).match(/(19|20)\d{2}/g);
        if (m) headerYear = Number(m[m.length - 1]);
      }
      editions[slug] = { slug, name: null, currency: currRow[c] || "USD", editionYear: headerYear, cols: [], years: [], statuses: [] };
    }
    if (!editions[slug].name) {
      const n = editionRow[c];
      if (n && typeof n === "string") editions[slug].name = n;
    }
    const rawStatus = String(statusRow?.[c] ?? "").toLowerCase().trim();
    editions[slug].cols.push(c);
    editions[slug].years.push(yearRow[c]);
    editions[slug].statuses.push(VALID_STATUS.has(rawStatus) ? rawStatus : "realizado");
  }

  return { editions: Object.values(editions), dataStart };
}

function buildIndicators(rows, layout) {
  const codeCol = layout?.codeCol ?? 0;
  const labelCol = layout?.labelCol ?? 3;
  return rows.slice(7).filter(r => {
    const code = r[codeCol];
    return code && typeof code === "string" && !code.startsWith("#") && code.trim() !== "";
  }).map(r => ({
    code:  r[codeCol].trim(),
    level: r[codeCol + 1] ?? 1,
    name:  r[labelCol] ?? r[codeCol],
    values: r, // full row — values indexed by col
  }));
}

// ─── Preview ──────────────────────────────────────────────────────────────────

export async function previewFederationFinancial(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado." });
    const sheetName = req.body.sheet || "Fifa";
    const id_league = req.body.id_league ? parseInt(req.body.id_league) : null;
    const { rows, usedSheet } = parseSheet(req.file.buffer, sheetName);
    const layout = detectLayout(rows);
    const { editions } = buildEditions(rows, layout);
    const indicators = buildIndicators(rows, layout);

    // Edições existentes: por slug OU por (liga, ano) — evita marcar como "nova"
    // edição que já existe com slug diferente (ex: world-cup_2002 × 2002_south-korea-japan)
    const existingSlugs = new Set();
    const existingYears = new Map(); // edition_year → slug existente
    if (editions.length) {
      const r = await db.query(
        `SELECT slug FROM competition_editions WHERE slug = ANY($1)`,
        [editions.map(e => e.slug)]
      );
      r.rows.forEach(row => existingSlugs.add(row.slug));
      if (id_league) {
        const ry = await db.query(
          `SELECT edition_year, slug FROM competition_editions WHERE id_league = $1`,
          [id_league]
        );
        ry.rows.forEach(row => existingYears.set(row.edition_year, row.slug));
      }
    }

    return res.json({
      sheetName: usedSheet,
      editions: editions.map(e => {
        const matchedByYear = !existingSlugs.has(e.slug) && e.editionYear != null && existingYears.has(e.editionYear);
        return {
          slug: e.slug,
          name: e.name,
          currency: e.currency,
          years: e.years,
          editionYear: e.editionYear,
          exists: existingSlugs.has(e.slug) || matchedByYear,
          matchedSlug: matchedByYear ? existingYears.get(e.editionYear) : null,
          rows: indicators.filter(i => {
            // conta valores não-nulos para essa edição
            return e.cols.some(c => i.values[c] != null && i.values[c] !== "N/A" && i.values[c] !== "");
          }).length,
        };
      }),
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
    const { rows } = parseSheet(req.file.buffer, sheetName);
    const layout = detectLayout(rows);
    const { editions } = buildEditions(rows, layout);
    const indicators = buildIndicators(rows, layout);

    const client = await db.connect();
    let totalRows = 0;
    let teamPrizesSaved = 0;
    let editionIds = {};

    // 0. Classifica as linhas: indicadores normais × linhas por-time (planilha de
    //    premiações usa slug de federação OU de clube como code nas seções "Times")
    const fedRes = await db.query(`
      SELECT f.id_federation, f.slug, f.name, c.name AS country_name
      FROM federations f LEFT JOIN countries c ON c.id_country = f.id_country
    `);
    const normFed = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const fedBySlug = new Map();
    const fedByName = new Map();
    for (const f of fedRes.rows) {
      if (f.slug) fedBySlug.set(f.slug, f.id_federation);
      if (f.name) fedByName.set(normFed(f.name), f.id_federation);
      if (f.country_name && !fedByName.has(normFed(f.country_name))) fedByName.set(normFed(f.country_name), f.id_federation);
    }

    const clubRes = await db.query(`SELECT id_club, slug, name FROM clubs`);
    const clubBySlug = new Map();
    const clubByName = new Map();
    for (const c of clubRes.rows) {
      if (c.slug) clubBySlug.set(c.slug, c.id_club);
      if (c.name) clubByName.set(normFed(c.name), c.id_club);
    }

    // Competição de clubes resolve times como clube primeiro; de seleções, como federação
    let leagueTeamType = "national";
    if (id_league) {
      const tt = await db.query(`SELECT team_type FROM leagues WHERE id_league = $1`, [id_league]);
      leagueTeamType = tt.rows[0]?.team_type || "national";
    }
    const TEAM_SECTIONS = [
      [/prizes-per-team_total$/, "total"],
      [/prizes-per-team_performance$/, "performance"],
      [/prizes-per-team_fixed$/, "fixed"],
      [/standings_per-team$/, "standing"],
    ];
    const finInds = [];       // → financial_indicators / edition_financials
    const teamRows = [];      // → edition_team_prizes
    const teamRowsSkipped = [];
    let currentTeamCategory = null;
    for (const ind of indicators) {
      const section = TEAM_SECTIONS.find(([re]) => re.test(ind.code));
      if (section) { currentTeamCategory = section[1]; finInds.push(ind); continue; }
      // Linha dentro de seção por-time que não é cabeçalho agregado (códigos
      // agregados contêm o prefixo da competição, ex: 'world-cup_...')
      let idFed = fedBySlug.get(ind.code) ?? fedByName.get(normFed(ind.name ?? "")) ?? null;
      let idClub = clubBySlug.get(ind.code) ?? clubByName.get(normFed(ind.name ?? "")) ?? null;
      // Resolve pelo tipo da competição (evita homônimos: seleção Costa Rica × clube Costa Rica EC)
      if (idFed != null && idClub != null) {
        if (leagueTeamType === "clubs") idFed = null; else idClub = null;
      } else if (leagueTeamType === "clubs" && idFed != null && idClub == null) {
        idClub = null; idFed = null; // federação em liga de clubes: não classifica, cai em skipped
      } else if (leagueTeamType !== "clubs" && idClub != null && idFed == null) {
        idClub = null; // clube em liga de seleções: idem
      }
      const isTeamRow = currentTeamCategory != null && (idFed != null || idClub != null || !ind.code.includes("cup_"));
      if (isTeamRow) {
        if (idFed != null || idClub != null) teamRows.push({ idFed, idClub, category: currentTeamCategory, values: ind.values });
        else teamRowsSkipped.push(ind.name ?? ind.code);
        continue;
      }
      finInds.push(ind);
    }

    try {
      await client.query("BEGIN");

      // 1. Bulk upsert dos indicadores — deduplica por código (sem linhas por-time)
      const uniqueInds = Array.from(new Map(finInds.map(i => [i.code, i])).values());
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

      // 2. Resolve edições (poucas, queries simples)
      //    a) slug exato; b) edição existente da mesma liga e ano (evita duplicar
      //       ex: world-cup_2002 quando já existe 2002_south-korea-japan); c) cria
      for (const ed of editions) {
        const editionYear = ed.editionYear
          ?? (ed.years.length ? Math.max(...ed.years.filter(Boolean)) : null);

        const bySlug = await client.query(
          `SELECT id_edition FROM competition_editions WHERE slug = $1`,
          [ed.slug]
        );
        if (bySlug.rows.length) {
          editionIds[ed.slug] = bySlug.rows[0].id_edition;
          await client.query(
            `UPDATE competition_editions
             SET name = COALESCE($1, name),
                 id_league = COALESCE($2, id_league),
                 edition_year = COALESCE($3, edition_year),
                 currency = COALESCE($4, currency)
             WHERE id_edition = $5`,
            [ed.name, id_league, editionYear, ed.currency, bySlug.rows[0].id_edition]
          );
          continue;
        }

        if (id_league && editionYear != null) {
          const byYear = await client.query(
            `SELECT id_edition FROM competition_editions WHERE id_league = $1 AND edition_year = $2`,
            [id_league, editionYear]
          );
          if (byYear.rows.length === 1) {
            // Reusa a edição existente sem sobrescrever slug/nome dela
            editionIds[ed.slug] = byYear.rows[0].id_edition;
            continue;
          }
        }

        const r = await client.query(
          `INSERT INTO competition_editions (slug, name, id_league, edition_year, currency)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id_edition`,
          [ed.slug, ed.name, id_league, editionYear, ed.currency]
        );
        editionIds[ed.slug] = r.rows[0].id_edition;
      }

      // 2b. Premiações por time (federação OU clube) → edition_team_prizes
      const teamPrizeMap = new Map(); // `${id_edition}|fed:X|club:Y` → linha consolidada
      for (const tr of teamRows) {
        for (const ed of editions) {
          const id_edition = editionIds[ed.slug];
          const year = ed.editionYear ?? (ed.years.length ? Math.max(...ed.years.filter(Boolean)) : null);
          const raw = tr.values[ed.cols[0]];
          if (raw == null || raw === "N/A" || raw === "") continue;
          const numVal = typeof raw === "number" ? raw : parseFloat(String(raw).replace(",", "."));
          if (isNaN(numVal)) continue;
          const key = `${id_edition}|fed:${tr.idFed}|club:${tr.idClub}`;
          if (!teamPrizeMap.has(key)) teamPrizeMap.set(key, { id_edition, id_federation: tr.idFed ?? null, id_club: tr.idClub ?? null, year, total: null, performance: null, fixed: null, standing: null });
          teamPrizeMap.get(key)[tr.category] = tr.category === "standing" ? Math.round(numVal) : numVal;
        }
      }
      for (const tp of teamPrizeMap.values()) {
        teamPrizesSaved++;
        const conflictTarget = tp.id_club != null
          ? "(id_edition, id_club) WHERE id_club IS NOT NULL"
          : "(id_edition, id_federation)";
        await client.query(
          `INSERT INTO edition_team_prizes (id_edition, id_federation, id_club, year, total, performance, fixed, standing)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT ${conflictTarget} DO UPDATE SET
             year        = COALESCE(EXCLUDED.year, edition_team_prizes.year),
             total       = COALESCE(EXCLUDED.total, edition_team_prizes.total),
             performance = COALESCE(EXCLUDED.performance, edition_team_prizes.performance),
             fixed       = COALESCE(EXCLUDED.fixed, edition_team_prizes.fixed),
             standing    = COALESCE(EXCLUDED.standing, edition_team_prizes.standing)`,
          [tp.id_edition, tp.id_federation, tp.id_club, tp.year, tp.total, tp.performance, tp.fixed, tp.standing]
        );
      }

      // 3. Monta registros financeiros em memória (apenas indicadores normais)
      const financialRows = [];
      for (const ed of editions) {
        const id_edition = editionIds[ed.slug];
        for (const ind of finInds) {
          const id_indicator = indicatorIdByCode[ind.code];
          if (!id_indicator) continue;
          for (let i = 0; i < ed.cols.length; i++) {
            const raw  = ind.values[ed.cols[i]];
            // Edição de coluna única (Público e Renda): o valor pertence ao ano
            // da edição, mesmo que o "Exercício" fiscal seja outro (ex: Copa 2018
            // com exercício 2015). Múltiplas colunas (balanço FIFA) mantém o ano fiscal.
            const year = (ed.cols.length === 1 && ed.editionYear != null) ? ed.editionYear : ed.years[i];
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
      teamPrizes: teamPrizesSaved,
      teamRowsSkipped: [...new Set(teamRowsSkipped)],
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/leagues/:id/prizes
// Página de Premiações: valores por posição (edition_financials, em milhões USD)
// + premiação por seleção (edition_team_prizes) com federação e bandeira
// ─────────────────────────────────────────────────────────────────────────────
export async function getLeaguePrizes(req, res) {
  const leagueId = Number(req.params.id);
  try {
    // Indicadores de premiação de todas as edições — chave normalizada sem prefixo
    const indRes = await db.query(`
      SELECT fi.code, fi.name_pt, ef.year, SUM(ef.value) AS value
      FROM edition_financials ef
      JOIN competition_editions ce ON ce.id_edition = ef.id_edition
      JOIN financial_indicators fi ON fi.id = ef.id_indicator
      WHERE ce.id_league = $1
        AND (fi.code LIKE '%prizes%' OR fi.code LIKE '%performance-%' OR fi.code LIKE '%preparation-fee%')
      GROUP BY fi.code, fi.name_pt, ef.year
      ORDER BY ef.year
    `, [leagueId]);

    const indicators = {}; // { ano: { 'prizes_total': v, ... } }
    const labels = {};     // { 'performance-champion_per-position': 'Campeão' }
    for (const r of indRes.rows) {
      const key = r.code.includes('_') ? r.code.slice(r.code.indexOf('_') + 1) : r.code;
      if (!indicators[r.year]) indicators[r.year] = {};
      indicators[r.year][key] = parseFloat(r.value);
      if (r.name_pt) labels[key] = r.name_pt;
    }

    // Premiação por time: seleção (federação + bandeira) ou clube (escudo)
    const teamsRes = await db.query(`
      SELECT etp.year, etp.total, etp.performance, etp.fixed, etp.standing,
             f.slug AS federation_slug, f.acronym AS federation_acronym,
             f.name AS federation_name, f.active AS federation_active,
             c.flag_url,
             cl.id_club, cl.slug AS club_slug, cl.name AS club_name, cl.crest_url AS club_crest
      FROM edition_team_prizes etp
      JOIN competition_editions ce ON ce.id_edition = etp.id_edition
      LEFT JOIN federations f ON f.id_federation = etp.id_federation
      LEFT JOIN countries c ON c.id_country = f.id_country
      LEFT JOIN clubs cl ON cl.id_club = etp.id_club
      WHERE ce.id_league = $1
      ORDER BY etp.year, etp.total DESC NULLS LAST
    `, [leagueId]);

    const teams = {}; // { ano: [linhas] }
    for (const t of teamsRes.rows) {
      if (!teams[t.year]) teams[t.year] = [];
      teams[t.year].push({
        federation_slug: t.federation_slug,
        federation_acronym: t.federation_acronym,
        name: t.club_name ?? t.federation_name,
        federation_active: t.federation_active ?? false,
        flag_url: t.club_crest ?? t.flag_url,
        id_club: t.id_club,
        club_slug: t.club_slug,
        total: t.total != null ? parseFloat(t.total) : null,
        performance: t.performance != null ? parseFloat(t.performance) : null,
        fixed: t.fixed != null ? parseFloat(t.fixed) : null,
        standing: t.standing,
      });
    }

    // Edições (nome/sede) para os cabeçalhos
    const edRes = await db.query(`
      SELECT edition_year AS year, name, slug FROM competition_editions
      WHERE id_league = $1 ORDER BY edition_year
    `, [leagueId]);
    const editions = {};
    for (const e of edRes.rows) editions[e.year] = { name: e.name, slug: e.slug };

    const years = [...new Set([...Object.keys(indicators), ...Object.keys(teams)].map(Number))].sort((a, b) => a - b);

    res.json({ years, indicators, labels, teams, editions });
  } catch (err) {
    console.error('[getLeaguePrizes]', err);
    res.status(500).json({ error: 'Erro ao buscar premiações' });
  }
}

// ─── Página de finanças da federação (/dashboard/federations/finance/:slug) ──
// Retorna todas as séries por indicador × ciclo, convertidas por ano.
// Indicadores de fluxo: soma dos anos do ciclo. De estoque (balanço): valor
// do último ano do ciclo. Anos sem taxa de câmbio usam a taxa mais recente.

const OVERVIEW_FLOW_CODES = [
  "revenue", "media", "sponsorship", "merchandising", "matchday", "other_revenue",
  "costs", "events", "development", "governance", "administrative", "wages",
  "net_income",
  "world-cup_media", "other-events_media",
  "world-cup_media-europe", "world-cup_media-asia-africa", "world-cup_media-south-america",
  "world-cup_media-north-america", "world-cup_media-rest-world",
  "world-cup_sponsorship", "other-events_sponsorship",
  "world-cup_sponsorship-partner", "world-cup_sponsorship-sponsor", "world-cup_sponsorship-supporter-supplier",
  "world-cup_ticketing", "other-events_ticketing",
  "world-cup_hospitality", "other-events_hospitality",
  "world-cup_licensing", "other-events_licensing",
  "world-cup_other-revenue", "other-events_other-revenue",
  "intercontinental-cup_other-revenue", "olympic-games_other-revenue",
  "quality-program_other-revenue", "museum_other-revenue",
  "audiovisual-rights_other-revenue", "miscellaneous_other-revenue",
];
const OVERVIEW_STOCK_CODES = [
  "net-debt", "short-term-debt", "long-term-debt",
  "cash-and-financial-applications", "cash", "financial-applications",
];

export async function getFederationFinanceOverview(req, res) {
  const { slug } = req.params;
  const toCurrency = req.query.to || "USD";

  try {
    const fedRow = await db.query(
      `SELECT financial_league_id FROM federations WHERE slug = $1 AND active = true LIMIT 1`,
      [slug]
    );
    if (!fedRow.rows.length) return res.status(404).json({ message: "Federação não encontrada" });

    const id_league = fedRow.rows[0].financial_league_id;
    if (!id_league) return res.json({ editions: [], series: {} });

    const leagueRow = await db.query(`SELECT currency_code FROM leagues WHERE id_league = $1`, [id_league]);
    const fromCurrency = leagueRow.rows[0]?.currency_code || "USD";

    const allCodes = [...OVERVIEW_FLOW_CODES, ...OVERVIEW_STOCK_CODES];

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT DISTINCT ON (EXTRACT(YEAR FROM period)::int)
          EXTRACT(YEAR FROM period)::int AS year, rate
        FROM currency_rates
        WHERE base_currency = $2 AND reference_currency = $3
        ORDER BY EXTRACT(YEAR FROM period)::int, period DESC
      ),
      last_rate AS (
        SELECT rate FROM currency_rates
        WHERE base_currency = $2 AND reference_currency = $3
        ORDER BY period DESC LIMIT 1
      )
      SELECT
        ce.edition_year, ce.slug, ce.name, fi.code,
        SUM(ef.value * COALESCE(r.rate, lr.rate, 1)) AS sum_converted,
        SUM(CASE WHEN ef.year = ce.edition_year
            THEN ef.value * COALESCE(r.rate, lr.rate, 1) ELSE 0 END) AS last_year_converted,
        BOOL_OR(ef.year = ce.edition_year) AS has_last_year
      FROM edition_financials ef
      JOIN competition_editions ce ON ce.id_edition = ef.id_edition
      JOIN financial_indicators fi ON fi.id = ef.id_indicator
      LEFT JOIN rate_cte r ON r.year = ef.year
      LEFT JOIN last_rate lr ON true
      WHERE ce.id_league = $1 AND fi.code = ANY($4)
      GROUP BY ce.edition_year, ce.slug, ce.name, fi.code
      ORDER BY ce.edition_year ASC
    `, [id_league, fromCurrency, toCurrency, allCodes]);

    const stockSet = new Set(OVERVIEW_STOCK_CODES);
    const editionsMap = new Map();
    const series = {};
    for (const row of result.rows) {
      if (!editionsMap.has(row.edition_year)) {
        editionsMap.set(row.edition_year, { slug: row.slug, name: row.name, edition_year: row.edition_year });
      }
      const value = stockSet.has(row.code)
        ? (row.has_last_year ? parseFloat(row.last_year_converted) : null)
        : parseFloat(row.sum_converted);
      if (!series[row.code]) series[row.code] = {};
      series[row.code][row.edition_year] = value;
    }

    return res.json({
      fromCurrency,
      toCurrency,
      editions: [...editionsMap.values()],
      series,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}
