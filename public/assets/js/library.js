import { BOOKS, SHELVES, UI_COPY } from "./data.js";
import { getBookThickness, getReadableInk } from "./book-appearance.js";

const bookcase = document.querySelector("[data-bookcase]");

function createShelf({ id }, language) {
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const booksContainer = document.createElement("div");
  const headingId = `${id}-label`;

  section.className = "shelf";
  section.dataset.shelf = id;
  section.setAttribute("aria-labelledby", headingId);

  heading.className = "shelf__label";
  heading.id = headingId;
  heading.textContent = UI_COPY[language].shelves[id];

  booksContainer.className = "shelf__books";
  booksContainer.dataset.shelfBooks = "";
  section.append(heading, booksContainer);

  return { section, booksContainer };
}

export function createBookSpine(book, index, language) {
  const button = document.createElement("button");
  const front = document.createElement("span");
  const back = document.createElement("span");
  const spine = document.createElement("span");
  const spineLabel = document.createElement("span");
  const foreEdge = document.createElement("span");
  const topEdge = document.createElement("span");
  const bottomEdge = document.createElement("span");
  const cover = document.createElement("img");
  const coverFallback = document.createElement("span");
  const title = document.createElement("span");
  const author = document.createElement("span");
  const bookThickness = getBookThickness(book.pageCount);
  const localizedTitle = book.title[language];

  button.className = "book";
  button.type = "button";
  button.dataset.bookIndex = index;
  button.dataset.book = book.id;
  button.dataset.pageCount = book.pageCount;
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-controls", "bookplate");
  button.style.setProperty("--book-accent", book.accentColor);
  button.style.setProperty("--book-spine", book.spineColor ?? book.accentColor);
  button.style.setProperty("--book-back", book.backColor ?? book.accentColor);
  button.style.setProperty("--book-binding", book.spineColor ?? book.accentColor);
  button.style.setProperty("--book-ink", book.spineTextColor || getReadableInk(book.spineColor ?? book.accentColor));
  button.style.setProperty("--book-thickness", `${bookThickness}px`);
  button.style.setProperty("--cover-aspect", book.coverAspect);
  button.setAttribute(
    "aria-label",
    `${localizedTitle} — ${book.author}${book.pageCount ? `, ${book.pageCount} ${UI_COPY[language].pages}` : ''}`
  );

  front.className = "book__front";
  back.className = "book__face book__back";
  spine.className = "book__face book__spine";
  foreEdge.className = "book__face book__fore-edge";
  topEdge.className = "book__face book__top-edge";
  bottomEdge.className = "book__face book__bottom-edge";
  [back, spine, foreEdge, topEdge, bottomEdge].forEach((face) => face.setAttribute("aria-hidden", "true"));

  cover.className = "book__cover";
  cover.alt = "";
  cover.loading = "lazy";
  cover.decoding = "async";
  cover.draggable = false;
  cover.onload = () => button.style.setProperty("--cover-aspect", cover.naturalWidth / cover.naturalHeight);

  coverFallback.className = "book__cover-fallback";
  coverFallback.hidden = true;
  coverFallback.textContent = localizedTitle;
  cover.onerror = () => {
    cover.hidden = true;
    coverFallback.hidden = false;
    cover.removeAttribute("src");
  };
  if (book.coverUrl) cover.src = book.coverUrl;
  else { cover.hidden = true; coverFallback.hidden = false; }
  if (book.backCoverUrl) {
    const backCover = document.createElement('img'); backCover.src = book.backCoverUrl;
    backCover.alt = ''; backCover.className = 'book__back-cover'; backCover.loading = 'lazy';
    backCover.onerror = () => backCover.remove(); back.append(backCover);
  }

  title.className = "book__title";
  title.textContent = book.spineTitle || localizedTitle;
  author.className = "book__author";
  author.textContent = book.spineAuthor ?? book.author;

  spineLabel.className = "book__spine-label";
  spineLabel.append(title);
  if (author.textContent) spineLabel.append(author);
  spine.append(spineLabel);
  front.append(cover, coverFallback);
  button.append(back, spine, foreEdge, topEdge, bottomEdge, front);
  return button;
}

export function renderLibrary(language, { loading = false } = {}) {
  bookcase.replaceChildren();
  const shelfElements = new Map();
  const orderedShelves = SHELVES;

  orderedShelves.forEach((shelf) => {
    const { section, booksContainer } = createShelf(shelf, language);
    shelfElements.set(shelf.id, booksContainer);
    bookcase.append(section);
  });

  BOOKS.forEach((book, index) => {
    const element = createBookSpine(book, index, language);
    element.classList.toggle('is-loading', loading); element.disabled = loading;
    shelfElements.get(book.shelf)?.append(element);
  });

  if (loading && !BOOKS.length) {
    for (const container of shelfElements.values()) {
      const placeholder = document.createElement('div');
      placeholder.className = 'shelf-placeholder'; placeholder.setAttribute('aria-hidden', 'true');
      container.append(placeholder);
    }
  }

  const futureSlot = document.createElement("div");
  const futureSlotLabel = document.createElement("span");
  futureSlot.className = "book-slot";
  futureSlot.setAttribute("aria-hidden", "true");
  futureSlotLabel.textContent = UI_COPY[language].nextBook;
  futureSlot.append(futureSlotLabel);
  shelfElements.get("want")?.append(futureSlot);
  bookcase.setAttribute('aria-busy', String(loading));
}

export function getSpineByIndex(index) {
  return bookcase.querySelector(`[data-book-index="${index}"]`);
}
