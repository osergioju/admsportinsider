import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { TrendingUp, Trophy, ArrowRight, Award, Users } from "lucide-react";
import PageLoader from "../../../components/uxui/PageLoader";
import EntityModules from "../../../components/publications/EntityModules";
import NotasSection from "./../../Dashboard/Notas/NotasSection"

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
    const [annualIndicators, setAnnualIndicators] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { injectStyles(); }, []);

    // Slug antigo da Copa do Mundo → novo (em inglês)
    useEffect(() => {
        if (slug === "copa-do-mundo") navigate("/dashboard/competitions/world-cup", { replace: true });
    }, [slug, navigate]);

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                const res = await api.get(`/dashboard/leagues/${slug}/info`);
                const leagueId = res.data.league.id_league;
                // Só o que o CABEÇALHO precisa (quais botões mostrar). Os gráficos e textos
                // abaixo vêm da área modular (EntityModules), que busca os próprios dados.
                const annualRes = await api.get(`/dashboard/leagues/${leagueId}/indicators/annual?codes=prizes_total,attendance-total`);
                setTheLeague(res.data);
                setAnnualIndicators(annualRes.data?.indicators || {});
            } catch (err) {
                console.error("Erro ao carregar dashboard da liga:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, [slug]);

    if (loading || !theLeague) return <PageLoader />;

    const lg = theLeague.league;
    const sj = lg.structure_json ?? {};
    const shortName = lg.name ?? sj.competition_name;
    const fullName = lg.description && lg.description !== shortName ? lg.description : null;
    const competitionTitle = shortName;

    const formatLabel = lg.format ? (FORMAT_LABEL[lg.format] ?? lg.format) : null;
    const organizer = lg.organizer || lg.federation_name || null;

    // Cores da liga → fallback para federação vinculada
    const [c1, c2, c3] = resolveColors(
        lg.primary_color || lg.fed_color1,
        lg.secondary_color || lg.fed_color2,
        lg.tertiary_color || lg.fed_color3
    );

    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);

    const background = `
        radial-gradient(circle at 20% 30%, ${c1} 0%, transparent 60%),
        radial-gradient(circle at 80% 70%, ${c2} 0%, transparent 60%),
        linear-gradient(135deg, ${c1}, ${c2}, ${c3})
    `.trim();

    const glowPrimary = rgb1
        ? `radial-gradient(circle, rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.45) 0%, transparent 70%)`
        : "rgba(0,0,0,0.2)";
    const glowSecondary = rgb2
        ? `radial-gradient(circle, rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.35) 0%, transparent 70%)`
        : glowPrimary;

    const lum1 = rgb1 ? (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255 : 0;
    const textColor = lum1 > 0.5 ? "#0A0A0A" : "#FFFFFF";
    const borderColor = lum1 > 0.5 ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)";

    // Indicadores anuais (premiações e público)
    // Anos zerados são edições futuras sem dado (ex: CWC 2029) — fora do gráfico
    const prizesData = (annualIndicators?.["prizes_total"] || []).filter(r => r.value);
    const attendanceData = (annualIndicators?.["attendance-total"] || []).filter(r => r.value);
    const hasPrizesSection = !!(sj.prizes_text || prizesData.length);
    const hasAttendanceSection = !!(sj.attendance_text || attendanceData.length);
    const hasSpecialSections = hasPrizesSection || hasAttendanceSection;
    // Competições de seleções (Copa do Mundo etc.) nunca exibem finanças —
    // o financeiro pertence à federação organizadora, não à competição
    const showFinance = !hasSpecialSections && lg.team_type !== "national";

    // Rola até uma seção SEM usar scrollIntoView: o root da página tem
    // overflow-hidden e o scrollIntoView rolava esse container internamente,
    // cortando o header. Aqui rolamos só o container de scroll real do layout.
    const scrollToSection = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
            const oy = getComputedStyle(parent).overflowY;
            if (oy === "auto" || oy === "scroll") break;
            parent = parent.parentElement;
        }
        if (parent && parent !== document.body) {
            const delta = el.getBoundingClientRect().top - parent.getBoundingClientRect().top - 16;
            parent.scrollBy({ top: delta, behavior: "smooth" });
        } else {
            window.scrollBy({ top: el.getBoundingClientRect().top - 16, behavior: "smooth" });
        }
    };

    // Nav cards
    const navCards = [
        {
            title: t("leagues.sports_results", "Resultados esportivos"),
            desc: t("leagues.sports_desc", "Desempenho dos clubes na competição, histórico de partidas e estatísticas por temporada."),
            route: `/dashboard/competitions/sports/${slug}`,
            Icon: Trophy,
        },
        ...(hasPrizesSection ? [{
            title: "Premiações",
            desc: "Distribuição de premiações por edição da competição.",
            route: `/dashboard/competitions/prizes/${slug}`,
            Icon: Award,
            isAnchor: false,
        }] : []),
        ...(hasAttendanceSection ? [{
            title: "Público e renda",
            desc: "Público total e renda nos estádios por edição da competição.",
            route: `/dashboard/competitions/attendance/${slug}`,
            Icon: Users,
            isAnchor: false,
        }] : []),
        ...(showFinance ? [{
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
                    <div className="flex lg:items-center gap-4 lg:p-5 flex-wrap">

                        {/* Logo */}
                        <div className="shrink-0 w-14 h-14 lg:w-30 lg:h-30 xl:w-40 xl:h-40 flex items-center justify-center">
                            {(lg.logo_url_negative || lg.logo_url || lg.slug) && (
                                <img
                                    src={lg.logo_url_negative || lg.logo_url || `https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${lg.slug}.webp`}
                                    alt={competitionTitle}
                                    className="w-full h-full object-contain"
                                    onError={e => e.currentTarget.style.display = "none"}
                                />
                            )}
                        </div>

                        {/* Nome + meta + nav cards */}
                        <div className="flex-1 min-w-0 border-b pb-4 pl-2" style={{ borderColor }}>
                            <h1
                                className="text-white font-light drop-shadow-md leading-tight truncate text-xl sm:text-2xl lg:text-3xl xl:text-4xl"
                                style={{ color: textColor }}
                            >
                                {competitionTitle}
                            </h1>

                            {/* Badge com nome completo */}
                            {fullName && (
                                <span
                                    className="inline-block lg:text-sm xl:text-base mt-1 text-xs border px-5 py-2 font-[300] rounded-full"
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
                                            className="fed-comp-card flex items-center justify-between rounded-2xl p-2 px-4 pr-2 lg:p-4 lg:px-5 cursor-pointer bg-black/40"
                                            onClick={() => card.isAnchor ? scrollToSection(card.route) : navigate(card.route)}
                                        >
                                            <h2 className="text-[#ffffff] font-[400] text-[14px] lg:text-[15px] leading-tight">
                                                {card.title}
                                            </h2>
                                            <button
                                                className="bg-white shrink-0 cursor-pointer transition-all text-sm px-4 py-2.5 ml-2 rounded-full border border-[#1E1E1E]/40 flex items-center gap-1.5 hover:bg-gray-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    card.isAnchor ? scrollToSection(card.route) : navigate(card.route);
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

            {/* ── Área modular (layout padrão ou próprio da competição — Admin > Publicações > Competições) ── */}
            <EntityModules kind="league" entityKey={slug} entity={lg} className="mb-4" />

            <NotasSection />
        </div>
    );
}
