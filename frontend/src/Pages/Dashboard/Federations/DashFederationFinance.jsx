import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "../../../services/api";
import { federationLogo } from "../../../utils/federationUrl";
import { useTranslation } from "../../../context/TranslationContext";
import PageLoader from "../../../components/uxui/PageLoader";

// ─── Helpers de cor ───────────────────────────────────────────────────────────

function hexToRgb(hex) {
  if (!hex) return null;
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3 ? cleaned.split("").map(c => c + c).join("") : cleaned;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function resolveColors(primary, secondary, tertiary) {
  const c1 = primary || "#1a1a2e";
  const c2 = secondary || c1;
  const c3 = tertiary || c2;
  return [c1, c2, c3];
}

// Primeira cor visível sobre fundo branco (pula brancos/quase-brancos)
function pickChartColor(...colors) {
  for (const c of colors) {
    const rgb = hexToRgb(c);
    if (!rgb) continue;
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    if (lum < 0.85) return c;
  }
  return "#7F33D9";
}

function lighten(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Formatação numérica (padrão do cliente) ──────────────────────────────────
// < 1 → 3 casas · 1 a 9,9 → 1 casa · ≥ 10 → nenhuma

function decimalsFor(v) {
  const a = Math.abs(v);
  if (a === 0) return 0;
  if (a < 1) return 3;
  if (a < 10) return 1;
  return 0;
}

function fmtNum(v) {
  if (v == null || isNaN(v)) return "—";
  const d = decimalsFor(v);
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

const cycleLabel = (y) => `${y - 3}-${y}`;
const cycleRangeLabel = (y) => `${y - 3} a ${y}`;

// ─── Moedas (apenas as 4 pedidas pelo cliente) ────────────────────────────────

const CURRENCIES = [
  { code: "USD", label: "$ Dólar" },
  { code: "EUR", label: "€ Euro" },
  { code: "BRL", label: "R$ Real" },
  { code: "GBP", label: "£ Libra" },
];

// ─── Gráficos base ────────────────────────────────────────────────────────────

const AXIS_LABEL = { fontSize: 10, color: "#9ca3af" };
const SPLIT_LINE = { lineStyle: { color: "#f3f4f6" } };

// Linha por ciclos (Receitas/Custos por ano, Bilheterias, Hospitalidade)
function LineCycles({ editions, values, color, starYears = [] }) {
  const labels = editions.map(e => cycleLabel(e.edition_year) + (starYears.includes(e.edition_year) ? "*" : ""));
  const names = editions.map(e => e.name || "");
  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p = params[0];
        return `<b>${labels[p.dataIndex]}</b> · ${names[p.dataIndex]}<br/>${p.marker} ${fmtNum(p.value)} mi`;
      },
    },
    grid: { left: 8, right: 16, top: 38, bottom: 8, containLabel: true },
    xAxis: { type: "category", data: labels, axisLabel: AXIS_LABEL, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: "value", axisLabel: { ...AXIS_LABEL, formatter: v => fmtNum(v) }, splitLine: SPLIT_LINE, max: v => (v.max > 0 ? v.max * 1.12 : undefined) },
    series: [{
      type: "line",
      data: values,
      symbol: "circle",
      symbolSize: 7,
      clip: false,
      lineStyle: { width: 2.5, color },
      itemStyle: { color },
      label: { show: true, position: "top", fontSize: 9, color: "#6b7280", formatter: p => fmtNum(p.value) },
    }],
  };
  return <ReactECharts option={option} style={{ height: 260 }} />;
}

// Quebra o label em linhas por palavra (evita corte fora da área visível)
function wrapLabel(text, max = 14) {
  const words = String(text).split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines.join("\n");
}

// Barras por categoria — composição de um único ciclo
function CategoryBars({ items, color }) {
  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p = params[0];
        return `<b>${items[p.dataIndex].label}</b><br/>${p.marker} ${fmtNum(p.value)} mi`;
      },
    },
    grid: { left: 8, right: 16, top: 38, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: items.map(i => i.label),
      axisLabel: { ...AXIS_LABEL, interval: 0, lineHeight: 12, formatter: v => wrapLabel(v) },
      axisLine: { show: false }, axisTick: { show: false },
    },
    yAxis: { type: "value", axisLabel: { ...AXIS_LABEL, formatter: v => fmtNum(v) }, splitLine: SPLIT_LINE, max: v => (v.max > 0 ? v.max * 1.12 : undefined) },
    series: [{
      type: "bar",
      data: items.map(i => i.value),
      barMaxWidth: 46,
      clip: false,
      itemStyle: { color, borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: "top", fontSize: 9, color: "#6b7280", formatter: p => fmtNum(p.value) },
    }],
  };
  return <ReactECharts option={option} style={{ height: 260 }} />;
}

