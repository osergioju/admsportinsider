import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { AuthContext } from "./AuthContext";

export const TranslationContext = createContext({
  t: (code, fallback) => fallback ?? code,
  locale: "pt-BR",
  loadingTranslations: false,
});

export function TranslationProvider({ children }) {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [translations, setTranslations] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState(false);

  // Locale vem de user.region_code (ex: "en-US", "ES", "pt-BR")
  const locale = user?.region_code ?? "pt-BR";

  useEffect(() => {
    // Só busca quando o usuário está logado e o auth terminou de carregar
    if (authLoading || !user) {
      setTranslations({});
      return;
    }

    async function fetchTranslations() {
      setLoadingTranslations(true);
      try {
        const { data } = await api.get("/user/translations");
        setTranslations(data);
      } catch (err) {
        console.error("[TranslationContext] Erro ao buscar traduções:", err);
        // Falha silenciosa — o app continua funcionando com pt-BR hardcoded
        setTranslations({});
      } finally {
        setLoadingTranslations(false);
      }
    }

    fetchTranslations();
  }, [user?.region_code, user?.id, authLoading]); // re-busca se o usuário trocar de idioma

  /**
   * t(code, fallback?)
   * Retorna a tradução do code ou o fallback fornecido ou o próprio code.
   *
   * Uso:
   *   t("menu.home")            → "Home page" (en-US) | "Página inicial" (pt-BR fallback)
   *   t("menu.home", "Início")  → usa "Início" se não encontrar nem no mapa nem no db
   */
  const t = useCallback(
    (code, fallback) => translations[code] ?? fallback ?? code,
    [translations]
  );

  return (
    <TranslationContext.Provider value={{ t, locale, loadingTranslations }}>
      {children}
    </TranslationContext.Provider>
  );
}

/** Hook de conveniência */
export function useTranslation() {
  return useContext(TranslationContext);
}
