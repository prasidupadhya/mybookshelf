import { BOOKS, SHELVES, UI_COPY } from "./data.js";

const MIN_SPINE_WIDTH = 52;
const MAX_SPINE_WIDTH = 112;
const SPINE_BASE_WIDTH = 46;
const SPINE_WIDTH_PER_PAGE = 0.18;

const bookcase = document.querySelector("[data-bookcase]");

function getSpineWidth(pageCount) {
  const scaledWidth = SPINE_BASE_WIDTH + pageCount * SPINE_WIDTH_PER_PAGE;
  return Math.round(Math.min(MAX_SPINE_WIDTH, Math.max(MIN_SPINE_WIDTH, scaledWidth)));
}

function getRelativeLuminance(hexColor) {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(hexColor.slice(index, index + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function getContrastRatio(colorA, colorB) {
  const lighter = Math.max(getRelativeLuminance(colorA), getRelativeLuminance(colorB));
  const darker = Math.min(getRelativeLuminance(colorA), getRelativeLuminance(colorB));
  return (lighter + 0.05) / (darker + 0.05);
}

function getReadableInk(backgroundColor) {
  const darkInk = "#17110f";
  const lightInk = "#fff8e8";

  return getContrastRatio(backgroundColor, darkInk) >= getContrastRatio(backgroundColor, lightInk)
    ? darkInk
    : lightInk;
}

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

function createBookSpine(book, index, language) {
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
  const spineWidth = getSpineWidth(book.pageCount);
  const bookThickness = Math.round(18 + ((spineWidth - MIN_SPINE_WIDTH) / (MAX_SPINE_WIDTH - MIN_SPINE_WIDTH)) * 14);
  const localizedTitle = book.title[language];

  button.className = "book";
  button.type = "button";
  button.dataset.bookIndex = index;
  button.dataset.book = book.id;
  button.dataset.pageCount = book.pageCount;
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-controls", "bookplate");
  button.style.setProperty("--book-accent", book.accentColor);
  button.style.setProperty("--book-ink", getReadableInk(book.accentColor));
  button.style.setProperty("--book-thickness", `${bookThickness}px`);
  button.style.setProperty("--cover-aspect", book.coverAspect);
  button.setAttribute(
    "aria-label",
    `${localizedTitle} — ${book.author}, ${book.pageCount} ${UI_COPY[language].pages}`
  );

  front.className = "book__front";
  back.className = "book__face book__back";
  spine.className = "book__face book__spine";
  foreEdge.className = "book__face book__fore-edge";
  topEdge.className = "book__face book__top-edge";
  bottomEdge.className = "book__face book__bottom-edge";
  [back, spine, foreEdge, topEdge, bottomEdge].forEach((face) => face.setAttribute("aria-hidden", "true"));

  cover.className = "book__cover";
  cover.src = book.coverUrl;
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

  title.className = "book__title";
  title.textContent = localizedTitle;
  author.className = "book__author";
  author.textContent = book.author;

  spineLabel.className = "book__spine-label";
  spineLabel.append(title, author);
  spine.append(spineLabel);
  front.append(cover, coverFallback);
  button.append(back, spine, foreEdge, topEdge, bottomEdge, front);
  return button;
}

export function renderLibrary(language) {
  bookcase.replaceChildren();
  const shelfElements = new Map();
  const orderedShelves = SHELVES
    .map((shelf) => ({
      ...shelf,
      order: Math.min(
        ...BOOKS.filter((book) => book.shelf === shelf.id).map((book) => book.shelfOrder)
      )
    }))
    .sort((a, b) => a.order - b.order);

  orderedShelves.forEach((shelf) => {
    const { section, booksContainer } = createShelf(shelf, language);
    shelfElements.set(shelf.id, booksContainer);
    bookcase.append(section);
  });

  BOOKS.forEach((book, index) => {
    shelfElements.get(book.shelf)?.append(createBookSpine(book, index, language));
  });

  const futureSlot = document.createElement("div");
  const futureSlotLabel = document.createElement("span");
  futureSlot.className = "book-slot";
  futureSlot.setAttribute("aria-hidden", "true");
  futureSlotLabel.textContent = UI_COPY[language].nextBook;
  futureSlot.append(futureSlotLabel);
  shelfElements.get("want")?.append(futureSlot);
}

export function getSpineByIndex(index) {
  return bookcase.querySelector(`[data-book-index="${index}"]`);
}
