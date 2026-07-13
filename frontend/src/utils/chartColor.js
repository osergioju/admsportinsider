// Cores próximas do branco ficam invisíveis em gráficos de linha (fundo branco).
// Usar sempre no lugar de `cor || DEFAULT_COLOR` para resolver a cor de uma série.
const WHITE_HEX_PATTERN = /^#?(fff|ffffff)$/i;

export function resolveChartColor(hex, fallback = "#999999") {
  if (!hex || WHITE_HEX_PATTERN.test(hex.trim())) return fallback;
  return hex;
}
