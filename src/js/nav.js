const menuBtn = document.getElementById("menu-btn");
const overlay = document.getElementById("nav-overlay");
const closeBtn = document.getElementById("nav-overlay-close");
const backdrop = document.getElementById("nav-overlay-backdrop");

if (menuBtn && overlay) {
  const navLinks = overlay.querySelectorAll('a[href^="#"]');

  function openMenu() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Закрыть меню");
    menuBtn.classList.add("is-active");
    document.body.classList.add("nav-open");
  }

  function closeMenu() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Открыть меню");
    menuBtn.classList.remove("is-active");
    document.body.classList.remove("nav-open");
  }

  menuBtn.addEventListener("click", () => {
    if (overlay.classList.contains("is-open")) closeMenu();
    else openMenu();
  });

  closeBtn?.addEventListener("click", closeMenu);
  backdrop?.addEventListener("click", closeMenu);

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      closeMenu();
    }
  });
}
