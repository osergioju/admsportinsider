import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { AuthContext } from "./AuthContext";

export const TranslationContext = createContext({
  t: (code, fallback) => fallback ?? code,
  locale: "pt",
  publicLocale: "pt",
  setPublicLocale: () => {},
  loadingTranslations: false,
});

// Códigos padronizados: só o idioma, sem sufixo de região (pt, en, es).
const LOCALES = [
  { code: "pt", label: "PT", flag: "🇧🇷" },
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

// Normaliza valores antigos salvos (ex.: "pt-BR" no localStorage) → "pt".
const normalizeLocale = (l) => (l || "pt").split("-")[0].toLowerCase();

export function TranslationProvider({ children }) {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [translations, setTranslations] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [publicLocale, setPublicLocaleState] = useState(
    () => normalizeLocale(localStorage.getItem("publicLocale"))
  );

  const locale = normalizeLocale(user?.region_code ?? publicLocale);

  function setPublicLocale(code) {
    const norm = normalizeLocale(code);
    localStorage.setItem("publicLocale", norm);
    setPublicLocaleState(norm);
  }

  useEffect(() => {
    if (authLoading) return;

    async function fetchTranslations() {
      setLoadingTranslations(true);
      try {
        let data;
        if (user) {
          ({ data } = await api.get("/user/translations"));
        } else {
          ({ data } = await api.get(`/public/translations?locale=${publicLocale}`));
        }
        setTranslations(data);
      } catch (err) {
        console.error("[TranslationContext] Erro ao buscar traduções:", err);
        setTranslations({});
      } finally {
        setLoadingTranslations(false);
      }
    }

    fetchTranslations();
  }, [user?.region_code, user?.id, authLoading, publicLocale]);

  const t = useCallback(
    (code, fallback) => translations[code] ?? fallback ?? code,
    [translations]
  );

  return (
    <TranslationContext.Provider value={{ t, locale, publicLocale, setPublicLocale, loadingTranslations, LOCALES }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
