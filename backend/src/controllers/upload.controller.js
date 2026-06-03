import { supabase } from "../utils/supabase.js";
import db from "../config/db.js";
import xlsx from "xlsx";

const CLUBS_START_COL = 4;

// Ajusta os planos, q tá em virghual
function parsePlans(raw) {
  if (raw === null || raw === undefined) return null;

  // Número único
  if (typeof raw === "number") {
    return [raw];
  }

  // String: "1,2,3"
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(p => p.trim())
      .filter(Boolean)
      .map(Number)
      .filter(n => !Number.isNaN(n));
  }

  return null;
}


// Sobe o logo do clube
export async function uploadClubLogo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    const file = req.file;
    const ext = file.originalname.split(".").pop();
    const filename = `club_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("assets")
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao enviar arquivo." });
    }

    const { data: publicUrl } = supabase.storage
      .from("assets")
      .getPublicUrl(filename);

    return res.status(200).json({
      message: "Upload realizado com sucesso!",
      url: publicUrl.publicUrl,
    });

  } catch (error) {
    console.error("Erro no upload:", error);
    return res.status(500).json({ message: "Erro interno no upload." });
  }
}

export async function uploadFederationLogo(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado." });
    const slug = req.body.slug?.trim();
    if (!slug) return res.status(400).json({ message: "Slug da federação é obrigatório." });

    const path = await import("path");
    const fs   = await import("fs");
    const dest = path.default.join(process.cwd(), "uploads", "federacoes");
    const ext  = path.default.extname(req.file.originalname).toLowerCase() || ".webp";
    const finalName = `${slug}${ext}`;
    const finalPath = path.default.join(dest, finalName);

    // Renomeia o arquivo temporário para {slug}.ext
    fs.default.renameSync(req.file.path, finalPath);

    const baseUrl = process.env.UPLOADS_BASE_URL || "https://pro.sportinsider.com.br";
    return res.status(200).json({ url: `${baseUrl}/uploads/federacoes/${finalName}` });
  } catch (error) {
    console.error("Erro no upload de federação:", error);
    return res.status(500).json({ message: "Erro interno no upload." });
  }
}

// Analiza o xlsx pra mapear
export async function analyzeXlsx(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Arquivo não enviado"
      });
    }

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true
    });

    const sheetsAnalysis = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      const rows = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: true
      });

      if (!rows.length) continue;

      const flatCells = rows.flat().filter(v => v !== null);

      // 🔍 Candidatos a ANOS (só sugestão)
      const detectedYears = [...new Set(
        flatCells.filter(v =>
          typeof v === "number" &&
          Number.isInteger(v) &&
          v >= 1900 &&
          v <= 2100
        )
      )].sort();

      sheetsAnalysis.push({
        sheetName,
        totalRows: rows.length,
        totalColumns: rows[0]?.length || 0,
        detectedYears,
      });
    }

    return res.json({
      meta: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalSheets: sheetsAnalysis.length
      },
      sheets: sheetsAnalysis
    });

  } catch (error) {
    console.error("Erro ao analisar XLSX:", error);

    return res.status(500).json({
      message: "Erro ao analisar arquivo XLSX"
    });
  }
}

// Apenas usado pra teste
export async function validateXlsxImport(req, res) {
  try {
    const { sheetName, leagueId } = req.body;
    const years = JSON.parse(req.body.years || "[]");

    if (!sheetName || !leagueId || !Array.isArray(years)) {
      return res.status(400).json({
        message: "Payload inválido"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Arquivo XLSX não enviado"
      });
    }

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true
    });

    const validation = {
      leagueId,
      contextSheet: null,
      yearSheets: [],
      errors: [],
      warnings: []
    };

    // 🔹 Validar sheet de contexto
    const contextSheet = workbook.Sheets[sheetName];

    if (!contextSheet) {
      validation.errors.push(
        `Sheet de contexto '${sheetName}' não encontrada`
      );
    } else {
      validation.contextSheet = {
        name: sheetName,
        rows: xlsx.utils.sheet_to_json(contextSheet, {
          header: 1,
          defval: null
        }).length
      };
    }

    // 🔹 Validar sheets de anos
    for (const year of years) {
      const yearSheet = workbook.Sheets[String(year)];

      if (!yearSheet) {
        validation.errors.push(
          `Sheet do ano '${year}' não encontrada`
        );
        continue;
      }

      const rows = xlsx.utils.sheet_to_json(yearSheet, {
        header: 1,
        defval: null
      });

      if (rows.length < 2) {
        validation.errors.push(
          `Sheet ${year} está vazia ou inválida`
        );
        continue;
      }

      validation.yearSheets.push({
        year,
        rows: rows.length,
        columns: rows[0]?.length || 0
      });
    }

    // 🔹 Diagnóstico final
    validation.isValid =
      validation.errors.length === 0 &&
      validation.contextSheet &&
      validation.yearSheets.length > 0;

    return res.json({
      message: validation.isValid
        ? "Validação concluída com sucesso"
        : "Validação encontrou problemas",
      validation
    });

  } catch (error) {
    console.error("Erro na validação:", error);

    return res.status(500).json({
      message: "Erro ao validar importação"
    });
  }
}


function normalizeStr(s) {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Preview: resolve quais clubes do XLSX já existem no banco (por slug ou nome normalizado)
export async function previewXlsxClubs(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });

    const years = req.body.years ? JSON.parse(req.body.years) : [];
    if (!years.length) return res.status(400).json({ error: "Nenhum ano selecionado" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    // Coleta todos os slugs únicos de todas as abas de ano selecionadas
    const rawSlugsSet = new Set();
    for (const year of years) {
      const sheet = workbook.Sheets[String(year)] ?? workbook.Sheets[`${year - 1}/${year}`];
      if (!sheet) continue;
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
      const slugRow = rows[1] ?? [];
      slugRow.slice(CLUBS_START_COL)
        .filter(v => v != null && v !== "" && normalizeStr(String(v)) !== "slug")
        .map(String)
        .forEach(s => rawSlugsSet.add(s));
    }

    const rawSlugs = [...rawSlugsSet];
    if (!rawSlugs.length) return res.json({ foundClubs: [], notFoundSlugs: [], allClubs: [] });

    // Busca todos os clubes ativos
    const allClubsRes = await db.query(`
      SELECT c.id_club, c.name, c.slug, c.crest_url, co.name AS country_name
      FROM clubs c
      LEFT JOIN countries co ON co.id_country = c.id_country
      WHERE c.active = true
      ORDER BY co.name ASC, c.name ASC
    `);

    // Índices para matching
    const bySlug = new Map(allClubsRes.rows.filter(c => c.slug).map(c => [c.slug, c]));
    const byNorm = new Map(allClubsRes.rows.map(c => [normalizeStr(c.name), c]));

    const foundClubs = [];
    const notFoundSlugs = [];

    for (const raw of rawSlugs) {
      const normRaw = normalizeStr(raw.replace(/_/g, " "));
      const club = bySlug.get(raw) || byNorm.get(normRaw);
      if (club) {
        foundClubs.push({ csvSlug: raw, id_club: club.id_club, name: club.name, crest_url: club.crest_url, country_name: club.country_name });
      } else {
        notFoundSlugs.push(raw);
      }
    }

    // Agrupa todos os clubes por país para o SearchableSelect
    const byCountry = new Map();
    for (const c of allClubsRes.rows) {
      const key = c.country_name ?? "—";
      if (!byCountry.has(key)) byCountry.set(key, []);
      byCountry.get(key).push({ value: String(c.id_club), label: c.name, image: c.crest_url || undefined });
    }
    const allClubsGrouped = [...byCountry.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "pt"))
      .map(([groupLabel, options]) => ({ groupLabel, options }));

    res.json({ foundClubs, notFoundSlugs, allClubsGrouped });
  } catch (err) {
    console.error("[previewXlsxClubs]", err);
    res.status(500).json({ error: "Erro ao analisar clubes" });
  }
}

// FUNÇÃO REAL QUE IMPORTA TUDO
export async function importLeagueCountry(req, res) {
  const client = await db.connect();

  try {
    const { sheetName, leagueId } = req.body;
    const selectedYears = req.body.years
      ? JSON.parse(req.body.years)
      : [];
    // onlyClubs=true → pula leitura/importação da aba de liga, importa só club_financials dos anos
    const onlyClubs = req.body.onlyClubs === "true" || req.body.onlyClubs === true;

    if (!leagueId) {
      return res.status(400).json({ message: "leagueId é obrigatório" });
    }
    if (!onlyClubs && !sheetName) {
      return res.status(400).json({ message: "sheetName é obrigatório quando onlyClubs não está ativo" });
    }

    // selectedYears vazio = importar apenas dados da liga (sem abas de temporada)

    if (!req.file) {
      return res.status(400).json({
        message: "Arquivo XLSX não enviado"
      });
    }

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true
    });

    console.log(`[import] sheetName="${sheetName}" leagueId=${leagueId} selectedYears=${JSON.stringify(selectedYears)} onlyClubs=${onlyClubs}`);
    console.log(`[import] abas no arquivo: ${workbook.SheetNames.join(", ")}`);

    // Quando onlyClubs=true, pulamos toda a leitura da aba de liga
    const leagueSheet = onlyClubs ? null : workbook.Sheets[sheetName];
    if (!onlyClubs && !leagueSheet) {
      return res.status(400).json({
        message: `Sheet '${sheetName}' não encontrada`
      });
    }

    const leagueRows = leagueSheet
      ? xlsx.utils.sheet_to_json(leagueSheet, { header: 1, defval: null })
      : [];

    const headerRow = leagueRows[0] ?? [];

    // Detecta offset de colunas (só relevante quando há aba de liga)
    const headerRow1 = leagueRows[1] || [];
    const colOffset = (headerRow1[0] == null) ? 1 : 0;
    if (!onlyClubs) console.log(`[import] aba liga "${sheetName}": colOffset=${colOffset}`);

    // Lê linhas de metadados: label na col (3+offset), valores a partir de (4+offset)
    const exercicioRow = leagueRows.find(r => r[3 + colOffset] === "Exercício");
    const moedaRow     = leagueRows.find(r => r[3 + colOffset] === "Moeda");

    const leagueYears = leagueRows.length
      ? ((exercicioRow ?? headerRow) ?? []).slice(4 + colOffset).filter(v => typeof v === "number" && Number.isInteger(v))
      : [];

    if (!onlyClubs) console.log(`[import] aba liga "${sheetName}": ${leagueRows.length} linhas, anos detectados: ${JSON.stringify(leagueYears)}`);

    const currencyCode = moedaRow
      ? (moedaRow.slice(4 + colOffset).find(v => v && typeof v === "string") ?? null)
      : null;

    await client.query("BEGIN");

    // ======================================================
    // CACHE GLOBAL DE INDICADORES
    // ======================================================
    const indicatorIdByCode = {};

    // Linhas de metadados da liga (sem código próprio) mapeadas por label
    const LEAGUE_META_CODES = {
      "Número de clubes":         { code: "num_clubs",             name_pt: "Número de clubes",           level: 0 },
      "Balanços registrados":     { code: "registered_balances",   name_pt: "Balanços registrados",       level: 0 },
      "Balanços registrados (%)": { code: "registered_pct",        name_pt: "Balanços registrados (%)",   level: 0 },
    };

    // ======================================================
    // 1️⃣ BULK UPSERT — INDICADORES DA LIGA
    // ======================================================
    const leagueIndicatorRows = [];
    const seenIndicatorCodes = new Set();

    for (let i = 1; i < leagueRows.length; i++) {
      const row = leagueRows[i];
      // colOffset=0 (Suíça): col0=code, col1=level, col2=plans, col3=name_pt, col4+=values
      // colOffset=1 (Colômbia): col0=null, col1=code, col2=level, col3=plans, col4=name_pt, col5+=values
      const code    = row[colOffset];
      const level   = row[colOffset + 1];
      const plans   = parsePlans(row[colOffset + 2]);
      const name_pt = row[colOffset + 3];

      // Linhas de metadados (sem código): mapear pelo label
      if (!code && name_pt && LEAGUE_META_CODES[name_pt]) {
        const meta = LEAGUE_META_CODES[name_pt];
        if (!seenIndicatorCodes.has(meta.code)) {
          seenIndicatorCodes.add(meta.code);
          leagueIndicatorRows.push([meta.code, meta.name_pt, meta.level, []]);
        }
        continue;
      }

      if (!code || typeof code !== "string" || !name_pt) continue;
      if (level == null || typeof level !== "number" || !Number.isInteger(level)) continue;
      if (seenIndicatorCodes.has(code)) continue;
      seenIndicatorCodes.add(code);

      leagueIndicatorRows.push([code, name_pt, level, plans]);
    }

    console.log(`[import] indicadores da liga: ${leagueIndicatorRows.length}`);
    if (leagueIndicatorRows.length > 0) {
      const values = leagueIndicatorRows
        .map((_, i) => `($${i * 4 + 1},$${i * 4 + 2},$${i * 4 + 3},$${i * 4 + 4})`)
        .join(",");

      const result = await client.query(
        `INSERT INTO financial_indicators (code, name_pt, level, plans)
         VALUES ${values}
         ON CONFLICT (code) DO UPDATE SET
           name_pt = EXCLUDED.name_pt,
           level   = EXCLUDED.level,
           plans   = EXCLUDED.plans
         RETURNING id, code`,
        leagueIndicatorRows.flat()
      );

      for (const r of result.rows) {
        indicatorIdByCode[r.code] = r.id;
      }
    }

    // ======================================================
    // 2️⃣ BULK INSERT — LEAGUE_FINANCIALS
    // ======================================================
    const leagueFinancialRows = [];
    const seenFinancialKeys = new Set();

    for (let i = 1; i < leagueRows.length; i++) {
      const row = leagueRows[i];
      let code = row[colOffset];

      // Linhas de metadados sem código próprio
      if (!code && row[3 + colOffset] && LEAGUE_META_CODES[row[3 + colOffset]]) {
        code = LEAGUE_META_CODES[row[3 + colOffset]].code;
      }

      if (!code || typeof code !== "string") continue;

      const id_indicator = indicatorIdByCode[code];
      if (!id_indicator) continue;

      for (let idx = 0; idx < leagueYears.length; idx++) {
        const year = leagueYears[idx];
        const value = row[4 + colOffset + idx]; // valores a partir de col (4+offset)
        if (value == null || typeof value === "string" && !value.trim()) continue;
        const numVal = typeof value === "number" ? value : Number(String(value).replace(/[%.]/g, "").replace(",", "."));
        if (isNaN(numVal)) continue;

        const key = `${id_indicator}|${year}`;
        if (seenFinancialKeys.has(key)) continue;
        seenFinancialKeys.add(key);

        leagueFinancialRows.push([leagueId, id_indicator, year, numVal]);
      }
    }

    console.log(`[import] linhas financeiras da liga: ${leagueFinancialRows.length}`);
    if (leagueFinancialRows.length > 0) {
      const values = leagueFinancialRows
        .map((_, i) => `($${i * 4 + 1},$${i * 4 + 2},$${i * 4 + 3},$${i * 4 + 4})`)
        .join(",");

      await client.query(
        `INSERT INTO league_financials (id_league, id_indicator, year, value)
         VALUES ${values}
         ON CONFLICT (id_league, id_indicator, year) DO UPDATE SET value = EXCLUDED.value`,
        leagueFinancialRows.flat()
      );
    }

    // Persiste o código de moeda na liga (lido da linha "Moeda" da planilha)
    if (currencyCode) {
      await client.query(
        `UPDATE leagues SET currency_code = $1 WHERE id_league = $2`,
        [currencyCode, leagueId]
      );
    }

    // ======================================================
    // HELPER — upsert indicador de clube (usa cache compartilhado)
    // ======================================================
    async function resolveClubIndicator(dbClient, row, cache) {
      // Colômbia: code em col 0; Suíça: null em col 0, code em col 1
      const off = (row[0] != null && typeof row[0] === "string") ? 0 : 1;
      const code    = row[off];
      const level   = row[off + 1] ?? 1;
      const plan    = row[off + 2];
      const name_pt = row[off + 3] || row[off];

      if (!code || typeof code !== "string") return null;
      if (cache[code]) return cache[code];

      const result = await dbClient.query(
        `INSERT INTO financial_indicators (code, name_pt, level, plans)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET
           name_pt = EXCLUDED.name_pt,
           level   = EXCLUDED.level,
           plans   = EXCLUDED.plans
         RETURNING id`,
        [code, name_pt || code, level, plan ? [plan] : []]
      );

      cache[code] = result.rows[0].id;
      return cache[code];
    }

    // ======================================================
    // 3️⃣ CLUBES / SEASONS / FINANCIALS
    // ======================================================
    const DATA_START_ROW = 7;

    // clubMappings: { csvSlug: id_club } — fornecido pelo front para slugs não encontrados
    const clubMappings = req.body.clubMappings ? JSON.parse(req.body.clubMappings) : {};

    for (const year of selectedYears) {
      const sheetKey = workbook.SheetNames.find(n => n === String(year) || n === `${year - 1}/${year}`);
      console.log(`[import] ano ${year}: procurando aba "${year}" ou "${year - 1}/${year}" → ${sheetKey ? `encontrada ("${sheetKey}")` : "NÃO ENCONTRADA"}`);
      const sheet = sheetKey ? workbook.Sheets[sheetKey] : null;
      if (!sheet) continue;

      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

      // Mapeia coluna → slug diretamente da linha de header (evita offset quando
      // há células de label antes dos clubes, como a coluna "Slug" em col 4)
      const colToSlug = {};
      for (let col = CLUBS_START_COL; col < rows[1].length; col++) {
        const val = rows[1][col];
        if (val != null && val !== "" && normalizeStr(String(val)) !== "slug") {
          colToSlug[col] = String(val);
        }
      }
      const clubSlugs = Object.values(colToSlug);
      console.log(`[import] ano ${year}: ${clubSlugs.length} slugs na aba → ${JSON.stringify(clubSlugs.slice(0, 5))}${clubSlugs.length > 5 ? "..." : ""}`);
      console.log(`[import] ano ${year}: primeiras linhas a partir de DATA_START_ROW (cols 0-4):`);
      for (let i = DATA_START_ROW; i < Math.min(DATA_START_ROW + 4, rows.length); i++) {
        console.log(`  row[${i}]:`, JSON.stringify(rows[i]?.slice(0, 5)));
      }

      // --- Resolve clubs: slug exato → nome normalizado → mapeamento manual → skip
      const allClubsRes = await client.query(
        `SELECT id_club, name, slug FROM clubs WHERE active = true`
      );
      const bySlug = new Map(allClubsRes.rows.filter(c => c.slug).map(c => [c.slug, c.id_club]));
      const byNorm = new Map(allClubsRes.rows.map(c => [normalizeStr(c.name), c.id_club]));

      const clubIdBySlug = {};
      const notFound = [];
      for (const slug of clubSlugs) {
        const normSlug = normalizeStr(slug.replace(/_/g, " "));
        const id = bySlug.get(slug) || byNorm.get(normSlug) || (clubMappings[slug] ? Number(clubMappings[slug]) : null);
        if (id) clubIdBySlug[slug] = id;
        else notFound.push(slug);
      }
      console.log(`[import] ano ${year}: ${Object.keys(clubIdBySlug).length} clubes resolvidos, ${notFound.length} não encontrados${notFound.length ? ` → ${JSON.stringify(notFound.slice(0, 5))}` : ""}`);

      // --- Bulk upsert club_seasons ---
      const divisionRow = rows[3];
      const clubSeasonRows = [];

      for (let col = CLUBS_START_COL; col < divisionRow.length; col++) {
        const slug = colToSlug[col];
        const division = divisionRow[col];
        const id_club = slug ? clubIdBySlug[slug] : null;
        if (!id_club || !division) continue;
        clubSeasonRows.push([id_club, leagueId, year, String(division)]);
      }

      if (clubSeasonRows.length > 0) {
        const values = clubSeasonRows
          .map((_, i) => `($${i * 4 + 1},$${i * 4 + 2},$${i * 4 + 3},$${i * 4 + 4})`)
          .join(",");

        await client.query(
          `INSERT INTO club_seasons (id_club, id_league, year, division)
           VALUES ${values}
           ON CONFLICT (id_club, id_league, year) DO UPDATE SET division = EXCLUDED.division`,
          clubSeasonRows.flat()
        );
      }

      console.log(`[import] ano ${year}: ${clubSeasonRows.length} club_seasons para gravar`);

      // --- Bulk upsert club_financials ---
      const clubFinancialRows = [];

      for (let i = DATA_START_ROW; i < rows.length; i++) {
        const row = rows[i];

        const id_indicator = await resolveClubIndicator(client, row, indicatorIdByCode);
        if (!id_indicator) continue;

        for (let col = CLUBS_START_COL; col < row.length; col++) {
          const slug = colToSlug[col];
          const id_club = slug ? clubIdBySlug[slug] : null;
          if (!id_club) continue;

          const rawValue = row[col];
          let value = null;

          if (typeof rawValue === "number") {
            value = rawValue;
          } else if (typeof rawValue === "string" && rawValue.trim()) {
            value = Number(rawValue.replace(/\./g, "").replace(",", "."));
          }

          if (value === null || Number.isNaN(value)) continue;

          clubFinancialRows.push([id_club, id_indicator, year, value]);
        }
      }

      console.log(`[import] ano ${year}: ${clubFinancialRows.length} linhas de club_financials coletadas`);
      if (clubFinancialRows.length > 0) {
        // deduplicate: keep last value for each (id_club, id_indicator, year)
        const dedupMap = new Map();
        for (const r of clubFinancialRows) dedupMap.set(`${r[0]}|${r[1]}|${r[2]}`, r);
        const dedupedRows = [...dedupMap.values()];

        // chunk to avoid parameter limit (~65535 params)
        const CHUNK_SIZE = 500;
        for (let s = 0; s < dedupedRows.length; s += CHUNK_SIZE) {
          const batch = dedupedRows.slice(s, s + CHUNK_SIZE);
          const values = batch
            .map((_, i) => `($${i * 4 + 1},$${i * 4 + 2},$${i * 4 + 3},$${i * 4 + 4})`)
            .join(",");

          await client.query(
            `INSERT INTO club_financials (id_club, id_indicator, year, value)
             VALUES ${values}
             ON CONFLICT (id_club, id_indicator, year) DO UPDATE SET value = EXCLUDED.value`,
            batch.flat()
          );
        }
      }
    }

    await client.query("COMMIT");

    return res.json({
      message: "Importação completa concluída com sucesso",
      yearsImported: selectedYears
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Erro na importação:", error);

    return res.status(500).json({
      message: "Erro ao importar dados"
    });

  } finally {
    client.release();
  }
}


function humanizeSlug(slug) {
  return String(slug)
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}
/*
export async function importLeagueBalance(req, res) {
    const { leagueId } = req.body;

    if (!leagueId) {
        return res.status(400).json({ message: "leagueId é obrigatório." });
    }

    if (!req.file) {
        return res.status(400).json({ message: "Arquivo XLSX não enviado." });
    }

    try {
        // 1) Ler buffer do XLSX
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

        // Resumos da importação
        let createdIndicators = 0;
        let updatedIndicators = 0;
        let insertedValues = 0;

        for (const row of rows) {
            
            const { name, code, category, level } = row;

            if (!code) continue;  
            
            // =====================================================================
            // 1) Criar ou atualizar indicador
            // =====================================================================
            const findIndicator = await db.query(
                `SELECT id FROM financial_indicators WHERE code = $1`,
                [code]
            );

            let indicatorId;
            
            if (findIndicator.rows.length === 0) {
                // Criar indicador novo
                const insert = await db.query(
                    `INSERT INTO financial_indicators (code, name_pt, category, level)
                     VALUES ($1, $2, $3, $4)
                     RETURNING id`,
                    [code, name, category, level]
                );
                indicatorId = insert.rows[0].id;
                createdIndicators++;

            } else {
                // Atualizar (se admin mudou)
                indicatorId = findIndicator.rows[0].id;

                await db.query(
                    `UPDATE financial_indicators
                     SET name_pt = $1, category = $2, level = $3
                     WHERE id = $4`,
                    [name, category, level, indicatorId]
                );

                updatedIndicators++;
            }

            // =====================================================================
            // 2) Inserir valores por ano: year_2023, year_2024, year_2025...
            // =====================================================================

            const yearColumns = Object.keys(row).filter(key => key.startsWith("year_"));

            for (const col of yearColumns) {
                const year = parseInt(col.replace("year_", ""));
                const value = row[col];

                if (value !== "" && value !== undefined && !isNaN(value)) {
                    await db.query(
                        `INSERT INTO league_financials (id_league, id_indicator, year, value)
                         VALUES ($1, $2, $3, $4)`,
                        [leagueId, indicatorId, year, value]
                    );
                    insertedValues++;
                }
            }
        }

        return res.json({
            message: "Importação concluída com sucesso!",
            summary: {
                createdIndicators,
                updatedIndicators,
                insertedValues,
                totalRows: rows.length
            }
        });

    } catch (err) {
        console.error("Erro ao importar XLSX:", err);
        return res.status(500).json({ message: "Erro ao processar arquivo XLSX." });
    }
}


export async function importClubBalance(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Arquivo XLSX não enviado." });
  }

  let createdIndicators = 0;
  let updatedIndicators = 0;
  let insertedValues = 0;
  let skippedRows = 0;

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    await db.query("BEGIN");

    for (const row of rows) {
      const {
        name_PT,
        name_EN,
        club_slug,
        level,
        code,
        category
      } = row;

      if (!club_slug || !code) {
        skippedRows++;
        continue;
      }

      // 1) Resolver clube
      const clubResult = await db.query(
        `SELECT id_club FROM clubs WHERE slug = $1`,
        [club_slug]
      );

      if (clubResult.rows.length === 0) {
        skippedRows++;
        continue;
      }

      const clubId = clubResult.rows[0].id_club;

      // 2) Criar ou buscar indicador
      const indicatorResult = await db.query(
        `SELECT id, name_pt, name_en, category, level
         FROM financial_indicators
         WHERE code = $1`,
        [code]
      );

      let indicatorId;

      if (indicatorResult.rows.length === 0) {
        const insert = await db.query(
          `INSERT INTO financial_indicators
           (code, name_pt, name_en, category, level)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [code, name_PT, name_EN, category, level]
        );

        indicatorId = insert.rows[0].id;
        createdIndicators++;

      } else {
        const indicator = indicatorResult.rows[0];
        indicatorId = indicator.id;

        // Só atualiza se mudou algo
        if (
          indicator.name_pt !== name_PT ||
          indicator.name_en !== name_EN ||
          indicator.category !== category ||
          indicator.level !== level
        ) {
          await db.query(
            `UPDATE financial_indicators
             SET name_pt = $1,
                 name_en = $2,
                 category = $3,
                 level = $4,
                 updated_at = NOW()
             WHERE id = $5`,
            [name_PT, name_EN, category, level, indicatorId]
          );

          updatedIndicators++;
        }
      }

      // 3) Inserir valores por ano
      const yearColumns = Object.keys(row).filter(k =>
        k.startsWith("year_")
      );
      for (const col of yearColumns) {
        const year = Number(col.replace("year_", ""));
        const value = row[col];

        if (value === "" || isNaN(value)) continue;

        await db.query(
          `INSERT INTO club_financials
           (id_club, id_indicator, year, value)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id_club, id_indicator, year)
           DO UPDATE SET
             value = EXCLUDED.value,
             updated_at = NOW()`,
          [clubId, indicatorId, year, value]
        );

        insertedValues++;
      }
    }

    await db.query("COMMIT");

    return res.json({
      message: "Importação de clubes concluída com sucesso!",
      summary: {
        totalRows: rows.length,
        createdIndicators,
        updatedIndicators,
        insertedValues,
        skippedRows
      }
    });

  } catch (error) {
    await db.query("ROLLBACK");
    console.error("ERRO REAL DA IMPORTAÇÃO:", error);

    return res.status(500).json({
      message: "Erro ao processar arquivo XLSX.",
      error: error.message // pode remover em produção
    });
  }
}
*/

