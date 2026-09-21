import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { formatFinancial } from "../../../utils/formatFinancial";
import { clubLogo, handleCrestRetry } from "../../../utils/clubUrl";
import { getStadiumSlug } from "../../../data/stadiums";
import {
    TrendingUp,
    Trophy, Users, EyeOff,
} from "lucide-react";
import RevenueLineChart from "./components/revenue/RevenueLineChart";
import NetResultLineChart from "./components/netResult/NetResultLineChart";
import DebtsBreakdownBarChart from "./components/debts/DebtsBreakdownBarChart";
import PageLoader from "../../../components/uxui/PageLoader";
import ClubHeaderO from "./components/header/ClubHeaderO";

function NoFinancialData({ title }) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center py-14 text-center">
            {title && <p className="text-base font-semibold text-gray-500 mb-3">{title}</p>}
            <p className="font-semibold text-[#0A0A0A] text-lg">
                {t("finance.no_data_title", "Ah, não!")}
            </p>
            <p className="text-sm text-gray-400 max-w-xs mt-2">
                {t("finance.no_data_desc", "Esses dados não estão disponíveis no documento publicado pelo clube.")}
            </p>
        </div>
    );
}

/* ─── Utilitários de cor ───────────────────────────────────────── */

function resolveColors(primary, secondary, tertiary) {
    const c1 = primary || "#1a1a2e";
    const c2 = secondary || c1;
    const c3 = tertiary || c2;
    return [c1, c2, c3];
}


