const header = document.getElementById("header");

if (header) {
  const threshold = 16;

  function updateHeader() {
    const y = window.scrollY ?? document.documentElement.scrollTop ?? 0;
    header.classList.toggle("is-scrolled", y > threshold);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}
