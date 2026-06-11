import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { api } from "../../../services/api";
import LeagueSportsSection from "./LeagueSportsSection";

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

export default function DashLeagueSports() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [theLeague, setTheLeague] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/dashboard/leagues/${slug}/info`)
            .then(res => setTheLeague(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading || !theLeague) return null;

    const lg = theLeague.league;
    const sj = lg.structure_json ?? {};
    const competitionTitle = sj.competition_name ?? lg.name;

    const [c1, c2] = resolveColors(lg.primary_color, lg.secondary_color, lg.tertiary_color);
    const rgb1 = hexToRgb(c1);
    const lum1 = rgb1 ? (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255 : 0;
    const textColor = lum1 > 0.5 ? "#0A0A0A" : "#FFFFFF";
    const leagueLogo = lg.logo_url || (lg.slug ? `https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${lg.slug}.webp` : null);

    return (
        <div className="space-y-6">
            {/* ── HEADER (padrão das páginas Premiações / Público e renda) ── */}
            <div
                className="rounded-2xl relative overflow-hidden px-5 sm:px-8 pt-5 pb-6"
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
            >
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.08), rgba(0,0,0,0.38))" }} />
                <div className="relative z-10 flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/dashboard/competitions/${slug}`)}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
                        style={{ background: "rgba(255,255,255,0.15)", color: textColor }}
                    >
                        <ArrowLeft size={15} />
                    </button>
                    {leagueLogo && (
                        <img src={leagueLogo} alt={competitionTitle}
                            className="w-10 h-10 object-contain drop-shadow"
                            onError={e => e.currentTarget.style.display = "none"} />
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl font-light leading-tight" style={{ color: textColor }}>
                            {competitionTitle}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Trophy size={12} style={{ color: textColor, opacity: 0.65 }} />
                            <span className="text-xs font-light" style={{ color: textColor, opacity: 0.75 }}>
                                Resultados esportivos
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTEÚDO ESPORTIVO */}
            <LeagueSportsSection leagueId={lg.id_league} />
        </div>
    );
}
