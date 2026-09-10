import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import StadiumGlobe from "../../components/stadium/StadiumGlobe";
import StadiumGoogleMapEmbed from "../../components/stadium/StadiumGoogleMapEmbed";
import { resolveStadiumData, geocodeStadium } from "../../data/stadiums";
import { clubUrl, clubLogo as resolveClubLogo, handleCrestRetry } from "../../utils/clubUrl";
import { api } from "../../services/api";
import { useTranslation } from "../../context/TranslationContext";

const STYLE_ID = "stadium-page-styles";

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
        @keyframes stadiumFadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .stadium-reveal {
            opacity: 0;
            animation: stadiumFadeUp 0.9s cubic-bezier(.2,.8,.2,1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
            .stadium-reveal { opacity: 1; animation: none; }
        }
    `;
    document.head.appendChild(el);
}

function InfoField({ label, value, delay }) {
    if (value === null || value === undefined || value === "") return null;
    return (
        <div className="stadium-reveal" style={{ animationDelay: delay }}>
            <p className="text-[11px] tracking-[0.18em] text-white/40 font-medium">{label}</p>
            <p className="text-xl sm:text-2xl font-light text-white mt-1">{value}</p>
        </div>
    );
}

export default function StadiumPage() {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => { injectStyles(); }, []);

    const clubHint = location.state?.club || null;
    const initialStadium = useMemo(() => resolveStadiumData(slug, clubHint), [slug, clubHint]);

    const [trackedInitial, setTrackedInitial] = useState(initialStadium);
    const [stadium, setStadium] = useState(initialStadium);
    const [locating, setLocating] = useState(!!initialStadium?.approximate);
    const [mapProvider, setMapProvider] = useState("mapbox"); // "mapbox" | "google" — só pra comparação/aprovação
    const [googleMapType, setGoogleMapType] = useState("roadmap"); // "roadmap" | "satellite" (só quando provider = google)

    // Troca de estádio (navegação pra outro slug): reseta o estado local pro
    // novo valor-base já no render, sem passar por efeito (evita re-render em
    // cascata pra só espelhar uma prop derivada).
    if (initialStadium !== trackedInitial) {
        setTrackedInitial(initialStadium);
        setStadium(initialStadium);
        setLocating(!!initialStadium?.approximate);
    }

    // Estádios fora do mock local chegam com coordenada aproximada (centróide do
    // país). Antes do globo animar, tenta achar a localização exata pelo nome na
    // Geocoding API do Mapbox — se achar, troca pra ela e grava no banco (via
    // clube de origem) pra nunca mais precisar buscar de novo; se não, segue no
    // fallback.
    useEffect(() => {
        if (!stadium?.approximate) return undefined;

        let cancelled = false;
        geocodeStadium(stadium).then((refined) => {
            if (cancelled) return;
            if (refined) {
                setStadium(refined);
                if (clubHint?.id) {
                    api.patch(`/dashboard/clubs/${clubHint.id}/stadium-location`, {
                        latitude: refined.latitude,
                        longitude: refined.longitude,
                        country_code: refined.countryCode,
                    }).catch(() => {
                        // best-effort — se falhar, só perde o cache; a próxima visita tenta de novo
                    });
                }
            }
            setLocating(false);
        });
        return () => { cancelled = true; };
    }, [stadium, clubHint]);

    useEffect(() => {
        document.title = stadium?.name ? `${stadium.name} · Sport Insider` : "Estádio · Sport Insider";
    }, [stadium?.name]);

    const backHref = clubHint?.id ? clubUrl(clubHint.id, clubHint.slug) : "/dashboard/clubs";
    const backLabel = stadium?.club?.name
        ? t("stadium.back_to_club", "Voltar para {club}").replace("{club}", stadium.club.name)
        : t("stadium.back", "Voltar");

    if (!stadium) {
        return (
            <div className="w-full flex flex-col items-center justify-center gap-4 py-24 text-center">
                <p className="text-gray-500 font-light text-lg">
                    {t("stadium.not_found", "Não encontramos dados desse estádio.")}
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#7F33D9] transition font-medium"
                >
                    <ArrowLeft size={15} />
                    {t("stadium.go_back", "Voltar")}
                </button>
            </div>
        );
    }

    const crestSrc = clubHint?.crest_url
        ? resolveClubLogo(clubHint.crest_url, clubHint.slug)
        : (stadium.club?.crest_url ? resolveClubLogo(stadium.club.crest_url, stadium.club.slug) : null);

    return (
        <div className="w-full overflow-hidden">

            {/* ── Voltar + toggle de mapa (comparação p/ aprovação) ─── */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <Link
                    to={backHref}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#7F33D9] transition font-medium"
                >
                    <ArrowLeft size={15} />
                    {backLabel}
                </Link>

                <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-gray-200 text-xs font-medium">
                    <button
                        type="button"
                        onClick={() => setMapProvider("mapbox")}
                        className={`px-3 py-1.5 rounded-full transition-colors ${mapProvider === "mapbox" ? "bg-[#7F33D9] text-white" : "text-gray-500 hover:text-[#7F33D9]"}`}
                    >
                        Mapbox
                    </button>
                    <button
                        type="button"
                        onClick={() => setMapProvider("google")}
                        className={`px-3 py-1.5 rounded-full transition-colors ${mapProvider === "google" ? "bg-[#7F33D9] text-white" : "text-gray-500 hover:text-[#7F33D9]"}`}
                    >
                        Google Maps
                    </button>

                    {mapProvider === "google" && (
                        <>
                            <div className="w-px h-4 bg-gray-200 mx-1" />
                            <button
                                type="button"
                                onClick={() => setGoogleMapType("roadmap")}
                                className={`px-3 py-1.5 rounded-full transition-colors ${googleMapType === "roadmap" ? "bg-[#7F33D9] text-white" : "text-gray-500 hover:text-[#7F33D9]"}`}
                            >
                                Mapa
                            </button>
                            <button
                                type="button"
                                onClick={() => setGoogleMapType("satellite")}
                                className={`px-3 py-1.5 rounded-full transition-colors ${googleMapType === "satellite" ? "bg-[#7F33D9] text-white" : "text-gray-500 hover:text-[#7F33D9]"}`}
                            >
                                Satélite
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── CARD PRINCIPAL — mesma linguagem visual do header do clube ── */}
            <div
                className="rounded-2xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #2A1050 0%, #170B33 55%, #0A0616 100%)" }}
            >
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 100%)" }} />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none blur-3xl" style={{ background: "radial-gradient(circle, rgba(127,51,217,0.4) 0%, transparent 70%)" }} />
                <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full pointer-events-none blur-3xl" style={{ background: "radial-gradient(circle, rgba(90,31,168,0.35) 0%, transparent 70%)" }} />

                <div className="relative z-10 grid lg:grid-cols-[minmax(320px,42%)_1fr]">

                    {/* ── Painel esquerdo ────────────────────────────── */}
                    <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-10 lg:py-14">

                        <p className="stadium-reveal text-[11px] tracking-[0.2em] text-white/40 font-medium mb-6"
                            style={{ animationDelay: "0.05s" }}>
                            {t("stadium.breadcrumb_clubs", "CLUBES")}
                            {stadium.club?.name && (
                                <> / <span className="text-white/60">{stadium.club.name.toUpperCase()}</span></>
                            )}
                            {" "}/ {t("stadium.breadcrumb_current", "ESTÁDIO")}
                        </p>

                        <h1 className="stadium-reveal text-3xl sm:text-4xl lg:text-5xl font-extralight leading-[1.05] tracking-tight text-white"
                            style={{ animationDelay: "0.15s" }}>
                            {stadium.name}
                        </h1>

                        <div className="stadium-reveal flex items-center gap-2 mt-5 text-white/55" style={{ animationDelay: "0.25s" }}>
                            <MapPin size={14} className="shrink-0" />
                            <p className="text-sm sm:text-base font-light">
                                {[stadium.city, stadium.state].filter(Boolean).join(", ")}
                                {stadium.city && stadium.country ? " · " : ""}
                                {stadium.country}
                                {stadium.approximate && (
                                    <span className="text-white/30"> · {t("stadium.approximate", "localização aproximada")}</span>
                                )}
                            </p>
                        </div>

                        {stadium.club?.name && (
                            <div className="stadium-reveal flex items-center gap-3 mt-8" style={{ animationDelay: "0.35s" }}>
                                {crestSrc && (
                                    <img
                                        src={crestSrc}
                                        onError={handleCrestRetry}
                                        alt={stadium.club.name}
                                        className="w-10 h-10 object-contain"
                                    />
                                )}
                                <div>
                                    <p className="text-sm font-normal text-white">{stadium.club.name}</p>
                                    {stadium.club.country && (
                                        <p className="text-xs text-white/40">{stadium.club.country}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-10 h-px w-16 bg-white/15 stadium-reveal" style={{ animationDelay: "0.4s" }} />

                        <div className="grid grid-cols-2 gap-x-8 gap-y-7 mt-8 max-w-sm">
                            <InfoField
                                label={t("stadium.capacity", "CAPACIDADE")}
                                value={stadium.capacity ? Number(stadium.capacity).toLocaleString("pt-BR") : null}
                                delay="0.45s"
                            />
                            <InfoField
                                label={t("stadium.founded", "INAUGURAÇÃO")}
                                value={stadium.founded || null}
                                delay="0.5s"
                            />
                            <InfoField
                                label={t("stadium.city", "CIDADE")}
                                value={stadium.city}
                                delay="0.55s"
                            />
                            <InfoField
                                label={t("stadium.country", "PAÍS")}
                                value={stadium.country}
                                delay="0.6s"
                            />
                        </div>
                    </div>

                    {/* ── Globo ──────────────────────────────────────── */}
                    <div className="relative h-[55vh] lg:h-[640px] overflow-hidden">
                        {locating ? (
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ background: "radial-gradient(circle at 50% 40%, #2A1050 0%, #0A0616 70%)" }}
                            >
                                <div className="flex flex-col items-center gap-3 text-white/40">
                                    <span className="w-2 h-2 rounded-full bg-[#B48CFF] animate-ping" />
                                    <p className="text-xs tracking-[0.15em] font-light">
                                        {t("stadium.locating", "LOCALIZANDO ESTÁDIO...")}
                                    </p>
                                </div>
                            </div>
                        ) : mapProvider === "google" ? (
                            <StadiumGoogleMapEmbed
                                key={`google-${googleMapType}-${stadium.slug}`}
                                latitude={stadium.latitude}
                                longitude={stadium.longitude}
                                stadiumName={stadium.name}
                                mapType={googleMapType}
                                className="absolute inset-0"
                            />
                        ) : (
                            <StadiumGlobe
                                key={`mapbox-${stadium.slug}`}
                                latitude={stadium.latitude}
                                longitude={stadium.longitude}
                                stadiumName={stadium.name}
                                city={stadium.city}
                                country={stadium.country}
                                countryCode={stadium.countryCode}
                                club={stadium.club}
                                clubLogo={crestSrc}
                                approximate={stadium.approximate}
                                className="absolute inset-0"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
