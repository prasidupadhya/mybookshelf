import { UI_COPY } from "./data.js";

const LANGUAGE_STORAGE_KEY = "bookshelf-language";
const heading = document.querySelector("[data-heading]");
const eyebrow = document.querySelector("[data-eyebrow]");
const siteName = document.querySelector("[data-site-name]");
const intro = document.querySelector("[data-intro]");
const languageGroup = document.querySelector("[data-language-group]");
const languageButtons = [...document.querySelectorAll("[data-language]")];
const footerPrefix = document.querySelector("[data-footer-prefix]");
const footerSuffix = document.querySelector("[data-footer-suffix]");

// A saved choice wins; otherwise Spanish browsers start in Spanish.
export function getPreferredLanguage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (UI_COPY[stored]) return stored;
  } catch {
    // Storage can be unavailable in private modes; fall through to the browser language.
  }
  return navigator.languages?.some(language => language.toLowerCase().startsWith("es")) ? "es" : "en";
}

export function applyLanguage(language, { persist = false } = {}) {
  if (!UI_COPY[language]) return false;

  if (persist) {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The language still changes for this visit when storage is unavailable.
    }
  }

  document.documentElement.lang = language;
  document.title = UI_COPY[language].documentTitle;
  heading.textContent = UI_COPY[language].heading;
  eyebrow.textContent = UI_COPY[language].eyebrow;
  siteName.textContent = UI_COPY[language].siteName;
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