// "Pizza" com total no centro (formato velocímetro das referências do cliente)
function DonutTotal({ slices, total, color }) {
  const palette = [color, lighten(color, 0.45), lighten(color, 0.7), lighten(color, 0.85)];
  const valid = slices.filter(s => s.value != null && s.value !== 0);
  const empty = valid.length === 0;
  const data = empty
    ? [{ name: "", value: 1, itemStyle: { color: "#e5e7eb" }, label: { show: false }, tooltip: { show: false }, emphasis: { disabled: true } }]
    : valid.map((s, i) => ({ name: s.label, value: Math.abs(s.value), itemStyle: { color: palette[i % palette.length] } }));
  const option = {
    tooltip: { trigger: "item", formatter: p => `<b>${p.name}</b><br/>${p.marker} ${fmtNum(p.value)} mi (${p.percent}%)` },
    legend: empty ? { show: false } : { bottom: 0, icon: "rect", itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: "#6b7280" } },
    title: {
      text: fmtNum(total),
      subtext: "Milhões",
      left: "center", top: "38%",
      textStyle: { fontSize: 34, fontWeight: 300, color: "#111827" },
      subtextStyle: { fontSize: 12, color: "#9ca3af" },
    },
    series: [{
      type: "pie",
      radius: ["62%", "74%"],
      center: ["50%", "46%"],
      avoidLabelOverlap: true,
      label: empty ? { show: false } : { show: true, formatter: "{d}%", fontSize: 10, color: "#6b7280" },
      labelLine: { length: 8, length2: 6 },
      data,
    }],
  };
  return <ReactECharts option={option} style={{ height: 280 }} />;
}

// Resultado líquido: barras com linha do zero (positivos/negativos)
function NetIncomeBars({ editions, values, color }) {
  const labels = editions.map(e => cycleLabel(e.edition_year));
  const names = editions.map(e => e.name || "");
  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p = params[0];
        return `<b>${labels[p.dataIndex]}</b> · ${names[p.dataIndex]}<br/>${p.marker} ${fmtNum(p.value)} mi`;
      },
    },
    grid: { left: 8, right: 16, top: 38, bottom: 20, containLabel: true },
    xAxis: { type: "category", data: labels, axisLabel: AXIS_LABEL, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: "value", axisLabel: { ...AXIS_LABEL, formatter: v => fmtNum(v) }, splitLine: SPLIT_LINE },
    series: [{
      type: "bar",
      clip: false,
      data: values.map(v => ({
        value: v,
        itemStyle: { color: v != null && v < 0 ? "#ef4444" : color, borderRadius: v != null && v < 0 ? [0, 0, 6, 6] : [6, 6, 0, 0] },
      })),
      barMaxWidth: 60,
      label: {
        show: true, fontSize: 9, color: "#6b7280",
        position: "top",
        formatter: p => fmtNum(p.value),
      },
      markLine: {
        silent: true, symbol: "none",
        lineStyle: { color: "#9ca3af", type: "solid", width: 1 },
        label: { show: false },
        data: [{ yAxis: 0 }],
      },
    }],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
}

// Card padrão
function Card({ title, chip, children, footnote }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h2 className="text-lg font-semibold text-[#111] leading-tight">{title}</h2>
          <p className="text-[11px] text-gray-400">em milhões</p>
        </div>
        {chip && <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full shrink-0">{chip}</span>}
      </div>
      {children}
      {footnote && <p className="text-[11px] text-gray-400 mt-2">{footnote}</p>}
    </div>
  );
}

