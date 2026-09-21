// Cores próximas do branco ficam invisíveis em gráficos de linha (fundo branco).
// Usar sempre no lugar de `cor || DEFAULT_COLOR` para resolver a cor de uma série.
const WHITE_HEX_PATTERN = /^#?(fff|ffffff)$/i;

export function resolveChartColor(hex, fallback = "#999999") {
  if (!hex || WHITE_HEX_PATTERN.test(hex.trim())) return fallback;
  return hex;
}

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// areaStyle em degradê vertical: da cor da série até transparente.
// Usa a mesma cor com alpha 0 no final (e não "transparent") pra não "sujar" de cinza no meio.
export function gradientAreaStyle(color, topAlpha = 0.35) {
  const start = color && hexToRgba(color, topAlpha);
  const end = color && hexToRgba(color, 0);
  if (!start || !end) return { color, opacity: 0.12 };
  return {
    color: {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: start },
        { offset: 1, color: end }
      ]
    }
  };
}

// Aplica o degradê a uma série de linha do ECharts (cor vem de serie.color ou itemStyle.color).
export function withGradientArea(serie) {
  const color = serie.color || serie.itemStyle?.color || serie.lineStyle?.color;
  return { ...serie, areaStyle: gradientAreaStyle(color) };
}
