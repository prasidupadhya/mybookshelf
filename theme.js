const THEME_STORAGE_KEY = "bookshelf-theme";
const THEME_COLORS = Object.freeze({ dark: "#0f1b17", light: "#e9dcc4" });
const THEME_COPY = Object.freeze({
  en: Object.freeze({ light: "Light", dark: "Dark", toLight: "Switch to light theme", toDark: "Switch to dark theme" }),
  es: Object.freeze({ light: "Claro", dark: "Oscuro", toLight: "Cambiar al tema claro", toDark: "Cambiar al tema oscuro" })
});

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

function updateThemeToggle() {
  const toggle = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");
  if (!toggle || !label) return;

  const currentTheme = document.documentElement.dataset.theme || getPreferredTheme();
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  const copy = THEME_COPY[getThemeLanguage()];

  toggle.dataset.nextTheme = nextTheme;
  toggle.setAttribute("aria-label", nextTheme === "light" ? copy.toLight : copy.toDark);
  toggle.title = nextTheme === "light" ? copy.toLight : copy.toDark;
  label.textContent = copy[nextTheme];
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
