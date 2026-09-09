const footerClock = document.querySelector("[data-live-clock]");
const CLOCK_LOCALES = Object.freeze({ en: "en-GB", es: "es-ES" });
let clockLanguage = document.documentElement.lang === "es" ? "es" : "en";

function createClockFormatter(language) {
  return new Intl.DateTimeFormat(CLOCK_LOCALES[language], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

let footerClockFormatter = createClockFormatter(clockLanguage);

function updateFooterClock() {
  const now = new Date();
  footerClock.dateTime = now.toISOString();
  footerClock.textContent = footerClockFormatter.format(now);
}

updateFooterClock();
window.setInterval(updateFooterClock, 1000);

window.addEventListener("bookshelf:languagechange", (event) => {
  clockLanguage = event.detail.language;
  footerClockFormatter = createClockFormatter(clockLanguage);
  updateFooterClock();
});