export async function importCompetitionStats(req, res) {
  const client = await db.connect();

  try {
    const { competitionId, seasonYear, sheetName } = req.body;

    if (!competitionId || !seasonYear || !sheetName) {
      return res.status(400).json({
        message: "competitionId, seasonYear e sheetName são obrigatórios"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Arquivo não enviado"
      });
    }

    const fileName = req.file.originalname.toLowerCase();
    const isCSV = fileName.endsWith(".csv");

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      raw: false,
      FS: isCSV ? ";" : undefined
    });

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return res.status(400).json({
        message: `Sheet '${sheetName}' não encontrada`
      });
    }

    const rows = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null
    });

    if (rows.length <= 1) {
      return res.status(400).json({
        message: "Planilha sem dados"
      });
    }

    await client.query("BEGIN");

    // --------------------------------------------------
    // 1️⃣ Garantir Season
    // --------------------------------------------------
    const seasonResult = await client.query(
      `
      INSERT INTO seasons (year)
      VALUES ($1)
      ON CONFLICT (year)
      DO UPDATE SET year = EXCLUDED.year
      RETURNING id_season
      `,
      [seasonYear]
    );

    const id_season = seasonResult.rows[0].id_season;

    // --------------------------------------------------
    // 2️⃣ Garantir League_Season
    // --------------------------------------------------
    const compSeasonResult = await client.query(
      `
      INSERT INTO competition_seasons (id_league, id_season)
      VALUES ($1, $2)
      ON CONFLICT (id_league, id_season)
      DO UPDATE SET id_league = EXCLUDED.id_league
      RETURNING id_competition_season
      `,
      [competitionId, id_season]
    );

    const id_competition_season =
      compSeasonResult.rows[0].id_competition_season;

    // 🔥 Limpar dados antigos da temporada
    await client.query(
      `DELETE FROM club_competition_stats WHERE id_competition_season = $1`,
      [id_competition_season]
    );

    // --------------------------------------------------
    // 3️⃣ Cache de clubes (MUITO MAIS RÁPIDO)
    // --------------------------------------------------
    const clubsResult = await client.query(
      `SELECT id_club, LOWER(name) as name FROM clubs`
    );

    const clubMap = {};
    for (const c of clubsResult.rows) {
      clubMap[c.name] = c.id_club;
    }

    // --------------------------------------------------
    // 4️⃣ Mapear header
    // --------------------------------------------------
    const header = rows[0];

    const colIndex = (colName) => {
      const index = header.indexOf(colName);
      if (index === -1) {
        throw new Error(`Coluna não encontrada: ${colName}`);
      }
      return index;
    };

    // --------------------------------------------------
    // 5️⃣ Loop nas linhas
    // --------------------------------------------------
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const clubName = row[colIndex("team_name")];
      if (!clubName) continue;

      const id_club = clubMap[clubName.toLowerCase()];

      if (!id_club) {
        console.warn(`Clube não encontrado: ${clubName}`);
        continue;
      }

      await client.query(
        `
        INSERT INTO club_competition_stats
          (
            id_competition_season,
            id_club,
            position_total,
            position_home,
            position_away,
            points,
            matches_total,
            matches_home,
            matches_away,
            wins_total,
            wins_home,
            wins_away,
            draws_total,
            draws_home,
            draws_away,
            losses_total,
            losses_home,
            losses_away,
            goals_for_total,
            goals_for_home,
            goals_for_away,
            goals_against_total,
            goals_against_home,
            goals_against_away,
            goal_difference,
            shots_total,
            shots_on_target_total,
            possession_total,
            clean_sheets_total,
            fouls_total
          )
        VALUES
          (
            $1,$2,
            $3,$4,$5,
            $6,$7,$8,$9,
            $10,$11,$12,
            $13,$14,$15,
            $16,$17,$18,
            $19,$20,$21,
            $22,$23,$24,
            $25,$26,$27,$28,$29,$30
          )
        `,
        [
          id_competition_season,
          id_club,

          parseInt(row[colIndex("league_position")]) || 0,
          parseInt(row[colIndex("league_position_home")]) || 0,
          parseInt(row[colIndex("league_position_away")]) || 0,

          Math.round(
            (parseFloat(row[colIndex("points_per_game")]) || 0) *
            (parseInt(row[colIndex("matches_played")]) || 0)
          ),

          parseInt(row[colIndex("matches_played")]) || 0,
          parseInt(row[colIndex("matches_played_home")]) || 0,
          parseInt(row[colIndex("matches_played_away")]) || 0,

          parseInt(row[colIndex("wins")]) || 0,
          parseInt(row[colIndex("wins_home")]) || 0,
          parseInt(row[colIndex("wins_away")]) || 0,

          parseInt(row[colIndex("draws")]) || 0,
          parseInt(row[colIndex("draws_home")]) || 0,
          parseInt(row[colIndex("draws_away")]) || 0,

          parseInt(row[colIndex("losses")]) || 0,
          parseInt(row[colIndex("losses_home")]) || 0,
          parseInt(row[colIndex("losses_away")]) || 0,

          parseInt(row[colIndex("goals_scored")]) || 0,
          parseInt(row[colIndex("goals_scored_home")]) || 0,
          parseInt(row[colIndex("goals_scored_away")]) || 0,

          parseInt(row[colIndex("goals_conceded")]) || 0,
          parseInt(row[colIndex("goals_conceded_home")]) || 0,
          parseInt(row[colIndex("goals_conceded_away")]) || 0,

          parseInt(row[colIndex("goal_difference")]) || 0,
          parseInt(row[colIndex("shots")]) || 0,
          parseInt(row[colIndex("shots_on_target")]) || 0,
          parseFloat(row[colIndex("average_possession")]) || 0,
          parseInt(row[colIndex("clean_sheets")]) || 0,
          parseInt(row[colIndex("fouls")]) || 0
        ]
      );
    }

    // 🔥 COMMIT DEPOIS DO LOOP
    await client.query("COMMIT");

    return res.json({
      message: "Estatísticas importadas com sucesso"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Erro:", error);

    return res.status(500).json({
      message: "Erro ao importar estatísticas"
    });
  } finally {
    client.release();
  }
}

