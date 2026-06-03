import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { AuthContext } from "./AuthContext";

export const TranslationContext = createContext({
  t: (code, fallback) => fallback ?? code,
  locale: "pt-BR",
  publicLocale: "pt-BR",
  setPublicLocale: () => {},
  loadingTranslations: false,
});

const LOCALES = [
  { code: "pt-BR", label: "PT", flag: "🇧🇷" },
  { code: "en-US", label: "EN", flag: "🇺🇸" },
  { code: "ES",    label: "ES", flag: "🇪🇸" },
];

export function TranslationProvider({ children }) {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [translations, setTranslations] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [publicLocale, setPublicLocaleState] = useState(
    () => localStorage.getItem("publicLocale") || "pt-BR"
  );

  const locale = user?.region_code ?? publicLocale;

  function setPublicLocale(code) {
    localStorage.setItem("publicLocale", code);
    setPublicLocaleState(code);
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
