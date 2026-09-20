import { useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, FlagDot } from "./headerParts";
import HospitalityLink from "./HospitalityLink";
import { useHeaderFonts } from "./useHeaderFonts";

const INK = "#17132B";
const MUTED = "#6B6785";
const RULE = "#DDD9EC";
const NAME_MAX = 172; // px — tamanho do desenho; encolhe sozinho p/ nomes longos
const NAME_MIN = 28;

// Faz o nome gigante caber numa linha só: mede o texto no tamanho máximo e reduz na proporção.
function useFitFontSize(text) {
    const boxRef = useRef(null);
    const textRef = useRef(null);
    const [size, setSize] = useState(NAME_MAX);

    useLayoutEffect(() => {
        const box = boxRef.current;
        const el = textRef.current;
        if (!box || !el) return undefined;

        // A largura do texto é proporcional ao font-size: mede no tamanho atual e projeta p/ o máximo,
        // sem mexer no DOM (mexer direto podia deixar o nome preso em 172px).
        const fit = () => {
            const avail = box.clientWidth;
            const current = parseFloat(getComputedStyle(el).fontSize);
            const width = el.getBoundingClientRect().width;
            if (!avail || !width || !current) return;
            const widthAtMax = width * (NAME_MAX / current);
            setSize(Math.max(NAME_MIN, Math.min(NAME_MAX, Math.floor(NAME_MAX * (avail / widthAtMax)))));
        };

        fit();
        // Observa a caixa (tela mudou de tamanho) e o próprio texto (a fonte terminou de carregar
        // e a largura do texto mudou). Repetir o mesmo tamanho não gera novo render, então não entra em loop.
        const ro = new ResizeObserver(fit);
        ro.observe(box);
        ro.observe(el);
        return () => ro.disconnect();
    }, [text]);

    return { boxRef, textRef, size };
}

