import db from "../config/db.js";
import xlsx from "xlsx";

// ---------------------------------------------------------------------------
// MOEDAS
// ---------------------------------------------------------------------------

// GET /currency/currencies
export async function getAllCurrencies(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT 
        c.id, c.code, c.name, c.symbol, c.active, c.created_at, c.id_country,
        co.name AS country_name,
        co.flag_url
      FROM currencies c
      LEFT JOIN countries co ON c.id_country = co.id_country
      WHERE c.active = true
      ORDER BY c.code ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar moedas:", err);
    res.status(500).json({ error: "Erro ao buscar moedas" });
  }
}

// GET /currency/currencies/:id
export async function getCurrencyById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT 
        c.id, c.code, c.name, c.symbol, c.active, c.created_at, c.id_country,
        co.name AS country_name,
        co.flag_url
      FROM currencies c
      LEFT JOIN countries co ON c.id_country = co.id_country
      WHERE c.id = $1 AND c.active = true
    `, [id]);

    if (!rows.length) return res.status(404).json({ error: "Moeda não encontrada" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar moeda:", err);
    res.status(500).json({ error: "Erro ao buscar moeda" });
  }
}

// POST /currency/currencies
export async function createCurrency(req, res) {
  try {
    const { id_country, code, name, symbol } = req.body;

    if (!code || !name || !symbol) {
      return res.status(400).json({ error: "code, name e symbol são obrigatórios" });
    }

    // Verifica duplicata de código
    const { rows: existing } = await db.query(
      `SELECT id FROM currencies WHERE code = $1 AND active = true`,
      [code.toUpperCase()]
    );
    if (existing.length) {
      return res.status(400).json({ error: "Já existe uma moeda com este código" });
    }

    const { rows } = await db.query(`
      INSERT INTO currencies (id_country, code, name, symbol, active, created_at)
      VALUES ($1, $2, $3, $4, true, NOW())
      RETURNING *
    `, [id_country || null, code.toUpperCase(), name, symbol]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Erro ao criar moeda:", err);
    res.status(500).json({ error: "Erro ao cadastrar moeda" });
  }
}

// DELETE /currency/currencies/:id  (soft delete)
export async function disableCurrency(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query(
      `UPDATE currencies SET active = false WHERE id = $1 AND active = true`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "Moeda não encontrada" });
    res.json({ success: true, message: "Moeda desativada com sucesso" });
  } catch (err) {
    console.error("Erro ao desativar moeda:", err);
    res.status(500).json({ error: "Erro ao desativar moeda" });
  }
}

// ---------------------------------------------------------------------------
// AUXILIARES
// ---------------------------------------------------------------------------

// GET /currency/currencies/available/countries
// Países que ainda não têm moeda ativa cadastrada
export async function getAvailableCountries(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT co.id_country, co.name, co.flag_url
      FROM countries co
      LEFT JOIN currencies c 
        ON co.id_country = c.id_country AND c.active = true
      WHERE co.active = true
        AND c.id IS NULL
      ORDER BY co.name
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar países disponíveis:", err);
    res.status(500).json({ error: "Erro ao buscar países disponíveis" });
  }
}

// GET /currency/currencies/:currencyId/other-currencies
// Moedas ativas exceto a atual (para criar par)
export async function getOtherCurrencies(req, res) {
  try {
    const { currencyId } = req.params;

    // Pega o code da moeda atual pra excluir dos pares já existentes
    const { rows: self } = await db.query(
      `SELECT code FROM currencies WHERE id = $1`,
      [currencyId]
    );
    if (!self.length) return res.status(404).json({ error: "Moeda não encontrada" });

    const selfCode = self[0].code;

    // Retorna moedas que ainda não têm par com a moeda atual
    const { rows } = await db.query(`
      SELECT 
        c.id, c.code, c.name, c.symbol,
        co.name AS country_name
      FROM currencies c
      LEFT JOIN countries co ON c.id_country = co.id_country
      WHERE c.active = true
        AND c.id <> $1
        AND c.code NOT IN (
          SELECT reference_currency FROM currency_rates WHERE base_currency = $2
        )
      ORDER BY c.code
    `, [currencyId, selfCode]);

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar outras moedas:", err);
    res.status(500).json({ error: "Erro ao buscar outras moedas" });
  }
}

// ---------------------------------------------------------------------------
// PARES E TAXAS (currency_rates)
// schema: id, base_currency (code), reference_currency (code), period (date), rate, source, created_at, updated_at
// Um "par" = (base_currency, reference_currency) com N linhas de period/rate
// ---------------------------------------------------------------------------

// GET /currency/currencies/:currencyId/pairs
// Retorna os pares distintos da moeda, com a taxa mais recente de cada um
export async function getCurrencyPairs(req, res) {
  try {
    const { currencyId } = req.params;

    const { rows: self } = await db.query(
      `SELECT code FROM currencies WHERE id = $1`,
      [currencyId]
    );
    if (!self.length) return res.status(404).json({ error: "Moeda não encontrada" });

    const selfCode = self[0].code;

    // Agrupa por par, traz taxa mais recente e total de registros
    const { rows } = await db.query(`
      SELECT
        cr.base_currency,
        cr.reference_currency,
        COUNT(*) AS total_rates,
        MAX(cr.period) AS latest_period,
        (
          SELECT cr2.rate 
          FROM currency_rates cr2 
          WHERE cr2.base_currency = cr.base_currency 
            AND cr2.reference_currency = cr.reference_currency
          ORDER BY cr2.period DESC 
          LIMIT 1
        ) AS latest_rate,
        c_to.id AS to_currency_id,
        c_to.name AS to_currency_name,
        c_to.symbol AS to_symbol,
        co.name AS to_country_name,
        co.flag_url AS to_flag
      FROM currency_rates cr
      INNER JOIN currencies c_to 
        ON c_to.code = cr.reference_currency AND c_to.active = true
      LEFT JOIN countries co 
        ON co.id_country = c_to.id_country
      WHERE cr.base_currency = $1
      GROUP BY 
        cr.base_currency, cr.reference_currency,
        c_to.id, c_to.name, c_to.symbol, co.name, co.flag_url
      ORDER BY cr.reference_currency
    `, [selfCode]);

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar pares:", err);
    res.status(500).json({ error: "Erro ao buscar pares de câmbio" });
  }
}

// GET /currency/currency-rates/:baseCurrencyCode/:referenceCurrencyCode
// Retorna todas as taxas de um par específico
export async function getRatesByPair(req, res) {
  try {
    const { baseCurrencyCode, referenceCurrencyCode } = req.params;

    const { rows } = await db.query(`
      SELECT id, base_currency, reference_currency, period, rate, source, created_at, updated_at
      FROM currency_rates
      WHERE base_currency = $1 AND reference_currency = $2
      ORDER BY period DESC
    `, [baseCurrencyCode, referenceCurrencyCode]);

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar taxas:", err);
    res.status(500).json({ error: "Erro ao buscar taxas" });
  }
}

// POST /currency/currency-rates
// Cria ou atualiza uma taxa para um par em um período
export async function createOrUpdateRate(req, res) {
  try {
    const { base_currency, reference_currency, year, rate } = req.body;

    if (!base_currency || !reference_currency || !year || rate == null) {
      return res.status(400).json({ error: "base_currency, reference_currency, year e rate são obrigatórios" });
    }

    if (base_currency === reference_currency) {
      return res.status(400).json({ error: "Não é possível criar par com a mesma moeda" });
    }

    const yearNum = Number(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }

    // period como primeiro dia do ano
    const period = `${yearNum}-01-01`;

    const { rows } = await db.query(`
      INSERT INTO currency_rates 
        (base_currency, reference_currency, period, rate, source, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'manual', NOW(), NOW())
      ON CONFLICT (base_currency, reference_currency, period)
      DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW()
      RETURNING *
    `, [base_currency.toUpperCase(), reference_currency.toUpperCase(), period, rate]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Erro ao salvar taxa:", err);
    res.status(500).json({ error: "Erro ao salvar taxa de câmbio" });
  }
}

// DELETE /currency/currency-rates/:id  (hard delete — tabela não tem active)
export async function deleteRate(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query(
      `DELETE FROM currency_rates WHERE id = $1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "Taxa não encontrada" });
    res.json({ success: true, message: "Taxa removida com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar taxa:", err);
    res.status(500).json({ error: "Erro ao deletar taxa" });
  }
}

