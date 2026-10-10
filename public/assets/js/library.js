import { BOOKS, SHELVES, UI_COPY } from "./data.js";
import { getReadableInk } from "./book-appearance.js";

const bookcase = document.querySelector("[data-bookcase]");
const stats = document.querySelector("[data-stats]");
const NUMERALS = ["I", "II", "III"];
// Natural variation in trim size; chosen by a stable hash so a book never changes height between visits.
const HEIGHT_SCALES = [1, .955, .925, .975, .94, .905];

function stableHash(text) {
  return [...text].reduce((value, character) => (Math.imul(value, 31) + character.charCodeAt(0)) >>> 0, 0);
}

// Spine thickness follows the page count, exaggerated slightly so thin books keep a legible spine.
function spineDepth(book, hash) {
  const base = book.pageCount ? 14 + book.pageCount * .06 : 26;
  return Math.round(Math.min(40, Math.max(22, base + hash % 3)));
}

// Printed spines carry the surname; an explicit admin override always wins.
function spineAuthorFor(book) {
  if (book.spineAuthor !== undefined) return book.spineAuthor;
  return book.author.trim().split(/\s+/).at(-1) ?? "";
}

// Shrink a long title until it fits the room left by the surname and mark, instead of cutting it off.
const MIN_SPINE_TYPE = 7.5;
const fits = title => title.scrollHeight <= title.clientHeight + .5 && title.scrollWidth <= title.clientWidth + .5;

function shrinkTitle(title) {
  let size = parseFloat(getComputedStyle(title).fontSize);
  // The flex layout gives the title its real room; compare against it until the text fits.
  for (let pass = 0; pass < 10 && !fits(title) && size > MIN_SPINE_TYPE; pass++) {
    const ratio = Math.min(title.clientHeight / title.scrollHeight, title.clientWidth / title.scrollWidth);
    size = Math.max(MIN_SPINE_TYPE, Math.min(size - .2, Math.floor(size * ratio * 10) / 10));
    title.style.fontSize = `${size}px`;
  }
}

function fitSpine(spine) {
  const title = spine.querySelector(".book__title");
  const mark = spine.querySelector(".book__mark");
  title.classList.remove("book__title--wrap");
  title.style.removeProperty("font-size");
  mark.hidden = false;
  if (!title.clientHeight) return;
  shrinkTitle(title);
  if (fits(title)) return;
  // On the thinnest, shortest spines the decorative mark yields its space to the title.
  mark.hidden = true;
  shrinkTitle(title);
  // Thick spines carry a long title on two lines, as printed spines often do.
  if (fits(title) || spine.clientWidth < 26) return;
  title.classList.add("book__title--wrap");
  title.style.fontSize = `${Math.min(12, Math.floor((spine.clientWidth - 7) / 2.2 * 10) / 10)}px`;
  shrinkTitle(title);
}

export function fitSpines(root = bookcase) {
  root.querySelectorAll(".book__spine").forEach(fitSpine);
}

let spineObserver = null;
function observeSpineSizes() {
  if (spineObserver) return;
  let frame = 0;
  // Row height follows the viewport, so refit when the bookcase resizes and once web fonts arrive.
  spineObserver = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => fitSpines()); });
  spineObserver.observe(bookcase);
  document.fonts?.ready.then(() => fitSpines());
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createShelf({ id }, language, count, loading) {
  const copy = UI_COPY[language];
  const section = element("section", "shelf");
  const booksContainer = element("div", "shelf__books");
  const board = element("div", "shelf__board");
  const heading = element("h2", "shelf__label");
  const headingId = `${id}-label`;

  section.dataset.shelf = id;
  section.setAttribute("aria-labelledby", headingId);
  booksContainer.dataset.shelfBooks = "";
  heading.id = headingId;

  const numeral = element("span", "shelf__number", NUMERALS[SHELVES.findIndex(shelf => shelf.id === id)]);
  numeral.setAttribute("aria-hidden", "true");
  const tally = element("span", "shelf__count");
  const number = element("span", "", loading ? "—" : String(count).padStart(2, "0"));
  number.setAttribute("aria-hidden", "true");
  const accessibleCount = element("span", "visually-hidden", loading ? copy.loading : `${count} ${count === 1 ? copy.book : copy.books}`);
  tally.append(number, accessibleCount);
  heading.append(numeral, element("span", "", copy.shelves[id]), tally);
  board.append(heading);
  section.append(booksContainer, board);
  return { section, booksContainer };
}

