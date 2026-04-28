export default function runPreloader({ appReady } = {}) {
  const preloader = document.getElementById("preloader");

  if (!preloader) return Promise.resolve();

  const minVisibleMs = 1000;
  const inner = preloader.querySelector(".preloader__inner");
  const siteLogo = document.querySelector(".logo");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const exitDuration = reduceMotion ? 0 : 350;
  const logoRevealDelay = reduceMotion ? 0 : 350;
  const overlayFadeDelay = reduceMotion ? 0 : 350;
  const removeDelay = 350;

  const onWindowLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }

    window.addEventListener("load", resolve, { once: true });
  });

  const onFontsReady = document.fonts?.ready ?? Promise.resolve();
  const onAppReady = appReady ?? Promise.resolve();
  const minTimer = new Promise((resolve) => {
    window.setTimeout(resolve, minVisibleMs);
  });

  return Promise.all([onWindowLoaded, onFontsReady, onAppReady, minTimer])
    .catch(() => null)
    .then(
      () =>
        new Promise((resolve) => {
          if (!inner) {
            preloader.classList.add("is-hidden");
            document.body.classList.remove("app-loading");
            window.setTimeout(() => {
              preloader.remove();
              resolve();
            }, removeDelay);
            return;
          }

          inner.classList.add("is-exit");

          const logoRect = siteLogo?.getBoundingClientRect();
          const innerRect = inner.getBoundingClientRect();
          const logoCopy = siteLogo?.cloneNode(true) ?? inner.cloneNode(true);
          logoCopy.classList.add("preloader__logo-copy");
          logoCopy.setAttribute("aria-hidden", "true");

          const targetRect = logoRect ?? innerRect;

          Object.assign(logoCopy.style, {
            left: `${targetRect.left}px`,
            top: `${targetRect.top}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          });

          preloader.append(logoCopy);

          window.setTimeout(() => {
            logoCopy.classList.add("is-visible");
          }, exitDuration + logoRevealDelay);

          window.setTimeout(() => {
            preloader.classList.add("is-hidden");
            document.body.classList.remove("app-loading");
          }, exitDuration + logoRevealDelay + overlayFadeDelay);

          window.setTimeout(() => {
            preloader.remove();
            resolve();
          }, exitDuration + logoRevealDelay + overlayFadeDelay + removeDelay);
        })
    );
}
