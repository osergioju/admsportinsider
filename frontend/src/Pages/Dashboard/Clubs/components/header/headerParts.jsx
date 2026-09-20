// Peças compartilhadas pelas testeiras de clube em teste (opções C e D).

const svgProps = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export const ChartIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...svgProps}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
);
export const TrophyIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...svgProps}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>
);
export const UsersIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...svgProps}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.4" /><path d="M17 14.2c2.4.3 4 2.2 4 4.8" /></svg>
);
export const ArrowUpRight = ({ size = 14, strokeWidth = 2.2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={strokeWidth} {...svgProps}><path d="M7 17L17 7M8 7h9v9" /></svg>
);

// Bandeira redonda (ou nada, se o país não tiver bandeira cadastrada).
export function FlagDot({ src, alt, size = 22 }) {
    if (!src) return null;
    return <img src={src} alt={alt || ""} width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid #D9D5E8", flex: "none" }} />;
}