/* ─── Keyframes ────────────────────────────────────────────────── */
const STYLE_ID = "club-prepage-styles";

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
        @keyframes cardIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes barGrow {
            from { transform: scaleY(0); opacity: 0; }
            to   { transform: scaleY(1); opacity: 1; }
        }
        .club-card {
            transition: transform 0.28s ease, box-shadow 0.28s ease,
                        background 0.28s ease, border-color 0.28s ease;
        }
        .club-card:hover { transform: translateY(-5px) scale(1.015); }
        .club-card .card-arrow { transition: transform 0.22s ease; }
        .club-card:hover .card-arrow { transform: translateX(5px); }
        .cta-btn { transition: background 0.2s ease, border-color 0.2s ease; }
        .finance-bar {
            transform-origin: bottom;
            animation: barGrow 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) both;
        }
    `;
    document.head.appendChild(el);
}



/* ─── Componente principal ─────────────────────────────────────── */
export default function PrePageClubs({ initialData } = {}) {
    const { t } = useTranslation();
    const { id } = useParams();

    const [theClub, setTheClub] = useState(initialData?.theClub ?? null);
    const [financials, setFinancials] = useState(initialData?.financials ?? null);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => { injectStyles(); }, []);

    useEffect(() => {
        if (initialData) return;

        async function loadDashboard() {
            try {
                setLoading(true);
                const [res, revRes, netRes, netEvoRes, debtEvRes, debtBrkRes] = await Promise.all([
                    api.get(`/dashboard/clubs/${id}/info`),
                    api.get(`/dashboard/clubs/${id}/financials/revenues`),
                    api.get(`/dashboard/clubs/${id}/financials/net-result`),
                    api.get(`/dashboard/clubs/${id}/financials/net-result/evolution`),
                    api.get(`/dashboard/clubs/${id}/financials/debts/evolution`),
                    api.get(`/dashboard/clubs/${id}/financials/debts/breakdown`),
                ]);
                setTheClub(res.data);
                setFinancials({
                    revenues: revRes.data?.data || [],
                    netResult: netRes.data?.data || [],
                    netEvolution: netEvoRes.data?.data || [],
                    debts: debtEvRes.data?.data || [],
                    debtsBreakdown: debtBrkRes.data?.data || [],
                    currency: revRes.data?.fromCurrency || "BRL",
                });
            } catch (err) {
                console.error("Erro ao carregar dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, [id]);

    if (loading || !theClub) return <PageLoader />;

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

    const fCurrency = financials?.currency || "BRL";

    // Receita
    const revData = (financials?.revenues || []).filter(r => r.code === "revenue");
    const [latestRev, prevRev] = getLatestTwo(revData);
    const revPct = latestRev && prevRev ? calcPct(latestRev.value, prevRev.value) : null;

    // Dívida
    const [latestDebt, prevDebt] = getLatestTwo(financials?.debts || []);
    const debtPct = latestDebt && prevDebt ? calcPct(latestDebt.value, prevDebt.value) : null;

    // Resultado líquido
    const netData = (financials?.netResult || []).filter(r => r.code === "net_income");
    const [latestNet, prevNet] = getLatestTwo(netData);

    const isHidden = theClub.club.hidden === true;
    const { primary_color, secondary_color, tertiary_color } = theClub.club;
    const [c1, c2, c3] = resolveColors(primary_color, secondary_color, tertiary_color);

    // Dados para os gráficos (mesmo formato do DashClubUniques)
    const chartClubId = Number(id);
    const clubMapLocal = { [chartClubId]: theClub.club.name };
    const clubColorMapLocal = { [chartClubId]: { color_one: c1, color_two: c2 } };

    // Gráficos sempre na moeda nativa do clube: sobrescreve converted_value com value
    const toNative = (arr) => (arr || []).filter(item => item.value != null && Number(item.value) !== 0).map(item => ({ ...item, converted_value: item.value }));
    const revenueChartData = { [chartClubId]: toNative(financials?.revenues) };
    const netChartData = { [chartClubId]: toNative(financials?.netEvolution) };
    const debtsChartData = { [chartClubId]: toNative(financials?.debtsBreakdown) };

    const backgroundLine = `
        linear-gradient(to bottom, ${c1}, ${c3}, ${c2}, transparent)
    `.trim();

    const clubName = theClub.club.name;

    const navCards = [
        {
            title: 'Indicadores financeiros',
            desc: t("clubs.finances_desc", "Receitas, custos, EBITDA, endividamento e mais."),
            route: `/dashboard/clubs/finance/${id}`,
            Icon: TrendingUp,
        },
        {
            title: t("clubs.sports_results", "Resultados esportivos"),
            desc: t("clubs.sports_desc", "Histórico de partidas e resultados por temporada."),

            route: `/dashboard/clubs/competitions/${id}`,
            Icon: Trophy,
        },
        {
            title: 'Elenco de atletas',
            desc: t("clubs.squad_desc", "Características de atletas e estratégia no mercado."),
            route: `/dashboard/clubs/club-players/${id}`,
            Icon: Users,
        },
    ];

    // Estádio (mesmo link/estado da testeira original) — usado pelas testeiras em teste C e D.
    const stadiumInfo = theClub.club.stadium_name ? {
        name: theClub.club.stadium_name,
        capacity: theClub.club.stadium_capacity,
        to: `/stadiums/${getStadiumSlug(theClub.club.stadium_name)}`,
        state: {
            club: {
                id: theClub.club.id_club,
                name: clubName,
                slug: theClub.club.slug,
                crest_url: theClub.club.crest_url,
                country: theClub.club.country_name,
                stadium_name: theClub.club.stadium_name,
                stadium_capacity: theClub.club.stadium_capacity,
                latitude: theClub.club.stadium_latitude != null ? Number(theClub.club.stadium_latitude) : null,
                longitude: theClub.club.stadium_longitude != null ? Number(theClub.club.stadium_longitude) : null,
                countryCode: theClub.club.stadium_country_code,
            },
        },
    } : null;
    const headerProps = {
        club: theClub.club,
        crestSrc: clubLogo(theClub.club.crest_url, theClub.club.slug),
        onCrestError: handleCrestRetry,
        color1: c1,
        color2: c2,
        navCards,
        showNav: !isHidden,
        stadium: stadiumInfo,
        // Mesma regra da testeira original: só existe se o clube tem estádio e link de hospitalidade.
        hospitality: stadiumInfo && theClub.hospitality?.hospitality_url ? {
            url: theClub.hospitality.hospitality_url,
            label: theClub.hospitality.description || t("club.hospitality", "Hospitalidade e camarotes"),
        } : null,
    };

    return (
        <div className="w-full overflow-hidden">

            {/* ── Testeira do clube (Opção O · Bicolor) ────────── */}
            {isHidden && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    <EyeOff size={13} className="shrink-0 opacity-70" />
                    Este clube está oculto e é usado apenas para marcação de dados.
                </div>
            )}
            <div className="mb-4">
                <ClubHeaderO {...headerProps} />
            </div>

            {/* ── Card Receita ─────────────────────────────────── */}
            <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                {!latestRev ? <NoFinancialData title={t("clubs.revenues", "Receitas")} /> : (
                    <div className="flex flex-wrap w-full items-center">
                        <div className="w-full lg:w-1/2">
                            <div className="w-full">
                                <RevenueLineChart
                                    data={revenueChartData}
                                    clubesSelecionados={[]}
                                    clubMap={clubMapLocal}
                                    mainClubId={chartClubId}
                                    clubColorMap={clubColorMapLocal}
                                />
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                            <h2
                                style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6">
                                <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                                {t("clubs.revenues", "Receitas")} {` em ${latestRev.year}`}
                            </h2>
                            <p style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                className="text-lg font-light lg:text-xl xl:text-2xl">
                                {`O ${clubName} registrou receita de ${formatMoney(latestRev.value, fCurrency)} em ${latestRev.year}${revPct != null ? `, ${revPct >= 0 ? "aumento" : "redução"} de ${Math.abs(revPct).toFixed(1)}% em relação a ${prevRev.year}` : ""}.`}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Card Dívidas ──────────────────────────────────── */}
            <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                {!latestDebt ? <NoFinancialData title={t("clubs.debts", "Dívidas")} /> : (
                    <div className="flex flex-wrap w-full items-center">
                        <div className="w-full lg:w-1/2">
                            <div className="w-full">
                                <DebtsBreakdownBarChart
                                    data={debtsChartData}
                                    clubesSelecionados={[]}
                                    clubMap={clubMapLocal}
                                    mainClubId={chartClubId}
                                />
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                            <h2
                                style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6">
                                <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                                {t("clubs.debts", "Dívidas")} {` em ${latestDebt.year}`}
                            </h2>
                            <p style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                className="text-lg font-light lg:text-xl xl:text-2xl">
                                {`O ${clubName} encerrou ${latestDebt.year} com dívida líquida de ${formatMoney(latestDebt.value, fCurrency)}${debtPct != null ? `, ${debtPct >= 0 ? "aumento" : "redução"} de ${Math.abs(debtPct).toFixed(1)}% em relação a ${prevDebt.year}` : ""}.`}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Card Resultado ────────────────────────────────── */}
            <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
                {!latestNet ? <NoFinancialData title={t("clubs.result", "Resultado")} /> : (
                    <div className="flex flex-wrap w-full items-center">
                        <div className="w-full lg:w-1/2">
                            <div className="w-full">
                                <NetResultLineChart
                                    data={netChartData}
                                    clubesSelecionados={[]}
                                    clubMap={clubMapLocal}
                                    mainClubId={chartClubId}
                                    clubColorMap={clubColorMapLocal}
                                />
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 pl-0 pt-8 lg:pt-0 lg:pl-10">
                            <h2
                                style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6">
                                <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                                {t("clubs.result", "Resultado")} {` em ${latestNet.year}`}
                            </h2>
                            <p style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                className="text-lg font-light lg:text-xl xl:text-2xl">
                                {`O ${clubName} teve ${latestNet.value >= 0 ? "lucro" : "prejuízo"} de ${formatMoney(Math.abs(latestNet.value), fCurrency)} em ${latestNet.year}${prevNet ? `, ${latestNet.value >= prevNet.value ? "acima" : "abaixo"} ${prevNet.value >= 0 ? "do lucro" : "do prejuízo"} de ${formatMoney(Math.abs(prevNet.value), fCurrency)} registrado em ${prevNet.year}` : ""}.`}
                            </p>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}
