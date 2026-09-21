// Contraste das cores dos clubes (vêm do cadastro e podem ser claras demais p/ servir de texto).

export function hexToRgb(hex) {
    if (typeof hex !== "string") return null;
    const c = hex.trim().replace("#", "");
    if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) return null;
    const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Luminância relativa (WCAG), 0 = preto, 1 = branco. Cor inválida conta como escura.
export function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0.1;
    const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
}

export const isLight = (hex, limit = 0.4) => luminance(hex) > limit;

// Cor escura p/ títulos: a secundária do clube se for escura; senão um tom bem fechado da primária;
// senão um quase-preto neutro.
export function pickInk(secondary, primary, fallback = "#050111") {
    if (!isLight(secondary, 0.25)) return secondary;
    if (!isLight(primary, 0.25)) return `color-mix(in srgb, ${primary} 45%, #000000)`;
    return fallback;
}
