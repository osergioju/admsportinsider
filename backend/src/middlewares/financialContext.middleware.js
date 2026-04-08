import db from  "../config/db.js";

export async function financialContext(req, res, next) {
  try {
    let locale = "pt-BR";
    let userCurrency = "BRL";

    if (req.user?.id) {
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
        [req.user.id]
      );
      locale = result.rows[0]?.locale || "pt-BR";
      userCurrency = result.rows[0]?.currency || "BRL";
    }

    req.financialContext = {
      locale,
      fromCurrency: req.query.from || userCurrency,
      toCurrency: req.query.to || userCurrency
    };

    next();
  } catch (err) {
    next(err);
  }
}
