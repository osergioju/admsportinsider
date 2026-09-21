import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, FlagDot } from "./headerParts";
import InfoTip from "./InfoTip";
import { getClubFacts, STRUCTURE_INTRO, STATUS_HINT } from "./clubFacts";
import HospitalityLink from "./HospitalityLink";
import { useFitFontSize } from "./useFitFontSize";
import { isLight, luminance, pickInk } from "./colorUtils";

const NAME_MAX = 92; // px — tamanho do desenho; encolhe sozinho p/ nomes longos
const NAME_MIN = 18;

// Opção O — "Bicolor": fundo branco → tom da cor primária, dois discos grandes (primária e secundária)
// no canto, escudo em círculo branco, título fino e três atalhos com botão redondo colorido.
// Referência: "O — Bicolor (Palmeiras)-html/Opcao-O.dc.html". Usa a fonte do sistema (Effra).
export default function ClubHeaderO({ club, crestSrc, onCrestError, color1, color2, navCards, showNav = true, stadium, hospitality }) {
    const navigate = useNavigate();
    const title = (club.short_name || club.name || "").toString();
    const official = club.description || (club.short_name && club.short_name !== club.name ? club.name : "");
    const { boxRef, textRef, size } = useFitFontSize(title, NAME_MAX, NAME_MIN);
    const facts = getClubFacts(club);

    // Cores secundárias do desenho, derivadas das do clube. Clubes com cor clara demais (amarelo, branco)
    // não podem virar texto/botão com contraste ruim: o desenho original só previa cores escuras.
    const ink = pickInk(color2, color1);
    const muted = `color-mix(in srgb, ${ink} 72%, #ffffff)`;
    const accentText = isLight(color1, 0.3) ? `color-mix(in srgb, ${color1} 50%, #000000)` : color1;
    const onAccent = luminance(color1) > 0.45 ? "#050111" : "#ffffff";

    return (
        <section
            className="club-ho @container relative w-full overflow-hidden"
            style={{ "--c1": color1, "--c2": color2, background: `linear-gradient(90deg, #ffffff 0%, color-mix(in srgb, ${color1} 5%, #ffffff) 100%)`, borderRadius: 24, color: ink }}
        >
            <style>{`
                .club-ho .c1,.club-ho .c2{position:absolute;border-radius:50%;pointer-events:none}
                .club-ho .c1{right:-70px;top:-90px;width:260px;height:260px;background:linear-gradient(180deg,var(--c1) 0%,color-mix(in srgb,var(--c1) 20%,#fff) 100%)}
                .club-ho .c2{right:-150px;top:40px;width:240px;height:240px;opacity:.92;background:linear-gradient(180deg,color-mix(in srgb,var(--c2) 48%,#fff) 0%,color-mix(in srgb,var(--c2) 10%,#fff) 100%)}
                @container (min-width:1000px){
                    .club-ho .c1{right:auto;left:calc(100% - 200px);top:-150px;width:620px;height:620px}
                    .club-ho .c2{right:auto;left:calc(100% - 60px);top:60px;width:560px;height:560px}
                }
                @container (min-width:1200px){
                    .club-ho .c1{left:max(1100px,calc(100% - 594px))}
                    .club-ho .c2{left:max(1340px,calc(100% - 354px))}
                }
                .club-ho .act{transition:border-color .2s ease}
                .club-ho .act:hover{border-color:var(--c1)!important}
                .club-ho .bt,.club-ho .arw{transition:transform .2s ease}
                .club-ho .act:hover .bt{transform:scale(1.06)}
                .club-ho .act:hover .arw,.club-ho .stadl:hover .arw{transform:translate(2px,-2px)}
                .club-ho .act:focus-visible,.club-ho .stadl:focus-visible{outline:2px solid #7F33D9;outline-offset:8px}
                .club-ho .stadl:hover .sname{text-decoration:underline;text-underline-offset:4px}
            `}</style>

            <div className="c1" aria-hidden="true" />
            <div className="c2" aria-hidden="true" />

            {facts.status && (
                // Discreto de propósito: vidro translúcido, sem sombra e sem cor de "semáforo". O texto usa a cor que
                // contrasta com o disco (branco em disco escuro, escuro em disco claro); ativo/inativo só muda o ponto.
                <div
                    className="absolute z-20 inline-flex items-center"
                    style={{ top: 20, right: 20, gap: 7, height: 28, padding: "0 6px 0 12px", borderRadius: 999, background: onAccent === "#ffffff" ? "rgba(255,255,255,0.18)" : "rgba(5,1,17,0.08)", border: `1px solid ${onAccent === "#ffffff" ? "rgba(255,255,255,0.32)" : "rgba(5,1,17,0.14)"}`, backdropFilter: "blur(6px)", fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: onAccent, opacity: facts.status === "active" ? 1 : 0.8 }}
                >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", boxSizing: "border-box", background: facts.status === "active" ? "currentColor" : "transparent", border: "1.5px solid currentColor" }} />
                    {facts.status === "active" ? "Ativo" : "Inativo"}
                    <InfoTip placement="bottom-end" color="currentColor" title="Situação do clube" label="O que significa ativo ou inativo?">{STATUS_HINT}</InfoTip>
                </div>
            )}

            <div className="relative z-10 flex flex-col gap-6 px-5 py-6 sm:px-8 @[1000px]:px-14 @[1000px]:pt-[54px] @[1000px]:pb-[34px]">
                <div className="flex flex-col gap-5 @[1000px]:flex-row @[1000px]:gap-11">
                    {/* Escudo */}
                    <div className="flex-none flex items-center justify-center rounded-full bg-white w-[120px] h-[120px] @[1000px]:w-[236px] @[1000px]:h-[236px]">
                        <img src={crestSrc} onError={onCrestError} alt={`Escudo do ${club.name}`} className="w-[76px] h-[76px] @[1000px]:w-[146px] @[1000px]:h-[146px]" style={{ objectFit: "contain" }} />
                    </div>

                    {/* Texto: no 1000–1199 deixa uma faixa livre p/ o disco não passar por baixo do texto */}
                    <div className="min-w-0 flex-1 @[1000px]:max-w-[720px] @[1000px]:pr-[200px] @[1200px]:pr-0">
                        <div className="flex flex-wrap items-center" style={{ gap: "8px 18px" }}>
                            {(club.flag_url || club.country_name) && (
                                <div className="flex items-center" style={{ gap: 10, fontSize: 11, fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: accentText }}>
                                    <FlagDot src={club.flag_url} alt={club.country_name} size={22} />
                                    {club.country_name && <span>{club.country_name}</span>}
                                </div>
                            )}
                        </div>

                        <div ref={boxRef} className="w-full min-w-0" style={{ marginTop: 16 }}>
                            <h1 ref={textRef} className="m-0 inline-block" style={{ fontSize: size, lineHeight: 0.95, fontWeight: 300, letterSpacing: "-0.03em", color: ink, whiteSpace: "nowrap" }}>
                                {title}
                            </h1>
                        </div>

                        {official && <div style={{ marginTop: 16, fontSize: 17, fontWeight: 500, color: muted }}>{official}</div>}

                        {stadium && (
                            <Link
                                to={stadium.to}
                                state={stadium.state}
                                title={`Ver ${stadium.name}`}
                                className="stadl inline-flex flex-wrap items-center"
                                style={{ marginTop: 10, gap: 4, fontSize: 16, fontWeight: 400, color: muted, textDecoration: "none" }}
                            >
                                <span>Estádio&nbsp;</span>
                                <strong className="sname" style={{ fontWeight: 600, color: ink }}>{stadium.name}</strong>
                                {stadium.capacity && (
                                    <>
                                        <span style={{ padding: "0 10px", color: "#7F33D9" }}>·</span>
                                        <strong style={{ fontWeight: 600, color: ink }}>{Number(stadium.capacity).toLocaleString("pt-BR")}</strong>
                                        <span>&nbsp;lugares</span>
                                    </>
                                )}
                                <span className="flex items-center justify-center" style={{ marginLeft: 8, width: 22, height: 22, borderRadius: "50%", background: color1, color: onAccent }}>
                                    <ArrowUpRight size={12} strokeWidth={2.4} />
                                </span>
                            </Link>
                        )}

                        {(facts.founded || facts.structure) && (
                            <div className="flex flex-col items-start @[1000px]:flex-row @[1000px]:flex-wrap @[1000px]:items-center" style={{ marginTop: 10, gap: "4px 0", fontSize: 16, fontWeight: 400, color: muted }}>
                                {facts.founded && (
                                    <span className="inline-flex" style={{ gap: 6 }}>Fundação<strong style={{ fontWeight: 600, color: ink }}>{facts.founded}</strong></span>
                                )}
                                {facts.founded && facts.structure && <span className="hidden @[1000px]:inline" style={{ padding: "0 10px", color: "#7F33D9" }}>·</span>}
                                {facts.structure && (
                                    <span className="inline-flex flex-wrap items-center" style={{ gap: 6 }}>
                                        Estrutura societária
                                        <strong style={{ fontWeight: 600, color: ink }}>{facts.structure.label}</strong>
                                        <InfoTip title="Estrutura societária" label="O que é estrutura societária?">
                                            {STRUCTURE_INTRO}{facts.structure.hint ? ` ${facts.structure.hint}` : ""}
                                        </InfoTip>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Linha dos atalhos + hospitalidade. ≥1200: lado a lado (hospitalidade à direita); abaixo disso
                    a hospitalidade desce p/ debaixo dos atalhos. No 1000–1199 os atalhos terminam antes do disco. */}
                {(showNav || hospitality?.url) && (
                <div className="flex flex-col gap-6 @[1200px]:flex-row @[1200px]:items-end @[1200px]:justify-between @[1200px]:gap-8">
                {showNav && (
                    <nav aria-label="Seções do clube" className="grid grid-cols-1 gap-4 @[1000px]:grid-cols-3 @[1000px]:gap-10 @[1000px]:w-[calc(100%-276px)] @[1200px]:w-auto @[1200px]:flex-1 @[1200px]:min-w-0 @[1200px]:max-w-[980px] max-w-full">
                        {navCards.map((card) => (
                            <a
                                key={card.route}
                                className="act flex items-center"
                                href={card.route}
                                onClick={(e) => { e.preventDefault(); navigate(card.route); }}
                                style={{ gap: 14, paddingTop: 16, borderTop: "2px solid rgba(5,1,17,0.14)", color: "inherit", textDecoration: "none" }}
                            >
                                <span className="flex-1" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.012em", color: "#050111" }}>{card.title}</span>
                                <span className="bt flex flex-none items-center justify-center" style={{ width: 44, height: 44, borderRadius: "50%", background: color1, color: onAccent }}>
                                    <span className="arw flex"><ArrowUpRight size={17} /></span>
                                </span>
                            </a>
                        ))}
                    </nav>
                )}
                {hospitality?.url && (
                    <div className="@[1200px]:flex-none @[1200px]:ml-auto">
                        <HospitalityLink hospitality={hospitality} color1={color1} fontFamily="inherit" solid />
                    </div>
                )}
                </div>
                )}
            </div>
        </section>
    );
}
