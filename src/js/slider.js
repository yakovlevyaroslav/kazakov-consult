import Swiper from "swiper";
import { EffectCoverflow, Pagination } from "swiper/modules";
import lightGallery from "lightgallery";
import lgZoom from "lightgallery/plugins/zoom";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";

const sliderEl = document.querySelector(".mySwiper");

if (sliderEl) {
  new Swiper(sliderEl, {
    modules: [EffectCoverflow, Pagination],
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    spaceBetween: 20,
    loop: true,
    coverflowEffect: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });

  const galleryEl = sliderEl.querySelector(".swiper-wrapper");

  if (galleryEl) {
    lightGallery(galleryEl, {
      selector: ".swiper-slide:not(.swiper-slide-duplicate) .swiper-slide__link",
      plugins: [lgZoom, lgThumbnail],
      speed: 500,
      download: false,
      licenseKey: "0000-0000-000-0000",
    });
  }
}