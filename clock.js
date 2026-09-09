const footerClock = document.querySelector("[data-live-clock]");
const footerClockFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "long",
  year: "numeric"
});

function updateFooterClock() {
  const now = new Date();
  footerClock.dateTime = now.toISOString();
  footerClock.textContent = footerClockFormatter.format(now);
}

updateFooterClock();
window.setInterval(updateFooterClock, 1000);