export async function importPlayerStats(req, res) {
  const client = await db.connect();

  try {
    const { competitionId, seasonYear, sheetName } = req.body;

    if (!competitionId || !seasonYear || !sheetName) {
      return res.status(400).json({
        message: "competitionId, seasonYear e sheetName são obrigatórios"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Arquivo XLSX não enviado"
      });
    }

    const fileName = req.file.originalname.toLowerCase();
    const isCSV = fileName.endsWith(".csv");

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      raw: false,
      FS: isCSV ? ";" : undefined // importante se CSV usa ;
    });
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return res.status(400).json({
        message: `Sheet '${sheetName}' não encontrada`
      });
    }

    const rows = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null
    });

    await client.query("BEGIN");

    // pegar competition_season
    const seasonResult = await client.query(
      `SELECT cs.id_competition_season
       FROM competition_seasons cs
       JOIN seasons s ON s.id_season = cs.id_season
       WHERE cs.id_competition = $1 AND s.year = $2`,
      [competitionId, seasonYear]
    );

    if (!seasonResult.rowCount) {
      throw new Error("Competition season não encontrada");
    }

    const id_competition_season =
      seasonResult.rows[0].id_competition_season;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const playerName = row[0];
      const clubName = row[1];

      if (!playerName || !clubName) continue;

      // criar jogador se não existir
      const playerResult = await client.query(
        `
        INSERT INTO players (full_name)
        VALUES ($1)
        ON CONFLICT (full_name)
        DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id_player
        `,
        [playerName]
      );

      const id_player = playerResult.rows[0].id_player;

      const clubResult = await client.query(
        `SELECT id_club FROM clubs WHERE LOWER(name) = LOWER($1)`,
        [clubName]
      );

      if (!clubResult.rowCount) continue;

      const id_club = clubResult.rows[0].id_club;

      await client.query(
        `
        INSERT INTO player_season_stats
          (
            id_player,
            id_club,
            id_competition_season,
            goals_total,
            assists_total,
            minutes_total,
            yellow_cards,
            red_cards
          )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id_player, id_club, id_competition_season)
        DO UPDATE SET
          goals_total = EXCLUDED.goals_total,
          assists_total = EXCLUDED.assists_total,
          minutes_total = EXCLUDED.minutes_total,
          yellow_cards = EXCLUDED.yellow_cards,
          red_cards = EXCLUDED.red_cards
        `,
        [
          id_player,
          id_club,
          id_competition_season,
          row[2],  // gols
          row[3],  // assistências
          row[4],  // minutos
          row[5],  // amarelos
          row[6]   // vermelhos
        ]
      );
    }

    await client.query("COMMIT");

    return res.json({
      message: "Player stats importado com sucesso"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      message: "Erro ao importar player stats"
    });
  } finally {
    client.release();
  }
}

