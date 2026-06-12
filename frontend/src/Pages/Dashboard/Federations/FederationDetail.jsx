import { useEffect, useState, useContext } from "react";
import NotasSection from "./../../Dashboard/Notas/NotasSection"
import { useParams, useNavigate } from "react-router-dom";
import { Heart, Shield, Trophy, ChevronLeft, ArrowRight, MapPin, Calendar, TrendingUp } from "lucide-react";
import { federationLogo } from "../../../utils/federationUrl";
import ReactECharts from "echarts-for-react";
import { api } from "../../../services/api";
import { useFavorites } from "../../../hooks/useFavorites";
import { useTranslation } from "../../../context/TranslationContext";
import { AuthContext } from "../../../context/AuthContext";
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
  const c1 = primary || "#7F33D9";
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

function lighten(hex, amount = 0.7) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Helpers financeiros ──────────────────────────────────────────────────────

function parseCycleYears(edition) {
  if (edition.name) {
    const match = edition.name.match(/(\d{4})\s*[-–]\s*(\d{4})/);
    if (match) return { start: parseInt(match[1]), end: parseInt(match[2]) };
  }
  const end = edition.edition_year ?? new Date().getFullYear();
  return { start: end - 3, end };
}

function fmtCycleValue(v, currency) {
  if (v == null || isNaN(v)) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1000) return `${currency} ${sign}${(abs / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bilhões`;
  return `${currency} ${sign}${abs.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} milhões`;
}

