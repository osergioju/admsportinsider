import { supabase } from "../utils/supabase.js";
import { db } from "../config/db.js";
import xlsx from "xlsx";

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
