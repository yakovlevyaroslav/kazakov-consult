import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function runGsapAnimations() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  gsap.defaults({
    ease: "power2.out",
    duration: 1.1,
  });

  const revealOnScroll = (selector, config = {}) => {
    const elements = gsap.utils.toArray(selector);
    if (!elements.length) return;

    const { scrollTrigger: scrollTriggerConfig, ...animationConfig } = config;
    const groupedBySection = new Map();

    elements.forEach((element) => {
      const section = element.closest("section") || element.parentElement || element;
      if (!groupedBySection.has(section)) {
        groupedBySection.set(section, []);
      }
      groupedBySection.get(section).push(element);
    });

    groupedBySection.forEach((groupElements, section) => {
      gsap.from(groupElements, {
        y: 34,
        opacity: 0,
        stagger: 0.11,
        ...animationConfig,
        scrollTrigger: {
          trigger: section,
          start: "top 84%",
          once: true,
          ...(scrollTriggerConfig || {}),
        },
      });
    });
  };

  // Hero: более мягкое кинематографичное появление.
  const heroTl = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });
  heroTl
    .from(".hero__badge", { y: 24, opacity: 0, duration: 0.85 }, 0)
    .from(".hero__title", { y: 36, opacity: 0, duration: 1.1 }, 0)
    .from(".hero__text", { y: 24, opacity: 0, duration: 0.85 }, 0)
    .from(".hero__info .btn", { y: 20, opacity: 0, duration: 0.75 }, 0)
    .from(
      ".hero__portrait-image",
      { x: 28, opacity: 0, duration: 1.05, ease: "power2.out" },
      0
    )
    .from(
      ".hero__quote",
      { y: 20, opacity: 0, duration: 0.8, stagger: 0.16 },
      0
    );

  let heroStarted = false;
  const playHeroAnimation = () => {
    if (heroStarted) return;
    heroStarted = true;
    heroTl.play(0);
  };
  window.addEventListener("preloader:done", playHeroAnimation, { once: true });
  if (!document.body.classList.contains("app-loading")) {
    playHeroAnimation();
  }

  // Общие заголовки секций.
  revealOnScroll(".section__greeting, .section__title, .section__text", {
    y: 28,
    duration: 1,
    stagger: 0.09,
  });

  // Карточки блоков.
  revealOnScroll(".about__grid-item, .situations__grid-item, .youself__grid-item", {
    y: 36,
    opacity: 0,
    scale: 0.97,
    duration: 1.5,
    stagger: 0.1,
  });

  // Этапы: последовательный таймлайн.
  revealOnScroll(".steps__list-line", {
    scaleY: 0,
    opacity: 0.7,
    transformOrigin: "top center",
    duration: 1.2,
    scrollTrigger: {
      trigger: ".steps__list",
      start: "top 60%",
    },
  });
  revealOnScroll(".steps__list-item", {
    x: 24,
    y: 20,
    opacity: 0,
    duration: 0.95,
    stagger: 0.14,
    scrollTrigger: {
      trigger: ".steps__list",
      start: "top 60%",
    },
  });

  // Слайдер и тарифы.
  revealOnScroll(".kdr .swiper", {
    y: 24,
    opacity: 0,
    duration: 1.05,
  });
  revealOnScroll(".tariffs__grid-item", {
    y: 30,
    opacity: 0,
    rotateX: -8,
    transformOrigin: "center top",
    duration: 1,
    stagger: 0.12,
  });

  // CTA форма и контакты.
  revealOnScroll(".consultation__content-block", {
    y: 34,
    opacity: 0,
    duration: 1.05,
    stagger: 0.16,
    scrollTrigger: {
      trigger: "#consultation",
      start: "top 78%",
    },
  });
}