// DELETE /currency/currency-pairs/:base/:reference
// Remove TODAS as taxas de um par (hard delete em lote)
export async function deletePair(req, res) {
  try {
    const { base, reference } = req.params;
    const { rowCount } = await db.query(
      `DELETE FROM currency_rates WHERE base_currency = $1 AND reference_currency = $2`,
      [base.toUpperCase(), reference.toUpperCase()]
    );
    if (!rowCount) return res.status(404).json({ error: "Par não encontrado" });
    res.json({ success: true, message: "Par removido com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar par:", err);
    res.status(500).json({ error: "Erro ao deletar par" });
  }
}

// ---------------------------------------------------------------------------
// IMPORTAÇÃO EM LOTE DO CÂMBIO.XLSX
// POST /currency/bulk-import-xlsx
// Aba "Moedas": [Slug, Moeda, País]  → popula tabela currencies
// Aba "Câmbio": blocos de taxas      → popula currency_rates
//   Linha 0: ["NomeMoeda", "BASE_REF1", "BASE_REF2", ...]
//   Linha 1: ["Data", "descrição1", ...]
//   Linhas N: ["M/D/YY", taxa1, taxa2, ...]
//   Linha vazia: separador de bloco
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOLS = {
  BRL: "R$", USD: "$", EUR: "€", GBP: "£", RUB: "₽", JPY: "¥",
  ARS: "$", UYU: "$U", CLP: "$", COP: "$", SAR: "﷼", CHF: "Fr",
  PYG: "₲", BOB: "Bs", PEN: "S/", VES: "Bs.S", CNY: "¥", KRW: "₩",
  MXN: "$", CAD: "C$", AUD: "A$", NZD: "NZ$", ZAR: "R",
};

function parseDateStr(raw) {
  // Suporta "6/30/20", "12/31/2020", "6/30/2020"
  if (!raw || typeof raw !== "string") return null;
  const parts = raw.trim().split("/");
  if (parts.length !== 3) return null;
  const [m, d, y] = parts;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export async function bulkImportExchangeRates(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });

    const wb = xlsx.read(req.file.buffer, { type: "buffer" });

    // ── 1. Importa moedas da aba "Moedas" ──────────────────────────────────
    let currenciesAdded = 0;
    let currenciesUpdated = 0;

    if (wb.SheetNames.includes("Moedas")) {
      const moedasWs = wb.Sheets["Moedas"];
      const moedasRows = xlsx.utils.sheet_to_json(moedasWs, { header: 1, defval: "" });

      for (const row of moedasRows.slice(1)) {
        const code = String(row[0] || "").trim().toUpperCase();
        const name = String(row[1] || "").trim();
        if (!code || !name || code.length > 4) continue;

        const symbol = CURRENCY_SYMBOLS[code] || code;

        // Tenta encontrar o país pelo nome
        let id_country = null;
        const countryName = String(row[2] || "").trim();
        if (countryName) {
          const { rows: cRows } = await db.query(
            `SELECT id_country FROM countries WHERE name ILIKE $1 AND active = true LIMIT 1`,
            [countryName]
          );
          id_country = cRows[0]?.id_country || null;
        }

        // Verifica se já existe (por code)
        const { rows: existing } = await db.query(
          `SELECT id, id_country FROM currencies WHERE code = $1`,
          [code]
        );

        if (existing.length === 0) {
          await db.query(
            `INSERT INTO currencies (code, name, symbol, active, id_country, created_at)
             VALUES ($1, $2, $3, true, $4, NOW())`,
            [code, name, symbol, id_country]
          );
          currenciesAdded++;
        } else {
          // Atualiza nome, símbolo e reativa; preserva id_country existente se já tiver
          const existingCountry = existing[0].id_country;
          await db.query(
            `UPDATE currencies SET name = $1, symbol = $2, active = true,
              id_country = COALESCE($3::integer, $4::integer)
             WHERE code = $5`,
            [name, symbol, existingCountry, id_country, code]
          );
          currenciesUpdated++;
        }
      }
    }

    // ── 2. Importa cotações da aba "Câmbio" ────────────────────────────────
    const sheetName = wb.SheetNames.includes("Câmbio") ? "Câmbio" : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });

    const records = [];
    let i = 0;

    while (i < rows.length) {
      const headerRow = rows[i];
      // Detecta início de bloco: célula[1] deve ter padrão "XXX_YYY"
      if (!headerRow[1] || !/^[A-Z]{2,4}_[A-Z]{2,4}$/.test(String(headerRow[1]).trim())) {
        i++;
        continue;
      }

      // Extrai pares da linha de cabeçalho
      const pairs = [];
      for (let col = 1; col < headerRow.length; col++) {
        const cell = String(headerRow[col]).trim();
        if (!cell || !/^[A-Z]{2,4}_[A-Z]{2,4}$/.test(cell)) break;
        const [base, ref] = cell.split("_");
        pairs.push({ col, base, ref });
      }

      // Pula linha de labels (i+1)
      let dataRow = i + 2;

      // Lê linhas de dados até linha vazia ou novo bloco
      while (dataRow < rows.length) {
        const row = rows[dataRow];
        const dateStr = String(row[0]).trim();
        if (!dateStr) break;

        const period = parseDateStr(dateStr);
        if (!period) { dataRow++; continue; }

        for (const { col, base, ref } of pairs) {
          const rawRate = String(row[col]).trim().replace(/,/g, "");
          const rate = parseFloat(rawRate);
          if (!isNaN(rate) && rate > 0) {
            records.push({ base_currency: base, reference_currency: ref, period, rate });
          }
        }
        dataRow++;
      }

      i = dataRow + 1;
    }

    // Upsert em lote de cotações
    let inserted = 0;
    let updated = 0;
    for (const r of records) {
      const result = await db.query(`
        INSERT INTO currency_rates (base_currency, reference_currency, period, rate, source, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'xlsx-import', NOW(), NOW())
        ON CONFLICT (base_currency, reference_currency, period)
        DO UPDATE SET rate = EXCLUDED.rate, source = 'xlsx-import', updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert
      `, [r.base_currency, r.reference_currency, r.period, r.rate]);
      if (result.rows[0]?.is_insert) inserted++; else updated++;
    }

    const parts = [];
    if (currenciesAdded || currenciesUpdated)
      parts.push(`${currenciesAdded} moedas adicionadas, ${currenciesUpdated} atualizadas`);
    if (records.length)
      parts.push(`${inserted} cotações novas, ${updated} atualizadas`);

    res.json({
      success: true,
      currencies: { added: currenciesAdded, updated: currenciesUpdated },
      rates: { total: records.length, inserted, updated },
      message: parts.length ? `Importação concluída: ${parts.join(" · ")}.` : "Nenhum dado encontrado no arquivo.",
    });
  } catch (err) {
    console.error("Erro ao importar câmbio:", err);
    res.status(500).json({ error: "Erro ao processar arquivo de câmbio" });
  }
}