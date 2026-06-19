import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { formatFinancial } from "../../../utils/formatFinancial";
import { clubLogo } from "../../../utils/clubUrl";
import {
    TrendingUp,
    Trophy, Users, ArrowRight, EyeOff,
} from "lucide-react";
import RevenueLineChart from "./components/revenue/RevenueLineChart";
import NetResultLineChart from "./components/netResult/NetResultLineChart";
import DebtsBreakdownBarChart from "./components/debts/DebtsBreakdownBarChart";
import PageLoader from "../../../components/uxui/PageLoader";

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
export default function PrePageClubs() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [theClub, setTheClub] = useState(null);
    const [financials, setFinancials] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { injectStyles(); }, []);

    useEffect(() => {
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

    function lighten(hex, amount = 0.2) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;

        const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount));
        const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount));
        const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount));

        return `rgb(${r}, ${g}, ${b})`;
    }

    const colorWOpacity = lighten(c1, 0.7);

    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);

    const background = `
        radial-gradient(circle at 20% 30%, ${c1} 0%, transparent 60%),
        radial-gradient(circle at 80% 70%, ${c2} 0%, transparent 60%),
        linear-gradient(135deg, ${c1}, ${c2}, ${c3})
    `.trim();

    const backgroundLine = `
        linear-gradient(to bottom, ${c1}, ${c3}, ${c2}, transparent)
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

    return (
        <div className="w-full overflow-hidden">

            {/* ── HEADER (faixa com gradiente do clube) ────────── */}
            <div className="rounded-2xl mb-4 relative overflow-hidden" style={{ background: background }}>

                {/* Overlay escuro para legibilidade */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)" }} />

                {/* Glow orbs decorativos */}
                <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none blur-3xl" style={{ background: glowPrimary }} />
                <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none blur-3xl" style={{ background: glowSecondary }} />

                <div className="relative z-10 px-5 sm:px-6 pt-4 pb-8">

                    {/* Linha principal: crest + nome + bandeira */}
                    <div className="flex items-start  gap-4 lg:p-5 flex-wrap">
                        <div className="shrink-0 w-14 h-14 lg:w-30 lg:h-30 xl:w-40 xl:h-40 flex items-center justify-center">
                            <img
                                src={clubLogo(theClub.club.crest_url, theClub.club.slug)}
                                alt={clubName}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="flex-1 min-w-0 border-b pb-4 pl-2" style={{ borderColor }}>
                            <h1 className="text-white font-light drop-shadow-md leading-tight truncate text-xl sm:text-2xl"
                                style={{
                                    color: textColor
                                }}
                            >
                                {clubName}
                            </h1>
                            {theClub.club.description && (
                                <span
                                    style={{
                                        color: textColor,
                                        borderColor: textColor
                                    }}
                                    className="inline-block mt-1 text-white text-xs border border-white/20 px-5 py-2 font-[300] rounded-full">
                                    {theClub.club.description}
                                </span>
                            )}
                            <div className="mt-4 flex gap-2 lg:flex-row flex-col lg:justify-between">
                                {(theClub.club.stadium_name) && (
                                    <>
                                        <div className="text-left pr-6">
                                            <span
                                                style={{
                                                    color: textColor,
                                                }}
                                                class="text-white font-[300] flex items-center gap-2 text-base">
                                                <svg
                                                    style={{
                                                        stroke: textColor,
                                                    }}
                                                    width="15" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1.21178 3.42684V0.686015L3.81043 2.05643L1.21178 3.42684ZM10.9583 3.42684V0.686015L13.5569 2.05643L10.9583 3.42684ZM6.40985 2.74163V0L9.00927 1.37122L6.40985 2.74163ZM5.8485 15C4.96437 14.9622 4.1647 14.8828 3.44951 14.7619C2.73432 14.6409 2.12049 14.4905 1.60803 14.3107C1.09557 14.1309 0.699578 13.9279 0.420054 13.7017C0.14053 13.4754 0.000511949 13.2384 0 12.9906V6.32397C0 6.03834 0.174574 5.77376 0.523723 5.53024C0.872872 5.28672 1.35871 5.07424 1.98124 4.89282C2.60377 4.71139 3.34251 4.56722 4.19747 4.46031C5.05242 4.3534 5.98673 4.29968 7.00038 4.29914C8.01404 4.2986 8.94835 4.35232 9.8033 4.46031C10.6583 4.5683 11.3973 4.71274 12.0203 4.89363C12.6433 5.07451 13.1289 5.28672 13.477 5.53024C13.8252 5.77376 13.9995 6.03834 14 6.32397V12.9897C14 13.2381 13.8602 13.4757 13.5807 13.7025C13.3012 13.9293 12.9052 14.1323 12.3927 14.3116C11.8808 14.4908 11.267 14.6409 10.5513 14.7619C9.83607 14.8828 9.0364 14.9622 8.15227 15V11.7756H5.8485V15ZM7.00038 7.53888C8.27155 7.53888 9.46158 7.43278 10.5705 7.22057C11.6793 7.00837 12.5077 6.72813 13.0555 6.37986C12.888 6.09422 12.2763 5.81102 11.2201 5.53024C10.164 5.24946 8.75739 5.10907 7.00038 5.10907C5.24338 5.10907 3.83705 5.24946 2.78142 5.53024C1.72578 5.81102 1.114 6.09449 0.946081 6.38067C1.49284 6.7284 2.26435 7.00837 3.2606 7.22057C4.25685 7.43278 5.50345 7.53888 7.00038 7.53888ZM5.08058 14.1309V10.9657H8.92019V14.1301C10.1315 14.0329 11.1052 13.8639 11.8414 13.6231C12.5776 13.3828 13.0414 13.1452 13.2328 12.9104V7.18979C12.3907 7.60124 11.4533 7.89714 10.4207 8.07748C9.38811 8.25783 8.248 8.34827 7.00038 8.34881C5.75277 8.34935 4.61266 8.25891 3.58006 8.07748C2.54746 7.89714 1.61008 7.60124 0.767923 7.18979V12.9112C0.959392 13.1455 1.39378 13.3831 2.07109 13.6239C2.7484 13.8642 3.75156 14.0332 5.08058 14.1309Z" fill="white" />
                                                </svg>
                                                {t("club.stadium", "Estádio")}
                                            </span>
                                            <p
                                                style={{
                                                    color: textColor,
                                                }}
                                                class="text-lg lg:text-[20px] text-white font-[400] flex leading-none mt-2 flex-col">
                                                {theClub.club.stadium_name}

                                                {theClub.club.stadium_capacity && (
                                                    <span class="text-sm font-[300] opacity-80">
                                                        {Number(theClub.club.stadium_capacity).toLocaleString("pt-BR")} {t("club.stadium_seats", "lugares")}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {theClub.hospitality?.hospitality_url && (
                                            <div
                                                className="flex-col lg:flex-row py-2 flex items-start w-auto"
                                            >
                                                <a
                                                    href={theClub.hospitality.hospitality_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#0A0A0A] font-[400] text-sm lg:text-[16px] bg-gradient-to-r to-white py-4 px-6 lg:px-6 lg:py-4 rounded-full transition-all hover:brightness-[1.1]"
                                                    style={{
                                                        background: `linear-gradient(to right, #ffffff, ${colorWOpacity})`
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {theClub.hospitality.description || t("club.hospitality", "Hospitalidade e camarotes")}
                                                </a>
                                                <svg class="w-[100px] mt-2 lg:ml-6 lg:w-[150px] invert" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1000 244.92">
                                                    <g>
                                                        <path class="st0" d="M72.8,151.71c-7.46,0-14.14-1.78-20.05-5.34-5.91-3.56-10.58-8.46-14.03-14.71-3.44-6.25-5.16-13.28-5.16-21.08s1.69-14.77,5.08-20.91c3.38-6.14,8.06-11.01,14.03-14.63,5.96-3.61,12.62-5.42,19.96-5.42,6.42,0,12.13,1.26,17.12,3.79,4.99,2.53,8.92,6.05,11.79,10.58,2.87,4.53,4.47,9.84,4.82,15.92v21.68c-.34,5.97-1.98,11.22-4.9,15.75-2.93,4.53-6.86,8.06-11.79,10.58-4.93,2.53-10.56,3.79-16.87,3.79ZM72.8,189.06c-8.49,0-15.95-1.55-22.37-4.65-6.43-3.1-11.65-7.46-15.66-13.08l10.15-10.15c3.33,4.24,7.28,7.49,11.88,9.72,4.59,2.24,10.04,3.36,16.35,3.36,8.26,0,14.86-2.21,19.79-6.63,4.93-4.42,7.4-10.36,7.4-17.81v-20.31l2.75-18.41-2.75-18.24v-21.51h15.49v78.48c0,7.8-1.81,14.66-5.42,20.57-3.61,5.91-8.66,10.5-15.14,13.77-6.48,3.27-13.97,4.91-22.46,4.91ZM75.72,137.08c5.16,0,9.64-1.09,13.42-3.27,3.79-2.18,6.74-5.25,8.86-9.21,2.12-3.96,3.18-8.58,3.18-13.85s-1.06-9.9-3.18-13.85c-2.12-3.96-5.11-7.06-8.95-9.29-3.85-2.24-8.29-3.36-13.34-3.36s-9.7,1.12-13.6,3.36c-3.9,2.24-6.97,5.34-9.21,9.29s-3.36,8.52-3.36,13.68,1.12,9.75,3.36,13.77c2.24,4.02,5.34,7.14,9.29,9.38,3.96,2.24,8.46,3.36,13.51,3.36Z" />
                                                        <path class="st0" d="M168.14,154.81c-7.92,0-15.09-1.89-21.51-5.68-6.43-3.79-11.53-8.92-15.32-15.4-3.79-6.48-5.68-13.74-5.68-21.77s1.89-15.06,5.68-21.43,8.89-11.44,15.32-15.23c6.42-3.79,13.6-5.68,21.51-5.68s15.29,1.87,21.77,5.59c6.48,3.73,11.62,8.81,15.4,15.23,3.79,6.43,5.68,13.6,5.68,21.51s-1.89,15.29-5.68,21.77c-3.79,6.48-8.92,11.62-15.4,15.4-6.48,3.79-13.74,5.68-21.77,5.68ZM168.14,139.83c5.28,0,9.92-1.2,13.94-3.61,4.02-2.41,7.17-5.71,9.47-9.9,2.29-4.19,3.44-8.98,3.44-14.37s-1.18-9.98-3.53-14.11c-2.35-4.13-5.51-7.37-9.47-9.72-3.96-2.35-8.58-3.53-13.85-3.53s-9.58,1.18-13.6,3.53c-4.02,2.35-7.17,5.59-9.47,9.72-2.3,4.13-3.44,8.84-3.44,14.11s1.15,10.18,3.44,14.37c2.29,4.19,5.45,7.49,9.47,9.9,4.01,2.41,8.55,3.61,13.6,3.61Z" />
                                                        <path class="st0" d="M220.8,153.09V50.05h15.49v103.03h-15.49Z" />
                                                        <path class="st0" d="M286.03,154.81c-7.46,0-14.17-1.86-20.14-5.59-5.97-3.73-10.7-8.8-14.2-15.23-3.5-6.42-5.25-13.65-5.25-21.68s1.75-15.26,5.25-21.68c3.5-6.42,8.23-11.53,14.2-15.32,5.96-3.79,12.68-5.68,20.14-5.68,6.2,0,11.76,1.29,16.69,3.87,4.93,2.58,8.92,6.14,11.96,10.67,3.04,4.53,4.73,9.78,5.08,15.75v24.61c-.34,5.85-2.01,11.07-4.99,15.66-2.99,4.59-6.94,8.17-11.87,10.76-4.93,2.58-10.56,3.87-16.87,3.87ZM288.61,140.18c5.16,0,9.69-1.2,13.6-3.61,3.9-2.41,6.94-5.71,9.12-9.9,2.18-4.19,3.27-8.98,3.27-14.37s-1.09-10.35-3.27-14.54c-2.18-4.19-5.22-7.49-9.12-9.9-3.9-2.41-8.43-3.61-13.6-3.61s-9.7,1.18-13.6,3.53c-3.9,2.35-6.97,5.62-9.21,9.81-2.24,4.19-3.36,9.04-3.36,14.54s1.12,10.39,3.36,14.63c2.24,4.25,5.34,7.55,9.29,9.9,3.96,2.35,8.46,3.53,13.51,3.53ZM329.22,153.09h-15.66v-18.47l2.93-16.74-2.93-16.59v-51.23h15.66v103.03Z" />
                                                        <path class="st0" d="M382.23,154.81c-8.26,0-15.63-1.86-22.11-5.59-6.48-3.73-11.62-8.8-15.4-15.23-3.79-6.42-5.68-13.71-5.68-21.86s1.86-15.26,5.59-21.68c3.73-6.42,8.78-11.5,15.15-15.23,6.37-3.73,13.51-5.59,21.43-5.59,7.46,0,14.11,1.72,19.96,5.16,5.85,3.44,10.41,8.2,13.68,14.28,3.27,6.08,4.9,13.02,4.9,20.82,0,1.15-.06,2.38-.17,3.7-.12,1.32-.34,2.78-.69,4.39h-69.01v-12.91h60.75l-5.68,4.99c0-5.51-.98-10.18-2.93-14.03-1.95-3.84-4.71-6.82-8.26-8.95-3.56-2.12-7.86-3.18-12.91-3.18s-9.93,1.15-13.94,3.44c-4.02,2.3-7.12,5.51-9.29,9.64-2.18,4.13-3.27,9.01-3.27,14.63s1.15,10.76,3.44,15.06c2.29,4.3,5.56,7.63,9.81,9.98,4.24,2.35,9.12,3.53,14.63,3.53,4.59,0,8.8-.8,12.65-2.41,3.84-1.61,7.14-4.01,9.9-7.23l9.98,10.15c-4.02,4.59-8.84,8.09-14.46,10.5-5.62,2.41-11.65,3.61-18.07,3.61Z" />
                                                        <path class="st0" d="M429.21,153.09v-81.75h15.49v81.75h-15.49ZM486.86,153.09v-47.67c0-6.2-1.92-11.3-5.77-15.32-3.85-4.01-8.86-6.02-15.06-6.02-4.13,0-7.8.92-11.02,2.75-3.21,1.84-5.74,4.36-7.57,7.57-1.84,3.21-2.75,6.88-2.75,11.01l-6.37-3.61c0-6.2,1.38-11.7,4.13-16.52,2.75-4.82,6.6-8.63,11.53-11.45,4.93-2.81,10.5-4.22,16.69-4.22s11.67,1.55,16.44,4.65c4.76,3.1,8.52,7.14,11.27,12.13s4.13,10.3,4.13,15.92v50.77h-15.66Z" />
                                                    </g>
                                                    <g>
                                                        <path class="st0" d="M711.62,154.79c-7.5,0-14.21-1.79-20.15-5.36-5.94-3.57-10.64-8.5-14.09-14.78-3.46-6.28-5.19-13.34-5.19-21.18s1.7-14.84,5.1-21.01c3.4-6.17,8.1-11.07,14.09-14.7,5.99-3.63,12.68-5.45,20.06-5.45,6.45,0,12.19,1.27,17.21,3.8,5.01,2.54,8.96,6.08,11.85,10.64,2.88,4.55,4.5,9.89,4.84,16v21.79c-.35,6-1.99,11.27-4.93,15.82-2.94,4.55-6.89,8.1-11.85,10.63-4.96,2.54-10.61,3.8-16.95,3.8ZM711.62,192.32c-8.53,0-16.03-1.56-22.48-4.67-6.46-3.11-11.7-7.49-15.74-13.14l10.2-10.2c3.34,4.26,7.32,7.52,11.93,9.77,4.61,2.25,10.09,3.37,16.43,3.37,8.3,0,14.93-2.22,19.89-6.66,4.96-4.44,7.44-10.4,7.44-17.9v-20.41l2.77-18.5-2.77-18.33v-21.62h15.56v78.85c0,7.84-1.82,14.73-5.45,20.66-3.63,5.94-8.71,10.55-15.22,13.83-6.51,3.29-14.04,4.93-22.57,4.93ZM714.56,140.1c5.19,0,9.68-1.09,13.49-3.29,3.8-2.19,6.77-5.27,8.91-9.25,2.13-3.98,3.2-8.62,3.2-13.92s-1.07-9.94-3.2-13.92c-2.13-3.98-5.13-7.09-8.99-9.34-3.86-2.25-8.33-3.37-13.4-3.37s-9.74,1.12-13.66,3.37c-3.92,2.25-7,5.36-9.25,9.34-2.25,3.98-3.37,8.56-3.37,13.75s1.12,9.8,3.37,13.83c2.25,4.04,5.36,7.18,9.34,9.42s8.5,3.37,13.57,3.37Z" />
                                                        <path class="st0" d="M807.42,157.91c-7.95,0-15.16-1.9-21.62-5.71-6.46-3.8-11.59-8.96-15.39-15.48-3.8-6.51-5.71-13.8-5.71-21.87s1.9-15.13,5.71-21.53c3.8-6.4,8.93-11.5,15.39-15.3,6.46-3.8,13.66-5.71,21.62-5.71s15.36,1.88,21.88,5.62c6.51,3.75,11.67,8.85,15.48,15.3,3.8,6.46,5.71,13.66,5.71,21.62s-1.9,15.36-5.71,21.87c-3.8,6.52-8.97,11.67-15.48,15.48-6.51,3.8-13.81,5.71-21.88,5.71ZM807.42,142.86c5.3,0,9.97-1.21,14.01-3.63,4.03-2.42,7.2-5.73,9.51-9.94,2.3-4.21,3.46-9.02,3.46-14.44s-1.18-10.03-3.54-14.18c-2.36-4.15-5.53-7.41-9.51-9.77-3.98-2.36-8.62-3.55-13.92-3.55s-9.63,1.18-13.66,3.55c-4.04,2.36-7.21,5.62-9.51,9.77-2.31,4.15-3.46,8.88-3.46,14.18s1.15,10.23,3.46,14.44c2.3,4.21,5.47,7.52,9.51,9.94,4.03,2.42,8.59,3.63,13.66,3.63Z" />
                                                        <path class="st0" d="M895.26,157.91c-7.61,0-14.44-1.87-20.49-5.62-6.05-3.74-10.84-8.85-14.35-15.3-3.52-6.46-5.27-13.72-5.27-21.79s1.76-15.33,5.27-21.79c3.52-6.45,8.3-11.59,14.35-15.39,6.05-3.8,12.88-5.71,20.49-5.71,6.23,0,11.79,1.3,16.69,3.89,4.9,2.59,8.85,6.17,11.85,10.72,3,4.55,4.67,9.83,5.02,15.82v24.73c-.35,5.88-1.99,11.13-4.93,15.74-2.94,4.61-6.89,8.21-11.85,10.81-4.96,2.59-10.55,3.89-16.77,3.89ZM897.86,143.21c7.72,0,13.95-2.62,18.68-7.87,4.73-5.24,7.09-11.96,7.09-20.15,0-5.53-1.1-10.43-3.29-14.7-2.19-4.26-5.22-7.58-9.08-9.94-3.86-2.36-8.39-3.55-13.57-3.55s-9.77,1.21-13.75,3.63-7.09,5.74-9.34,9.94c-2.25,4.21-3.37,9.02-3.37,14.44s1.12,10.41,3.37,14.61c2.25,4.21,5.39,7.52,9.42,9.94,4.03,2.42,8.65,3.63,13.83,3.63ZM922.58,156.18v-22.14l2.94-20.06-2.94-19.89v-20.06h15.74v82.14h-15.74Z" />
                                                        <path class="st0" d="M953.54,156.18V52.65h15.56v103.53h-15.56Z" />
                                                    </g>
                                                    <g>
                                                        <g id="lChx2i.tif">
                                                            <path class="st0" d="M592.46,173.59l-7.45,16.96c-2.71,5.79-5.59,11.42-8.57,17.02-.91,1.71,1.47,3.24,2.64,1.69,21.36-28.22,45.86-65.99,56.78-94.38,1.73-4.49,2.76-8.84,3.36-13.61.8-6.36.16-12.63-1.63-18.85-2.56-8.87-7.63-16.53-14.4-22.77-9.88-9.1-23.51-14.72-36.47-17.88-10.06-2.46-20.12-3.45-30.49-4.29-.04,0-.09,0-.13,0h-33.68s-.08,0-.12,0c-6.19.49-12.26.92-18.36,1.52-1.86.18-1.89,2.9-.03,3.12,5.95.72,11.87,1.55,17.83,2.62,6.9,1.28,13.45,2.76,20.22,4.55,27.39,7.75,53.09,21.32,60.74,51,4.1,15.92,2.42,32.09-1.7,47.92-2.27,8.7-4.87,17.04-8.54,25.38Z" />
                                                        </g>
                                                        <path class="st0" d="M597.22,103.17c-4.5-17.48-15.27-29.36-28.95-37.77-2.03-1.25-4.65-.89-6.3.84-7.13,7.5-11.51,17.63-11.51,28.8,0,23.09,18.72,41.81,41.81,41.81.67,0,1.34-.02,2.01-.05,2.49-.12,4.5-2.04,4.76-4.51,1.02-9.71.66-19.46-1.83-29.12Z" />
                                                    </g>
                                                </svg>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── CONTENT (fundo neutro escuro) ─────────────────── */}
                        <div className="w-full mt-4">
                            {!isHidden && (
                                <div className="grid lg:grid-cols-3 gap-1 lg:gap-4 sm:gap-5">
                                    {navCards.map((card, i) => (
                                        <div
                                            key={card.title}
                                            className="flex items-center justify-between border rounded-2xl p-2 px-5 pr-2 lg:p-4 lg:px-6 cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #ffffff, #ffffff)`
                                            }}
                                            onClick={() => navigate(card.route)}
                                        >
                                            <div className="w-1/3 lg:w-auto">
                                                <h2 className="text-[#0A0A0A] font-[400] text-[16px] mb-0 leading-none">
                                                    {card.title}
                                                </h2>
                                                {/* <p className="text-sm text-[#5F5F5F]/80">{card.desc}</p> */}
                                            </div>

                                            <button
                                                class="group cursor-pointer transition-all hover:brightness-[2] text-[15px] px-8 py-3 rounded-full w-auto border border-[#1E1E1E]/50 flex items-center gap-2"
                                                onClick={e => { e.stopPropagation(); navigate(card.route); }}

                                            >
                                                {t("ui.see_more", "Ver mais")}
                                                <ArrowRight size={14} className="group-hover:rotate-0 transition-all card-arrow -rotate-40" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {theClub.club.flag_url && (
                            <div
                                className="absolute top-6 right-6 shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-lg"
                                style={{ border: "2px solid rgba(255,255,255,0.28)" }}
                                title={theClub.club.country_name}
                            >
                                <img
                                    src={theClub.club.flag_url}
                                    alt={theClub.club.country_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>

                    {/* Banner clube oculto */}
                    {isHidden && (
                        <div
                            className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3 text-xs font-semibold"
                            style={{
                                background: "rgba(0,0,0,0.30)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "rgba(255,255,255,0.7)",
                            }}
                        >
                            <EyeOff size={13} className="shrink-0 opacity-70" />
                            Este clube está oculto e é usado apenas para marcação de dados.
                        </div>
                    )}
                </div>
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
