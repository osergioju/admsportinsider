import { useCallback, useState } from "react";

// Preferência do menu lateral (recolhido só com ícones). Uma chave única: vale p/ admin e dashboard.
const KEY = "sidebar_collapsed";

function read() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(read);
  const setCollapsed = useCallback((value) => {
    setCollapsedState(value);
    try { localStorage.setItem(KEY, value ? "1" : "0"); } catch { /* storage bloqueado: só não persiste */ }
  }, []);
  return [collapsed, setCollapsed];
}
