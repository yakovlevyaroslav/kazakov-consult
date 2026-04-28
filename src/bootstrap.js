import "./styles/_preloader.scss";
import runPreloader from "./js/preloader.js";

const mainAppReady = import("./main.js");

runPreloader({ appReady: mainAppReady }).catch(() => null);
