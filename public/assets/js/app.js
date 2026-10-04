import { UI_COPY, BOOKS, setBooks } from "./data.js";
import { loadPublicBooks } from "./books-api.js";
import { initClock, setClockLanguage } from "./clock.js";
import { initBookplate, openBookplate, refreshBookplateLanguage } from "./bookplate.js";
import { applyLanguage } from "./language.js";
import { renderLibrary } from "./library.js";
import { cancelBookSelection, initMotion, selectBook } from "./motion.js";

const bookcase = document.querySelector("[data-bookcase]");
const languageButtons = [...document.querySelectorAll("[data-language]")];

let activeLanguage = document.documentElement.lang === "es" ? "es" : "en";
let loading = true;
let pendingBooks = null;
let fetching = false;
let unavailable = false;

function renderCollection() {
  renderLibrary(activeLanguage, { loading });
  if (!unavailable) return;
  const message = document.createElement('p'); message.className = 'collection-status';
  message.setAttribute('role', 'status');
  message.textContent = activeLanguage === 'es' ? 'La colección no está disponible temporalmente. ' : 'The collection is temporarily unavailable. ';
  const retry = document.createElement('button'); retry.type = 'button';
  retry.textContent = activeLanguage === 'es' ? 'Reintentar' : 'Try again';
  retry.addEventListener('click', refreshBooks); message.append(retry); bookcase.append(message);
}

function setLanguage(language) {
  if (!UI_COPY[language] || !applyLanguage(language)) return;

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