export async function importMatchStats(req, res) {
  const client = await db.connect();

  try {
    const { competitionId, seasonYear, sheetName } = req.body;

    if (!competitionId || !seasonYear || !sheetName) {
      return res.status(400).json({
        message: "competitionId, seasonYear e sheetName são obrigatórios"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Arquivo XLSX não enviado"
      });
    }

    const fileName = req.file.originalname.toLowerCase();
    const isCSV = fileName.endsWith(".csv");

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      raw: false,
      FS: isCSV ? ";" : undefined // importante se CSV usa ;
    });
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return res.status(400).json({
        message: `Sheet '${sheetName}' não encontrada`
      });
    }

    const rows = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null
    });

    await client.query("BEGIN");

    // --------------------------------------------------
    // 1️⃣ Buscar competition_season
    // --------------------------------------------------
    const seasonResult = await client.query(
      `
      SELECT cs.id_competition_season
      FROM competition_seasons cs
      JOIN seasons s ON s.id_season = cs.id_season
      WHERE cs.id_competition = $1
        AND s.year = $2
      `,
      [competitionId, seasonYear]
    );

    if (!seasonResult.rowCount) {
      throw new Error("Competition season não encontrada");
    }

    const id_competition_season =
      seasonResult.rows[0].id_competition_season;

    // 🔥 limpar antes de importar (temporada fechada)
    await client.query(
      `DELETE FROM matches WHERE id_competition_season = $1`,
      [id_competition_season]
    );

    // --------------------------------------------------
    // 2️⃣ Cache de clubes
    // --------------------------------------------------
    const clubsResult = await client.query(
      `SELECT id_club, LOWER(name) as name FROM clubs`
    );

    const clubMap = {};
    for (const c of clubsResult.rows) {
      clubMap[c.name] = c.id_club;
    }

    // --------------------------------------------------
    // 3️⃣ Loop nas partidas
    // --------------------------------------------------
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const homeName = row[4];  // coluna Mandante
      const awayName = row[5];  // coluna Visitante

      if (!homeName || !awayName) continue;

      const id_home = clubMap[homeName.toLowerCase()];
      const id_away = clubMap[awayName.toLowerCase()];

      if (!id_home || !id_away) continue;

      await client.query(
        `
        INSERT INTO matches (
          id_competition_season,
          match_date,
          stadium,
          referee,
          id_home_club,
          id_away_club,
          home_goals,
          away_goals,
          home_shots,
          away_shots,
          home_shots_on_target,
          away_shots_on_target,
          home_possession,
          away_possession,
          home_xg,
          away_xg,
          home_fouls,
          away_fouls,
          home_yellow,
          away_yellow,
          home_red,
          away_red,
          attendance
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,
          $19,$20,$21,$22,$23
        )
        `,
        [
          id_competition_season,
          row[1],  // data
          row[65], // estádio (ajuste conforme coluna real)
          row[6],  // árbitro
          id_home,
          id_away,
          row[12], // gols casa
          row[13], // gols fora
          row[30], // chutes casa
          row[31], // chutes fora
          row[32], // chutes gol casa
          row[33], // chutes gol fora
          row[38], // posse casa
          row[39], // posse fora
          row[40], // xg casa
          row[41], // xg fora
          row[34], // faltas casa
          row[35], // faltas fora
          row[22], // amarelos casa
          row[24], // amarelos fora
          row[23], // vermelhos casa
          row[25], // vermelhos fora
          row[3]   // público
        ]
      );
    }

    await client.query("COMMIT");

    return res.json({
      message: "Match stats importado com sucesso"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);

    return res.status(500).json({
      message: "Erro ao importar partidas"
    });

  } finally {
    client.release();
  }
}