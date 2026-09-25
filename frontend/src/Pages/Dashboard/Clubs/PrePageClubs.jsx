import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { clubLogo, handleCrestRetry } from "../../../utils/clubUrl";
import { getStadiumSlug } from "../../../data/stadiums";
import {
    TrendingUp,
    Trophy, Users, EyeOff,
} from "lucide-react";
import PageLoader from "../../../components/uxui/PageLoader";
import ClubHeaderO from "./components/header/ClubHeaderO";
import ClubModules from "../../../components/publications/ClubModules";

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
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => { injectStyles(); }, []);

    useEffect(() => {
        if (initialData) return;

        async function loadClub() {
            try {
                setLoading(true);
                const res = await api.get(`/dashboard/clubs/${id}/info`);
                setTheClub(res.data);
            } catch (err) {
                console.error("Erro ao carregar clube:", err);
            } finally {
                setLoading(false);
            }
        }
        loadClub();
    }, [id]);

    if (loading || !theClub) return <PageLoader />;

    const isHidden = theClub.club.hidden === true;
    const { primary_color, secondary_color, tertiary_color } = theClub.club;
    const [c1, c2] = resolveColors(primary_color, secondary_color, tertiary_color);

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

            {/* ── Área modular (layout padrão ou próprio do clube — editado em Admin > Publicações > Clubes) ── */}
            <ClubModules clubId={Number(id)} club={theClub.club} initialLayout={initialData?.layout} />
        </div>
    );
}
