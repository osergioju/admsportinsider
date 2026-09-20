import { Link, useNavigate } from "react-router-dom";
import { ChartIcon, TrophyIcon, UsersIcon, ArrowUpRight, FlagDot } from "./headerParts";
import HospitalityLink from "./HospitalityLink";
import { useHeaderFonts } from "./useHeaderFonts";

// Ícones das 3 seções, na mesma ordem do navCards (financeiros, resultados, elenco).
const SECTION_ICONS = [ChartIcon, TrophyIcon, UsersIcon];

const INK = "#17132B";
const MUTED = "#6B6785";

// Opção C — "Capa de perfil": faixa em degradê, escudo circular sobreposto, nome, chip,
// cartão do estádio e abas em barra. Referência: "C — Capa de perfil-html/Opcao-C.dc.html".
export default function ClubHeaderC({ club, crestSrc, onCrestError, color1, color2, navCards, showNav = true, stadium, hospitality }) {
    useHeaderFonts();
    const navigate = useNavigate();

    return (
        <section
            className="club-hc w-full bg-white overflow-hidden"
            style={{ fontFamily: "'Figtree', system-ui, sans-serif", color: INK, borderRadius: 28, boxShadow: "0 1px 2px rgba(23,19,43,.05), 0 14px 34px -14px rgba(23,19,43,.16)" }}
        >
            <style>{`
                .club-hc .tab{transition:background .18s ease, box-shadow .18s ease}
                .club-hc .tab:hover{background:#FAF9FE!important;box-shadow:inset 0 -3px 0 #17132B}
                .club-hc .tab:hover .arr,.club-hc .stad:hover .arr{background:#17132B!important;color:#fff!important}
                .club-hc .stad{transition:background .18s ease, border-color .18s ease, box-shadow .18s ease}
                .club-hc .stad:hover{background:#fff!important;border-color:#17132B!important;box-shadow:0 8px 20px -10px rgba(23,19,43,.35)}
                .club-hc .stad:focus-visible{outline:3px solid #8B5CF6;outline-offset:2px}
                .club-hc .tab:focus-visible{outline:3px solid #8B5CF6;outline-offset:-3px}
            `}</style>

            {/* Faixa com degradê */}
            <div className="relative overflow-hidden" style={{ height: 128, background: `linear-gradient(100deg, ${color1} 0%, ${color2} 100%)` }}>
                {club.country_name && (
                    <div className="absolute flex items-center" style={{ right: 20, top: 20, gap: 8, height: 36, padding: "0 16px 0 7px", borderRadius: 999, background: "#fff", fontSize: 14, fontWeight: 650, color: INK }}>
                        <FlagDot src={club.flag_url} alt={club.country_name} />
                        <span>{club.country_name}</span>
                    </div>
                )}
            </div>

            {/* Escudo + nome + estádio */}
            <div className="flex flex-col lg:flex-row lg:items-start px-5 sm:px-8 lg:px-12 pb-6 lg:pb-7" style={{ gap: 24 }}>
                <div
                    className="relative z-10 flex-none flex items-center justify-center bg-white rounded-full w-[120px] h-[120px] -mt-[60px] lg:w-[164px] lg:h-[164px] lg:-mt-[68px]"
                    style={{ boxSizing: "border-box" }}
                >
                    <img src={crestSrc} onError={onCrestError} alt={`Escudo do ${club.name}`} className="w-[80px] h-[80px] lg:w-[112px] lg:h-[112px]" style={{ objectFit: "contain" }} />
                </div>

                <div className="flex-1 min-w-0 lg:pt-[22px]">
                    <h1 className="m-0 text-[30px] sm:text-[38px] lg:text-[44px]" style={{ lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.025em" }}>{club.name}</h1>
                    {club.description && (
                        <div className="inline-flex items-center" style={{ height: 28, marginTop: 10, padding: "0 12px", border: "1px solid #E1DDF0", borderRadius: 999, background: "#FAF9FE", fontSize: 12.5, fontWeight: 600, color: "#5B5675" }}>
                            {club.description}
                        </div>
                    )}
                </div>

                {stadium && (
                    <div className="flex-none flex flex-col items-stretch lg:items-end lg:mt-[22px]" style={{ gap: 12 }}>
                    <Link
                        to={stadium.to}
                        state={stadium.state}
                        className="stad flex-none flex items-center self-stretch"
                        title={`Ver ${stadium.name}`}
                        style={{ gap: 18, padding: "14px 14px 14px 22px", border: "1px solid #ECE9F6", borderRadius: 18, background: "#FAF9FE", textDecoration: "none", color: "inherit" }}
                    >
                        <div className="flex-1 min-w-0">
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>Estádio</div>
                            <div style={{ marginTop: 2, fontSize: 19, fontWeight: 650 }}>{stadium.name}</div>
                            {stadium.capacity && <div style={{ marginTop: 1, fontSize: 14, fontWeight: 500, color: MUTED }}>{Number(stadium.capacity).toLocaleString("pt-BR")} lugares</div>}
                        </div>
                        <span className="arr flex flex-none items-center justify-center" style={{ width: 28, height: 28, borderRadius: "50%", background: "#F1EEF9", color: INK, transition: "background .18s ease, color .18s ease" }}><ArrowUpRight /></span>
                    </Link>
                    <HospitalityLink hospitality={hospitality} color1={color1} />
                    </div>
                )}
            </div>

            {/* Abas */}
            {showNav && (
                <nav aria-label="Seções do clube" className="flex overflow-x-auto px-3 lg:px-7" style={{ height: 68, borderTop: "1px solid #ECE9F6" }}>
                    {navCards.map((card, i) => {
                        const Icon = SECTION_ICONS[i];
                        return (
                            <a
                                key={card.route}
                                className="tab flex items-center flex-none"
                                href={card.route}
                                onClick={(e) => { e.preventDefault(); navigate(card.route); }}
                                style={{ gap: 10, padding: "0 20px", fontSize: 16, fontWeight: 650, background: "#fff", color: "inherit", textDecoration: "none" }}
                            >
                                <span className="flex" style={{ color: `color-mix(in oklab, ${color1} 55%, #000000)` }}>{Icon && <Icon />}</span>
                                <span className="whitespace-nowrap">{card.title}</span>
                                <span className="arr flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: "50%", background: "#F1EEF9", color: INK }}><ArrowUpRight /></span>
                            </a>
                        );
                    })}
                </nav>
            )}
        </section>
    );
}
