// Adapta as opções dos gráficos ECharts ao modo escuro SEM editar cada gráfico (22 arquivos definem cores
// próprias: #333/#666 p/ texto, #eee/#ddd p/ linhas, #fff p/ fundos de tooltip e bordas de fatias).
// A troca é por PAPEL da cor (texto forte, texto suave, linha, fundo), decidido pelo valor e pelo caminho
// da chave. Cores das SÉRIES (roxos, cores dos clubes) não são tocadas.

const STRONG = "#F1ECFB";   // texto principal
const SOFT = "#CDC5E3";     // texto secundário forte
const MUTED = "#A699C7";    // rótulos/eixos
const LINE = "#2F2059";     // linhas de grade / divisórias
const AXIS = "#5B4A8A";     // linha de eixo
const SURFACE = "#150B2E";  // cards
const RAISED = "#1D1140";   // tooltip

const DARK_TEXT = new Set(["#000", "#000000", "#111", "#111827", "#050111", "#222", "#222222", "#1a1a2e", "#333", "#333333"]);
const MID_TEXT = new Set(["#555", "#555555", "#666", "#666666"]);
const SOFT_TEXT = new Set(["#6b7280", "#888", "#888888", "#999", "#999999", "#9ca3af", "#aaa", "#aaaaaa"]);
const LIGHT_LINE = new Set(["#ddd", "#dddddd", "#eee", "#eeeeee", "#f3f4f6", "#f0f0f0", "#e5e7eb", "#f3f3f3", "#ccc", "#cccccc", "#bbb", "#bbbbbb", "#e0e6f1"]);
const WHITE = new Set(["#fff", "#ffffff", "white"]);

const TEXT_KEYS = new Set(["axisLabel", "textStyle", "label", "legend", "title", "subtextStyle", "nameTextStyle", "rich", "detail"]);
const LINE_KEYS = new Set(["splitLine", "axisLine", "axisTick", "minorSplitLine", "minorTick", "axisPointer", "crossStyle"]);
const FILL_KEYS = new Set(["backgroundColor", "borderColor", "textBorderColor"]);

function mapColor(value, key, path) {
    if (typeof value !== "string") return value;
    const v = value.trim().toLowerCase();
    const inText = path.some((k) => TEXT_KEYS.has(k));
    const inLine = path.some((k) => LINE_KEYS.has(k));

    if (WHITE.has(v)) return FILL_KEYS.has(key) ? (key === "backgroundColor" ? RAISED : SURFACE) : value;
    if (DARK_TEXT.has(v)) return inLine ? AXIS : STRONG;
    if (MID_TEXT.has(v)) return inLine ? AXIS : SOFT;
    if (SOFT_TEXT.has(v)) return inLine ? AXIS : MUTED;
    if (LIGHT_LINE.has(v)) return inText && !inLine ? MUTED : LINE;
    return value;
}

// O formatter de tooltip devolve HTML com cores fixas (color:#333, background:#fff…): troca também lá.
function recolorHtml(html) {
    if (typeof html !== "string") return html;
    return html
        .replace(/color:\s*#(000|111|222|333)(?![0-9a-f])/gi, `color:${STRONG}`)
        .replace(/color:\s*#(555|666)(?![0-9a-f])/gi, `color:${SOFT}`)
        .replace(/color:\s*#(888|999|aaa|9ca3af|6b7280)(?![0-9a-f])/gi, `color:${MUTED}`)
        .replace(/(background(?:-color)?):\s*#(fff|ffffff)(?![0-9a-f])/gi, `$1:${SURFACE}`)
        .replace(/border(-[a-z]+)?:([^;"]*)#(eee|ddd|f0f0f0|e5e7eb)(?![0-9a-f])/gi, (m) => m.replace(/#(eee|ddd|f0f0f0|e5e7eb)/i, LINE));
}

function isPlain(o) {
    return o !== null && typeof o === "object" && (Object.getPrototypeOf(o) === Object.prototype || Array.isArray(o));
}

function walk(node, key, path) {
    if (Array.isArray(node)) {
        // séries com milhares de números: não percorre (não têm cor)
        if (node.length && typeof node[0] !== "object") return node;
        return node.map((item) => walk(item, key, path));
    }
    if (isPlain(node)) {
        const out = {};
        for (const k of Object.keys(node)) {
            const v = node[k];
            if (k === "formatter" && typeof v === "function" && path.includes("tooltip")) {
                out[k] = (...args) => recolorHtml(v(...args));
            } else if (typeof v === "string") {
                out[k] = mapColor(v, k, path);
            } else {
                out[k] = walk(v, k, [...path, k]);
            }
        }
        return out;
    }
    return node;
}

// Linhas de grade/eixo padrão do ECharts (#E0E6F1, muito claras) sobrevivem se o gráfico não define a sua.
function withAxisDefaults(axis) {
    const one = (a) => (isPlain(a) ? { ...a, splitLine: { ...(a.splitLine || {}), lineStyle: { color: LINE, ...(a.splitLine?.lineStyle || {}) } } } : a);
    return Array.isArray(axis) ? axis.map(one) : one(axis);
}

export function themeChartOption(option) {
    if (!isPlain(option)) return option;
    const out = walk(option, "", []);

    if (out.textStyle === undefined) out.textStyle = { color: MUTED };
    if (out.xAxis) out.xAxis = withAxisDefaults(out.xAxis);
    if (out.yAxis) out.yAxis = withAxisDefaults(out.yAxis);

    if (out.tooltip && isPlain(out.tooltip)) {
        out.tooltip = {
            backgroundColor: RAISED,
            borderColor: LINE,
            ...out.tooltip,
            textStyle: { color: STRONG, ...(out.tooltip.textStyle || {}) },
        };
    }
    if (out.legend && isPlain(out.legend) && !out.legend.textStyle) out.legend = { ...out.legend, textStyle: { color: MUTED } };
    if (out.title && isPlain(out.title) && !out.title.textStyle) out.title = { ...out.title, textStyle: { color: STRONG } };
    return out;
}