function calcPct(latest, prev) {
  if (prev == null || prev === 0) return null;
  return ((latest - prev) / Math.abs(prev)) * 100;
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

const STYLE_ID = "fed-detail-styles";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    .fed-comp-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .fed-comp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
    .fed-comp-card .card-arrow { transition: transform 0.2s ease; }
    .fed-comp-card:hover .card-arrow { transform: translateX(4px); }
  `;
  document.head.appendChild(el);
}

// ─── Gráfico de barras por ciclo ──────────────────────────────────────────────

function CycleBarChart({ editions, field, color }) {
  if (!editions?.length) return null;

  const labels = editions.map(e => {
    const { start, end } = parseCycleYears(e);
    return `${start}-${end}`;
  });

  const values = editions.map(e => {
    const v = parseFloat(e[field]);
    return isNaN(v) ? null : Math.round(v * 10) / 10;
  });

  const fmt = (v) => {
    if (v == null) return "—";
    const abs = Math.abs(v);
    if (abs >= 1000) return `${(v / 1000).toFixed(1)}B`;
    return `${Math.round(v)}M`;
  };

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p = params[0];
        return `<b>${labels[p.dataIndex]}</b><br/>${p.marker} ${fmt(p.value)}`;
      },
    },
    grid: { left: 8, right: 8, top: 10, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 11, color: "#9ca3af" },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v) => fmt(v), fontSize: 10, color: "#9ca3af" },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
    },
    series: [{
      type: "bar",
      data: values,
      barMaxWidth: 70,
      itemStyle: { color, borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: "top", formatter: (p) => fmt(p.value), fontSize: 10, color: "#6b7280" },
    }],
  };

  return <ReactECharts option={option} style={{ height: 220 }} />;
}

// ─── Seletor de moeda ─────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "BRL", "EUR", "GBP"];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function FederationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [federation, setFederation] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editions, setEditions] = useState(null);
  const [loadingFin, setLoadingFin] = useState(false);
  const [currency, setCurrency] = useState(user?.currency_code || "USD");

  const token = localStorage.getItem("token");

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/federations/${slug}`)
      .then(({ data }) => { setFederation(data.federation); setLeagues(data.leagues || []); })
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); else console.error(err); })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!federation) return;
    if (!["global", "continental"].includes(federation.sphere)) return;
    setLoadingFin(true);
    api.get(`/dashboard/federations/${slug}/cycle-financials?to=${currency}`)
      .then(({ data }) => setEditions(data.editions?.length ? data.editions : []))
      .catch(() => setEditions([]))
      .finally(() => setLoadingFin(false));
  }, [slug, federation, currency]);

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

  if (loading || !federation) return <PageLoader />;

  // ── Cores da federação ─────────────────────────────────────────────────────
  const [c1, c2, c3] = resolveColors(federation.primary_color, federation.secondary_color, federation.tertiary_color);
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);

  const background = `
    radial-gradient(circle at 20% 30%, ${c1} 0%, transparent 60%),
    radial-gradient(circle at 80% 70%, ${c2} 0%, transparent 60%),
    linear-gradient(135deg, ${c1}, ${c2}, ${c3})
  `.trim();


  const lum1 = rgb1 ? (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255 : 0;
  const textColor = lum1 > 0.5 ? "#0A0A0A" : "#FFFFFF";
  const borderColor = lum1 > 0.5 ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)";

  const glowPrimary = rgb1
    ? `radial-gradient(circle, rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.45) 0%, transparent 70%)`
    : "rgba(0,0,0,0.2)";
  const glowSecondary = rgb2
    ? `radial-gradient(circle, rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.35) 0%, transparent 70%)`
    : glowPrimary;

  const chartColor = pickChartColor(federation.primary_color, federation.secondary_color, federation.tertiary_color);

  // ── Dados financeiros ──────────────────────────────────────────────────────
  const hasFinancials = editions && editions.length > 0;
  const latestEd = hasFinancials ? editions[editions.length - 1] : null;
  const prevEd = editions?.length >= 2 ? editions[editions.length - 2] : null;

  const latestRev = latestEd ? parseFloat(latestEd.revenue_converted) : null;
  const prevRev = prevEd ? parseFloat(prevEd.revenue_converted) : null;
  const revPct = (latestRev != null && prevRev != null) ? calcPct(latestRev, prevRev) : null;

  const latestNet = latestEd ? parseFloat(latestEd.net_income_converted) : null;
  const prevNet = prevEd ? parseFloat(prevEd.net_income_converted) : null;

  const latestCycle = latestEd ? parseCycleYears(latestEd) : null;

  const formatFoundedAt = (dateStr) => {
    if (!dateStr) return null;
    try {
      const clean = String(dateStr).split("T")[0];
      const [y, m, d] = clean.split("-").map(Number);
      if (!y || !m || !d) return clean;
      return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return String(dateStr); }
  };

  const favFed = isFavorited(federation.id_federation, "federation");
  const fedName = federation.acronym || federation.name;

  return (
    <div className="w-full overflow-hidden">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/dashboard/federations")}
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
        {token && (
          <button
            onClick={() => toggleFavorite(federation.id_federation, "federation")}
            className={`ml-auto shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all ${favFed ? "bg-[#7F33D9] border-[#7F33D9] text-white" : "bg-white border-gray-200 text-gray-500 hover:border-[#7F33D9] hover:text-[#7F33D9]"}`}
          >
            <Heart size={12} fill={favFed ? "white" : "transparent"} strokeWidth={2} />
            {favFed ? "Favoritada" : "Favoritar"}
          </button>
        )}
      </div>

      {/* ── Header com gradiente ─────────────────────────────────────────── */}
      <div className="rounded-2xl mb-4 relative overflow-hidden" style={{ background }}>

        {/* Overlay
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)" }} />
        */}
        {/* Glow orbs 
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none blur-3xl" style={{ background: glowPrimary }} />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none blur-3xl" style={{ background: glowSecondary }} />
        */}
        <div className="relative z-10 px-5 sm:px-6 pt-4 pb-8">
          <div className="flex items-start gap-4 lg:p-5 flex-wrap">

            {/* Logo */}
            <div className="shrink-0 w-14 h-14 lg:w-28 lg:h-28 xl:w-36 xl:h-36 flex items-center justify-center">
              {federation.slug
                ? <img src={federationLogo(federation.slug, "medium")} alt={federation.name} className="w-full h-full object-contain drop-shadow-lg" />
                : <Shield size={40} style={{ color: textColor, opacity: 0.6 }} />
              }
            </div>

            {/* Nome + nome completo + info */}
            <div className="flex-1 min-w-0 border-b pb-4 pl-2" style={{ borderColor }}>
              <h1 className="font-light drop-shadow-md leading-tight text-xl sm:text-2xl lg:text-3xl xl:text-4xl" style={{ color: textColor }}>
                {fedName}
              </h1>
              {federation.full_name && (
                <span
                  className="lg:text-sm xl:text-base inline-block mt-1 text-xs border px-5 py-2 font-[300] rounded-full"
                  style={{ color: textColor, borderColor }}
                >
                  {federation.full_name}
                </span>
              )}

              <div className="mt-4 flex gap-2 lg:flex-row flex-col lg:justify-between">

                {/* Cidade-sede + Data de fundação */}
                <div className="flex gap-6 flex-wrap">
                  {federation.city_name && (
                    <div className="text-left pr-4">
                      <span className="flex items-center gap-1.5 text-sm font-[300]" style={{ color: textColor }}>
                        <MapPin size={13} /> Cidade-sede
                      </span>
                      <p className="text-lg lg:text-xl font-[400] leading-none mt-2" style={{ color: textColor }}>
                        {federation.city_name}
                      </p>
                    </div>
                  )}
                  {federation.founded_at && (
                    <div className="text-left">
                      <span className="flex items-center gap-1.5 text-sm font-[300]" style={{ color: textColor }}>
                        <Calendar size={13} /> Fundação
                      </span>
                      <p className="text-lg lg:text-xl font-[400] leading-none mt-2" style={{ color: textColor }}>
                        {formatFoundedAt(federation.founded_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botão Indicadores financeiros (onde fica Hospitalidade nos clubes) */}
                {hasFinancials && (
                  <div className="flex items-start lg:items-center py-1">
                    <button
                      onClick={() => navigate(`/dashboard/federations/finance/${slug}`)}
                      className="flex items-center gap-2 cursor-pointer text-[#0A0A0A] font-[400] text-sm lg:text-[15px] py-3 px-5 rounded-full transition-all hover:brightness-[1.05]"
                      style={{ background: "#ffffff" }}
                    >
                      <TrendingUp size={15} />
                      Indicadores financeiros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botões de competições (onde ficam os 3 nav cards nos clubes) */}
          {leagues.length > 0 && (
            <div className="w-full mt-4">
              <div className="grid lg:grid-cols-3 gap-1 lg:gap-4 sm:gap-2">
                {leagues.slice(0, 3).map((league) => (
                  <div
                    key={league.id_league}
                    className="fed-comp-card flex items-center justify-between border rounded-2xl p-2 px-4 pr-2 lg:p-4 lg:px-5 cursor-pointer bg-white"
                    onClick={() => navigate(`/dashboard/competitions/${league.slug || league.id_league}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {league.logo_url
                        ? <img src={league.logo_url} className="w-8 h-8 shrink-0 object-contain" alt={league.name} onError={e => e.currentTarget.style.display = "none"} />
                        : <Trophy size={18} className="text-gray-400 shrink-0" />
                      }
                      <h2 className="text-[#0A0A0A] font-[400] text-[14px] lg:text-[15px] leading-tight truncate">
                        {league.name}
                      </h2>
                    </div>
                    <button
                      className="shrink-0 cursor-pointer transition-all text-sm px-4 py-2.5 ml-2 rounded-full border border-[#1E1E1E]/40 flex items-center gap-1.5 hover:bg-gray-50"
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/competitions/${league.slug || league.id_league}`); }}
                    >
                      Ver mais
                      <ArrowRight size={13} className="card-arrow" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Seção financeira ─────────────────────────────────────────────── */}
      {!loading && editions !== null && (
        <div id="financials">

          {/* Seletor de moeda */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Receitas por ciclo</p>
            <div className="flex gap-1 bg-gray-100 rounded-full p-1 shrink-0">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${currency === c ? "bg-white text-[#7F33D9] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loadingFin ? (
            <div className="space-y-4">
              <div className="h-72 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              <div className="h-72 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            </div>
          ) : !hasFinancials ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-gray-400 text-sm">Sem dados financeiros para esta federação.</p>
            </div>
          ) : (
            <>
              {/* ── Gráfico de Receitas ── */}
              <div className="rounded-2xl mb-4 w-full px-6 py-6 xl:py-8 lg:px-11 bg-white">
                <div className="flex flex-wrap w-full items-center">
                  <div className="w-full lg:w-1/2">
                    <CycleBarChart editions={editions} field="revenue_converted" color={chartColor} />
                  </div>
                  <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                    <h2
                      style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                      className="mb-4 text-3xl font-light lg:text-4xl relative"
                    >
                      Receitas por ciclo
                    </h2>
                    {latestEd && latestCycle && latestRev != null && (
                      <p
                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                        className="text-sm font-light lg:text-base"
                      >
                        <>
                          A {fedName} projeta receita de{" "}
                          <b className="font-[600]">{fmtCycleValue(latestRev, currency)}</b>
                          {" entre "}
                          {latestCycle.start} e {latestCycle.end}
                          {revPct != null && (
                            <>
                              , <span className="font-[600]">{revPct >= 0 ? "aumento" : "redução"} de{" "}
                                {Math.abs(revPct).toFixed(0)}%</span>  em relação ao período anterior
                            </>
                          )}
                          .
                        </>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Resultado Líquido ── */}
              <div id="resultado" className="rounded-2xl mb-4 w-full px-6 py-6 xl:py-8 lg:px-11 bg-white">
                <div className="flex flex-wrap w-full items-center">
                  <div className="w-full lg:w-1/2">
                    <CycleBarChart
                      editions={editions}
                      field="net_income_converted"
                      color={latestNet != null && latestNet >= 0 ? "#946E1C" : "#ef4444"}
                    />
                  </div>
                  <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                    <h2
                      style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                      className="mb-4 text-3xl font-light lg:text-4xl relative"
                    >
                      Resultado líquido
                    </h2>
                    {latestEd && latestCycle && latestNet != null && (
                      <p
                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                        className="text-sm font-light lg:text-base"
                      >
                        <>
                          A {fedName} projeta{" "}
                          <b className="font-[600]">
                            {latestNet >= 0 ? "lucro" : "prejuízo"} de{" "}
                            {fmtCycleValue(Math.abs(latestNet), currency)}
                          </b>{" "}
                          entre {latestCycle.start} e {latestCycle.end}
                          {prevNet != null && (
                            <>
                              , {latestNet >= prevNet ? "acima" : "abaixo"} do{" "}
                              <b className="font-[600]">
                                {prevNet >= 0 ? "lucro" : "prejuízo"} de{" "}
                                {fmtCycleValue(Math.abs(prevNet), currency)}
                              </b>{" "}
                              registrado no período anterior
                            </>
                          )}
                          .
                        </>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <NotasSection />
    </div>
  );
}
