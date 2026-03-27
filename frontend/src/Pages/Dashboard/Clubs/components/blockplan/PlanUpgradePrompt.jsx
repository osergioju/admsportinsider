import { useNavigate } from "react-router-dom";
import IconInsider from "../../../../../assets/svg/brand-icon.svg";

export default function PlanUpgradePrompt({
  title = "Visualize dados financeiros em tempo real",
  description = "Desbloqueie gráficos detalhados, histórico completo e muito mais com um plano avançado.",
  badge = "Disponível nos planos Pro e Premium",
  ctaLabel = "Fazer upgrade agora →",
  redirectTo = "/me/plans",
}) {
  const navigate = useNavigate();

  return (
    <div className="p-10 overflow-hidden relative flex items-center justify-center h-full px-4 bg-white rounded-xl">
      <div className="w-full h-full blur-xs absolute top-0 left-0 p-10">
        <svg width="100%" height="100%" viewBox="0 0 680 320" preserveAspectRatio="none">
          <line x1="60" y1="20" x2="650" y2="20" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
          <line x1="60" y1="58.6" x2="650" y2="58.6" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
          <line x1="60" y1="97.1" x2="650" y2="97.1" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
          <line x1="60" y1="135.7" x2="650" y2="135.7" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
          <line x1="60" y1="174.3" x2="650" y2="174.3" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
          <line x1="60" y1="212.9" x2="650" y2="212.9" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
          <line x1="60" y1="251.4" x2="650" y2="251.4" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
          <line x1="60" y1="290" x2="650" y2="290" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />

          <text x="48" y="24" textAnchor="end" fontSize="12" fill="var(--color-text-secondary)" dominantBaseline="central">7M</text>
          <text x="48" y="62" textAnchor="end" fontSize="12" fill="var(--color-text-secondary)" dominantBaseline="central">6M</text>
          <text x="48" y="101" textAnchor="end" fontSize="12" fill="var(--color-text-secondary)" dominantBaseline="central">5M</text>
          <text x="48" y="139" textAnchor="end" fontSize="12" fill="var(--color-text-secondary)" dominantBaseline="central">4M</text>
          <text x="48" y="178" textAnchor="end" fontSize="12" fill="var(--color-text-secondary)" dominantBaseline="central">3M</text>
          <text x="48" y="216" textAnchor="end" fontSize="12" fill="var(--color-text-secondary)" dominantBaseline="central">2M</text>
          <text x="48" y="255" textAnchor="end" fontSize="12" fill="var(--color-text-secondary)" dominantBaseline="central">1M</text>
          <text x="48" y="290" textAnchor="end" fontSize="12" fill="var(--color-text-secondary)" dominantBaseline="central">0M</text>
          <polyline
            points="130,170.2 260,64.6 390,50.1 520,21.7 630,23.6"
            fill="none"
            stroke="#D32F2F"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="130" cy="170.2" r="5" fill="#D32F2F" />
          <circle cx="260" cy="64.6" r="5" fill="#D32F2F" />
          <circle cx="390" cy="50.1" r="5" fill="#D32F2F" />
          <circle cx="520" cy="21.7" r="5" fill="#D32F2F" />
          <circle cx="630" cy="23.6" r="5" fill="#D32F2F" />
          <text x="130" y="308" textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">2020</text>
          <text x="260" y="308" textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">2021</text>
          <text x="390" y="308" textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">2022</text>
          <text x="520" y="308" textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">2023</text>
          <text x="630" y="308" textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">2024</text>
        </svg>
      </div>
      <div className="border border-gray-200 relative rounded-[2.5rem] bg-white p-8 flex flex-col items-center text-center max-w-sm w-full">

        <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] flex items-center justify-center mb-5">
          <img src={IconInsider} alt="Logo" className="w-6 h-auto" />
        </div>

        <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-2">
          {title}
        </h3>

        <p className="text-gray-400 text-xs lg:text-sm font-medium mb-6 leading-relaxed">
          {description}
        </p>

        {badge && (
          <span className="px-3 py-1 rounded-full bg-[#F5F3FF] text-[#7F33D9] text-[10px] font-bold mb-6 tracking-wide uppercase">
            {badge}
          </span>
        )}

        <button
          onClick={() => navigate(redirectTo)}
          className="cursor-pointer w-full py-3 rounded-2xl bg-[#7F33D9] hover:bg-[#6a28b8] active:scale-95 text-white text-sm font-bold shadow-[0_8px_20px_rgba(127,51,217,0.25)] transition-all duration-300"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}