const footerClock = document.querySelector("[data-live-clock]");
const CLOCK_LOCALES = Object.freeze({ en: "en-GB", es: "es-ES" });

let footerClockFormatter = null;
let intervalId = null;

function createClockFormatter(language) {
  return new Intl.DateTimeFormat(CLOCK_LOCALES[language], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function updateFooterClock() {
  const now = new Date();
  footerClock.dateTime = now.toISOString();
  footerClock.textContent = footerClockFormatter.format(now);
}

export function setClockLanguage(language) {
  footerClockFormatter = createClockFormatter(language);
  updateFooterClock();
}

export function initClock(language) {
  setClockLanguage(language);
  if (intervalId === null) intervalId = window.setInterval(updateFooterClock, 1000);
}
