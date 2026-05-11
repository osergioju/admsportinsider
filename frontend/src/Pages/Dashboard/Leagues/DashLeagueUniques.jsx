import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { formatFinancial } from "../../../utils/formatFinancial";
import { TrendingUp, Trophy, ArrowRight } from "lucide-react";
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

/* ─── Componente principal ─────────────────────────────────────── */
export default function DashLeagueUniques() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [theLeague, setTheLeague] = useState(null);
    const [financials, setFinancials] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { injectStyles(); }, []);

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                const [res, revRes, netRes, netEvoRes, debtEvRes, debtBrkRes] = await Promise.all([
                    api.get(`/dashboard/leagues/${id}/info`),
                    api.get(`/dashboard/leagues/${id}/financials/revenues`),
                    api.get(`/dashboard/leagues/${id}/financials/net-result`),
                    api.get(`/dashboard/leagues/${id}/financials/net-result/evolution`),
                    api.get(`/dashboard/leagues/${id}/financials/debts/evolution`),
                    api.get(`/dashboard/leagues/${id}/financials/debts/breakdown`),
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
            } catch (err) {
                console.error("Erro ao carregar dashboard da liga:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, [id]);

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

    const FORMAT_LABEL = {
        pontos_corridos: "Pontos corridos",
        mata_mata: "Mata-mata",
        grupos: "Grupos + Mata-mata",
    };
    const formatLabel = lg.format ? (FORMAT_LABEL[lg.format] ?? lg.format) : null;

    const [c1, c2, c3] = resolveColors(lg.primary_color, lg.secondary_color, lg.tertiary_color);

    const background = `linear-gradient(83.98deg, ${c1} 35.41%, ${c3} 83.12%, ${c2} 100%)`.trim();
    const backgroundLine = `linear-gradient(to bottom, ${c1}, ${c3}, ${c2}, transparent)`.trim();

    const colors = [c1, c2, c3];
    const lightCount = colors.filter(c => {
        const rgb = hexToRgb(c);
        if (!rgb) return false;
        const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return lum > 0.6;
    }).length;
    const textColor = lightCount >= 2 ? "#0A0A0A" : "#FFFFFF";

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

    // Dados para os gráficos
    const chartLeagueId = Number(id);
    const leagueMapLocal = { [chartLeagueId]: competitionTitle };
    const leagueColorLocal = { [chartLeagueId]: { color_one: c1 } };

    const toNative = (arr) => (arr || []).filter(item => item.value != null && Number(item.value) !== 0).map(item => ({ ...item, converted_value: item.value }));
    const revenueChartData = { [chartLeagueId]: toNative(financials?.revenues) };
    const netChartData = { [chartLeagueId]: toNative(financials?.netEvolution) };
    const debtsChartData = { [chartLeagueId]: toNative(financials?.debtsBreakdown) };

    const navCards = [
        {
            title: t("leagues.finances", "Finanças"),
            desc: t("leagues.finances_desc", "Receitas, custos, folha salarial, dívidas e resultado financeiro líquido."),
            route: `/dashboard/competitions/finance/${id}`,
            Icon: TrendingUp,
        },
        {
            title: t("leagues.sports_results", "Resultados esportivos"),
            desc: t("leagues.sports_desc", "Desempenho dos clubes na competição, histórico de partidas e estatísticas por temporada."),
            route: `/dashboard/competitions/sports/${id}`,
            Icon: Trophy,
        },
    ];

    return (
        <div className="w-full overflow-hidden">

            {/* ── HEADER ───────────────────────────────────────── */}
            <div className="rounded-2xl mb-4 relative overflow-hidden" style={{ background }}>

                <div className="relative z-10 px-5 sm:px-6 pt-4 pb-8">
                    <div className="flex items-center gap-4 lg:p-5 flex-wrap">

                        {/* Logo */}
                        <div className="shrink-0 w-14 h-14 lg:w-30 lg:h-30 xl:w-40 xl:h-40 flex items-center justify-center">
                            {lg.logo_url && (
                                <img
                                    src={`https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${lg.slug}.webp`}
                                    alt={competitionTitle}
                                    className="w-full h-full object-contain drop-shadow-lg"
                                />
                            )}
                        </div>

                        {/* Nome + meta + nav cards */}
                        <div className="flex-1 min-w-0 border-b border-white/40 pb-4 pl-2">
                            <h1
                                className="text-white font-light drop-shadow-md leading-tight truncate text-xl sm:text-2xl"
                                style={{ color: textColor }}
                            >
                                {competitionTitle}
                            </h1>

                            {fullName && (
                                <p className="mt-0.5 text-sm font-light opacity-80" style={{ color: textColor }}>
                                    ({fullName})
                                </p>
                            )}

                            {(lg.organizer || formatLabel) && (
                                <div className="mt-2 flex flex-col gap-0.5">
                                    {lg.organizer && (
                                        <p className="text-xs font-light opacity-80" style={{ color: textColor }}>
                                            Organizador: <span className="font-medium">{lg.organizer}</span>
                                        </p>
                                    )}
                                    {formatLabel && (
                                        <p className="text-xs font-light opacity-80" style={{ color: textColor }}>
                                            Fórmula de disputa: <span className="font-medium">{formatLabel}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Nav cards */}
                            <div className="w-full mt-4">
                                <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
                                    {navCards.map((card) => (
                                        <div
                                            key={card.title}
                                            className="rounded-2xl p-6 cursor-pointer"
                                            style={{ background: "linear-gradient(to right, #ffffff, #ffffff)" }}
                                            onClick={() => navigate(card.route)}
                                        >
                                            <div className="mb-4">
                                                <h2 className="text-[#0A0A0A] font-[400] text-[18px] mb-1">{card.title}</h2>
                                                <p className="text-sm text-[#5F5F5F]/80">{card.desc}</p>
                                            </div>
                                            <button
                                                className="group cursor-pointer transition-all hover:brightness-[2] text-[15px] px-8 py-3 rounded-full w-auto border border-[#1E1E1E]/50 flex items-center gap-2"
                                                onClick={(e) => { e.stopPropagation(); navigate(card.route); }}
                                            >
                                                {t("ui.see_more", "Ver mais")}
                                                <ArrowRight size={14} className="group-hover:rotate-0 transition-all card-arrow -rotate-40" />
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
                                style={{ border: "2px solid rgba(255,255,255,0.28)" }}
                                title={lg.country_name}
                            >
                                <img src={lg.flag_url} alt={lg.country_name} className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Card Receita ──────────────────────────────────── */}
            <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                {!latestRev ? (
                    <NoFinancialData title={t("clubs.revenues", "Receitas")} />
                ) : (
                    <div className="flex flex-wrap w-full items-center">
                        <div className="w-full lg:w-1/2">
                            <div className="w-full">
                                <RevenueLineChart
                                    data={revenueChartData}
                                    ligasSelecionadas={[]}
                                    leagueMap={leagueMapLocal}
                                    mainLeagueId={chartLeagueId}
                                    leagueColor={leagueColorLocal}
                                />
                            </div>
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

            {/* ── Card Dívidas ──────────────────────────────────── */}
            <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                {!latestDebt ? (
                    <NoFinancialData title={t("clubs.debts", "Dívidas")} />
                ) : (
                    <div className="flex flex-wrap w-full items-center">
                        <div className="w-full lg:w-1/2">
                            <div className="w-full">
                                <DebtsBreakdownBarChart
                                    data={debtsChartData}
                                    ligasSelecionadas={[]}
                                    leagueMap={leagueMapLocal}
                                    mainLeagueId={chartLeagueId}
                                />
                            </div>
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

            {/* ── Card Resultado ────────────────────────────────── */}
            <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                {!latestNet ? (
                    <NoFinancialData title={t("clubs.result", "Resultado")} />
                ) : (
                    <div className="flex flex-wrap w-full items-center">
                        <div className="w-full lg:w-1/2">
                            <div className="w-full">
                                <NetResultLineChart
                                    data={netChartData}
                                    ligasSelecionadas={[]}
                                    leagueMap={leagueMapLocal}
                                    mainLeagueId={chartLeagueId}
                                    leagueColor={leagueColorLocal}
                                />
                            </div>
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

        </div>
    );
}
