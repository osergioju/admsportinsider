import { useBanners } from "../../hooks/findBanners";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

export default function HomeBanners() {
  const banners = useBanners();

  if (banners.length === 0) {
    return (
      <div className="w-full h-[240px] rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse" />
    );
  }

  return (
    <section className="w-full overflow-hidden">
      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        pagination={{ clickable: true, el: ".banner-pagination" }}
        className="relative rounded-2xl overflow-hidden"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id_banner} className="relative">
            <a
              href={banner.link_url || "#"}
              className="absolute inset-0 z-10"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver banner"
            />

            {/* Desktop */}
            <div
              className="hidden md:block w-full bg-cover bg-center bg-gray-900"
              style={{
                backgroundImage: `url(${banner.image_desktop_url})`,
                height: 240,
              }}
            />

            {/* Mobile */}
            <div
              className="md:hidden w-full bg-cover bg-center bg-gray-900"
              style={{
                backgroundImage: `url(${banner.image_mobile_url})`,
                height: 200,
              }}
            />
          </SwiperSlide>
        ))}

        {/* Paginação centralizada na parte inferior */}
        <div className="banner-pagination absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20" />
      </Swiper>

      <style>{`
        .banner-pagination .swiper-pagination-bullet {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.5);
          transition: width 0.25s ease, background 0.25s ease;
          cursor: pointer;
        }
        .banner-pagination .swiper-pagination-bullet-active {
          width: 20px;
          background: #fff;
        }
      `}</style>
    </section>
  );
}
