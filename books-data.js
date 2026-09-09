const SHELVES = Object.freeze([
  Object.freeze({ id: "current", label: "Currently reading" }),
  Object.freeze({ id: "want", label: "Want to read" }),
  Object.freeze({ id: "read", label: "Read" })
]);

const BOOKS = Object.freeze([
  Object.freeze({
    title: "Siddhartha",
    author: "Hermann Hesse",
    url: "https://www.goodreads.com/en/book/show/52036.Siddhartha",
    shelf: "read",
    shelfOrder: 3,
    pageCount: 152,
    accentColor: "#3c3489",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1629378189i/52036.jpg",
    description: "A wealthy Indian Brahmin leaves a life of privilege in search of spiritual fulfillment. Hesse brings together Eastern religion, Jungian archetypes, and Western individualism in one man's search for meaning."
  }),
  Object.freeze({
    title: "The Stranger",
    author: "Albert Camus",
    url: "https://www.goodreads.com/book/show/49552.The_Stranger",
    shelf: "read",
    shelfOrder: 3,
    pageCount: 123,
    accentColor: "#c7c6c7",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1738704267i/49552.jpg",
    description: "Camus follows an ordinary man who is drawn into a senseless murder on a sun-drenched Algerian beach. Through his story, the novel explores the confrontation between human beings and the absurd."
  }),
  Object.freeze({
    title: "White Nights",
    author: "Fyodor Dostoevsky",
    url: "https://www.goodreads.com/book/show/1772910.White_Nights",
    shelf: "read",
    shelfOrder: 3,
    pageCount: 82,
    accentColor: "#d4c0a4",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1450699039i/1772910.jpg",
    description: "Set in St. Petersburg, this 1848 story follows a young man struggling with inner restlessness and unrequited love. Its two alienated protagonists are briefly brought together in a tender blend of romanticism and realism."
  }),
  Object.freeze({
    title: "The Metamorphosis",
    author: "Franz Kafka",
    url: "https://www.goodreads.com/book/show/485894.The_Metamorphosis",
    shelf: "current",
    shelfOrder: 1,
    pageCount: 201,
    accentColor: "#aa7764",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1646444605i/485894.jpg",
    description: "Gregor Samsa wakes one morning transformed into a giant insect. The story follows how he becomes an object of disgrace and an outsider within his own family, turning the bizarre premise into a darkly comic meditation on inadequacy, guilt, isolation, and alienation."
  }),
  Object.freeze({
    title: "The Bhagavad Gita",
    author: "Krishna-Dwaipayana Vyasa",
    url: "https://www.goodreads.com/book/show/99944.The_Bhagavad_Gita",
    shelf: "want",
    shelfOrder: 2,
    pageCount: 160,
    accentColor: "#6c584f",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1769077152i/99944.jpg",
    description: "Part of the Mahabharata, the Bhagavad Gita is a philosophical dialogue in which Krishna instructs the warrior prince Arjuna on ethics, the nature of God, and how people may come to know the divine. Set before a great battle, it moves through spiritual and moral questions as a practical guide to living well."
  })
]);
