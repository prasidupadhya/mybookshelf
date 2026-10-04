import { UI_COPY, BOOKS, setBooks } from "./data.js";
import { loadSnapshot, loadPublicBooks } from "./books-api.js";
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

function setLanguage(language) {
  if (!UI_COPY[language] || !applyLanguage(language)) return;

  activeLanguage = language;
  cancelBookSelection();
  renderLibrary(activeLanguage, { loading });
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
  cancelBookSelection(); setBooks(books); loading = false;
  renderLibrary(activeLanguage);
  if (focused) bookcase.querySelector(`[data-book="${focused}"]`)?.focus({ preventScroll: true });
}

async function refreshBooks() {
  if (fetching) return;
  fetching = true;
  try { updateBooks(await loadPublicBooks()); }
  catch {
    if (loading && BOOKS.length) { loading = false; renderLibrary(activeLanguage); }
    else if (loading) {
      loading = false; renderLibrary(activeLanguage);
      const message = document.createElement('p'); message.className = 'collection-status';
      message.textContent = activeLanguage === 'es' ? 'La colección no está disponible temporalmente.' : 'The collection is temporarily unavailable.';
      message.setAttribute('role', 'status'); bookcase.append(message);
    }
  } finally { fetching = false; }
}

// Load the snapshot and API concurrently. Known cover ratios reserve the exact shelf layout.
const apiRequest = loadPublicBooks().then(books => ({ books })).catch(() => null);
try { setBooks(await loadSnapshot()); } catch { /* The API can still supply the collection. */ }
renderLibrary(activeLanguage, { loading: true });
const response = await apiRequest;
if (response) updateBooks(response.books);
else { loading = false; renderLibrary(activeLanguage); }

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
