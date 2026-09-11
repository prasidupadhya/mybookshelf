import { BOOKS, UI_COPY } from "./data.js";
import { getSpineByIndex } from "./library.js";

const bookplate = document.querySelector("#bookplate");
const bookplateCard = bookplate.querySelector(".bookplate__card");
const bookplateTitle = bookplate.querySelector("[data-bookplate-title]");
const bookplateAuthor = bookplate.querySelector("[data-bookplate-author]");
const bookplatePages = bookplate.querySelector("[data-bookplate-pages]");
const bookplateDescription = bookplate.querySelector("[data-bookplate-description]");
const bookplateLink = bookplate.querySelector("[data-bookplate-link]");
const bookplateCover = bookplate.querySelector("[data-bookplate-cover]");
const bookplateCoverFallback = bookplate.querySelector("[data-bookplate-cover-fallback]");
const bookplateCoverTitle = bookplate.querySelector("[data-bookplate-cover-title]");
const bookplateCoverFallbackLabel = bookplate.querySelector("[data-bookplate-cover-fallback-label]");
const bookplateClose = bookplate.querySelector(".bookplate__close");
const pageShell = document.querySelector("[data-page-shell]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let lastFocusedSpine = null;
let activeBookIndex = null;
let activeLanguage = "en";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setBookplateOrigin(spine, accentColor) {
  const rect = spine.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;
  const maxX = Math.min(320, window.innerWidth * 0.34);
  const maxY = Math.min(260, window.innerHeight * 0.34);

  const offsetX = reduceMotion.matches ? 0 : clamp(centerX - viewportCenterX, -maxX, maxX);
  const offsetY = reduceMotion.matches ? 0 : clamp(centerY - viewportCenterY, -maxY, maxY);

  bookplate.style.setProperty("--plate-accent", accentColor);
  bookplate.style.setProperty("--book-origin-x", `${(centerX / window.innerWidth) * 100}%`);
  bookplate.style.setProperty("--book-origin-y", `${(centerY / window.innerHeight) * 100}%`);
  bookplateCard.style.setProperty("--book-origin-dx", `${offsetX}px`);
  bookplateCard.style.setProperty("--book-origin-dy", `${offsetY}px`);
}

function showCover(book) {
  bookplateCoverFallback.hidden = true;
  bookplateCover.hidden = false;
  const localizedTitle = book.title[activeLanguage];
  bookplateCover.alt = activeLanguage === "es"
    ? `Portada de ${localizedTitle}`
    : `Cover of ${localizedTitle}`;
  bookplateCoverTitle.textContent = localizedTitle;

  bookplateCover.onerror = () => {
    bookplateCover.hidden = true;
    bookplateCoverFallback.hidden = false;
    bookplateCover.removeAttribute("src");
  };

  bookplateCover.src = book.coverUrl;
}

function populateBookplate(book) {
  bookplateTitle.textContent = book.title[activeLanguage];
  bookplateAuthor.textContent = book.author;
  bookplatePages.textContent = `${book.pageCount} ${UI_COPY[activeLanguage].pages}`;
  bookplateDescription.textContent = book.description[activeLanguage];
  bookplateLink.textContent = UI_COPY[activeLanguage].readOnGoodreads;
  bookplateLink.href = book.url;
  bookplateClose.setAttribute("aria-label", UI_COPY[activeLanguage].closeDetails);
  bookplateCoverFallbackLabel.textContent = UI_COPY[activeLanguage].coverUnavailable;
  bookplateCard.style.setProperty("--plate-accent", book.accentColor);
  showCover(book);
}

export function openBookplate(index, spine, language) {
  const book = BOOKS[index];
  if (!book) return;

  activeLanguage = language;
  lastFocusedSpine = spine;
  activeBookIndex = index;
  populateBookplate(book);
  setBookplateOrigin(spine, book.accentColor);

  bookplate.hidden = false;
  pageShell.inert = true;
  document.body.classList.add("has-open-bookplate");
  requestAnimationFrame(() => bookplate.classList.add("is-open"));
  bookplateClose.focus({ preventScroll: true });
}

function finishClose() {
  if (!bookplate.classList.contains("is-open")) bookplate.hidden = true;
  pageShell.inert = false;
  document.body.classList.remove("has-open-bookplate");
  activeBookIndex = null;
  lastFocusedSpine?.focus({ preventScroll: true });
}

export function closeBookplate() {
  bookplate.classList.remove("is-open");

  if (reduceMotion.matches) {
    finishClose();
    return;
  }

  window.setTimeout(finishClose, 560);
}

export function refreshBookplateLanguage(language) {
  activeLanguage = language;
  if (activeBookIndex === null || bookplate.hidden) return;

  lastFocusedSpine = getSpineByIndex(activeBookIndex);
  populateBookplate(BOOKS[activeBookIndex]);
}

function trapBookplateFocus(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeBookplate();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = [...bookplate.querySelectorAll("button, a[href]")];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function initBookplate(language) {
  activeLanguage = language;

  bookplate.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-bookplate]")) closeBookplate();
  });
  bookplate.addEventListener("keydown", trapBookplateFocus);
}
