import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../context/TranslationContext";

// Botão redondo claro/escuro. Mostra o ícone do modo PARA O QUAL vai trocar (lua no claro, sol no escuro).
export default function ThemeToggle({ compact = false, className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const label = isDark ? t("ui.theme_light", "Modo claro") : t("ui.theme_dark", "Modo escuro");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={`relative ${compact ? "w-9 h-9" : "w-11 h-11"} shrink-0 rounded-full border border-gray-200 bg-white text-gray-500 flex items-center justify-center shadow-sm cursor-pointer transition-all hover:border-[#7F33D9] hover:text-[#7F33D9] hover:shadow-purple-500/20 active:scale-95 ${className}`}
    >
      <Sun size={18} strokeWidth={1.5} className={`absolute transition-all duration-300 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} />
      <Moon size={18} strokeWidth={1.5} className={`absolute transition-all duration-300 ${isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
    </button>
  );
}
