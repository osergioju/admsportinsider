import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { formatFinancial } from "../../../utils/formatFinancial";
import { TrendingUp, Trophy, ArrowRight, Award, Users } from "lucide-react";
import ReactECharts from "echarts-for-react";
import RevenueLineChart from "./components/revenue/RevenueLineChart";
import NetResultLineChart from "./components/netResult/NetResultLineChart";
import DebtsBreakdownBarChart from "./components/debts/DebtsBreakdownBarChart";
import NoFinancialData from "./components/NoFinancialData";

/* ─── Utilitários de cor ───────────────────────────────────────── */

function hexToRgb(hex) {
    if (!hex) return null;
    const cleaned = hex.replace("#", "");
    const full = cleaned.length === 3
        ? cleaned.split("").map(c => c + c).join("")
        : cleaned;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function resolveColors(primary, secondary, tertiary) {
    const c1 = primary || "#1a1a2e";
    const c2 = secondary || c1;
    const c3 = tertiary || c2;
    return [c1, c2, c3];
}

/* ─── Gráfico de barras por ano ─────────────────────────────────── */

function AnnualBarChart({ rows, color }) {
    if (!rows?.length) return (
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
            Sem dados disponíveis
        </div>
    );

    const labels = rows.map(r => String(r.year));
    const values = rows.map(r => Math.round(r.value * 10) / 10);

    const fmt = (v) => {
        if (v == null) return "—";
        const abs = Math.abs(v);
        if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
        return String(Math.round(v));
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

/* ─── Keyframes ────────────────────────────────────────────────── */
const STYLE_ID = "league-prepage-styles";

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
        @keyframes cardIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .club-card {
            transition: transform 0.28s ease, box-shadow 0.28s ease,
                        background 0.28s ease, border-color 0.28s ease;
        }
        .club-card:hover { transform: translateY(-5px) scale(1.015); }
        .club-card .card-arrow { transition: transform 0.22s ease; }
        .club-card:hover .card-arrow { transform: translateX(5px); }
        .cta-btn { transition: background 0.2s ease, border-color 0.2s ease; }
    `;
    document.head.appendChild(el);
}

const FORMAT_LABEL = {
    pontos_corridos: "Pontos corridos",
    mata_mata: "Mata-mata",
    grupos: "Grupos + Mata-mata",
    misto: "Misto",
};

/* ─── Componente principal ─────────────────────────────────────── */
export default function DashLeagueUniques() {
    const { t } = useTranslation();
    const { slug } = useParams();
    const navigate = useNavigate();

    const [theLeague, setTheLeague] = useState(null);
    const [financials, setFinancials] = useState(null);
    const [annualIndicators, setAnnualIndicators] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { injectStyles(); }, []);

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                const res = await api.get(`/dashboard/leagues/${slug}/info`);
                const leagueId = res.data.league.id_league;
                const [revRes, netRes, netEvoRes, debtEvRes, debtBrkRes, annualRes] = await Promise.all([
                    api.get(`/dashboard/leagues/${leagueId}/financials/revenues`),
                    api.get(`/dashboard/leagues/${leagueId}/financials/net-result`),
                    api.get(`/dashboard/leagues/${leagueId}/financials/net-result/evolution`),
                    api.get(`/dashboard/leagues/${leagueId}/financials/debts/evolution`),
                    api.get(`/dashboard/leagues/${leagueId}/financials/debts/breakdown`),
                    api.get(`/dashboard/leagues/${leagueId}/indicators/annual?codes=world-cup_prizes_total,world-cup_attendance-total`),
                ]);
                setTheLeague(res.data);
                setFinancials({
                    revenues: revRes.data?.data || [],
                    netResult: netRes.data?.data || [],
                    netEvolution: netEvoRes.data?.data || [],
                    debts: debtEvRes.data?.data || [],
                    debtsBreakdown: debtBrkRes.data?.data || [],
                    currency: revRes.data?.fromCurrency || "BRL",
                });
                setAnnualIndicators(annualRes.data?.indicators || {});
            } catch (err) {
                console.error("Erro ao carregar dashboard da liga:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, [slug]);

    if (loading || !theLeague) return null;

    /* ─── Helpers financeiros ──────────────────────────────────── */
    function formatMoney(value, currency) {
        return formatFinancial(value, currency, "pt-BR");
    }

    function getLatestTwo(arr) {
        const sorted = [...arr]
            .filter(r => r.value != null && Number(r.value) !== 0)
            .sort((a, b) => b.year - a.year);
        return [sorted[0] || null, sorted[1] || null];
    }

    function calcPct(latest, prev) {
        if (!prev || prev === 0) return null;
        return ((latest - prev) / Math.abs(prev)) * 100;
    }

    const lg = theLeague.league;
    const sj = lg.structure_json ?? {};
    const shortName = sj.competition_name ?? lg.name;
    const fullName = lg.description && lg.description !== shortName ? lg.description : null;
    const competitionTitle = shortName;

    const formatLabel = lg.format ? (FORMAT_LABEL[lg.format] ?? lg.format) : null;
    const organizer = lg.organizer || lg.federation_name || null;

    // Cores da liga → fallback para federação vinculada
    const [c1, c2, c3] = resolveColors(
        lg.primary_color   || lg.fed_color1,
        lg.secondary_color || lg.fed_color2,
        lg.tertiary_color  || lg.fed_color3
    );

    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);

    const background = `
        radial-gradient(circle at 20% 30%, ${c1} 0%, transparent 60%),
        radial-gradient(circle at 80% 70%, ${c2} 0%, transparent 60%),
        linear-gradient(135deg, ${c1}, ${c2}, ${c3})
    `.trim();
    const backgroundLine = `linear-gradient(to bottom, ${c1}, ${c3}, ${c2}, transparent)`.trim();

    const glowPrimary = rgb1
        ? `radial-gradient(circle, rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.45) 0%, transparent 70%)`
        : "rgba(0,0,0,0.2)";
    const glowSecondary = rgb2
        ? `radial-gradient(circle, rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.35) 0%, transparent 70%)`
        : glowPrimary;

    const lum1 = rgb1 ? (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255 : 0;
    const textColor  = lum1 > 0.5 ? "#0A0A0A" : "#FFFFFF";
    const borderColor = lum1 > 0.5 ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)";

    const fCurrency = financials?.currency || "BRL";

    // Receita
    const revData = (financials?.revenues || []).filter(r => r.code === "revenue" || r.code === "recurring_revenue");
    const [latestRev, prevRev] = getLatestTwo(revData);
    const revPct = latestRev && prevRev ? calcPct(latestRev.value, prevRev.value) : null;

    // Dívida
    const [latestDebt, prevDebt] = getLatestTwo(financials?.debts || []);
    const debtPct = latestDebt && prevDebt ? calcPct(latestDebt.value, prevDebt.value) : null;

    // Resultado líquido
    const netData = (financials?.netResult || []).filter(r => r.code === "net_income");
    const [latestNet, prevNet] = getLatestTwo(netData);

    // Dados para os gráficos financeiros
    const chartLeagueId = lg.id_league;
    const leagueMapLocal = { [chartLeagueId]: competitionTitle };
    const leagueColorLocal = { [chartLeagueId]: { color_one: c1 } };

    const toNative = (arr) => (arr || []).filter(item => item.value != null && Number(item.value) !== 0).map(item => ({ ...item, converted_value: item.value }));
    const revenueChartData = { [chartLeagueId]: toNative(financials?.revenues) };
    const netChartData = { [chartLeagueId]: toNative(financials?.netEvolution) };
    const debtsChartData = { [chartLeagueId]: toNative(financials?.debtsBreakdown) };

    // Indicadores anuais (premiações e público)
    const prizesData = annualIndicators?.["world-cup_prizes_total"] || [];
    const attendanceData = annualIndicators?.["world-cup_attendance-total"] || [];
    const hasPrizesSection = !!(sj.prizes_text || prizesData.length);
    const hasAttendanceSection = !!(sj.attendance_text || attendanceData.length);
    const hasSpecialSections = hasPrizesSection || hasAttendanceSection;

    // Nav cards
    const navCards = [
        {
            title: t("leagues.sports_results", "Resultado esportivo"),
            desc: t("leagues.sports_desc", "Desempenho dos clubes na competição, histórico de partidas e estatísticas por temporada."),
            route: `/dashboard/competitions/sports/${slug}`,
            Icon: Trophy,
        },
        ...(hasPrizesSection ? [{
            title: "Premiações",
            desc: "Distribuição de premiações por edição da competição.",
            route: `#premiacoes`,
            Icon: Award,
            isAnchor: true,
        }] : []),
        ...(hasAttendanceSection ? [{
            title: "Público e renda",
            desc: "Público total e renda nos estádios por edição da competição.",
            route: `#publico`,
            Icon: Users,
            isAnchor: true,
        }] : []),
        ...(!hasSpecialSections ? [{
            title: t("leagues.finances", "Finanças"),
            desc: t("leagues.finances_desc", "Receitas, custos, folha salarial, dívidas e resultado financeiro líquido."),
            route: `/dashboard/competitions/finance/${slug}`,
            Icon: TrendingUp,
        }] : []),
    ];

    return (
        <div className="w-full overflow-hidden">

            {/* ── HEADER ───────────────────────────────────────── */}
            <div className="rounded-2xl mb-4 relative overflow-hidden" style={{ background }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)" }} />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none blur-3xl" style={{ background: glowPrimary }} />
                <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none blur-3xl" style={{ background: glowSecondary }} />

                <div className="relative z-10 px-5 sm:px-6 pt-4 pb-8">
                    <div className="flex items-center gap-4 lg:p-5 flex-wrap">

                        {/* Logo */}
                        <div className="shrink-0 w-14 h-14 lg:w-30 lg:h-30 xl:w-40 xl:h-40 flex items-center justify-center">
                            {(lg.logo_url || lg.slug) && (
                                <img
                                    src={lg.logo_url || `https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${lg.slug}.webp`}
                                    alt={competitionTitle}
                                    className="w-full h-full object-contain drop-shadow-lg"
                                    onError={e => e.currentTarget.style.display = "none"}
                                />
                            )}
                        </div>

                        {/* Nome + meta + nav cards */}
                        <div className="flex-1 min-w-0 border-b pb-4 pl-2" style={{ borderColor }}>
                            <h1
                                className="text-white font-light drop-shadow-md leading-tight truncate text-xl sm:text-2xl"
                                style={{ color: textColor }}
                            >
                                {competitionTitle}
                            </h1>

                            {/* Badge com nome completo */}
                            {fullName && (
                                <span
                                    className="inline-block mt-1 text-xs border px-5 py-2 font-[300] rounded-full"
                                    style={{ color: textColor, borderColor }}
                                >
                                    {fullName}
                                </span>
                            )}

                            {/* Fórmula + Organizador */}
                            {(organizer || formatLabel) && (
                                <div className="mt-3 flex gap-6 flex-wrap">
                                    {formatLabel && (
                                        <div className="text-left">
                                            <span className="text-xs font-[300] opacity-70" style={{ color: textColor }}>
                                                Fórmula de disputa
                                            </span>
                                            <p className="text-base lg:text-lg font-[400] leading-none mt-1" style={{ color: textColor }}>
                                                {formatLabel}
                                            </p>
                                        </div>
                                    )}
                                    {organizer && (
                                        <div className="text-left">
                                            <span className="text-xs font-[300] opacity-70" style={{ color: textColor }}>
                                                Organizador
                                            </span>
                                            <p className="text-base lg:text-lg font-[400] leading-none mt-1" style={{ color: textColor }}>
                                                {organizer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Nav cards */}
                            <div className="w-full mt-4">
                                <div className={`grid gap-1 lg:gap-3 sm:gap-2 ${navCards.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                                    {navCards.map((card) => (
                                        <div
                                            key={card.title}
                                            className="fed-comp-card flex items-center justify-between border rounded-2xl p-2 px-4 pr-2 lg:p-4 lg:px-5 cursor-pointer bg-white"
                                            onClick={() => card.isAnchor ? document.querySelector(card.route)?.scrollIntoView({ behavior: "smooth" }) : navigate(card.route)}
                                        >
                                            <h2 className="text-[#0A0A0A] font-[400] text-[14px] lg:text-[15px] leading-tight">
                                                {card.title}
                                            </h2>
                                            <button
                                                className="shrink-0 cursor-pointer transition-all text-sm px-4 py-2.5 ml-2 rounded-full border border-[#1E1E1E]/40 flex items-center gap-1.5 hover:bg-gray-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    card.isAnchor
                                                        ? document.querySelector(card.route)?.scrollIntoView({ behavior: "smooth" })
                                                        : navigate(card.route);
                                                }}
                                            >
                                                Ver mais
                                                <ArrowRight size={13} className="card-arrow" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bandeira */}
                        {lg.flag_url && (
                            <div
                                className="absolute top-6 right-6 shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-lg"
                                style={{ border: `2px solid ${borderColor}` }}
                                title={lg.country_name}
                            >
                                <img src={lg.flag_url} alt={lg.country_name} className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── SEÇÕES ESPECIAIS (Premiações / Público) ──────── */}
            {hasSpecialSections && (
                <>
                    {hasPrizesSection && (
                        <div id="premiacoes" className="rounded-2xl mb-4 w-full px-6 py-6 xl:py-8 lg:px-11 bg-white">
                            <div className="flex flex-wrap w-full items-center">
                                <div className="w-full lg:w-1/2">
                                    <AnnualBarChart rows={prizesData} color={c1} />
                                </div>
                                <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                                    <h2
                                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6"
                                    >
                                        <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                                        Premiações
                                    </h2>
                                    {sj.prizes_text && (
                                        <p
                                            style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                            className="text-lg font-light lg:text-xl xl:text-2xl"
                                        >
                                            {sj.prizes_text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {hasAttendanceSection && (
                        <div id="publico" className="rounded-2xl mb-4 w-full px-6 py-6 xl:py-8 lg:px-11 bg-white">
                            <div className="flex flex-wrap w-full items-center">
                                <div className="w-full lg:w-1/2">
                                    <AnnualBarChart rows={attendanceData} color={c2 !== c1 ? c2 : "#10b981"} />
                                </div>
                                <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                                    <h2
                                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6"
                                    >
                                        <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                                        Público
                                    </h2>
                                    {sj.attendance_text && (
                                        <p
                                            style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                            className="text-lg font-light lg:text-xl xl:text-2xl"
                                        >
                                            {sj.attendance_text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── SEÇÕES FINANCEIRAS (apenas quando não há seções especiais) ── */}
            {!hasSpecialSections && (
                <>
                    <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                        {!latestRev ? (
                            <NoFinancialData title={t("clubs.revenues", "Receitas")} />
                        ) : (
                            <div className="flex flex-wrap w-full items-center">
                                <div className="w-full lg:w-1/2">
                                    <RevenueLineChart
                                        data={revenueChartData}
                                        ligasSelecionadas={[]}
                                        leagueMap={leagueMapLocal}
                                        mainLeagueId={chartLeagueId}
                                        leagueColor={leagueColorLocal}
                                    />
                                </div>
                                <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                                    <h2
                                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6"
                                    >
                                        <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                                        {t("clubs.revenues", "Receitas")} <br /> em {latestRev.year}
                                    </h2>
                                    <p
                                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        className="text-lg font-light lg:text-xl"
                                    >
                                        {`${competitionTitle} registrou receita de ${formatMoney(latestRev.value, fCurrency)} em ${latestRev.year}${revPct != null ? `, ${revPct >= 0 ? "aumento" : "redução"} de ${Math.abs(revPct).toFixed(1)}% em relação a ${prevRev.year}` : ""}.`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                        {!latestDebt ? (
                            <NoFinancialData title={t("clubs.debts", "Dívidas")} />
                        ) : (
                            <div className="flex flex-wrap w-full items-center">
                                <div className="w-full lg:w-1/2">
                                    <DebtsBreakdownBarChart
                                        data={debtsChartData}
                                        ligasSelecionadas={[]}
                                        leagueMap={leagueMapLocal}
                                        mainLeagueId={chartLeagueId}
                                    />
                                </div>
                                <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                                    <h2
                                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6"
                                    >
                                        <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                                        {t("clubs.debts", "Dívidas")}<br /> em {latestDebt.year}
                                    </h2>
                                    <p
                                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        className="text-lg font-light lg:text-xl"
                                    >
                                        {`${competitionTitle} encerrou ${latestDebt.year} com dívida líquida de ${formatMoney(latestDebt.value, fCurrency)}${debtPct != null ? `, ${debtPct >= 0 ? "aumento" : "redução"} de ${Math.abs(debtPct).toFixed(1)}% em relação a ${prevDebt.year}` : ""}.`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                        {!latestNet ? (
                            <NoFinancialData title={t("clubs.result", "Resultado")} />
                        ) : (
                            <div className="flex flex-wrap w-full items-center">
                                <div className="w-full lg:w-1/2">
                                    <NetResultLineChart
                                        data={netChartData}
                                        ligasSelecionadas={[]}
                                        leagueMap={leagueMapLocal}
                                        mainLeagueId={chartLeagueId}
                                        leagueColor={leagueColorLocal}
                                    />
                                </div>
                                <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                                    <h2
                                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6"
                                    >
                                        <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                                        {t("clubs.result", "Resultado")} <br /> em {latestNet.year}
                                    </h2>
                                    <p
                                        style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        className="text-lg font-light lg:text-xl"
                                    >
                                        {`${competitionTitle} teve ${latestNet.value >= 0 ? "lucro" : "prejuízo"} de ${formatMoney(Math.abs(latestNet.value), fCurrency)} em ${latestNet.year}${prevNet ? `, ${Math.abs(latestNet.value) >= Math.abs(prevNet.value) ? "acima" : "abaixo"} dos ${formatMoney(Math.abs(prevNet.value), fCurrency)} registrados em ${prevNet.year}` : ""}.`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
