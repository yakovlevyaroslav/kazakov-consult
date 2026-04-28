const preloader = document.getElementById("preloader");

if (preloader) {
  const minVisibleMs = 5000;
  const inner = preloader.querySelector(".preloader__inner");
  const siteLogo = document.querySelector(".logo");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const exitDuration = reduceMotion ? 0 : 260;
  const logoRevealDelay = reduceMotion ? 0 : 110;
  const overlayFadeDelay = reduceMotion ? 0 : 180;

  const minTimer = new Promise((resolve) => {
    window.setTimeout(resolve, minVisibleMs);
  });

  const onWindowLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }

    window.addEventListener("load", resolve, { once: true });
  });

  const onFontsReady = document.fonts?.ready ?? Promise.resolve();

  Promise.all([onWindowLoaded, onFontsReady, minTimer])
    .catch(() => null)
    .finally(() => {
      if (!inner) {
        preloader.classList.add("is-hidden");
        document.body.classList.remove("app-loading");
        window.setTimeout(() => preloader.remove(), 350);
        return;
      }

      inner.classList.add("is-exit");

      const logoRect = siteLogo?.getBoundingClientRect();
      const innerRect = inner.getBoundingClientRect();
      const logoCopy = (siteLogo?.cloneNode(true) ?? inner.cloneNode(true));
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
      }, exitDuration + logoRevealDelay + overlayFadeDelay + 350);
    });
}
