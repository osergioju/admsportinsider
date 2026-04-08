import db from "../config/db.js";

export async function getEntityCurrency(db, { type, id, fallback }) {
  try {
    let query = "";
    let paramName = "";

    if (type === "club") {
      query = `
        SELECT ccy.code
        FROM clubs c
        JOIN currencies ccy ON ccy.id_country = c.id_country
        WHERE c.id_club = $1
        LIMIT 1
      `;
    }

    if (type === "league") {
      query = `
        SELECT ccy.code
        FROM leagues l
        JOIN currencies ccy ON ccy.id_country = l.id_country
        WHERE l.id_league = $1
        LIMIT 1
      `;
    }

    if (!query) return fallback;

    const result = await db.query(query, [id]);

    return result.rows.length ? result.rows[0].code : fallback;

  } catch (err) {
    console.error(`Erro ao buscar moeda (${type}):`, err);
    return fallback;
  }
}

async function getUserFinancialContext(req) {
  if (!req.user) {
    return { locale: "pt-BR", fromCurrency: "BRL", toCurrency: "BRL" };
  }
  const userId = req.user.id;

  const result = await db.query(
    `
    SELECT 
      r.code  AS locale,
      c.code  AS currency
    FROM user_preferences up
    LEFT JOIN regions r    ON r.id = up.region_id
    LEFT JOIN currencies c ON c.id = up.currency_id
    WHERE up.user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  const locale = result.rows[0]?.locale || "pt-BR";
  const userCurrency = result.rows[0]?.currency || "BRL";

  return {
    locale,
    fromCurrency: req.query.from || userCurrency,
    toCurrency: req.query.to || userCurrency
  };
}


export const getClubes = (req, res) => {
  const clubes = [
    "Athletico-PR", "Atlético-GO", "Atlético-MG", "Bahia", "Botafogo",
    "Corinthians", "Criciúma", "Cruzeiro", "Cuiabá", "Flamengo",
    "Fluminense", "Fortaleza", "Grêmio", "Internacional", "Juventude",
    "Palmeiras", "Red Bull Bragantino", "São Paulo", "Vasco", "Vitória"
  ];
  return res.json({ clubes });
};

export const getReceita = (req, res) => {
  const { clube } = req.query;

  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const series = [
    "Athletico-PR", "Atlético-GO", "Atlético-MG", "Bahia", "Botafogo",
    "Corinthians", "Criciúma", "Cruzeiro", "Cuiabá", "Flamengo",
    "Fluminense", "Fortaleza", "Grêmio", "Internacional", "Juventude",
    "Palmeiras", "Red Bull Bragantino", "São Paulo", "Vasco", "Vitória"
  ];


  const data = [
    [22, 30, 28, 40, 55, 60, 72, 80, 78, 88, 95, 110], // Athletico-PR
    [10, 15, 18, 22, 30, 35, 40, 48, 52, 55, 60, 68], // Atlético-GO
    [40, 45, 48, 55, 60, 66, 70, 78, 82, 90, 95, 100], // Atlético-MG
    [18, 22, 25, 28, 30, 38, 45, 50, 52, 58, 60, 65], // Bahia
    [30, 35, 40, 50, 65, 70, 80, 90, 92, 100, 110, 115], // Botafogo
    [20, 25, 28, 34, 40, 45, 52, 60, 64, 70, 75, 80], // Corinthians
    [12, 18, 20, 26, 30, 34, 38, 42, 48, 50, 55, 60], // Criciúma
    [28, 33, 36, 40, 45, 52, 58, 64, 70, 78, 84, 90], // Cruzeiro
    [15, 20, 24, 26, 30, 32, 36, 40, 44, 48, 52, 55], // Cuiabá
    [50, 55, 60, 68, 75, 80, 90, 100, 110, 115, 120, 118], // Flamengo
    [25, 28, 32, 36, 40, 45, 50, 55, 60, 66, 70, 75], // Fluminense
    [22, 26, 30, 34, 38, 42, 48, 55, 60, 64, 70, 78], // Fortaleza
    [35, 40, 44, 48, 52, 60, 64, 70, 78, 82, 88, 95], // Grêmio
    [32, 38, 42, 48, 52, 58, 60, 66, 72, 80, 85, 90], // Internacional
    [14, 18, 22, 26, 30, 33, 37, 40, 44, 48, 50, 55], // Juventude
    [45, 50, 55, 60, 68, 72, 80, 90, 100, 110, 114, 120], // Palmeiras
    [26, 30, 34, 36, 40, 45, 52, 60, 65, 70, 75, 82], // Red Bull Bragantino
    [34, 36, 38, 42, 46, 50, 55, 60, 66, 70, 72, 78], // São Paulo
    [20, 24, 30, 32, 36, 40, 45, 50, 55, 60, 64, 70], // Vasco
    [12, 16, 20, 25, 28, 32, 36, 40, 45, 48, 52, 58], // Vitória
  ];


  // filtro simples (mock)
  if (clube) {
    const index = series.indexOf(clube);
    return res.json({
      labels,
      series: [series[index]],
      data: [data[index]],
    });
  }

  return res.json({ labels, series, data });
};

// Retorna evolução da receita de todas as ligas
export async function getRevenueEvolutionByLeague(req, res) {
  try {
    // 1. Buscar dados agregados por ano e liga
    const result = await db.query(`
      SELECT 
        l.id_league,
        l.name AS league_name,
        lf.year,
        SUM(lf.value) AS total
      FROM league_financials lf
      JOIN leagues l ON l.id_league = lf.id_league
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE fi.category = 'revenue'
      GROUP BY l.id_league, l.name, lf.year
      ORDER BY lf.year ASC, l.id_league ASC;
    `);

    const rows = result.rows;

    // Extrair anos únicos
    const years = [...new Set(rows.map(r => r.year))].sort();

    // Extrair ligas únicas
    const leagues = [...new Set(rows.map(r => r.league_name))];

    // Montar matriz de dados [liga][anos...]
    const data = leagues.map(league => {
      return years.map(year => {
        const row = rows.find(r => r.league_name === league && r.year === year);
        return row ? Math.round(Number(row.total)).toLocaleString("pt-BR") : "0";
      });
    });

    return res.json({
      labels: years,
      series: leagues,
      data
    });

  } catch (err) {
    console.error("Erro ao carregar gráfico:", err);
    return res.status(500).json({ message: "Erro ao gerar gráfico." });
  }
}

// Controller original, aqui pega para a página de clube único 
export async function getAvailableYears(req, res) {
  try {
    const { id } = req.params;


    const result = await db.query(`
      SELECT DISTINCT year
      FROM club_financials
      WHERE id_club = $1
      ORDER BY year ASC;
    `, [id]);

    return res.json({
      years: result.rows.map(r => r.year)
    });

  } catch (err) {
    console.error("Erro ao buscar anos disponíveis:", err);
    return res.status(500).json({ message: "Erro ao buscar anos disponíveis" });
  }
}

export async function getRevenues(req, res) {
  try {
    const { id } = req.params;
    const { fromYear, toYear } = req.query;
    const userId = req.user?.id ?? null;


    const clubCurrencyResult = await db.query(
      `
      SELECT ccy.code
      FROM clubs c
      JOIN currencies ccy ON ccy.id_country = c.id_country
      WHERE c.id_club = $1
      LIMIT 1
      `,
      [id]
    );

    const clubCurrency = clubCurrencyResult.rows.length
      ? clubCurrencyResult.rows[0].code
      : actualCurrency; // fallback

    // 🔎 Busca locale da região do usuário
    const regionResult = await db.query(
      `
      SELECT r.code
      FROM user_preferences up
      JOIN regions r ON r.id = up.region_id
      WHERE up.user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    // Busca currency do usuário
    const currencyResult = await db.query(
      `
      SELECT c.code
      FROM user_preferences up
      JOIN currencies c ON c.id = up.currency_id
      WHERE up.user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const locale = regionResult.rows.length ? regionResult.rows[0].code : "pt-BR";
    const actualCurrency = currencyResult.rows.length ? currencyResult.rows[0].code : "BRL";
    const fromCurrency = clubCurrency;
    const toCurrency = req.query.to || actualCurrency;

    const values = [id, locale, fromCurrency, toCurrency];
    let idx = 5;
    let yearFilter = "";

    if (fromYear) {
      yearFilter += ` AND cf.year >= $${idx}`;
      values.push(fromYear);
      idx++;
    }

    if (toYear) {
      yearFilter += ` AND cf.year <= $${idx}`;
      values.push(toYear);
      idx++;
    }

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $3
          AND cr.reference_currency = $4
      )
      SELECT
        cf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        cf.value,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $2
      LEFT JOIN rate_cte r ON r.period = (cf.year || '-01-01')::date
      WHERE cf.id_club = $1
        AND fi.code IN ('revenue')
        ${yearFilter}
      ORDER BY cf.year ASC;
    `, values);

    return res.json({
      fromCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });
  } catch (err) {
    console.error("Erro ao buscar receitas:", err);
    return res.status(500).json({ message: "Erro ao buscar receitas" });
  }
}

