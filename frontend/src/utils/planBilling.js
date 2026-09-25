// Preço, moeda e periodicidade de um plano (colunas plans.currency / plans.billing_interval).
// Planos antigos sem esses campos caem em BRL / mensal.

export function planCurrency(plan) {
  return (plan?.currency || "BRL").trim().toUpperCase();
}

export function isYearly(plan) {
  return plan?.billing_interval === "year";
}

// "€ 199,00" / "R$ 29,90"
export function formatPlanPrice(plan) {
  return Number(plan?.price ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: planCurrency(plan),
  });
}

// "/mês" | "/ano"
export function intervalSuffix(plan) {
  return isYearly(plan) ? "/ano" : "/mês";
}

// "mensal" | "anual"
export function intervalAdjective(plan) {
  return isYearly(plan) ? "anual" : "mensal";
}

export function formatMoney(value, currency = "BRL") {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency });
}

// Resumo do MRR para os KPIs do admin. O MRR exato é por moeda; o total em BRL é uma
// conversão pela cotação mais recente, então aparece com "≈" quando há mais de uma moeda.
// Moeda sem cotação fica de fora do total e é avisada.
export function mrrSummary(kpis) {
  if (kpis?.mrr == null) return { value: "-", sub: "receita recorrente mensal" };

  const byCurrency = kpis.mrr_by_currency ?? [];
  const foreign = byCurrency.filter((c) => c.currency !== "BRL" && c.mrr > 0);
  const missing = kpis.mrr_missing_rates ?? [];

  const value = (foreign.length > 0 ? "≈ " : "") + formatMoney(kpis.mrr, kpis.mrr_currency || "BRL");

  if (byCurrency.length <= 1 && missing.length === 0) {
    return { value, sub: "receita recorrente mensal" };
  }

  const parts = byCurrency.filter((c) => c.mrr > 0).map((c) => formatMoney(c.mrr, c.currency));
  let sub = `por mês (anual ÷ 12): ${parts.join(" + ")}`;
  if (missing.length > 0) sub += ` · sem cotação p/ ${missing.join(", ")}: fora do total`;
  return { value, sub };
}