export function createBookSpine(book, index, language, { faceOut = false } = {}) {
  const copy = UI_COPY[language];
  const localizedTitle = book.title[language];
  const hash = stableHash(book.id);
  const binding = book.spineColor ?? book.accentColor;
  const button = element("button", faceOut ? "book book--face-out" : "book");
  const object = element("span", "book__object");
  const front = element("span", "book__face book__front");
  const back = element("span", "book__face book__back");
  const spine = element("span", "book__face book__spine");
  const pages = element("span", "book__face book__pages");
  const top = element("span", "book__face book__top");
  const bottom = element("span", "book__face book__bottom");
  const cover = element("img", "book__cover");
  const coverFallback = element("span", "book__cover-fallback", localizedTitle);

  button.type = "button";
  button.dataset.bookIndex = index;
  button.dataset.book = book.id;
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-controls", "bookplate");
  const pageLabel = book.pageCount ? `, ${book.pageCount} ${copy.pages}` : "";
  button.setAttribute("aria-label", `${localizedTitle}, ${book.author}${pageLabel}`);
  button.style.setProperty("--book-binding", binding);
  button.style.setProperty("--book-back", book.backColor ?? binding);
  button.style.setProperty("--book-ink", getReadableInk(binding));
  button.style.setProperty("--book-d", `${spineDepth(book, hash)}px`);
  button.style.setProperty("--book-scale", String(HEIGHT_SCALES[hash % HEIGHT_SCALES.length]));
  button.style.setProperty("--cover-aspect", book.coverAspect);

  cover.alt = "";
  cover.decoding = "async";
  cover.draggable = false;
  // Face-out covers are visible immediately; spine-out covers only appear when a book is pulled.
  cover.loading = faceOut && index < 4 ? "eager" : "lazy";
  if (faceOut && index === 0) cover.fetchPriority = "high";
  // Correct artwork whose real proportions differ from the stored aspect.
  cover.onload = () => {
    const aspect = cover.naturalWidth / cover.naturalHeight;
    if (Math.abs(aspect - book.coverAspect) > .01 && aspect >= .2 && aspect <= 2) button.style.setProperty("--cover-aspect", aspect);
  };
  cover.onerror = () => { cover.hidden = true; coverFallback.hidden = false; cover.removeAttribute("src"); };
  coverFallback.hidden = Boolean(book.coverUrl);
  if (book.coverUrl) cover.src = book.coverUrl; else cover.hidden = true;
  front.append(cover, coverFallback);

  if (book.backCoverUrl) {
    const backCover = element("img", "book__back-cover");
    backCover.alt = ""; backCover.loading = "lazy"; backCover.src = book.backCoverUrl;
    backCover.onerror = () => backCover.remove();
    back.append(backCover);
  }

  const spineAuthor = spineAuthorFor(book);
  spine.append(element("span", "book__title", book.spineTitle || localizedTitle));
  if (spineAuthor) spine.append(element("span", "book__author", spineAuthor));
  const mark = element("span", "book__mark");
  if (!spineAuthor) mark.style.marginTop = "auto";
  spine.append(mark);
  [front, back, spine, pages, top, bottom].forEach(face => face.setAttribute("aria-hidden", "true"));
  object.append(back, pages, top, bottom, spine, front);

  if (book.shelf === "current") {
    const ribbon = element("span", "book__ribbon");
    ribbon.setAttribute("aria-hidden", "true");
    object.append(ribbon);
  }

  const tooltip = element("span", "book__tooltip");
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.append(element("strong", "", localizedTitle), element("span", "", book.author));
  button.append(object, tooltip);
  return button;
}

function renderStats(language, loading) {
  if (!stats) return;
  const copy = UI_COPY[language];
  [...stats.children].forEach((item, index) => {
    const shelf = SHELVES[index].id;
    const count = BOOKS.filter(book => book.shelf === shelf).length;
    item.querySelector("dt").textContent = copy.stats[shelf];
    item.querySelector("dd").textContent = loading ? "—" : String(count).padStart(2, "0");
  });
  stats.setAttribute("aria-busy", String(loading));
}

export function renderLibrary(language, { loading = false, unavailable = false } = {}) {
  bookcase.replaceChildren();
  const shelfElements = new Map();

  SHELVES.forEach((shelf) => {
    const count = BOOKS.filter(book => book.shelf === shelf.id).length;
    const { section, booksContainer } = createShelf(shelf, language, count, loading || unavailable);
    shelfElements.set(shelf.id, booksContainer);
    bookcase.append(section);
  });

  BOOKS.forEach((book, index) => {
    const container = shelfElements.get(book.shelf);
    if (!container) return;
    // The reading shelf displays every cover; other shelves stand their first book face-out.
    const faceOut = book.shelf === "current" || !container.children.length;
    const spine = createBookSpine(book, index, language, { faceOut });
    spine.classList.toggle("is-loading", loading); spine.disabled = loading;
    container.append(spine);
  });

  for (const shelf of SHELVES) {
    const container = shelfElements.get(shelf.id);
    if (container.children.length) {
      // The bookend belongs to the last book, so it can never wrap onto a row of its own.
      const bookend = element("span", "bookend");
      bookend.setAttribute("aria-hidden", "true");
      container.lastElementChild.append(bookend);
    } else if (loading) {
      const placeholder = element("div", "shelf-placeholder");
      placeholder.setAttribute("aria-hidden", "true");
      container.append(placeholder);
    } else if (!unavailable) {
      // Without a database response, empty-shelf copy would misrepresent the collection.
      container.append(element("p", "shelf-empty", UI_COPY[language].emptyShelves[shelf.id]));
    }
  }

  renderStats(language, loading || unavailable);
  bookcase.setAttribute("aria-busy", String(loading));
  fitSpines();
  observeSpineSizes();
}

export function getSpineByIndex(index) {
  return bookcase.querySelector(`[data-book-index="${index}"]`);
}