export async function getRevenuesBreakdown(req, res) {
  try {
    const { id } = req.params;
    const { locale, fromCurrency, toCurrency } = await getUserFinancialContext(req);

    const result = await db.query(`
      WITH latest_year AS (
        SELECT MAX(year) AS year
        FROM club_financials
        WHERE id_club = $1
      ),
      rate_cte AS (
        SELECT rate
        FROM currency_rates
        WHERE base_currency = $3
          AND reference_currency = $4
          AND period = (SELECT (year || '-01-01')::date FROM latest_year)
        LIMIT 1
      )
      SELECT
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        cf.value,
        cf.year,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $2
      LEFT JOIN rate_cte r ON true
      WHERE cf.id_club = $1
        AND fi.code IN (
          'media',
          'commercial',
          'matchday',
          'prizes',
          'other_revenue',
          'transfers_revenue'
        )
        ORDER BY cf.year DESC, name;
    `, [id, locale, fromCurrency, toCurrency]);


    return res.json({
      year: result.rows[0]?.year || null,
      fromCurrency,
      toCurrency,
      rate: result.rows[0]?.rate || 1,
      data: result.rows.map(row => ({
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency,
        year: row.year
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de receitas" });
  }
}

export async function getPayrollCosts(req, res) {
  try {
    const { id } = req.params;
    const { locale, fromCurrency, toCurrency } = await getUserFinancialContext(req);

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        cf.year,
        cf.value,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN rate_cte r ON r.period = (cf.year || '-01-01')::date
      WHERE cf.id_club = $1
        AND fi.code = 'wages'
      ORDER BY cf.year ASC;
    `, [id, fromCurrency, toCurrency]);

    return res.json({
      fromCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency,
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar folha salarial" });
  }
}

export async function getCostsBreakdown(req, res) {
  try {
    const { id } = req.params;
    const { locale, fromCurrency, toCurrency } = await getUserFinancialContext(req);

    const result = await db.query(`
      WITH latest_year AS (
        SELECT MAX(year) AS year
        FROM club_financials
        WHERE id_club = $1
      ),
      rate_cte AS (
        SELECT rate
        FROM currency_rates
        WHERE base_currency = $2
          AND reference_currency = $3
          AND period = (SELECT (year || '-01-01')::date FROM latest_year)
        LIMIT 1
      )
      SELECT
        cf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        cf.value,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $4
      LEFT JOIN rate_cte r ON true
      WHERE cf.id_club = $1
        AND fi.code IN (
          'wages',
          'administrative',
          'infrastructure',
          'other_expense',
          'transfers_costs'
        )
      ORDER BY name;
    `, [id, fromCurrency, toCurrency, locale]); // ✅ CORRIGIDO: 4 parâmetros

    return res.json({
      year: result.rows[0]?.year || null,
      fromCurrency,
      toCurrency,
      rate: result.rows[0]?.rate || 1,
      data: result.rows.map(row => ({
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency,
        year: row.year
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de custos" });
  }
}

export async function getNetResult(req, res) {
  try {
    const { id } = req.params;
    const { locale, fromCurrency, toCurrency } = await getUserFinancialContext(req);

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        cf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        cf.value,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $4
      LEFT JOIN rate_cte r ON r.period = (cf.year || '-01-01')::date
      WHERE cf.id_club = $1
        AND fi.code IN ('ebitda', 'revenue', 'costs', 'net_income')
      ORDER BY cf.year DESC
      LIMIT 12;
    `, [id, fromCurrency, toCurrency, locale]); // ✅ CORRIGIDO: 4 parâmetros

    return res.json({
      fromCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        code: row.code,
        name: row.name,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar resultado líquido" });
  }
}

export async function getNetResultEvolution(req, res) {
  try {
    const { id } = req.params;
    const { locale, fromCurrency, toCurrency } = await getUserFinancialContext(req);

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        cf.year,
        cf.value,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN rate_cte r ON r.period = (cf.year || '-01-01')::date
      WHERE cf.id_club = $1
        AND fi.code = 'net_income'
      ORDER BY cf.year ASC;
    `, [id, fromCurrency, toCurrency]);

    return res.json({
      fromCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar evolução do resultado líquido" });
  }
}

export async function getDebtsBreakdown(req, res) {
  try {
    const { id } = req.params;
    const { locale, fromCurrency, toCurrency } = await getUserFinancialContext(req);

    const result = await db.query(`
      WITH latest_year AS (
        SELECT MAX(year) AS year
        FROM club_financials
        WHERE id_club = $1
      ),
      rate_cte AS (
        SELECT rate
        FROM currency_rates
        WHERE base_currency = $2
          AND reference_currency = $3
          AND period = (SELECT (year || '-01-01')::date FROM latest_year)
        LIMIT 1
      )
      SELECT
        cf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        cf.value,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $4
      LEFT JOIN rate_cte r ON true
      WHERE cf.id_club = $1
        AND fi.code IN (
          'loans_debt',
          'tax_debt',
          'payroll_debt',
          'other_debt'
        )
        AND cf.year = (SELECT year FROM latest_year)
      ORDER BY name;
    `, [id, fromCurrency, toCurrency, locale]); // ✅ CORRIGIDO: 4 parâmetros

    return res.json({
      year: result.rows[0]?.year || null,
      fromCurrency,
      toCurrency,
      rate: result.rows[0]?.rate || 1,
      data: result.rows.map(row => ({
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de dívidas" });
  }
}

export async function getDebtsEvolution(req, res) {
  try {
    const { id } = req.params;
    const { locale, fromCurrency, toCurrency } = await getUserFinancialContext(req);

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        cf.year,
        cf.value,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN rate_cte r ON r.period = (cf.year || '-01-01')::date
      WHERE cf.id_club = $1
        AND fi.code = 'net_debt'
      ORDER BY cf.year ASC;
    `, [id, fromCurrency, toCurrency]); // ✅ CORRIGIDO: 3 parâmetros

    return res.json({
      fromCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar evolução da dívida" });
  }
}

export async function getFinancialIndicators(req, res) {
  try {
    const { id } = req.params;
    const { locale, fromCurrency, toCurrency } = await getUserFinancialContext(req);

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        cf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        cf.value,
        COALESCE(r.rate, 1) AS rate,
        (cf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM club_financials cf
      JOIN financial_indicators fi ON fi.id = cf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $4
      LEFT JOIN rate_cte r ON r.period = (cf.year || '-01-01')::date
      WHERE cf.id_club = $1
        AND fi.code IN (
          'ebitda',
          'recurring_ebitda',
          'debt_revenue_ratio',
          'debt_ebitda_ratio'
        )
      ORDER BY cf.year DESC;
    `, [id, fromCurrency, toCurrency, locale]); // ✅ CORRIGIDO: 4 parâmetros

    return res.json({
      fromCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        code: row.code,
        name: row.name,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar indicadores financeiros" });
  }
}




// MEsma coisa!!! mas só que para as ligas que seguem o mesmo padrão!!!!
export async function getLeagueAvailableYears(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT DISTINCT year
      FROM league_financials
      WHERE id_league = $1
      ORDER BY year ASC;
    `, [id]);

    return res.json({
      years: result.rows.map(r => r.year)
    });

  } catch (err) {
    console.error("Erro ao buscar anos disponíveis da liga:", err);
    return res.status(500).json({ message: "Erro ao buscar anos disponíveis da liga" });
  }
}

export async function getLeagueRevenues(req, res) {
  try {
    const { id } = req.params;
    const { fromYear, toYear } = req.query;

    const { locale, toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const values = [id, locale, leagueCurrency, toCurrency];
    let idx = 5;
    let yearFilter = "";

    if (fromYear) {
      yearFilter += ` AND lf.year >= $${idx}`;
      values.push(fromYear);
      idx++;
    }

    if (toYear) {
      yearFilter += ` AND lf.year <= $${idx}`;
      values.push(toYear);
      idx++;
    }

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $3
          AND cr.reference_currency = $4
      )
      SELECT
        lf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        lf.value,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $2
      LEFT JOIN rate_cte r ON r.period = (lf.year || '-01-01')::date
      WHERE lf.id_league = $1
        AND fi.code IN ('revenue', 'recurring_revenue', 'costs')
        ${yearFilter}
      ORDER BY lf.year ASC;
    `, values);

    return res.json({
      fromCurrency: leagueCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });

  } catch (err) {
    console.error("Erro ao buscar receitas da liga:", err);
    return res.status(500).json({ message: "Erro ao buscar receitas da liga" });
  }
}

export async function getLeagueRevenuesBreakdown(req, res) {
  try {
    const { id } = req.params;

    const { locale, toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const result = await db.query(`
      WITH latest_year AS (
        SELECT MAX(year) AS year
        FROM league_financials
        WHERE id_league = $1
      ),
      rate_cte AS (
        SELECT rate
        FROM currency_rates
        WHERE base_currency = $2
          AND reference_currency = $3
          AND period = (SELECT (year || '-01-01')::date FROM latest_year)
        LIMIT 1
      )
      SELECT
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        lf.value,
        lf.year,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi
        ON fi.id = lf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $4
      LEFT JOIN rate_cte r ON true
      WHERE lf.id_league = $1
        AND fi.code IN (
          'media',
          'commercial',
          'matchday',
          'prizes',
          'other_revenue',
          'transfers_revenue'
        )
        ORDER BY lf.year DESC, name;
    `, [id, leagueCurrency, toCurrency, locale]);

    return res.json({
      year: result.rows[0]?.year || null,
      fromCurrency: leagueCurrency,
      toCurrency,
      rate: result.rows[0]?.rate || 1,
      data: result.rows.map(row => ({
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency,
        year: row.year
      }))
    });

  } catch (err) {
    console.error("Erro ao buscar breakdown de receitas da liga:", err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de receitas da liga" });
  }
}

export async function getLeaguePayrollCosts(req, res) {
  try {
    const { id } = req.params;

    const { locale, toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        lf.year,
        lf.value,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      LEFT JOIN rate_cte r ON r.period = (lf.year || '-01-01')::date
      WHERE lf.id_league = $1
        AND fi.code = 'wages'
      ORDER BY lf.year ASC;
    `, [id, leagueCurrency, toCurrency]);

    return res.json({
      fromCurrency: leagueCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency,
      }))
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar folha salarial da liga" });
  }
}

export async function getLeagueCostsBreakdown(req, res) {
  try {
    const { id } = req.params;

    const { locale, toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const result = await db.query(`
      WITH latest_year AS (
        SELECT MAX(year) AS year
        FROM league_financials
        WHERE id_league = $1
      ),
      rate_cte AS (
        SELECT rate
        FROM currency_rates
        WHERE base_currency = $2
          AND reference_currency = $3
          AND period = (SELECT (year || '-01-01')::date FROM latest_year)
        LIMIT 1
      )
      SELECT
        lf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        lf.value,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $4
      LEFT JOIN rate_cte r ON true
      WHERE lf.id_league = $1
        AND fi.code IN (
          'wages',
          'administrative',
          'infrastructure',
          'other_expense',
          'transfers_costs'
        )
      ORDER BY name;
    `, [id, leagueCurrency, toCurrency, locale]);

    return res.json({
      year: result.rows[0]?.year || null,
      fromCurrency: leagueCurrency,
      toCurrency,
      rate: result.rows[0]?.rate || 1,
      data: result.rows.map(row => ({
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency,
        year: row.year
      }))
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de custos da liga" });
  }
}

export async function getLeagueNetResult(req, res) {
  try {
    const { id } = req.params;

    const { locale, toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        lf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        lf.value,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $4
      LEFT JOIN rate_cte r ON r.period = (lf.year || '-01-01')::date
      WHERE lf.id_league = $1
        AND fi.code IN ('revenue', 'costs', 'net_income', 'ebitda')
      ORDER BY lf.year DESC
      LIMIT 15;
    `, [id, leagueCurrency, toCurrency, locale]);

    return res.json({
      fromCurrency: leagueCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        code: row.code,
        name: row.name,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar resultado líquido da liga" });
  }
}

export async function getLeagueNetResultEvolution(req, res) {
  try {
    const { id } = req.params;

    const { toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        lf.year,
        lf.value,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      LEFT JOIN rate_cte r ON r.period = (lf.year || '-01-01')::date
      WHERE lf.id_league = $1
        AND fi.code = 'net_income'
      ORDER BY lf.year ASC;
    `, [id, leagueCurrency, toCurrency]);

    return res.json({
      fromCurrency: leagueCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar evolução do resultado líquido da liga" });
  }
}

export async function getLeagueDebtsBreakdown(req, res) {
  try {
    const { id } = req.params;

    const { locale, toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const result = await db.query(`
      WITH latest_year AS (
        SELECT MAX(year) AS year
        FROM league_financials
        WHERE id_league = $1
      ),
      rate_cte AS (
        SELECT rate
        FROM currency_rates
        WHERE base_currency = $2
          AND reference_currency = $3
          AND period = (SELECT (year || '-01-01')::date FROM latest_year)
        LIMIT 1
      )
      SELECT
        lf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        lf.value,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $4
      LEFT JOIN rate_cte r ON true
      WHERE lf.id_league = $1
        AND fi.code IN (
          'loans_debt',
          'tax_debt',
          'payroll_debt',
          'other_debt'
        )
        AND lf.year = (SELECT year FROM latest_year)
      ORDER BY name;
    `, [id, leagueCurrency, toCurrency, locale]);

    return res.json({
      year: result.rows[0]?.year || null,
      fromCurrency: leagueCurrency,
      toCurrency,
      rate: result.rows[0]?.rate || 1,
      data: result.rows.map(row => ({
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de dívidas da liga" });
  }
}

export async function getLeagueDebtsEvolution(req, res) {
  try {
    const { id } = req.params;

    const { toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $2
          AND cr.reference_currency = $3
      )
      SELECT
        lf.year,
        lf.value,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      LEFT JOIN rate_cte r ON r.period = (lf.year || '-01-01')::date
      WHERE lf.id_league = $1
        AND fi.code = 'net_debt'
      ORDER BY lf.year ASC;
    `, [id, leagueCurrency, toCurrency]);

    return res.json({
      fromCurrency: leagueCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        value: row.value,
        rate: row.rate,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar evolução da dívida da liga" });
  }
}

/* Controller para página de liga única
export async function getLeagueAvailableYears(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT DISTINCT year
      FROM league_financials
      WHERE id_league = $1
      ORDER BY year ASC;
    `, [id]);

    return res.json({
      years: result.rows.map(r => r.year)
    });

  } catch (err) {
    console.error("Erro ao buscar anos disponíveis da liga:", err);
    return res.status(500).json({ message: "Erro ao buscar anos disponíveis da liga" });
  }
}
export async function getLeagueRevenues(req, res) {
  try {
    const { id } = req.params;
    const { fromYear, toYear } = req.query;

    const values = [id];
    let idx = 2;
    let yearFilter = "";

    if (fromYear) {
      yearFilter += ` AND lf.year >= $${idx}`;
      values.push(fromYear);
      idx++;
    }

    if (toYear) {
      yearFilter += ` AND lf.year <= $${idx}`;
      values.push(toYear);
      idx++;
    }

    const result = await db.query(`
      SELECT
        lf.year,
        fi.code,
        fi.name_pt,
        lf.value
      FROM league_financials lf
      JOIN financial_indicators fi 
        ON fi.id = lf.id_indicator
      WHERE lf.id_league = $1
        AND fi.code IN ('revenue', 'recurring_revenue', 'costs')
        ${yearFilter}
      ORDER BY lf.year ASC;
    `, values);

    return res.json({ data: result.rows });

  } catch (err) {
    console.error("Erro ao buscar receitas da liga:", err);
    return res.status(500).json({ message: "Erro ao buscar receitas da liga" });
  }
}

export async function getLeagueRevenues(req, res) {
  try {
    const { id } = req.params;
    const { fromYear, toYear } = req.query;

    const { locale, toCurrency, fromCurrency: userCurrency } =
      await getUserFinancialContext(req);

    // 🔥 moeda REAL da liga
    const leagueCurrency = await getEntityCurrency(db, {
      type: "league",
      id,
      fallback: userCurrency
    });

    const values = [id, locale, leagueCurrency, toCurrency];
    let idx = 5;
    let yearFilter = "";

    if (fromYear) {
      yearFilter += ` AND lf.year >= $${idx}`;
      values.push(fromYear);
      idx++;
    }

    if (toYear) {
      yearFilter += ` AND lf.year <= $${idx}`;
      values.push(toYear);
      idx++;
    }

    const result = await db.query(`
      WITH rate_cte AS (
        SELECT cr.rate, cr.period
        FROM currency_rates cr
        WHERE cr.base_currency = $3
          AND cr.reference_currency = $4
      )
      SELECT
        lf.year,
        fi.code,
        COALESCE(fit.name, fi.name_pt) AS name,
        lf.value,
        COALESCE(r.rate, 1) AS rate,
        (lf.value * COALESCE(r.rate, 1)) AS converted_value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      LEFT JOIN financial_indicator_translations fit
        ON fit.financial_indicator_id = fi.id AND fit.locale = $2
      LEFT JOIN rate_cte r ON r.period = (lf.year || '-01-01')::date
      WHERE lf.id_league = $1
        AND fi.code IN ('revenue', 'recurring_revenue', 'costs')
        ${yearFilter}
      ORDER BY lf.year ASC;
    `, values);


    return res.json({
      fromCurrency: leagueCurrency,
      toCurrency,
      data: result.rows.map(row => ({
        year: row.year,
        code: row.code,
        name: row.name,
        value: row.value,
        converted_value: row.converted_value,
        currency_converted: toCurrency
      }))
    });

  } catch (err) {
    console.error("Erro ao buscar receitas da liga:", err);
    return res.status(500).json({ message: "Erro ao buscar receitas da liga" });
  }
}

export async function getLeagueRevenuesBreakdown(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`SELECT
          fi.code,
          fi.name_pt,
          lf.value,
          lf.year
        FROM league_financials lf
        JOIN financial_indicators fi 
          ON fi.id = lf.id_indicator
        WHERE lf.id_league = $1
          AND fi.code IN (
            'media',
            'commercial',
            'matchday',
            'prizes',
            'other_revenue',
            'transfers_revenue'
          )
        ORDER BY lf.year, fi.name_pt;;
    `, [id]);

    return res.json({
      year: result.rows[0]?.year || null,
      data: result.rows
    });

  } catch (err) {
    console.error("Erro ao buscar breakdown de receitas da liga:", err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de receitas da liga" });
  }
}

export async function getLeaguePayrollCosts(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT lf.year, lf.value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE lf.id_league = $1
        AND fi.code = 'wages'
      ORDER BY lf.year ASC;
    `, [id]);

    return res.json({ data: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar folha salarial da liga" });
  }
}

export async function getLeagueCostsBreakdown(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT lf.year, fi.code, fi.name_pt, lf.value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE lf.id_league = $1
        AND fi.code IN (
          'wages',
          'administrative',
          'infrastructure',
          'other_expense',
          'transfers_costs'
        )
      ORDER BY fi.name_pt;
    `, [id]);

    return res.json({ data: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de custos da liga" });
  }
}

export async function getLeagueNetResult(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT lf.year, fi.code, fi.name_pt, lf.value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE lf.id_league = $1
        AND fi.code IN ('revenue', 'costs', 'net_income', 'ebitda')
      ORDER BY lf.year DESC
      LIMIT 15;
    `, [id]);

    return res.json({ data: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar resultado líquido da liga" });
  }
}

export async function getLeagueNetResultEvolution(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT lf.year, lf.value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE lf.id_league = $1
        AND fi.code = 'net_income'
      ORDER BY lf.year ASC;
    `, [id]);

    return res.json({ data: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar evolução do resultado líquido da liga" });
  }
}

export async function getLeagueDebtsBreakdown(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT lf.year, fi.code, fi.name_pt, lf.value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE lf.id_league = $1
        AND fi.code IN (
          'loans_debt',
          'tax_debt',
          'payroll_debt',
          'other_debt'
        )
        AND lf.year = (
          SELECT MAX(year) FROM league_financials WHERE id_league = $1
        )
      ORDER BY fi.name_pt;
    `, [id]);

    return res.json({ data: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar breakdown de dívidas da liga" });
  }
}

export async function getLeagueDebtsEvolution(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT lf.year, lf.value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE lf.id_league = $1
        AND fi.code = 'net_debt'
      ORDER BY lf.year ASC;
    `, [id]);

    return res.json({ data: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar evolução da dívida da liga" });
  }
}
*/

export async function getLeagueFinancialIndicators(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT lf.year, fi.code, fi.name_pt, lf.value
      FROM league_financials lf
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE lf.id_league = $1
        AND fi.code IN (
          'ebitda',
          'recurring_ebitda',
          'debt_revenue_ratio',
          'debt_ebitda_ratio'
        )
      ORDER BY lf.year DESC;
    `, [id]);

    return res.json({ data: result.rows });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar indicadores financeiros da liga" });
  }
}

// ─────────────────────────────────────────────
// COUNTRIES — listagem pública
// ─────────────────────────────────────────────

export async function getCountries(req, res) {
  try {
    const result = await db.query(`
      SELECT
        co.id_country   AS id,
        co.name         AS name,
        co.flag_url     AS flag_url,
        COUNT(DISTINCT l.id_league) AS leagues_count,
        COUNT(DISTINCT c.id_club)   AS clubs_count
      FROM countries co
      LEFT JOIN leagues l ON l.id_country = co.id_country AND l.active = TRUE
      LEFT JOIN clubs   c ON c.id_country = co.id_country AND c.active = TRUE
      GROUP BY co.id_country, co.name, co.flag_url
      HAVING COUNT(DISTINCT l.id_league) > 0 OR COUNT(DISTINCT c.id_club) > 0
      ORDER BY co.name ASC
    `);

    return res.json({ countries: result.rows });
  } catch (err) {
    console.error("[getCountries]", err);
    return res.status(500).json({ message: "Erro ao buscar países" });
  }
}

// ─────────────────────────────────────────────
// COUNTRY DETAIL — ligas + clubes do país
// ─────────────────────────────────────────────

export async function getCountryDetail(req, res) {
  try {
    const { id } = req.params;

    const [countryRes, leaguesRes, clubsRes] = await Promise.all([
      db.query(`SELECT id_country AS id, name, flag_url FROM countries WHERE id_country = $1`, [id]),

      db.query(`
        SELECT
          l.id_league   AS id,
          l.name        AS name,
          l.logo_url    AS logo_url,
          l.format      AS format,
          COUNT(DISTINCT cs.id_club) AS clubs_count
        FROM leagues l
        LEFT JOIN club_seasons cs ON cs.id_league = l.id_league
        WHERE l.id_country = $1 AND l.active = TRUE
        GROUP BY l.id_league, l.name, l.logo_url, l.format
        ORDER BY l.name ASC
      `, [id]),

      db.query(`
        SELECT
          c.id_club     AS id,
          c.name        AS name,
          c.crest_url   AS crest_url
        FROM clubs c
        WHERE c.id_country = $1 AND c.active = TRUE
        ORDER BY c.name ASC
      `, [id]),
    ]);

    if (!countryRes.rows.length) {
      return res.status(404).json({ message: "País não encontrado" });
    }

    return res.json({
      country: countryRes.rows[0],
      leagues: leaguesRes.rows,
      clubs: clubsRes.rows,
    });
  } catch (err) {
    console.error("[getCountryDetail]", err);
    return res.status(500).json({ message: "Erro ao buscar país" });
  }
}
