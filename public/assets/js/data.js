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

export const BOOKS = Object.freeze([
  Object.freeze({
    id: "siddhartha",
    title: Object.freeze({ en: "Siddhartha", es: "Siddhartha" }),
    author: "Hermann Hesse",
    url: "https://www.goodreads.com/en/book/show/52036.Siddhartha",
    shelf: "read",
    shelfOrder: 3,
    pageCount: 152,
    accentColor: "#3c3489",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1629378189i/52036.jpg",
    description: Object.freeze({
      en: "Set in ancient India during the time of the Buddha, a young Brahmin named Siddhartha leaves home to seek enlightenment. He tries asceticism, worldly pleasure, wealth, and love, then finds peace as a ferryman by a river. A novel about learning through direct experience rather than doctrine.",
      es: "Ambientada en la India antigua en tiempos de Buda, un joven brahmán llamado Siddhartha deja su hogar en busca de la iluminación. Prueba el ascetismo, el placer mundano, la riqueza y el amor, y finalmente encuentra paz como barquero junto a un río. Una novela sobre el aprendizaje a través de la experiencia directa en lugar de la doctrina."
    })
  }),
  Object.freeze({
    id: "the-stranger",
    title: Object.freeze({ en: "The Stranger", es: "El Extranjero" }),
    author: "Albert Camus",
    url: "https://www.goodreads.com/book/show/49552.The_Stranger",
    shelf: "read",
    shelfOrder: 3,
    pageCount: 123,
    accentColor: "#c7c6c7",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1738704267i/49552.jpg",
    description: Object.freeze({
      en: "Meursault, an emotionally detached Algerian clerk, drifts through his mother's funeral and later kills a man for almost no reason. His trial and imprisonment work through absurdism, the idea that life has no inherent meaning and that a person can still face that fact honestly.",
      es: "Meursault, un empleado argelino emocionalmente distante, pasa por el funeral de su madre con indiferencia y más tarde mata a un hombre casi sin razón. Su juicio y encarcelamiento desarrollan el absurdismo, la idea de que la vida no tiene un sentido inherente y que aun así una persona puede enfrentar esa verdad con honestidad."
    })
  }),
  Object.freeze({
    id: "white-nights",
    title: Object.freeze({ en: "White Nights", es: "Noches Blancas" }),
    author: "Fyodor Dostoevsky",
    url: "https://www.goodreads.com/book/show/1772910.White_Nights",
    shelf: "read",
    shelfOrder: 3,
    pageCount: 82,
    accentColor: "#d4c0a4",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1450699039i/1772910.jpg",
    description: Object.freeze({
      en: "A lonely dreamer in St. Petersburg spends four nights wandering the city. He falls for a young woman, Nastenka, who is waiting for her former lover to return. A short book about loneliness and the pain of a connection that never becomes real.",
      es: "Un soñador solitario en San Petersburgo pasa cuatro noches vagando por la ciudad. Se enamora de una joven, Nastenka, que espera el regreso de su antiguo amor. Un libro breve sobre la soledad y el dolor de una conexión que nunca llega a concretarse."
    })
  }),
  Object.freeze({
    id: "the-metamorphosis",
    title: Object.freeze({ en: "The Metamorphosis", es: "La Metamorfosis" }),
    author: "Franz Kafka",
    url: "https://www.goodreads.com/book/show/485894.The_Metamorphosis",
    shelf: "current",
    shelfOrder: 1,
    pageCount: 201,
    accentColor: "#aa7764",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1646444605i/485894.jpg",
    description: Object.freeze({
      en: "Traveling salesman Gregor Samsa wakes up transformed into a giant insect. The novella follows his family's disgust, guilt, and eventual indifference toward him. A short story about isolation and how a person's worth gets tied to what they can produce.",
      es: "El viajante de comercio Gregor Samsa despierta transformado en un insecto gigante. La novela sigue el asco, la culpa y la eventual indiferencia de su familia hacia él. Un relato breve sobre el aislamiento y cómo el valor de una persona termina ligado a lo que puede producir."
    })
  }),
  Object.freeze({
    id: "the-bhagavad-gita",
    title: Object.freeze({ en: "The Bhagavad Gita", es: "El Bhagavad Gita" }),
    author: "Unknown",
    url: "https://www.goodreads.com/book/show/99944.The_Bhagavad_Gita",
    shelf: "want",
    shelfOrder: 2,
    pageCount: 160,
    accentColor: "#6c584f",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1769077152i/99944.jpg",
    description: Object.freeze({
      en: "A foundational Hindu scripture written as a dialogue between the warrior prince Arjuna and the god Krishna on the eve of a great battle. Arjuna doesn't want to fight his own kin, and Krishna's response lays out teachings on duty, action without attachment to results, and the nature of the self and the divine.",
      es: "Una escritura fundamental del hinduismo, escrita como un diálogo entre el príncipe guerrero Arjuna y el dios Krishna en vísperas de una gran batalla. Arjuna no quiere luchar contra sus propios parientes, y la respuesta de Krishna expone enseñanzas sobre el deber, la acción sin apego a los resultados, y la naturaleza del ser y lo divino."
    })
  })
]);
