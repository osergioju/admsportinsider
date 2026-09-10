import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../../services/api";
import { useTranslation } from "../../../context/TranslationContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import PublicationCard from "../../../components/publications/blocks/PublicationCard";
import CarouselNavBar from "../../../components/publications/blocks/CarouselNavBar";

// Percorre a árvore de layout (ver PublicationsAdmin/SlotRenderer) e coleta,
// em ordem, as folhas do tipo "external_link" — a zona "finance" é editada
// como uma lista simples, mas a API sempre devolve uma árvore.
function flattenExternalLinks(node) {
  if (!node) return [];
  if (node.type === "block") return node.block_type === "external_link" ? [node] : [];
  return (node.children || []).flatMap(flattenExternalLinks);
}

const SkeletonCard = () => <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-200 h-[340px] sm:h-[380px]" />;

export default function FinanceCarousel() {
  const { t } = useTranslation();
  const swiperRef = useRef(null);

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await api.get("/dashboard/publications/home/finance");
      setSlots(flattenExternalLinks(res.data.tree));
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  if (!loading && slots.length === 0) return null;

  return (
    <div className="pb-8 mt-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-[#7f34d9]" />
          <h2 className="text-lg font-medium text-[#0A0A0A]">{t("finance.title", "Finanças")}</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[80%] sm:w-[45%] lg:w-[30%]">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : (
        <>
          <Swiper
            onSwiper={(sw) => (swiperRef.current = sw)}
            onSlideChange={(sw) => setActiveIndex(sw.realIndex)}
            modules={[Autoplay, Pagination]}
            spaceBetween={14}
            slidesPerView={1.15}
            breakpoints={{ 640: { slidesPerView: 2.1 }, 1024: { slidesPerView: 4 } }}
            autoplay={{ delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true }}
            grabCursor
          >
            {slots.map((slot) => (
              <SwiperSlide key={slot.id}>
                <PublicationCard
                  title={slot.content?.title}
                  link={slot.content?.url}
                  image={slot.content?.image_url}
                  ctaLabel={slot.content?.source_label ? `Ver em ${slot.content.source_label}` : "Ver conteúdo"}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <CarouselNavBar
            total={slots.length}
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
