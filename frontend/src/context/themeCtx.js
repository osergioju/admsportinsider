import { createContext } from "react";

// Padrão (usado também no SSR, onde não há provider): tema claro.
export const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});
