// Peças compartilhadas da testeira do clube (ClubHeaderO e HospitalityLink).
export const ArrowUpRight = ({ size = 14, strokeWidth = 2.2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17L17 7M8 7h9v9" />
    </svg>
);

// Bandeira redonda (ou nada, se o país não tiver bandeira cadastrada).
export function FlagDot({ src, alt, size = 22 }) {
    if (!src) return null;
    return <img src={src} alt={alt || ""} width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(5,1,17,0.12)", flex: "none" }} />;
}
