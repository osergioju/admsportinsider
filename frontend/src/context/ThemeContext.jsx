import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeCtx";

// Tema claro/escuro do app. A classe `dark` fica no <html> (o Tailwind e o theme-dark.css dependem dela) e a
// escolha é salva em localStorage["theme"]. O script no <head> do index.html aplica a classe ANTES do React
// montar, então abrir no escuro não pisca branco. Padrão: claro (não seguimos o tema do sistema).
const KEY = "theme";
const META_COLOR = { light: "#7F33D9", dark: "#0A0616" };

function apply(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme; // scrollbars e controles nativos acompanham
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[theme]);
}

function readInitial() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitial);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    apply(next);
    try { localStorage.setItem(KEY, next); } catch { /* storage bloqueado: vale só nesta sessão */ }
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  // Mantém várias abas abertas em sincronia.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
        apply(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => ({ theme, isDark: theme === "dark", setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
