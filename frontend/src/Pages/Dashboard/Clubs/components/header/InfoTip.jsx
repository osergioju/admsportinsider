import { useId, useState } from "react";

const INK = "#050111";

// Botãozinho "?" que abre uma explicação (hover, foco por teclado ou toque). Aparece acima do botão p/ não
// ser cortado pela borda de baixo do card ("bottom-end" abre p/ baixo, alinhado à direita: p/ quem fica no topo). Reseta tipografia herdada (o kicker é caixa alta com espaçamento).
export default function InfoTip({ title, children, label = "O que é isto?", placement = "top", color = "#7F33D9" }) {
    const id = useId();
    const [open, setOpen] = useState(false);

    return (
        <span
            className="relative inline-flex align-middle"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                aria-label={label}
                aria-expanded={open}
                aria-describedby={open ? id : undefined}
                onClick={() => setOpen((o) => !o)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
                className="inline-flex items-center justify-center"
                style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${color}`, background: "transparent", color, fontSize: 11, fontWeight: 700, lineHeight: 1, cursor: "help", padding: 0 }}
            >
                ?
            </button>
            {open && (
                <span
                    role="tooltip"
                    id={id}
                    style={{ position: "absolute", zIndex: 30, ...(placement === "bottom-end" ? { top: "calc(100% + 10px)", right: -8 } : { bottom: "calc(100% + 10px)", left: -8 }), width: 280, maxWidth: "min(280px, 70vw)", padding: "12px 14px", borderRadius: 14, background: "#fff", border: "1px solid #ECE9F6", boxShadow: "0 18px 40px -16px rgba(5,1,17,.35)", color: INK, textAlign: "left", textTransform: "none", letterSpacing: "normal", whiteSpace: "normal", fontSize: 13, fontWeight: 400, lineHeight: 1.45 }}
                >
                    {title && <strong style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 700 }}>{title}</strong>}
                    {children}
                </span>
            )}
        </span>
    );
}
