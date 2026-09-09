# My Bookshelf

My Bookshelf is a single-page personal library for literary and philosophical classics. The collection is arranged as a photographed-looking wooden bookshelf with three real reading states: books already read, the current read, and books saved for later.

Each title appears as its own designed spine, with the width derived from that edition's page count. Selecting a book opens a bookplate-style detail view with its real cover, author, page count, a concise Goodreads-based synopsis, and a link to its Goodreads page.

## What this repository contains

- A responsive three-tier bookshelf interface
- A reusable JavaScript book collection that drives the layout and shelf order
- Distinct spine treatments for each title
- Spine colors sampled from the matching Goodreads cover art
- Spine widths derived from each edition's page count
- Hover, keyboard, and book-open interactions
- A bookplate detail view with real cover art and edition details
- Goodreads-based book descriptions instead of invented personal notes
- An empty shelf slot reserved for a future addition
- A small signature-style footer with a visitor-local live clock
- Reduced-motion and visible-focus support

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts

The site has no build step and no runtime dependencies. Open `index.html` directly in a browser or serve the repository with any static file host.

## Collection

The library currently includes works by Hermann Hesse, Albert Camus, Fyodor Dostoevsky, Franz Kafka, and the *Bhagavad Gita*.

## Project structure

```text
mybookshelf/
├── index.html       # Page structure only
├── styles.css       # Visual design, responsive rules, and motion
├── books-data.js    # Shared book collection data
├── shelf.js         # Rendering and interaction logic
├── clock.js         # Visitor-local footer clock
└── README.md        # Project overview and usage notes
```
