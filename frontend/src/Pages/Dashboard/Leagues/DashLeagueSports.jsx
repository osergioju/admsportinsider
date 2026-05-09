import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
    const { id } = useParams();
    const [theLeague, setTheLeague] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/dashboard/leagues/${id}/info`)
            .then(res => setTheLeague(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading || !theLeague) return null;

    const lg = theLeague.league;
    const sj = lg.structure_json ?? {};
    const competitionTitle = sj.competition_name ?? lg.name;

    const [c1, c2, c3] = resolveColors(lg.primary_color, lg.secondary_color, lg.tertiary_color);
    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    const glowPrimary = rgb1 ? `radial-gradient(circle, rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.45) 0%, transparent 70%)` : "rgba(0,0,0,0.2)";
    const glowSecondary = rgb2 ? `radial-gradient(circle, rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.35) 0%, transparent 70%)` : glowPrimary;

    return (
        <div className="space-y-6">
            {/* HEADER */}
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
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)" }} />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none blur-3xl" style={{ background: glowPrimary }} />
                <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none blur-3xl" style={{ background: glowSecondary }} />

                <div className="relative z-10 p-6 sm:p-8">
                    <div className="flex items-start gap-5">
                        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center p-2.5">
                            {lg.logo_url && (
                                <img
                                    src={`https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${lg.slug}.webp`}
                                    alt={competitionTitle}
                                    className="w-full h-full object-contain drop-shadow-lg"
                                />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold drop-shadow-md truncate">
                                {competitionTitle}
                            </h1>
                            {lg.country_name && (
                                <span className="inline-block mt-1.5 text-white/70 text-sm font-semibold bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                                    {lg.country_name}
                                </span>
                            )}
                        </div>
                        {lg.flag_url && (
                            <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden shadow-lg" style={{ border: "2px solid rgba(255,255,255,0.28)" }} title={lg.country_name}>
                                <img src={lg.flag_url} alt={lg.country_name} className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CONTEÚDO ESPORTIVO */}
            <LeagueSportsSection leagueId={Number(id)} />
        </div>
    );
}
