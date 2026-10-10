import { UI_COPY, BOOKS, setBooks } from "./data.js";
import { loadPublicBooks } from "./books-api.js";
import { initClock, setClockLanguage } from "./clock.js";
import { initBookplate, openBookplate, prefetchBook, refreshBookplateLanguage } from "./bookplate.js";
import { applyLanguage, getPreferredLanguage } from "./language.js";
import { renderLibrary } from "./library.js";
import { cancelBookSelection, initMotion, selectBook } from "./motion.js";

const bookcase = document.querySelector("[data-bookcase]");
const languageButtons = [...document.querySelectorAll("[data-language]")];

let activeLanguage = getPreferredLanguage();
let loading = true;
let pendingBooks = null;
let fetching = false;
let unavailable = false;

function renderCollection() {
  renderLibrary(activeLanguage, { loading, unavailable });
  if (!unavailable) return;
  const message = document.createElement('p'); message.className = 'collection-status';
  message.setAttribute('role', 'status');
  message.textContent = `${UI_COPY[activeLanguage].unavailable} `;
  const retry = document.createElement('button'); retry.type = 'button';
  retry.textContent = UI_COPY[activeLanguage].retry;
  retry.addEventListener('click', refreshBooks); message.append(retry); bookcase.prepend(message);
}

function setLanguage(language) {
  if (!UI_COPY[language] || !applyLanguage(language, { persist: true })) return;

  activeLanguage = language;
  cancelBookSelection();
  renderCollection();
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

// A deliberate hover, keyboard focus or the first touch warms the detail view before the click
// arrives. A short hover delay keeps a pointer sweeping across the shelf from fetching every cover.
let hoverPrefetch = 0;
const prefetchSpine = (event) => {
  const spine = event.target.closest?.("[data-book-index]");
  if (spine && !spine.disabled) prefetchBook(Number(spine.dataset.bookIndex));
};
bookcase.addEventListener("pointerover", (event) => {
  window.clearTimeout(hoverPrefetch);
  hoverPrefetch = window.setTimeout(() => prefetchSpine(event), 120);
}, { passive: true });
bookcase.addEventListener("pointerout", () => window.clearTimeout(hoverPrefetch), { passive: true });
bookcase.addEventListener("pointerdown", prefetchSpine, { passive: true });
bookcase.addEventListener("focusin", prefetchSpine);

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

applyLanguage(activeLanguage);
initBookplate(activeLanguage);
initClock(activeLanguage);
initMotion();

function updateBooks(books) {
  // A background refresh must not replace a book while its detail view is open.
  if (!document.querySelector('#bookplate').hidden) { pendingBooks = books; return; }
  if (!loading && JSON.stringify(BOOKS) === JSON.stringify(books)) return;
  const focused = document.activeElement?.closest('[data-book]')?.dataset.book;
  cancelBookSelection(); setBooks(books); loading = false; unavailable = false;
  renderCollection();
  if (focused) bookcase.querySelector(`[data-book="${focused}"]`)?.focus({ preventScroll: true });
}

async function refreshBooks() {
  if (fetching) return;
  fetching = true;
  try { updateBooks(await loadPublicBooks()); }
  catch {
    if (!BOOKS.length) { loading = false; unavailable = true; renderCollection(); }
    // During a transient refresh failure, retain the last database response in memory.
  } finally { fetching = false; }
}

// Only the database supplies book records; the skeleton contains no edition information.
renderCollection();
refreshBooks();

const modalObserver = new MutationObserver(() => {
  if (document.querySelector('#bookplate').hidden && pendingBooks) {
    const books = pendingBooks; pendingBooks = null; updateBooks(books);
  }
});
modalObserver.observe(document.querySelector('#bookplate'), { attributes: true, attributeFilter: ['hidden'] });

function scheduleRefresh() {
  window.setTimeout(async () => { if (!document.hidden) await refreshBooks(); scheduleRefresh(); }, 60000 - Date.now() % 60000 + 100);
}
scheduleRefresh();
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshBooks(); });
