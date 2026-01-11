import { supabase } from "../utils/supabase.js";
import { db } from "../config/db.js";
import xlsx from "xlsx";
import slugify from "slugify";

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

export async function importLeagueCountry(req, res) {
  const client = await db.connect();

  try {
    const { sheetName, leagueId } = req.body;

    if (!sheetName || !leagueId) {
      return res.status(400).json({
        message: "sheetName e leagueId são obrigatórios"
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

    // 🔹 HEADER (linha 1)
    const headerRow = rows[0];
    const years = headerRow
      .slice(5)
      .filter(v =>
        typeof v === "number" &&
        Number.isInteger(v)
      );

    if (!years.length) {
      return res.status(400).json({
        message: "Nenhum ano válido encontrado no header"
      });
    }

    await client.query("BEGIN");

    // ===============================
    // 1️⃣ UPSERT FINANCIAL_INDICATORS
    // ===============================
    const indicatorIdByCode = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const name_pt = row[0];
      const category = row[1];
      const rawPlan = row[2];
      const plans = parsePlans(rawPlan);

      const level = row[3];

      if (
        !name_pt ||
        typeof name_pt !== "string" ||
        category === null ||
        plans === null ||
        plans.length === 0 ||
        level === null
      ) {
        continue;
      }

      const code = slugify(name_pt, {
        lower: true,
        strict: true
      }).replace(/-/g, "_");

      if (indicatorIdByCode[code]) continue;

      const result = await client.query(
        `
        INSERT INTO financial_indicators
          (code, name_pt, category, plans, level)
        VALUES
          ($1, $2, $3, $4, $5)
        ON CONFLICT (code)
        DO UPDATE SET
          name_pt = EXCLUDED.name_pt,
          category = EXCLUDED.category,
          plans = EXCLUDED.plans,
          level = EXCLUDED.level
        RETURNING id
        `,
        [code, name_pt, category, plans, level]
      );

      indicatorIdByCode[code] = result.rows[0].id;
    }

    // ===============================
    // 2️⃣ INSERT / UPDATE LEAGUE_FINANCIALS
    // ===============================
    let insertedRows = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const name_pt = row[0];
      const category = row[1];
      const plan = row[2];
      const level = row[3];

      if (
        !name_pt ||
        typeof name_pt !== "string" ||
        category === null ||
        plan === null ||
        level === null
      ) {
        continue;
      }

      const code = slugify(name_pt, {
        lower: true,
        strict: true
      }).replace(/-/g, "_");

      const id_indicator = indicatorIdByCode[code];

      if (!id_indicator) continue;

      years.forEach(async (year, idx) => {
        const value = row[5 + idx];

        if (typeof value !== "number") return;

        await client.query(
          `
          INSERT INTO league_financials
            (id_league, id_indicator, year, value)
          VALUES
            ($1, $2, $3, $4)
          ON CONFLICT (id_league, id_indicator, year)
          DO UPDATE SET
            value = EXCLUDED.value
          `,
          [leagueId, id_indicator, year, value]
        );

        insertedRows++;
      });
    }

    await client.query("COMMIT");

    return res.json({
      message: "Importação concluída com sucesso",
      summary: {
        indicators: Object.keys(indicatorIdByCode).length,
        financialRows: insertedRows,
        years
      }
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Erro na importação:", error);

    return res.status(500).json({
      message: "Erro ao importar dados da liga"
    });

  } finally {
    client.release();
  }
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
      console.log(yearColumns);
      console.log(row);
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