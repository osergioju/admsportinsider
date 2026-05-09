import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import {
    TrendingUp,
    Trophy, Users, ArrowRight, EyeOff,
} from "lucide-react";
import RevenueLineChart from "./components/revenue/RevenueLineChart";
import NetResultLineChart from "./components/netResult/NetResultLineChart";
import DebtsBreakdownBarChart from "./components/debts/DebtsBreakdownBarChart";

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
                    currency: revRes.data?.toCurrency || "BRL",
                });
            } catch (err) {
                console.error("Erro ao carregar dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, [id]);

    if (loading || !theClub) return null;

    /* ─── Helpers financeiros ──────────────────────────────────── */
    function formatMoney(value, currency) {
        if (value == null) return "—";
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: currency || "BRL",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(value);
    }

    function getLatestTwo(arr) {
        const sorted = [...arr].sort((a, b) => b.year - a.year);
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
    const revPct = latestRev && prevRev ? calcPct(latestRev.converted_value, prevRev.converted_value) : null;

    // Dívida
    const [latestDebt, prevDebt] = getLatestTwo(financials?.debts || []);
    const debtPct = latestDebt && prevDebt ? calcPct(latestDebt.converted_value, prevDebt.converted_value) : null;

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
    const revenueChartData = { [chartClubId]: financials?.revenues || [] };
    const netChartData = { [chartClubId]: financials?.netEvolution || [] };
    const debtsChartData = { [chartClubId]: financials?.debtsBreakdown || [] };

    function lighten(hex, amount = 0.2) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;

        const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount));
        const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount));
        const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount));

        return `rgb(${r}, ${g}, ${b})`;
    }

    const colorWOpacity = lighten(c1, 0.7);

    const background = `
        linear-gradient(83.98deg, ${c1} 35.41%, ${c3} 83.12%, ${c2} 100%)
    `.trim();

    const backgroundLine = `
        linear-gradient(to bottom, ${c1}, ${c3}, ${c2}, transparent)
    `.trim();

    const colors = [c1, c2, c3];

    const lightCount = colors.filter(c => {
        const rgb = hexToRgb(c);
        if (!rgb) return false;

        const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return lum > 0.6;
    }).length;

    const textColor = lightCount >= 5 ? "#0A0A0A" : "#FFFFFF";

    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    const glowPrimary = rgb1 ? `rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.6)` : "rgba(0,0,0,0.3)";
    const glowSecondary = rgb2 ? `rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.45)` : glowPrimary;

    const clubName = theClub.club.name;

    const navCards = [
        {
            title: t("clubs.finances", "Finanças"),
            desc: t("clubs.finances_desc", "Receitas, custos, folha salarial, dívidas e resultado financeiro líquido."),
            route: `/dashboard/clubs/finance/${id}`,
            Icon: TrendingUp,
        },
        {
            title: t("clubs.sports_results", "Resultados esportivos"),
            desc: t("clubs.sports_desc", "Desempenho nas competições, histórico de partidas e estatísticas por temporada."),

            route: `/dashboard/clubs/competitions/${id}`,
            Icon: Trophy,
        },
        {
            title: t("clubs.main_squad", "Elenco principal"),
            desc: t("clubs.squad_desc", "Jogadores do elenco, posições, idades e perfis individuais detalhados."),
            route: `/dashboard/clubs/club-players/${id}`,
            Icon: Users,
        },
    ];

    return (
        <div className="w-full overflow-hidden">

            {/* ── HEADER (faixa com gradiente do clube) ────────── */}
            <div className="rounded-2xl mb-4 relative overflow-hidden" style={{ background: background }}>

                <div className="relative z-10 px-5 sm:px-6 pt-4 pb-8">

                    {/* Linha principal: crest + nome + bandeira */}
                    <div className="flex items-center gap-4 lg:p-5 flex-wrap">
                        <div className="shrink-0 w-14 h-14 lg:w-30 lg:h-30 xl:w-40 xl:h-40 flex items-center justify-center">
                            <img
                                src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_${theClub.club.crest_url}.webp`}
                                alt={clubName}
                                className="w-full h-full object-contain drop-shadow-lg"
                            />
                        </div>

                        <div className="flex-1 min-w-0 border-b border-white/40 pb-4 pl-2">
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
                            <div className="mt-4 flex gap-2">
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
                                                className="py-2 flex items-center w-auto"
                                            >
                                                <a
                                                    href={theClub.hospitality.hospitality_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#0A0A0A] font-[400] text-[18px] bg-gradient-to-r to-white py-4 px-6 lg:px-8 rounded-full transition-all hover:brightness-[1.1]"
                                                    style={{
                                                        background: `linear-gradient(to right, #ffffff, ${colorWOpacity})`
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {theClub.hospitality.description || t("club.hospitality", "Hospitalidade e camarotes")}
                                                </a>
                                                <svg class="ml-6 w-[150px]" viewBox="0 0 125 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.3575 5.02226C12.4873 5.12219 13.7711 5.04724 14.9265 5.39698C17.4684 6.19637 18.213 8.61953 16.7238 10.7929C15.2346 12.9662 11.8197 13.9655 9.3548 12.9163C7.89127 12.2917 7.14666 11.1676 7.19802 9.54382C7.19802 9.26903 7.19802 8.99424 7.19802 8.56956C6.83855 8.84436 6.60747 9.09417 6.29936 9.21907C6.0426 9.34398 5.63178 9.41892 5.42637 9.29401C5.22096 9.16911 5.04123 8.74443 5.06691 8.49462C5.19529 7.49538 5.73448 6.72097 6.58179 6.17139C7.17234 5.79667 7.71154 6.09644 7.78857 6.77093C7.81424 6.97078 7.78857 7.17063 7.78857 7.42044C8.6102 6.77093 9.38048 6.14641 10.3305 5.39698C9.86832 5.47192 9.58589 5.59682 9.30345 5.57184C9.02102 5.54686 8.68723 5.42196 8.48182 5.22211C8.37911 5.12219 8.50749 4.69751 8.66155 4.54762C9.56021 3.67329 10.6386 3.17367 11.9224 3.19865C12.513 3.19865 12.7184 3.67329 12.3332 4.12295C11.9994 4.52264 11.5886 4.82241 11.3575 5.02226Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M19.0869 10.8179C20.7302 10.8179 21.5518 12.0419 20.8072 13.5158C20.0369 15.0147 18.7531 15.964 16.9558 16.0139C15.2098 16.0639 14.6193 14.9647 15.1585 13.4159C15.6463 11.992 17.5207 10.8179 19.0869 10.8179Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M20.7297 9.89353C19.2405 9.89353 17.9054 8.56954 17.931 7.07068C17.931 5.97151 18.727 5.17212 19.7797 5.17212C21.2432 5.17212 22.7838 6.67098 22.7581 8.0949C22.7324 9.21904 21.9622 9.91851 20.7297 9.89353Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.9211 17.3128C10.2279 17.1379 9.50895 16.988 8.86705 16.7382C8.22515 16.4884 7.7373 15.9638 7.7373 15.2393C7.7373 14.5149 8.25083 14.0902 8.9184 13.8904C10.2022 13.4657 11.486 13.4907 12.6928 14.0902C13.3604 14.415 13.8996 14.9396 13.7455 15.7889C13.5914 16.6383 12.8468 16.9131 12.1279 17.1379C11.7684 17.2378 11.3833 17.2128 10.9982 17.2378C10.9468 17.2378 10.9468 17.2628 10.9211 17.3128Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M24.2727 11.6172C25.7619 11.6172 26.4038 12.6414 25.7876 13.7905C25.2227 14.8148 23.8362 15.4393 22.8349 15.1145C21.8849 14.7898 21.5254 13.9654 21.9876 13.0911C22.4754 12.1418 23.3227 11.6921 24.2727 11.6172Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5148 20.4356C12.9242 20.2857 12.462 20.2108 12.0512 20.0359C11.1782 19.6112 11.1269 18.6869 11.9229 18.1373C12.8985 17.4878 13.9769 17.4629 15.0297 17.8625C15.954 18.2123 16.0567 19.1865 15.2351 19.7361C14.7472 20.0859 14.054 20.2108 13.5148 20.4356Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M16.3901 5.27209C15.6969 5.04726 14.9266 4.92235 14.2333 4.5976C13.4631 4.22288 13.5144 3.57338 14.259 3.17368C15.209 2.6241 17.5199 2.749 18.3672 3.37353C19.0091 3.84817 18.9834 4.47269 18.2645 4.79745C17.7253 5.02228 17.1091 5.09722 16.3901 5.27209Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.55801 12.7413C7.60936 13.4158 7.3526 13.9654 6.7107 14.2152C6.04313 14.49 5.47825 14.1403 5.06744 13.6656C4.55392 13.0411 4.19445 12.3167 4.45121 11.4923C4.785 10.3931 5.88907 10.0684 6.68503 10.8927C7.14719 11.3924 7.40395 12.0668 7.73774 12.6414C7.68639 12.6664 7.60936 12.6914 7.55801 12.7413Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0124 2.39917C21.6029 2.67396 22.1421 2.84883 22.5273 3.1486C22.7584 3.34845 22.9381 3.82309 22.8611 4.09788C22.7584 4.34769 22.2962 4.64746 22.0138 4.64746C21.5002 4.62248 20.9354 4.47259 20.5245 4.17282C20.2421 3.97297 19.934 3.42339 20.011 3.17358C20.0881 2.84883 20.6016 2.67396 21.0124 2.39917Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.88892 16.0638C5.63216 16.4135 5.47811 16.8881 5.19567 16.9631C4.91323 17.038 4.42539 16.8132 4.21998 16.5384C3.96322 16.2137 3.75781 15.739 3.75781 15.3393C3.75781 15.0146 4.04025 14.5649 4.32269 14.415C4.52809 14.3151 5.06729 14.5399 5.24702 14.7648C5.52946 15.0895 5.65784 15.5392 5.88892 16.0638Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.2321 2.74893C12.9496 2.57407 12.6672 2.3992 12.3848 2.22433C12.6672 2.02448 12.924 1.72471 13.2321 1.62479C13.6686 1.52486 14.1307 1.52486 14.5672 1.59981C15.0037 1.67475 15.0807 2.02448 14.6699 2.24931C14.2848 2.47414 13.8226 2.57407 13.2321 2.74893Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.34845 8.91925C4.32277 9.71864 3.7579 10.518 3.34708 10.4681C3.19303 10.4431 2.93627 10.1433 2.93627 9.96845C2.91059 9.3689 3.57817 8.49457 3.98898 8.54453C4.14304 8.59449 4.2971 8.86928 4.34845 8.91925Z" fill="white" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.58196 5.62165C6.4279 5.24693 6.3252 5.07206 6.3252 4.8972C6.3252 4.77229 6.47925 4.59743 6.63331 4.54746C7.09548 4.32263 7.58332 4.17275 8.07117 3.9729C8.09684 4.12279 8.19955 4.34762 8.14819 4.3726C7.68603 4.74731 7.19818 5.12203 6.58196 5.62165Z" fill="white" />
                                                    <path d="M41.7731 11.013C41.7731 13.5831 39.9368 15.4951 37.2952 15.4951C34.4925 15.4951 32.5273 13.4891 32.5273 11.013C32.5273 8.59956 34.428 6.56226 37.2952 6.56226C38.9382 6.56226 40.2268 7.22046 40.9999 8.34882L39.518 9.5712C38.9382 8.85031 38.1972 8.4115 37.263 8.4115C35.7167 8.4115 34.5569 9.50852 34.5569 11.107C34.5569 12.6115 35.6522 13.7398 37.2308 13.7398C38.4227 13.7398 39.1959 13.1757 39.518 12.2354H37.1663V10.5428H41.7409V11.013H41.7731ZM47.0886 15.5264C44.5114 15.5264 42.4174 13.6145 42.4174 11.0757C42.4174 8.50553 44.5114 6.56226 47.0886 6.56226C49.7303 6.56226 51.7598 8.47419 51.7598 11.013C51.7598 13.5831 49.7303 15.5264 47.0886 15.5264ZM47.0886 13.7085C48.5705 13.7085 49.7303 12.5488 49.7303 11.0443C49.7303 9.53986 48.5705 8.38016 47.0886 8.38016C45.6067 8.38016 44.447 9.53986 44.447 11.0443C44.447 12.5488 45.5745 13.7085 47.0886 13.7085ZM52.6296 15.3383V6.75031H54.627V13.5518H58.7183V15.3383H52.6296ZM59.6526 15.3383V6.75031H63.2607C65.9667 6.75031 67.7708 8.63091 67.7708 11.013C67.7708 13.4264 65.9023 15.3383 63.164 15.3383H59.6526ZM63.164 8.53688H61.6499V13.5518H63.2285C64.6459 13.5518 65.7412 12.4861 65.7412 11.013C65.7412 9.60255 64.6459 8.53688 63.164 8.53688ZM68.6406 15.3383V6.75031H75.0836V8.50553H70.638V10.1354H74.7615V11.8279H70.638V13.5831H75.1159V15.3383H68.6406ZM81.4623 15.3383L77.9186 9.88463V15.3383H75.9857V6.75031H78.1763L81.72 12.204V6.75031H83.6529V15.3383H81.4623ZM96.2813 11.013C96.2813 13.5831 94.445 15.4951 91.8034 15.4951C89.0006 15.4951 87.0355 13.4891 87.0355 11.013C87.0355 8.56822 88.9362 6.56226 91.8034 6.56226C93.4463 6.56226 94.7349 7.22046 95.5403 8.31747L94.0584 9.53986C93.4785 8.81897 92.7376 8.38016 91.8034 8.38016C90.257 8.38016 89.0973 9.47717 89.0973 11.0757C89.0973 12.5801 90.1926 13.7085 91.7711 13.7085C92.9631 13.7085 93.7363 13.1443 94.0584 12.204H91.7067V10.5115H96.2813V11.013ZM101.597 15.5264C99.0196 15.5264 96.9256 13.6145 96.9256 11.0757C96.9256 8.50553 99.0196 6.5936 101.597 6.5936C104.238 6.5936 106.268 8.50553 106.268 11.0443C106.268 13.5831 104.238 15.5264 101.597 15.5264ZM101.597 13.7085C103.079 13.7085 104.238 12.5488 104.238 11.0443C104.238 9.53986 103.079 8.38016 101.597 8.38016C100.115 8.38016 98.9551 9.53986 98.9551 11.0443C98.9551 12.5488 100.115 13.7085 101.597 13.7085ZM112.131 12.1413L110.971 8.78762L109.812 12.1413H112.131ZM113.226 15.3383L112.711 13.8652H109.232L108.716 15.3383H106.655L109.812 6.75031H112.26L115.353 15.3383H113.226ZM115.997 15.3383V6.75031H117.994V13.5518H122.086V15.3383H115.997Z" fill="white" />
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
                                <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
                                    {navCards.map((card, i) => (
                                        <div
                                            key={card.title}
                                            className="border rounded-2xl p-6 cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #ffffff, #ffffff)`
                                            }}
                                            onClick={() => navigate(card.route)}
                                        >
                                            <div className="mb-4">
                                                <h2 className="text-[#0A0A0A] font-[400] text-[18px] mb-1">
                                                    {card.title}
                                                </h2>
                                                <p className="text-sm text-[#5F5F5F]/80">{card.desc}</p>
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
                    <div className="w-full lg:w-1/2 pl-4 lg:pl-10">
                        <h2
                            style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                            className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6">
                            <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                            {t("clubs.revenues", "Receitas")} <br />{clubName}{latestRev ? ` em ${latestRev.year}` : ""}
                        </h2>
                        <p style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                            className="text-lg font-light lg:text-xl">
                            {latestRev
                                ? `O ${clubName} registrou receita de ${formatMoney(latestRev.converted_value, fCurrency)} em ${latestRev.year}${revPct != null ? `, ${revPct >= 0 ? "aumento" : "redução"} de ${Math.abs(revPct).toFixed(1)}% em relação a ${prevRev.year}` : ""}.`
                                : t("clubs.no_financial_data", "Dados financeiros não disponíveis.")}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Card Dívidas ──────────────────────────────────── */}
            <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
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
                    <div className="w-full lg:w-1/2 pl-4 lg:pl-10">
                        <h2
                            style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                            className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6">
                            <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                            {t("clubs.debts", "Dívidas")}<br />{clubName}{latestDebt ? ` em ${latestDebt.year}` : ""}
                        </h2>
                        <p style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                            className="text-lg font-light lg:text-xl">
                            {latestDebt
                                ? `O ${clubName} encerrou ${latestDebt.year} com dívida líquida de ${formatMoney(latestDebt.converted_value, fCurrency)}${debtPct != null ? `, ${debtPct >= 0 ? "aumento" : "redução"} de ${Math.abs(debtPct).toFixed(1)}% em relação a ${prevDebt.year}` : ""}.`
                                : t("clubs.no_financial_data", "Dados financeiros não disponíveis.")}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Card Resultado ────────────────────────────────── */}
            <div className="rounded-2xl mb-4 w-full px-6 py-4 xl:py-8 lg:px-11 bg-white">
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
                    <div className="w-full lg:w-1/2 pl-4 lg:pl-10">
                        <h2
                            style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                            className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6">
                            <div className="top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: backgroundLine }} />
                            {t("clubs.result", "Resultado")} <br />{clubName}{latestNet ? ` em ${latestNet.year}` : ""}
                        </h2>
                        <p style={{ background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                            className="text-lg font-light lg:text-xl">
                            {latestNet
                                ? `O ${clubName} teve ${latestNet.converted_value >= 0 ? "lucro" : "prejuízo"} de ${formatMoney(Math.abs(latestNet.converted_value), fCurrency)} em ${latestNet.year}${prevNet ? `, ${latestNet.converted_value >= prevNet.converted_value ? "acima" : "abaixo"} dos ${formatMoney(Math.abs(prevNet.converted_value), fCurrency)} registrados em ${prevNet.year}` : ""}.`
                                : t("clubs.no_financial_data", "Dados financeiros não disponíveis.")}
                        </p>
                    </div>
                </div>
            </div>


        </div>
    );
}
