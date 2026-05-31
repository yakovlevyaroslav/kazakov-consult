import "./styles/main.scss";
import "./js/form.js";
import "./js/slider.js";
import "./js/nav.js";
import "./js/header-sticky.js";
import { initCookieConsent } from "./js/cookie-consent.js";
import runGsapAnimations from "./js/gsap-animations.js";

initCookieConsent();
runGsapAnimations();

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
