import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

/* ───────────────── Card ───────────────── */

const NotaCard = ({ item }) => {
  const { t } = useTranslation();

  const { title, slug, image, type } = item;

  const isNewsletter = type === "newsletter";

  const link = isNewsletter
    ? `https://sportinsider.com.br${slug}`
    : `https://sportinsider.com.br/${slug}`;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-md select-none h-[340px] sm:h-[380px]">

      {/* Imagem */}
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#7f34d9]/40 to-gray-900" />
      )}

      {/* Badge PRO (newsletter) */}
      {isNewsletter && (
        <div className="absolute top-3 left-3 z-10 bg-[#7f34d9] text-white text-[10px] px-2 py-1 rounded-full font-semibold">
          PRO
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Conteúdo */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-white leading-snug line-clamp-3">
          {title}
        </h3>

        {slug ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full py-2.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold hover:bg-white hover:text-[#7f34d9] transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {isNewsletter
              ? t("notes.access_newsletter", "Acessar conteúdo")
              : t("notes.access", "Acessar nota")}
          </a>
        ) : (
          <div className="w-full py-2.5 rounded-full bg-white/10 text-white/40 text-xs text-center font-medium">
            {t("ui.unavailable", "Indisponível")}
          </div>
        )}
      </div>
    </article>
  );
};

/* ───────────────── Skeleton ───────────────── */

const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-200 h-[340px] sm:h-[380px]" />
);

/* ───────────────── Navbar ───────────────── */

const NavBar = ({ total, active, onDotClick, onPrev, onNext }) => {
  if (total === 0) return null;

  const MAX_DOTS = 7;
  const dots = total <= MAX_DOTS ? total : MAX_DOTS;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-[#7f34d9] hover:text-[#7f34d9] transition disabled:opacity-30"
      >
        ‹
      </button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: dots }).map((_, i) => {
          const dotIndex =
            total <= MAX_DOTS
              ? i
              : Math.round((i / (MAX_DOTS - 1)) * (total - 1));

          const isActive =
            total <= MAX_DOTS
              ? i === active
              : Math.abs(dotIndex - active) < total / MAX_DOTS;

          return (
            <button
              key={i}
              onClick={() => onDotClick(dotIndex)}
              className={`rounded-full transition-all ${isActive
                ? "w-5 h-2 bg-[#7f34d9]"
                : "w-2 h-2 bg-gray-300"
                }`}
            />
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-[#7f34d9] hover:text-[#7f34d9] transition"
      >
        ›
      </button>
    </div>
  );
};

/* ───────────────── Seção ───────────────── */

export default function NotasSection() {
  const { t } = useTranslation();

  const swiperRef = useRef(null);

  const [conteudos, setConteudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchConteudos = useCallback(async () => {
    try {
      const response = await api.get("/user/notas");

      const items = response.data?.conteudos;

      setConteudos(Array.isArray(items) ? items : []);
    } catch {
      setError("Não foi possível carregar os conteúdos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConteudos();
  }, [fetchConteudos]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchConteudos();
  };

  return (
    <div className="pb-8 mt-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-[#7f34d9]" />
          <div>
            <h2 className="text-lg font-medium text-[#0A0A0A]">
              {t("notes.title", "Notícias")}
            </h2>
            <p className="text-xs text-[#AFAFB2]">
              {t("notes.subtitle", "Análises e conteúdos exclusivos")}
            </p>
          </div>
        </div>

        {!loading && !error && conteudos.length > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7f34d9]" />
            {conteudos.length}{" "}
            {conteudos.length === 1
              ? t("notes.singular", "conteúdo")
              : t("notes.plural", "conteúdos")}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-white p-10 rounded-2xl border text-center">
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-5 py-2 rounded-full bg-[#7f34d9] text-white"
          >
            {t("ui.try_again", "Tentar novamente")}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[80%] sm:w-[45%] lg:w-[30%]">
              <SkeletonCard />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && conteudos.length === 0 && (
        <div className="bg-white p-10 rounded-2xl border text-center text-sm text-gray-400">
          {t("notes.none_available", "Nenhum conteúdo disponível.")}
        </div>
      )}

      {/* Carousel */}
      {!loading && !error && conteudos.length > 0 && (
        <>
          <Swiper
            onSwiper={(sw) => (swiperRef.current = sw)}
            onSlideChange={(sw) => setActiveIndex(sw.realIndex)}
            modules={[Autoplay, Pagination]}
            spaceBetween={14}
            slidesPerView={1.15}
            breakpoints={{
              640: { slidesPerView: 2.1 },
              1024: { slidesPerView: 4 },
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: true,
              pauseOnMouseEnter: true,
            }}
            grabCursor
          >
            {conteudos.map((item) => (
              <SwiperSlide key={item.id}>
                <NotaCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>

          <NavBar
            total={conteudos.length}
            active={activeIndex}
            onDotClick={(i) => swiperRef.current?.slideTo(i)}
            onPrev={() => swiperRef.current?.slidePrev()}
            onNext={() => swiperRef.current?.slideNext()}
          />
        </>
      )}
    </div>
  );
}