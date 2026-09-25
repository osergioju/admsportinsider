import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";

// Casco visual das telas "Escolha seu plano" e "Assinatura e cobrança" (design de referência:
// pastas "Escolha seu plano-html" e "Assinatura e cobrança-html"). Tipografia grande e leve, linhas
// finas no lugar de cards. Cores por variável do modo escuro, com o valor do design como reserva.
export const INK = "var(--dm-text, #050111)";
export const MUTED = "var(--dm-muted, #3C1867)";
export const LINE = "var(--dm-border, rgba(60,24,103,0.16))";
export const LINE_SOFT = "var(--dm-border, rgba(60,24,103,0.12))";
export const BRAND = "var(--dm-brand, #7F33D9)";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7F33D9]";

export function Eyebrow({ children, color = BRAND, className = "" }) {
  return (
    <div
      className={`text-[11px] font-bold uppercase tracking-[0.24em] ${className}`}
      style={{ color }}
    >
      {children}
    </div>
  );
}

// Botão em pílula: primary (roxo cheio) | secondary (contorno)
export function PillButton({ variant = "primary", loading = false, children, className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full text-base font-semibold tracking-[-0.005em] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";
  const styles =
    variant === "primary"
      ? "bg-[#7F33D9] text-white hover:bg-[#6B22C4]"
      : "border border-[rgba(60,24,103,0.3)] text-[#3C1867] hover:border-[#7F33D9] hover:text-[#7F33D9] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:hover:border-[var(--dm-brand)] dark:hover:text-[var(--dm-brand)]";
  return (
    <button type="button" aria-busy={loading} className={`${base} ${styles} ${focusRing} ${className}`} {...props}>
      {loading && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {children}
    </button>
  );
}

// Link de texto com seta que sobe (ex.: "Comparar planos ↗"). Aceita `to` (rota) ou onClick.
export function ArrowLink({ to, onClick, children, disabled = false }) {
  const cls = `group inline-flex items-center gap-[9px] text-[15px] font-semibold transition-colors hover:text-[#7F33D9] disabled:opacity-50 cursor-pointer ${focusRing}`;
  const inner = (
    <>
      <span>{children}</span>
      <ArrowUpRight size={15} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </>
  );
  return to ? (
    <Link to={to} className={cls} style={{ color: MUTED }}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} style={{ color: MUTED }}>{inner}</button>
  );
}

// Separador de rodapé: pontinho lilás entre itens
export function Dot() {
  return <span className="inline-block w-[7px] h-[7px] rounded-full bg-[#A977E5] shrink-0" aria-hidden="true" />;
}

export function Hairline({ className = "" }) {
  return <div className={`h-px w-full ${className}`} style={{ background: LINE }} />;
}

// Cabeçalho + moldura da página. `backTo` mostra o botão redondo de voltar.
export default function BillingShell({ title, subtitle, backTo, backLabel, children }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-[#FCFAFE] dark:from-[var(--dm-surface)] dark:to-[var(--dm-surface)] px-6 sm:px-10 lg:px-14 pt-10 pb-12 lg:pt-14"
      style={{ fontFamily: "'Effra Trial', 'Effra', 'Hanken Grotesk', system-ui, sans-serif" }}
    >
      <div className="relative">
        <header className="flex items-start gap-5 lg:gap-8">
          {backTo && (
            <Link
              to={backTo}
              aria-label={backLabel}
              className={`mt-1 shrink-0 w-12 h-12 rounded-full border border-[rgba(60,24,103,0.28)] flex items-center justify-center transition-colors hover:border-[#7F33D9] hover:text-[#7F33D9] dark:border-[var(--dm-border)] ${focusRing}`}
              style={{ color: MUTED }}
            >
              <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          )}
          <div className="min-w-0">
            <Eyebrow className="tracking-[0.26em]">Minha conta · Financeiro</Eyebrow>
            <h1
              className="mt-5 text-[40px] sm:text-[52px] lg:text-[64px] leading-none font-light tracking-[-0.03em]"
              style={{ color: INK }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-5 text-base lg:text-[17px] max-w-3xl" style={{ color: MUTED }}>
                {subtitle}
              </p>
            )}
          </div>
        </header>

        <Hairline className="mt-10 lg:mt-12" />
        {children}
      </div>
    </div>
  );
}
