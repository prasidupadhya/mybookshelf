const THEME_STORAGE_KEY = "bookshelf-theme";
const THEME_COLORS = Object.freeze({ dark: "#0e0d0b", light: "#e9e7e0" });
const THEME_COPY = Object.freeze({
  en: Object.freeze({ toLight: "Switch to light mode", toDark: "Switch to dark mode" }),
  es: Object.freeze({ toLight: "Cambiar al modo claro", toDark: "Cambiar al modo oscuro" })
});
// Icon geometry from the animated sun/moon toggle: a sun with eight rays and a crescent moon.
const SUN_PATHS = [
  "M12.4058 17.7625C15.1672 17.7625 17.4058 15.5239 17.4058 12.7625C17.4058 10.0011 15.1672 7.76251 12.4058 7.76251C9.64434 7.76251 7.40576 10.0011 7.40576 12.7625C7.40576 15.5239 9.64434 17.7625 12.4058 17.7625Z",
  "M12.4058 1.76251V3.76251", "M12.4058 21.7625V23.7625", "M4.62598 4.98248L6.04598 6.40248",
  "M18.7656 19.1225L20.1856 20.5425", "M1.40576 12.7625H3.40576", "M21.4058 12.7625H23.4058",
  "M4.62598 20.5425L6.04598 19.1225", "M18.7656 6.40248L20.1856 4.98248"
];
const MOON_PATH = "M21.1918 13.2013C21.0345 14.9035 20.3957 16.5257 19.35 17.8781C18.3044 19.2305 16.8953 20.2571 15.2875 20.8379C13.6797 21.4186 11.9398 21.5294 10.2713 21.1574C8.60281 20.7854 7.07479 19.9459 5.86602 18.7371C4.65725 17.5283 3.81774 16.0003 3.4457 14.3318C3.07367 12.6633 3.18451 10.9234 3.76526 9.31561C4.346 7.70783 5.37263 6.29868 6.72501 5.25307C8.07739 4.20746 9.69959 3.56862 11.4018 3.41132C10.4052 4.75958 9.92564 6.42077 10.0503 8.09273C10.175 9.76469 10.8957 11.3364 12.0812 12.5219C13.2667 13.7075 14.8384 14.4281 16.5104 14.5528C18.1823 14.6775 19.8435 14.1979 21.1918 13.2013Z";

const systemTheme = window.matchMedia("(prefers-color-scheme: light)");

function readStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  } catch {
    return null;
  }
}

function getPreferredTheme() {
  return readStoredTheme() ?? (systemTheme.matches ? "light" : "dark");
}

function getThemeLanguage() {
  return document.documentElement.lang === "es" ? "es" : "en";
}

function renderThemeIcon(toggle) {
  const sun = SUN_PATHS.map(d => `<path d="${d}" pathLength="1"/>`).join("");
  toggle.innerHTML = `<svg class="theme-toggle__icon" viewBox="0 0 25 25" aria-hidden="true" focusable="false">`
    + `<g class="theme-toggle__sun">${sun}</g>`
    + `<path class="theme-toggle__moon" d="${MOON_PATH}" pathLength="1"/></svg>`;
}

function updateThemeToggle() {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  // The label names the mode the button will switch to, as the animated toggle does.
  const currentTheme = document.documentElement.dataset.theme || getPreferredTheme();
  const copy = THEME_COPY[getThemeLanguage()];
  const label = currentTheme === "dark" ? copy.toLight : copy.toDark;
  toggle.setAttribute("aria-label", label);
  toggle.title = label;
}

function setTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The theme still works when local storage is unavailable.
    }
  }

  updateThemeToggle();
}

setTheme(getPreferredTheme());

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) renderThemeIcon(toggle);
  updateThemeToggle();

  toggle?.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme, true);
  });
});

systemTheme.addEventListener("change", (event) => {
  if (!readStoredTheme()) setTheme(event.matches ? "light" : "dark");
});

window.addEventListener("bookshelf:languagechange", updateThemeToggle);
