import { UI_COPY } from "./data.js";

const heading = document.querySelector("[data-heading]");
const intro = document.querySelector("[data-intro]");
const languageGroup = document.querySelector("[data-language-group]");
const languageButtons = [...document.querySelectorAll("[data-language]")];
const footerPrefix = document.querySelector("[data-footer-prefix]");
const footerSuffix = document.querySelector("[data-footer-suffix]");

export function applyLanguage(language) {
  if (!UI_COPY[language]) return false;

  document.documentElement.lang = language;
  heading.textContent = UI_COPY[language].heading;
  intro.textContent = UI_COPY[language].intro;
  languageGroup.setAttribute("aria-label", UI_COPY[language].languageLabel);
  footerPrefix.textContent = UI_COPY[language].footerPrefix;
  footerPrefix.hidden = !UI_COPY[language].footerPrefix;
  footerSuffix.textContent = UI_COPY[language].footerSuffix;
  footerSuffix.hidden = !UI_COPY[language].footerSuffix;

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  window.dispatchEvent(new CustomEvent("bookshelf:languagechange", {
    detail: { language }
  }));
  return true;
}
