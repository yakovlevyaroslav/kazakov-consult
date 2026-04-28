const preloader = document.getElementById("preloader");

if (preloader) {
  const onWindowLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }

    window.addEventListener("load", resolve, { once: true });
  });

  const onFontsReady = document.fonts?.ready ?? Promise.resolve();

  Promise.all([onWindowLoaded, onFontsReady])
    .catch(() => null)
    .finally(() => {
      preloader.classList.add("is-hidden");
      document.body.classList.remove("app-loading");

      window.setTimeout(() => {
        preloader.remove();
      }, 350);
    });
}
