import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { TrendingUp, Trophy, Users, ArrowRight, Building2, Landmark, PieChart } from "lucide-react";

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

/* ─── Keyframes (injetados uma vez no <head>) ──────────────────── */
const STYLE_ID = "club-prepage-styles";

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
        @keyframes auroraShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes cardIn {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes glowPulse {
            0%, 100% { opacity: 0.45; }
            50%       { opacity: 0.9; }
        }
        .club-card {
            transition: transform 0.28s ease, box-shadow 0.28s ease,
                        background 0.28s ease, border-color 0.28s ease;
        }
        .club-card:hover {
            transform: translateY(-5px) scale(1.015);
        }
        .club-card .card-arrow {
            transition: transform 0.22s ease;
        }
        .club-card:hover .card-arrow {
            transform: translateX(5px);
        }
        .cta-btn {
            transition: background 0.2s ease, border-color 0.2s ease;
        }
    `;
    document.head.appendChild(el);
}

/* ─── Componente ───────────────────────────────────────────────── */
export default function PrePageClubs() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [theClub, setTheClub] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { injectStyles(); }, []);

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                const res = await api.get(`/dashboard/clubs/${id}/info`);
                setTheClub(res.data);
            } catch (err) {
                console.error("Erro ao carregar dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, [id]);

    if (loading || !theClub) return null;

    const { primary_color, secondary_color, tertiary_color } = theClub.club;
    const [c1, c2, c3] = resolveColors(primary_color, secondary_color, tertiary_color);

    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    const glowPrimary = rgb1 ? `rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.6)` : "rgba(0,0,0,0.3)";
    const glowSecondary = rgb2 ? `rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.45)` : glowPrimary;

    function formatDateBR(dateString) {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
    }

    const cards = [
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
        <div
            className="w-full rounded-2xl overflow-hidden relative"
            style={{
                background: `
                    radial-gradient(circle at 20% 30%, ${c1} 0%, transparent 60%),
                    radial-gradient(circle at 80% 70%, ${c2} 0%, transparent 60%),
                    linear-gradient(135deg, ${c1}, ${c2}, ${c3})
                `,
            }}
        >
            {/* Overlay escuro para legibilidade */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)",
                }}
            />

            {/* Glow decorativo canto inferior direito */}
            <div
                className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none blur-3xl"
                style={{
                    background: glowPrimary
                }}
            />
            {/* Glow decorativo canto superior esquerdo */}
            <div
                className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none blur-3xl"
                style={{
                    background: glowSecondary
                }}
            />

            <div className="relative z-10 p-6 sm:p-8">

                {/* ── Header ──────────────────────────────────────── */}
                <div className="flex items-start gap-5 pb-6">

                    {/* Crest flutuante com glow */}
                    <div
                        className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center p-2.5"
                    >
                        <img
                            src={theClub.club.crest_url}
                            alt={theClub.club.name}
                            className="w-full h-full object-contain drop-shadow-lg"
                        />
                    </div>

                    {/* Nome + short_name */}
                    <div className="flex-1 justify-center min-w-0 items-center">
                        <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold drop-shadow-md truncate">
                            {theClub.club.name}
                        </h1>
                        {theClub.club.short_name && (
                            <span className="inline-block mt-1.5 text-white/70 text-sm font-semibold bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                                {theClub.club.short_name}
                            </span>
                        )}
                    </div>

                    {/* Bandeira */}
                    {theClub.club.flag_url && (
                        <div
                            className="shrink-0 w-9 h-9 rounded-full overflow-hidden shadow-lg"
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

                {/* Divisor */}
                <div
                    className="mb-5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
                />

                {/* ── Info strip (estádio + proprietários) ── */}
                {(theClub.club.stadium_name || (theClub.owners?.length > 0)) && (
                    <div className="flex flex-wrap gap-3 mb-6">
                        {/* Estádio */}
                        {theClub.club.stadium_name && (
                            <div
                                className="flex items-start gap-2.5 rounded-xl px-4 py-3 flex-1 min-w-[200px]"
                                style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.12)" }}
                            >
                                <Landmark size={15} className="text-white/60 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-0.5">Estádio</p>
                                    <p className="text-white text-sm font-semibold leading-tight">{theClub.club.stadium_name}</p>
                                    <div className="flex flex-wrap gap-x-3 mt-1">
                                        {theClub.club.stadium_capacity && (
                                            <span className="text-white/60 text-xs">{Number(theClub.club.stadium_capacity).toLocaleString("pt-BR")} lugares</span>
                                        )}
                                        {theClub.club.stadium_ownership && (
                                            <span className="text-white/60 text-xs capitalize">{theClub.club.stadium_ownership}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Proprietários */}
                        {theClub.owners?.length > 0 && (
                            <div
                                className="flex items-start gap-2.5 rounded-xl px-4 py-3 flex-1 min-w-[200px]"
                                style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.12)" }}
                            >
                                <PieChart size={15} className="text-white/60 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5">Estrutura societária</p>
                                    <div className="flex flex-col gap-1">
                                        {theClub.owners.map((o, i) => (
                                            <div key={i} className="flex items-center justify-between gap-3">
                                                <span className="text-white text-xs font-medium truncate">{o.name}</span>
                                                {o.ownership_pct != null && (
                                                    <span className="text-white/70 text-xs font-bold shrink-0">
                                                        {Number(o.ownership_pct).toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Cards ───────────────────────────────────────── */}
                <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
                    {cards.map((card, i) => (
                        <div
                            key={card.title}
                            className="club-card rounded-2xl p-6 flex flex-col justify-between min-h-52 cursor-pointer"
                            style={{
                                background: "rgba(0,0,0,0.26)",
                                backdropFilter: "blur(16px)",
                                WebkitBackdropFilter: "blur(16px)",
                                border: "1px solid rgba(255,255,255,0.14)",
                                animation: `cardIn 0.48s ease both`,
                                animationDelay: `${i * 0.1 + 0.1}s`,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = `0 16px 48px -10px ${glowSecondary}`;
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
                                e.currentTarget.style.background = "rgba(0,0,0,0.36)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = "";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                                e.currentTarget.style.background = "rgba(0,0,0,0.26)";
                            }}
                            onClick={() => navigate(card.route)}
                        >
                            {/* Conteúdo */}
                            <div>
                                {/* Ícone */}
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                                    style={{
                                        background: "rgba(255,255,255,0.1)",
                                        border: "1px solid rgba(255,255,255,0.18)",
                                    }}
                                >
                                    <card.Icon size={18} className="text-white/85" strokeWidth={1.75} />
                                </div>

                                <h2 className="text-white text-lg font-bold mb-2 leading-snug">
                                    {card.title}
                                </h2>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={e => { e.stopPropagation(); navigate(card.route); }}
                                className="cta-btn mt-5 self-start inline-flex items-center gap-2 text-white/90 text-sm font-semibold px-4 py-2 rounded-full"
                                style={{
                                    background: "rgba(255,255,255,0.12)",
                                    border: "1px solid rgba(255,255,255,0.22)",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.22)";
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                                }}
                            >
                                {t("ui.see_more", "Ver mais")}
                                <ArrowRight size={14} className="card-arrow" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
