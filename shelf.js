const MIN_SPINE_WIDTH = 52;
const MAX_SPINE_WIDTH = 112;
const SPINE_BASE_WIDTH = 46;
const SPINE_WIDTH_PER_PAGE = 0.18;

const shelfElements = new Map(
  [...document.querySelectorAll("[data-shelf]")].map((shelf) => [
    shelf.dataset.shelf,
    shelf.querySelector("[data-shelf-books]")
  ])
);

const bookplate = document.querySelector("#bookplate");
const bookplateCard = bookplate.querySelector(".bookplate__card");
const bookplateTitle = bookplate.querySelector("[data-bookplate-title]");
const bookplateAuthor = bookplate.querySelector("[data-bookplate-author]");
const bookplatePages = bookplate.querySelector("[data-bookplate-pages]");
const bookplateNote = bookplate.querySelector("[data-bookplate-note]");
const bookplateLink = bookplate.querySelector("[data-bookplate-link]");
const bookplateCover = bookplate.querySelector("[data-bookplate-cover]");
const bookplateCoverFallback = bookplate.querySelector("[data-bookplate-cover-fallback]");
const bookplateCoverTitle = bookplate.querySelector("[data-bookplate-cover-title]");
const bookplateClose = bookplate.querySelector(".bookplate__close");
const pageShell = document.querySelector("[data-page-shell]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let lastFocusedSpine = null;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSpineWidth(pageCount) {
  const scaledWidth = SPINE_BASE_WIDTH + pageCount * SPINE_WIDTH_PER_PAGE;
  return Math.round(Math.min(MAX_SPINE_WIDTH, Math.max(MIN_SPINE_WIDTH, scaledWidth)));
}

function createBookSpine(book, index) {
  const button = document.createElement("button");
  const title = document.createElement("span");
  const author = document.createElement("span");
  const spineWidth = getSpineWidth(book.pageCount);

  button.className = "book";
  button.type = "button";
  button.dataset.bookIndex = index;
  button.dataset.book = slugify(book.title);
  button.dataset.pageCount = book.pageCount;
  button.style.setProperty("--book-accent", book.accentColor);
  button.style.setProperty("--book-width", `${spineWidth}px`);
  button.setAttribute(
    "aria-label",
    `${book.title} by ${book.author}, ${book.pageCount} pages`
  );

  title.className = "book__title";
  title.textContent = book.title;
  author.className = "book__author";
  author.textContent = book.author;

  button.append(title, author);
  return button;
}

function renderBooks() {
  BOOKS.forEach((book, index) => {
    shelfElements.get(book.shelf)?.append(createBookSpine(book, index));
  });

  const futureSlot = document.createElement("div");
  const futureSlotLabel = document.createElement("span");
  futureSlot.className = "book-slot";
  futureSlot.setAttribute("aria-hidden", "true");
  futureSlotLabel.textContent = "Next book";
  futureSlot.append(futureSlotLabel);
  shelfElements.get("want")?.append(futureSlot);
}

function showCover(book) {
  bookplateCoverFallback.hidden = true;
  bookplateCover.hidden = false;
  bookplateCover.alt = `Cover of ${book.title}`;
  bookplateCoverTitle.textContent = book.title;

  bookplateCover.onerror = () => {
    bookplateCover.hidden = true;
    bookplateCoverFallback.hidden = false;
    bookplateCover.removeAttribute("src");
  };

  bookplateCover.src = book.coverUrl;
}

function openBookplate(book, spine) {
  lastFocusedSpine = spine;
  bookplateTitle.textContent = book.title;
  bookplateAuthor.textContent = book.author;
  bookplatePages.textContent = `${book.pageCount} pages`;
  bookplateNote.textContent = book.note;
  bookplateLink.href = book.url;
  bookplateCard.style.setProperty("--plate-accent", book.accentColor);
  showCover(book);

  bookplate.hidden = false;
  pageShell.inert = true;
  document.body.classList.add("has-open-bookplate");
  requestAnimationFrame(() => bookplate.classList.add("is-open"));
  bookplateClose.focus({ preventScroll: true });
}

function finishClose() {
  if (!bookplate.classList.contains("is-open")) {
    bookplate.hidden = true;
  }
  pageShell.inert = false;
  document.body.classList.remove("has-open-bookplate");
  lastFocusedSpine?.focus({ preventScroll: true });
}

function closeBookplate() {
  bookplate.classList.remove("is-open");

  if (reduceMotion.matches) {
    finishClose();
    return;
  }

  window.setTimeout(finishClose, 440);
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

document.querySelector(".bookcase").addEventListener("click", (event) => {
  const spine = event.target.closest("[data-book-index]");
  if (!spine) return;
  openBookplate(BOOKS[Number(spine.dataset.bookIndex)], spine);
});

bookplate.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-bookplate]")) closeBookplate();
});

bookplate.addEventListener("keydown", trapBookplateFocus);

renderBooks();
