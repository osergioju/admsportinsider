import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useTranslation } from "../../context/TranslationContext";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// O WordPress não marca o idioma dos relatórios — detecta pelo título/URI
// para não exibir o mesmo relatório duplicado em português e inglês.
const detectLang = (rel) => {
  const txt = `${rel.title || ""} ${rel.uri || ""}`.toLowerCase();
  if (/[ãõçáéíóúâêô]|copa|finanças|futebol|esporte|brasileiro|relatório|mundo/.test(txt)) return "pt";
  if (/world cup|megaevent|finance|report|football|soccer|-en\//.test(txt)) return "en";
  return "pt";
};

/* ───────────────── Card ───────────────── */

const RelatorioCard = ({ relatorio }) => {
  const { t } = useTranslation();
  const { id, title, uri, featuredImage } = relatorio;
  const cover = featuredImage?.node?.sourceUrl;

  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">

      {/* Capa */}
      <div className="relative aspect-[6/4] bg-gray-100 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
            {t("reports.pdf_label", "PDF")}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-1">


        <h3 className="text-sm font-normal text-gray-900 leading-snug mb-3">
          <div dangerouslySetInnerHTML={{ __html: title }} />
        </h3>

        <div className="mt-auto">
          {uri ? (
            <a
              href={`https://index.sportinsider.com.br/` + uri}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
            >
              {t("reports.download_pdf", "Baixar PDF")}
            </a>
          ) : (
            <div className="w-full py-2.5 rounded-lg bg-gray-200 text-gray-500 text-sm text-center font-medium">
              {t("ui.unavailable", "Indisponível")}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

/* ───────────────── Skeleton ───────────────── */

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-[3/4] bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-9 bg-gray-200 rounded mt-4" />
    </div>
  </div>
);

/* ───────────────── Página ───────────────── */

export default function Relatorios() {
  const { t, locale } = useTranslation();
  // Idioma exibido: começa no idioma da ferramenta, com caixinha para trocar
  const [lang, setLang] = useState(String(locale || "pt-BR").startsWith("en") ? "en" : "pt");
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });

  const fetchRelatorios = useCallback(async (cursor = null) => {
    try {
      const params = { first: 12 };
      if (cursor) params.after = cursor;

      const response = await api.get("/user/relatorios", { params });
      const { relatorios: newItems, pageInfo: newPageInfo } = response.data;

      setRelatorios((prev) =>
        cursor ? [...prev, ...newItems] : newItems
      );

      setPageInfo(newPageInfo);
    } catch (err) {
      setError("Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchRelatorios();
  }, [fetchRelatorios]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchRelatorios(pageInfo.endCursor);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchRelatorios();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 md:px-10 py-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t("reports.title", "Relatórios")}
          </h1>
        </div>

        {/* Caixinha de idioma — evita relatórios duplicados PT/EN */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 self-start">
          {[{ code: "pt", label: "Português" }, { code: "en", label: "English" }].map(o => (
            <button
              key={o.code}
              onClick={() => setLang(o.code)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${lang === o.code ? "bg-white text-[#7F33D9] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {error ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-5 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800 transition"
            >
              {t("ui.try_again", "Tentar novamente")}
            </button>
          </div>
        ) : loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : relatorios.filter(r => detectLang(r) === lang).length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border text-center text-gray-500">
            {t("reports.none_available", "Nenhum relatório disponível no momento.")}
          </div>
        ) : (
          relatorios
            .filter(r => detectLang(r) === lang)
            .map((rel) => (
              <RelatorioCard key={rel.id ?? rel.uri} relatorio={rel} />
            ))
        )}
      </div>

      {/* Load More */}
      {!loading && !error && pageInfo.hasNextPage && (
        <div className="flex justify-center mt-12">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 rounded-full border border-gray-300 bg-white text-sm font-medium hover:border-black hover:bg-black hover:text-white transition disabled:opacity-50"
          >
            {loadingMore ? "Carregando..." : t("reports.see_more", "Ver mais relatórios")}
          </button>
        </div>
      )}
    </div>
  );
}