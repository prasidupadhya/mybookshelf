import { UI_COPY } from "./data.js";
import { initClock, setClockLanguage } from "./clock.js";
import { initBookplate, openBookplate, refreshBookplateLanguage } from "./bookplate.js";
import { applyLanguage } from "./language.js";
import { renderLibrary } from "./library.js";
import { cancelBookSelection, initMotion, selectBook } from "./motion.js";

const bookcase = document.querySelector("[data-bookcase]");
const languageButtons = [...document.querySelectorAll("[data-language]")];

let activeLanguage = document.documentElement.lang === "es" ? "es" : "en";

function setLanguage(language) {
  if (!UI_COPY[language] || !applyLanguage(language)) return;

  activeLanguage = language;
  cancelBookSelection();
  renderLibrary(activeLanguage);
  refreshBookplateLanguage(activeLanguage);
  setClockLanguage(activeLanguage);
}

bookcase.addEventListener("click", (event) => {
  const spine = event.target.closest("[data-book-index]");
  if (!spine) return;
  selectBook(spine, event, () => {
    openBookplate(Number(spine.dataset.bookIndex), spine, activeLanguage);
  });
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

applyLanguage(activeLanguage);
renderLibrary(activeLanguage);
initBookplate(activeLanguage);
initClock(activeLanguage);
initMotion();
