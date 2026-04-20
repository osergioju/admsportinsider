import { useState, useEffect, useCallback } from "react";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";

/* ───────────────── Card ───────────────── */

const NotaCard = ({ nota }) => {
  const { t } = useTranslation();
  const { title, slug, featuredImage } = nota;
  const cover = featuredImage?.node?.sourceUrl;
  const altText = featuredImage?.node?.altText;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 min-h-[220px]">
      {/* Imagem de capa */}
      <div className="relative flex-1 overflow-hidden bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={altText || title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium tracking-widest uppercase">
            {t("notes.label", "Nota")}
          </div>
        )}

        {/* Gradiente sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Conteúdo sobreposto */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3">
        <h3 className="text-sm font-normal text-white leading-snug line-clamp-3">
          {title}
        </h3>

        {slug ? (
          <a
            href={`https://sportinsider.com.br/nota/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full py-2 rounded-full bg-white/10  border border-white/20 text-white text-xs font-medium hover:bg-white hover:text-[#7f34d9] transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {t("notes.access", "Acessar nota")}
          </a>
        ) : (
          <div className="w-full py-2 rounded-full bg-white/10 text-white/40 text-xs text-center">
            {t("ui.unavailable", "Indisponível")}
          </div>
        )}
      </div>
    </article>
  );
};

/* ───────────────── Skeleton ───────────────── */

const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse bg-white min-h-[220px]">
    <div className="h-full bg-gray-100" style={{ minHeight: 220 }} />
  </div>
);

/* ───────────────── Seção ───────────────── */

export default function NotasSection() {
  const { t } = useTranslation();
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });

  const fetchNotas = useCallback(async (cursor = null) => {
    try {
      const params = { first: 12 };
      if (cursor) params.after = cursor;

      const response = await api.get("/user/notas", { params });
      const { notas: newItems, pageInfo: newPageInfo } = response.data;

      setNotas((prev) => (cursor ? [...prev, ...newItems] : newItems));
      setPageInfo(newPageInfo);
    } catch (err) {
      setError("Não foi possível carregar as notas.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchNotas(); }, [fetchNotas]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchNotas(pageInfo.endCursor);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchNotas();
  };

  return (
    <div className="pb-8 mt-10">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-[#7f34d9]" />
          <div>
            <h2 className="text-lg font-medium text-[#0A0A0A] leading-tight">
              {t("notes.title", "Notas")}
            </h2>
            <p className="text-xs text-[#AFAFB2] mt-0.5">
              {t("notes.subtitle", "Análises e conteúdos exclusivos")}
            </p>
          </div>
        </div>

        {!loading && !error && notas.length > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7f34d9]" />
            {notas.length} {notas.length === 1 ? t("notes.singular", "nota") : t("notes.plural", "notas")}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {error ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border border-gray-100 text-center">
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-5 py-2 rounded-full bg-[#7f34d9] text-white text-sm hover:bg-[#6b28bf] transition"
            >
              {t("ui.try_again", "Tentar novamente")}
            </button>
          </div>
        ) : loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : notas.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border border-gray-100 text-center text-sm text-gray-400">
            {t("notes.none_available", "Nenhuma nota disponível no momento.")}
          </div>
        ) : (
          notas.map((nota) => <NotaCard key={nota.id} nota={nota} />)
        )}
      </div>

      {/* Ver mais */}
      {!loading && !error && pageInfo.hasNextPage && (
        <div className="flex justify-center mt-10">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-[#7f34d9] hover:text-[#7f34d9] transition-all disabled:opacity-50"
          >
            {loadingMore ? "Carregando…" : t("notes.see_more", "Ver mais notas")}
          </button>
        </div>
      )}
    </div>
  );
}
