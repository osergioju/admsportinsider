import { useBanners } from  "../../hooks/findBanners";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";


export default function HomeBanners() {
  const banners = useBanners();

  return (
    <section className="w-full overflow-hidden">
      
         <Swiper
            modules={[Pagination, Autoplay]}
            slidesPerView={1}
            loop
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              el: ".custom-pagination",
            }}
            className="relative rounded-xl overflow-hidden"
        >
          {banners.map((banner) => (
          <SwiperSlide>
            <a
              key={banner.id_banner}
              href={banner.link_url || "#"}
              className="z-50 cursor-pointer absolute inline-block w-full h-full"
              target="_blank"
            >
            </a>
            {/* Desktop */}
            <img
              src={banner.image_desktop_url}
              className="hidden md:block w-full"
              alt={banner.title}
            />

            {/* Mobile */}
            <img
              src={banner.image_mobile_url}
              className="block md:hidden w-full"
              alt={banner.title}
            />
            
          </SwiperSlide>
          ))}
          {/* PAGINAÇÃO */}
          <div className="custom-pagination absolute top-6 left-6 flex gap-2 z-20" />
        </Swiper>
      
    </section>
  );
}
