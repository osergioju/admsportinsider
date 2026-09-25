/**
 * Formata um valor financeiro armazenado em MILHÕES para exibição legível.
 *
 * Regras de escala:
 *   < 1          → multiplica por 1000 → exibe em "mil"
 *   1 a 999,999  → exibe em "milhão" / "milhões"
 *   ≥ 1000       → divide por 1000   → exibe em "bilhão" / "bilhões"
 *
 * Separadores:
 *   pt / es  →  decimal = vírgula, milhares = ponto   (1.500,94)
 *   en       →  decimal = ponto,   milhares = vírgula  (1,500.94)
 */

const UNITS = {
  pt: {
    thousand:        "mil",
    millionOne:      "milhão",
    millionMany:     "milhões",
    billionOne:      "bilhão",
    billionMany:     "bilhões",
  },
  es: {
    thousand:        "mil",
    millionOne:      "millón",
    millionMany:     "millones",
    billionOne:      "billón",
    billionMany:     "billones",
  },
  en: {
    thousand:        "thousand",
    millionOne:      "million",
    millionMany:     "million",
    billionOne:      "billion",
    billionMany:     "billion",
  },
};

function getLang(locale = "pt-BR") {
  const lang = locale.split("-")[0].toLowerCase();
  return UNITS[lang] ? lang : "pt";
}

function getIntlLocale(locale = "pt-BR") {
  const lang = getLang(locale);
  if (lang === "en") return "en-US";
  if (lang === "es") return "es-ES";
  return "pt-BR";
}

function getCurrencySymbol(code, intlLocale) {
  if (!code) return "";
  try {
    const parts = new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

/**
 * @param {number|null} valueInMillions  - valor bruto do banco (em milhões)
 * @param {string}      currencyCode     - código ISO da moeda ("BRL", "EUR", "CHF" …)
 * @param {string}      locale           - locale do usuário ("pt-BR", "en-US" …)
 * @returns {string}
 */
export function formatFinancial(valueInMillions, currencyCode = "", locale = "pt-BR") {
  if (valueInMillions == null) return "—";

  const isNegative = valueInMillions < 0;
  const abs = Math.abs(valueInMillions);

  if (abs === 0) return "—";

  const lang = getLang(locale);
  const units = UNITS[lang];
  const intlLocale = getIntlLocale(locale);

  let scaled;
  let unit;

  if (abs < 1) {
    scaled = abs * 1000;
    unit = units.thousand;
  } else if (abs < 1000) {
    scaled = abs;
    unit = scaled < 2 ? units.millionOne : units.millionMany;
  } else {
    scaled = abs / 1000;
    unit = scaled < 2 ? units.billionOne : units.billionMany;
  }

  const formatted = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(scaled);

  const symbol = getCurrencySymbol(currencyCode, intlLocale);
  const sign = isNegative ? "-" : "";
  const prefix = symbol ? `${symbol}\u00a0` : ""; // non-breaking space

  return `${sign}${prefix}${formatted} ${unit}`;
}
