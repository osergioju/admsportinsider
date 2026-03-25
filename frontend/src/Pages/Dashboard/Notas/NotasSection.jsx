import { useState, useEffect, useCallback } from "react";
import { api } from "../../../services/api"

/* ───────────────── Card ───────────────── */

const NotaCard = ({ nota }) => {
  const { title, slug, featuredImage } = nota;
  console.log(nota);
  const cover = featuredImage?.node?.sourceUrl;
  const altText = featuredImage?.node?.altText;

  return (
    <article className="relative min-h-100 bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">

      {/* Capa */}
      <div className="relative h-full bg-gray-100 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={altText || title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
            NOTA
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="pt-16 bg-gradient-to-t from-black via-black to-transparent absolute bottom-0 left-0 right-0 p-5 flex flex-col flex-1">
        <h3 className="text-sm lg:text-lg font-light text-white leading-snug mb-3">
          {title}
        </h3>

        <div className="mt-auto">
          {slug ? (
            <a
              href={`https://sportinsider.com.br/nota/` + slug}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full py-2.5 rounded-full bg-gradient-to-r from-[#904EDE] to-[#4E2A78] text-white text-sm font-medium hover:bg-gray-800 transition"
            >
              Acessar Nota
            </a>
          ) : (
            <div className="w-full py-2.5 rounded-lg bg-gray-200 text-gray-500 text-sm text-center font-medium">
              Indisponível
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
    <div className="aspect-[6/4] bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-9 bg-gray-200 rounded mt-4" />
    </div>
  </div>
);

/* ───────────────── Página ───────────────── */

export default function NotasSection() {
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

      setNotas((prev) =>
        cursor ? [...prev, ...newItems] : newItems
      );

      setPageInfo(newPageInfo);
    } catch (err) {
      setError("Não foi possível carregar as notas.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

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
    <div className="pb-8 mt-14">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl text-gray-900">
            Notas
          </h1>
          <p className="text-sm text-gray-500">
            Notas e análises exclusivas
          </p>
        </div>

        {!loading && !error && notas.length > 0 && (
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full text-xs font-medium text-gray-700">
            <span className="w-2 h-2 bg-black rounded-full" />
            {notas.length} nota{notas.length !== 1 && "s"}
          </div>
        )}
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
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : notas.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border text-center text-gray-500">
            Nenhuma nota disponível no momento.
          </div>
        ) : (
          notas.map((nota) => (
            <NotaCard key={nota.id} nota={nota} />
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
            {loadingMore ? "Carregando..." : "Ver mais notas"}
          </button>
        </div>
      )}
    </div>
  );
}