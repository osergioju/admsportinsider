import { ArrowUpRight } from "./headerParts";
import HospitalityLogo from "./HospitalityLogo";

const INK = "#17132B";

// Botão "Hospitalidade e camarotes" + logotipo do parceiro (só existem em alguns clubes).
// O logo fica dentro do mesmo link: clicar em qualquer parte do bloco abre a página externa.
export default function HospitalityLink({ hospitality, color1 }) {
    if (!hospitality?.url) return null;

    return (
        <a
            href={hospitality.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="club-hosp flex items-center flex-wrap"
            style={{ gap: 14, color: INK, textDecoration: "none", fontFamily: "'Figtree', system-ui, sans-serif" }}
        >
            <style>{`
                .club-hosp .pill{transition:background .18s ease, border-color .18s ease, color .18s ease}
                .club-hosp .pill .arr{transition:background .18s ease, color .18s ease}
                .club-hosp:hover .pill{background:#17132B!important;border-color:#17132B!important;color:#fff!important}
                .club-hosp:hover .pill .arr{background:#fff!important;color:#17132B!important}
                .club-hosp:focus-visible{outline:3px solid #8B5CF6;outline-offset:3px;border-radius:999px}
            `}</style>
            <span
                className="pill flex items-center"
                style={{ gap: 12, padding: "6px 6px 6px 18px", borderRadius: 999, border: `1px solid color-mix(in oklab, ${color1} 30%, #ffffff)`, background: `color-mix(in oklab, ${color1} 9%, #ffffff)`, fontSize: 14, fontWeight: 650 }}
            >
                <span>{hospitality.label}</span>
                <span className="arr flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: "50%", background: "#F1EEF9", color: INK }}><ArrowUpRight /></span>
            </span>
            <HospitalityLogo style={{ width: 96, height: "auto", opacity: 0.85 }} />
        </a>
    );
}