// Opção D — "Manchete tipográfica": nome gigante em caixa alta, lista numerada de seções e
// rodapé do estádio. Referência: "D — Manchete tipográfica (São Paulo)-html/Opcao-D.dc.html".
export default function ClubHeaderD({ club, crestSrc, onCrestError, color1, color2, navCards, showNav = true, stadium, hospitality }) {
    useHeaderFonts();
    const navigate = useNavigate();
    const title = (club.short_name || club.name || "").toString();
    const { boxRef, textRef, size } = useFitFontSize(title);
    const official = club.description || (club.short_name && club.short_name !== club.name ? club.name : "");

    return (
        <section
            className="club-hd @container w-full bg-white overflow-hidden"
            style={{ "--c1": color1, fontFamily: "'Figtree', system-ui, sans-serif", color: INK, borderRadius: 20, boxShadow: "0 1px 2px rgba(23,19,43,.05), 0 14px 34px -14px rgba(23,19,43,.16)" }}
        >
            <style>{`
                .club-hd .row{transition:background .15s ease, padding .15s ease}
                .club-hd .row:hover{background:color-mix(in oklab, var(--c1) 12%, #ffffff)!important;padding-left:14px!important}
                .club-hd .row .arr{transition:transform .15s ease}
                .club-hd .row:hover .arr{transform:translate(3px,-3px)}
                .club-hd .row:focus-visible,.club-hd .foot:focus-visible{outline:3px solid #8B5CF6;outline-offset:-3px}
                .club-hd .foot{transition:background .15s ease}
                .club-hd .foot:hover{background:color-mix(in oklab, var(--c1) 12%, #ffffff)!important}
                .club-hd .foot .arr{transition:transform .15s ease}
                .club-hd .foot:hover .arr{transform:translate(3px,-3px)}
            `}</style>

            {/* Barra bicolor */}
            <div className="flex" style={{ height: 12 }}>
                <div style={{ flexGrow: 7, background: color1 }} />
                <div style={{ flexGrow: 3, background: color2 }} />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-stretch px-5 sm:px-8 lg:px-12 py-6 lg:py-7 gap-6 lg:gap-11">
                {/* Escudo */}
                <div className="flex-none flex items-center justify-center w-[120px] h-[120px] lg:w-[200px] lg:h-auto lg:min-h-[200px]" style={{ borderRadius: 14, background: "#F6F5FB", border: "1px solid #E7E4F2" }}>
                    <img src={crestSrc} onError={onCrestError} alt={`Escudo do ${club.name}`} className="w-[84px] h-[84px] lg:w-[140px] lg:h-[160px]" style={{ objectFit: "contain" }} />
                </div>

                {/* Manchete */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                    <div className="flex items-center" style={{ gap: 10 }}>
                        <FlagDot src={club.flag_url} alt={club.country_name} />
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED }}>
                            Clube{club.country_name ? ` · ${club.country_name}` : ""}
                        </span>
                    </div>

                    <div ref={boxRef} className="w-full min-w-0">
                        <h1
                            ref={textRef}
                            className="m-0 inline-block"
                            style={{ fontFamily: "'Effra Trial', system-ui, sans-serif", fontSize: size, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.02em", textTransform: "uppercase", whiteSpace: "nowrap", color: INK }}
                        >
                            {title}
                        </h1>
                    </div>

                    <div style={{ fontSize: 17, fontWeight: 500, color: "#5B5675", minHeight: 22 }}>{official}</div>
                </div>

                {/* Lista numerada */}
                {showNav && (
                    <nav aria-label="Seções do clube" className="flex-none flex flex-col w-full lg:w-[470px]" style={{ borderBottom: `1px solid ${RULE}` }}>
                        {navCards.map((card) => (
                            <a
                                key={card.route}
                                className="row flex items-center py-4 lg:py-0 lg:flex-1"
                                href={card.route}
                                onClick={(e) => { e.preventDefault(); navigate(card.route); }}
                                style={{ gap: 20, borderTop: `1px solid ${RULE}`, padding: "0 8px", color: "inherit", textDecoration: "none" }}
                            >
                                <span className="flex-1 text-[17px] lg:text-[21px]" style={{ fontWeight: 650 }}>{card.title}</span>
                                <span className="arr flex" style={{ color: INK }}><ArrowUpRight size={22} strokeWidth={2} /></span>
                            </a>
                        ))}
                    </nav>
                )}
            </div>

            {/* Rodapé: estádio */}
            {stadium && (
                <div className="flex flex-col @[1000px]:flex-row @[1000px]:items-stretch" style={{ minHeight: 64, borderTop: "1px solid #ECE9F6", background: "#FBFAFE" }}>
                <Link
                    to={stadium.to}
                    state={stadium.state}
                    className="foot flex flex-1 min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-5 sm:px-8 @[1000px]:pl-12 @[1000px]:pr-6 py-3 @[1000px]:py-0"
                    title={`Ver ${stadium.name}`}
                    style={{ gap: 18, color: "inherit", textDecoration: "none" }}
                >
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED }}>Estádio</span>
                    <span style={{ fontSize: 19, fontWeight: 650 }}>{stadium.name}</span>
                    {stadium.capacity && (
                        <>
                            <span className="hidden sm:block" style={{ width: 1, height: 22, background: RULE }} />
                            <span style={{ fontSize: 16, fontWeight: 500, color: "#5B5675" }}>{Number(stadium.capacity).toLocaleString("pt-BR")} lugares</span>
                        </>
                    )}
                    <span className="arr flex" style={{ color: INK }}><ArrowUpRight size={22} strokeWidth={2} /></span>
                </Link>
                {hospitality?.url && (
                    <div className="flex items-center px-5 sm:px-8 @[1000px]:pl-8 @[1000px]:pr-12 py-3 @[1000px]:py-0 border-t @[1000px]:border-t-0 @[1000px]:border-l" style={{ borderColor: "#ECE9F6" }}>
                        <HospitalityLink hospitality={hospitality} color1={color1} />
                    </div>
                )}
                </div>
            )}
        </section>
    );
}
