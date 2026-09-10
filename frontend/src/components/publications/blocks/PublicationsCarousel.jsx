import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../../services/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import PublicationCard from "./PublicationCard";
import CarouselNavBar from "./CarouselNavBar";

const SOURCE_LABELS = { nota: "Notas", destaque: "Destaques", financas: "Finanças", externa: "Publicação Externa" };

const SkeletonCard = () => <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-200 h-[340px] sm:h-[380px]" />;

// Carrossel automático puxado direto do WordPress (ver getWordpressPublications
// no backend) — fonte configurável no editor de Publicações: Notas, Destaques,
// Finanças (categoria) ou Publicação Externa (CPT à parte).
export default function PublicationsCarousel({ slot }) {
  const { source = "nota", limit = 4, desktop_items = 4, mobile_items = 1 } = slot.content || {};
  const swiperRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/publications", { params: { source, limit } });
      setItems(res.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [source, limit]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: Math.min(3, limit) }).map((_, i) => (
          <div key={i} className="w-[80%] sm:w-[45%] lg:w-[30%]">
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
        Nenhuma publicação de "{SOURCE_LABELS[source] || source}" encontrada.
      </div>
    );
  }

  return (
    <div>
      <Swiper
        onSwiper={(sw) => (swiperRef.current = sw)}
        onSlideChange={(sw) => setActiveIndex(sw.realIndex)}
        modules={[Autoplay, Pagination]}
        spaceBetween={14}
        slidesPerView={Math.min(mobile_items, items.length)}
        breakpoints={{ 768: { slidesPerView: Math.min(desktop_items, items.length) } }}
        autoplay={{ delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true }}
        grabCursor
      >
        {items.map((item) => (
          <SwiperSlide key={item.id}>
            <PublicationCard title={item.title} link={item.link} image={item.image} date={item.date} />
          </SwiperSlide>
        ))}
      </Swiper>

      <CarouselNavBar
        total={items.length}
        active={activeIndex}
        onDotClick={(i) => swiperRef.current?.slideTo(i)}
        onPrev={() => swiperRef.current?.slidePrev()}
        onNext={() => swiperRef.current?.slideNext()}
      />
    </div>
  );
}