// Card com seletor de ciclo (gráficos de barra e rosca de um único período)
function CycleCard({ title, editions, defaultYear, footnote, children }) {
  const [year, setYear] = useState(defaultYear);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-x-3 gap-y-2 mb-1 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-[#111] leading-tight">{title}</h2>
          <p className="text-[11px] text-gray-400">em milhões · {cycleRangeLabel(year)}</p>
        </div>
        <div className="flex gap-0.5 bg-gray-100 rounded-full p-0.5 flex-wrap shrink-0">
          {editions.map(e => (
            <button
              key={e.edition_year}
              onClick={() => setYear(e.edition_year)}
              title={`${cycleLabel(e.edition_year)} · ${e.name || ""}`}
              className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-all ${
                year === e.edition_year ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {e.edition_year}
            </button>
          ))}
        </div>
      </div>
      {children(year)}
      {footnote && <p className="text-[11px] text-gray-400 mt-2">{footnote}</p>}
    </div>
  );
}

// ─── Composições (slugs conforme doc do cliente / planilha "Finanças") ────────

const REV_ORIGIN = [
  { label: "Direitos de transmissão", code: "media" },
  { label: "Patrocínios", code: "sponsorship" },
  { label: "Licenciamentos", code: "merchandising" },
  { label: "Hospitalidade e bilheterias", code: "matchday" },
  { label: "Outros", code: "other_revenue" },
];

const COST_DEST = [
  { label: "Eventos", code: "events" },
  { label: "Desenvolvimento", code: "development" },
  { label: "Governança", code: "governance" },
  { label: "Administrativo", code: "administrative" },
  { label: "Pessoal", code: "wages" },
];

const MEDIA_MARKETS = [
  { label: "Europa", code: "world-cup_media-europe" },
  { label: "Ásia e África do Norte", code: "world-cup_media-asia-africa" },
  { label: "América do Sul e Central", code: "world-cup_media-south-america" },
  { label: "América do Norte e Caribe", code: "world-cup_media-north-america" },
  { label: "Resto do mundo", code: "world-cup_media-rest-world" },
  { label: "Outros eventos", code: "other-events_media" },
];

const SPONSOR_TIERS = [
  { label: "Parceiro", code: "world-cup_sponsorship-partner" },
  { label: "Patrocinador da Copa do Mundo", code: "world-cup_sponsorship-sponsor" },
  { label: "Apoiador e fornecedor", code: "world-cup_sponsorship-supporter-supplier" },
  { label: "Outros eventos", code: "other-events_sponsorship" },
];

const OTHER_REVENUES = [
  { label: "Copa Intercontinental", code: "intercontinental-cup_other-revenue" },
  { label: "Jogos Olímpicos", code: "olympic-games_other-revenue" },
  { label: "Programa de Qualidade", code: "quality-program_other-revenue" },
  { label: "Museu", code: "museum_other-revenue" },
  { label: "Direitos audiovisuais", code: "audiovisual-rights_other-revenue" },
  { label: "Copa do Mundo", code: "world-cup_other-revenue" },
  { label: "Outras receitas", code: "miscellaneous_other-revenue" },
];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DashFederationFinance() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [federation, setFederation] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [editions, setEditions] = useState([]);
  const [series, setSeries] = useState({});
  const [loadingFin, setLoadingFin] = useState(true);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    api.get(`/dashboard/federations/${slug}`)
      .then(({ data }) => setFederation(data.federation))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); else console.error(err); });
  }, [slug]);

  useEffect(() => {
    setLoadingFin(true);
    api.get(`/dashboard/federations/${slug}/finance-overview?to=${currency}`)
      .then(({ data }) => { setEditions(data.editions || []); setSeries(data.series || {}); })
      .catch(console.error)
      .finally(() => setLoadingFin(false));
  }, [slug, currency]);

  if (notFound) {
    return (
      <div className="w-full pb-20">
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <Shield size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm font-medium mb-1">Federação não encontrada</p>
          <button onClick={() => navigate("/dashboard/federations")} className="mt-4 text-sm text-[#7F33D9] font-bold hover:underline">
            Voltar para federações
          </button>
        </div>
      </div>
    );
  }

  if (!federation) {
    return <PageLoader />;
  }

  // ── Cores / header ──
  // Testeira no novo padrão: cor sólida escura + letras brancas
  const [c1, c2, c3] = resolveColors(federation.primary_color, federation.secondary_color, federation.tertiary_color);
  const isDark = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 < 0.5;
  };
  const headerBg = [c1, c2, c3].find(isDark) || "#1a1a2e";
  const headerText = "#FFFFFF";
  const chartColor = pickChartColor(federation.primary_color, federation.secondary_color, federation.tertiary_color);

  const fedName = federation.acronym || federation.name;

  // ── Dados ──
  const val = (code, year) => {
    const v = series?.[code]?.[year];
    return v == null ? null : Number(v);
  };

  // De onde vem o dinheiro: sem ciclo de 2026 em diante
  const pastEditions = editions.filter(e => e.edition_year <= 2022);
  const latest = pastEditions.length ? pastEditions[pastEditions.length - 1].edition_year : null;

  const compose = (items, year) => items.map(i => ({ label: i.label, value: val(i.code, year) }));
  const composeAbs = (items, year) => items.map(i => {
    const v = val(i.code, year);
    return { label: i.label, value: v == null ? null : Math.abs(v) };
  });
  const sumSlices = (slices) => slices.reduce((acc, s) => acc + (s.value || 0), 0);

  const eventDonut = (wcCode, oeCode, year) => {
    const slices = [
      { label: "Copa do Mundo", value: val(wcCode, year) },
      { label: "Outros eventos", value: val(oeCode, year) },
    ];
    return { slices, total: sumSlices(slices) };
  };

  const debtSlices = (year) => [
    { label: "Curto prazo", value: val("short-term-debt", year) },
    { label: "Longo prazo", value: val("long-term-debt", year) },
  ];
  const cashSlices = (year) => [
    { label: "Caixa", value: val("cash", year) },
    { label: "Aplicações financeiras", value: val("financial-applications", year) },
  ];

  const hasData = editions.length > 0;

  return (
    <div className="space-y-4 pb-16">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/dashboard/federations/${slug}`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#7F33D9] transition font-medium"
        >
          <ChevronLeft size={16} />{t("ui.back", "Voltar")}
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-2">
          {federation.slug
            ? <img src={federationLogo(federation.slug, "thumb")} className="w-5 h-5 object-contain" alt={federation.acronym} onError={e => e.currentTarget.style.display = "none"} />
            : <Shield size={14} className="text-[#7F33D9]" />
          }
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{federation.name}</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="w-full rounded-2xl overflow-hidden relative" style={{ background: headerBg }}>
        <div className="relative z-10 p-6 sm:p-8 flex items-start gap-5">
          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center p-2.5">
            {federation.slug
              ? <img src={federationLogo(federation.slug, "medium")} alt={federation.name} className="w-full h-full object-contain" style={{ filter: "drop-shadow(rgb(255, 255, 255) 0.5px 0.5px 0px) drop-shadow(rgb(255, 255, 255) -0.5px -0.5px 0px) drop-shadow(rgb(255, 255, 255) 0.5px -0.5px 0px) drop-shadow(rgb(255, 255, 255) -0.5px 0.5px 0px)" }} />
              : <Shield size={40} className="text-white/60" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold drop-shadow-md truncate" style={{ color: headerText }}>
              {fedName}
            </h1>
            {federation.full_name && (
              <span className="inline-block mt-1.5 text-sm font-semibold bg-white/10 border px-2.5 py-0.5 rounded-full" style={{ color: headerText, borderColor: `${headerText}40` }}>
                {federation.full_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Seletor de moeda ── */}
      <div className="flex items-center justify-end">
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 shrink-0">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${currency === c.code ? "bg-white text-[#7F33D9] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loadingFin ? (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          </div>
          <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-sm">Sem dados financeiros para esta federação.</p>
        </div>
      ) : (
        <>
          {/* ── Receitas ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Receitas (por ano)">
              <LineCycles editions={editions} values={editions.map(e => val("revenue", e.edition_year))} color={chartColor} />
            </Card>
            <CycleCard title="Receitas (por origem)" editions={editions} defaultYear={latest}>
              {(year) => <CategoryBars items={compose(REV_ORIGIN, year)} color={chartColor} />}
            </CycleCard>
          </div>

          {/* ── Custos ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Custos (por ano)">
              <LineCycles editions={editions} values={editions.map(e => {
                const v = val("costs", e.edition_year);
                return v == null ? null : Math.abs(v);
              })} color={chartColor} />
            </Card>
            <CycleCard title="Custos (por destinação)" editions={editions} defaultYear={latest}>
              {(year) => <CategoryBars items={composeAbs(COST_DEST, year)} color={chartColor} />}
            </CycleCard>
          </div>

          {/* ── Resultado líquido (tela inteira, linha do zero) ── */}
          <Card title="Resultado líquido">
            <NetIncomeBars editions={editions} values={editions.map(e => val("net_income", e.edition_year))} color={chartColor} />
          </Card>

          {/* ── Dívida líquida + Caixa ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <CycleCard title="Dívida líquida" editions={editions} defaultYear={latest}>
              {(year) => <DonutTotal slices={debtSlices(year)} total={val("net-debt", year)} color={chartColor} />}
            </CycleCard>
            <CycleCard title="Caixa e aplicações financeiras" editions={editions} defaultYear={latest}>
              {(year) => <DonutTotal slices={cashSlices(year)} total={val("cash-and-financial-applications", year)} color={chartColor} />}
            </CycleCard>
          </div>

          {/* ── Testeira: De onde vem o dinheiro ── */}
          <div className="w-full rounded-2xl overflow-hidden relative mt-8" style={{ background: headerBg }}>
            <div className="relative z-10 px-6 sm:px-8 py-6 sm:py-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow-md" style={{ color: headerText }}>
                De onde vem o dinheiro
              </h2>
              {latest && (
                <p className="text-xs mt-1 opacity-70" style={{ color: headerText }}>
                  Dados até {cycleRangeLabel(latest)}
                </p>
              )}
            </div>
          </div>

          {/* ── Direitos de transmissão ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <CycleCard title="Direitos de transmissão (por evento)" editions={pastEditions} defaultYear={latest}>
              {(year) => { const d = eventDonut("world-cup_media", "other-events_media", year); return <DonutTotal slices={d.slices} total={d.total} color={chartColor} />; }}
            </CycleCard>
            <CycleCard title="Direitos de transmissão (por mercado)" editions={pastEditions} defaultYear={latest}>
              {(year) => <CategoryBars items={compose(MEDIA_MARKETS, year)} color={chartColor} />}
            </CycleCard>
          </div>

          {/* ── Patrocínios ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <CycleCard title="Patrocínios (por evento)" editions={pastEditions} defaultYear={latest}>
              {(year) => { const d = eventDonut("world-cup_sponsorship", "other-events_sponsorship", year); return <DonutTotal slices={d.slices} total={d.total} color={chartColor} />; }}
            </CycleCard>
            <CycleCard title="Patrocínios (por faixa comercial)" editions={pastEditions} defaultYear={latest}>
              {(year) => <CategoryBars items={compose(SPONSOR_TIERS, year)} color={chartColor} />}
            </CycleCard>
          </div>

          {/* ── Bilheterias ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <CycleCard title="Bilheterias (por evento)" editions={pastEditions} defaultYear={latest}>
              {(year) => { const d = eventDonut("world-cup_ticketing", "other-events_ticketing", year); return <DonutTotal slices={d.slices} total={d.total} color={chartColor} />; }}
            </CycleCard>
            <Card
              title="Bilheterias (Copa do Mundo)"
              footnote="*Receita contabilizada nas contas do Comitê Organizador Local."
            >
              <LineCycles
                editions={pastEditions}
                values={pastEditions.map(e => val("world-cup_ticketing", e.edition_year))}
                color={chartColor}
                starYears={[2006, 2010]}
              />
            </Card>
          </div>

          {/* ── Hospitalidade ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <CycleCard title="Hospitalidade (por evento)" editions={pastEditions} defaultYear={latest}>
              {(year) => { const d = eventDonut("world-cup_hospitality", "other-events_hospitality", year); return <DonutTotal slices={d.slices} total={d.total} color={chartColor} />; }}
            </CycleCard>
            <Card title="Hospitalidade (Copa do Mundo)">
              <LineCycles
                editions={pastEditions}
                values={pastEditions.map(e => val("world-cup_hospitality", e.edition_year))}
                color={chartColor}
              />
            </Card>
          </div>

          {/* ── Licenciamentos + Outras receitas ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <CycleCard title="Licenciamentos (por evento)" editions={pastEditions} defaultYear={latest}>
              {(year) => { const d = eventDonut("world-cup_licensing", "other-events_licensing", year); return <DonutTotal slices={d.slices} total={d.total} color={chartColor} />; }}
            </CycleCard>
            <CycleCard title="Outras receitas" editions={pastEditions} defaultYear={latest}>
              {(year) => <CategoryBars items={compose(OTHER_REVENUES, year)} color={chartColor} />}
            </CycleCard>
          </div>
        </>
      )}
    </div>
  );
}
