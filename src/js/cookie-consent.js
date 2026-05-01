import { gsap } from "gsap";

const STORAGE_KEY = "kazakov_cookie_privacy_consent_v1";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Показ баннера только после события preloader:done (см. preloader.js),
 * чтобы не перекрывать экран загрузки. Если прелоадера нет — сразу.
 */
export function initCookieConsent() {
  const root = document.getElementById("cookie-consent");
  const acceptBtn = document.getElementById("cookie-consent-accept");
  if (!root || !acceptBtn) return;

  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "1") {
      root.setAttribute("hidden", "");
      return;
    }
  } catch {
    // приватный режим и т.п.
  }

  const mount = () => {
    const panel = root.querySelector(".cookie-consent__panel");
    let showTween = null;
    let hideTween = null;

    const hide = () => {
      showTween?.kill();
      hideTween?.kill();

      if (!panel || prefersReducedMotion()) {
        root.setAttribute("hidden", "");
        if (panel) gsap.set(panel, { clearProps: "all" });
        return;
      }

      hideTween = gsap.to(panel, {
        opacity: 0,
        y: 28,
        scale: 0.97,
        filter: "blur(6px)",
        duration: 0.38,
        ease: "power2.in",
        onComplete: () => {
          root.setAttribute("hidden", "");
          gsap.set(panel, { clearProps: "all" });
        },
      });
    };

    root.removeAttribute("hidden");

    if (panel && !prefersReducedMotion()) {
      gsap.set(panel, {
        opacity: 0,
        y: 56,
        scale: 0.94,
        filter: "blur(10px)",
        transformOrigin: "50% 100%",
      });
      showTween = gsap.to(panel, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.85,
        ease: "power3.out",
        delay: 0.08,
        clearProps: "filter",
      });
    } else if (panel) {
      gsap.set(panel, { clearProps: "all" });
    }

    acceptBtn.addEventListener("click", () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // игнорируем
      }
      window.dispatchEvent(new CustomEvent("cookie-consent:accepted"));
      hide();
    });
  };

  const preloader = document.getElementById("preloader");
  if (!preloader) {
    mount();
    return;
  }

  window.addEventListener("preloader:done", () => mount(), { once: true });
}
