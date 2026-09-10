import { useState, useEffect } from "react";

// Mesmo breakpoint usado em RevenueLineChart.jsx. Usado pelo renderer de
// Publicações pra colapsar linhas da grid em coluna única no mobile (larguras
// em frações de 12 só fazem sentido lado a lado no desktop).
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 640 : false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
