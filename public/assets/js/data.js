export const UI_COPY = Object.freeze({
  en: Object.freeze({
    heading: "My bookshelf",
    intro: "Books I've finished, what I'm reading now, and what I want to read next.",
    shelves: Object.freeze({
      current: "Currently reading",
      want: "Want to read",
      read: "Read"
    }),
    nextBook: "Next book",
    pages: "pages",
    coverUnavailable: "Cover unavailable",
    readOnGoodreads: "Read about it on Goodreads",
    closeDetails: "Close book details",
    languageLabel: "Language",
    footerPrefix: "",
    footerSuffix: "'s bookshelf"
  }),
  es: Object.freeze({
    heading: "Mi biblioteca",
    intro: "Libros que ya he leído, lo que estoy leyendo ahora y lo que quiero leer después.",
    shelves: Object.freeze({
      current: "Leyendo ahora",
      want: "Quiero leer",
      read: "Leídos"
    }),
    nextBook: "Próximo libro",
    pages: "páginas",
    coverUnavailable: "Portada no disponible",
    readOnGoodreads: "Leer más en Goodreads",
    closeDetails: "Cerrar detalles del libro",
    languageLabel: "Idioma",
    footerPrefix: "Biblioteca de",
    footerSuffix: ""
  })
});

export const SHELVES = Object.freeze([
  Object.freeze({ id: "current" }),
  Object.freeze({ id: "want" }),
  Object.freeze({ id: "read" })
]);

// Live bindings keep shelf rendering and the detail viewer on the same collection.
export let BOOKS = Object.freeze([]);

export function setBooks(books) {
  BOOKS = Object.freeze(books);
}
