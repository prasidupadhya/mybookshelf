# My Bookshelf

My Bookshelf is a single-page personal library for literary and philosophical classics. The collection is arranged as a warm wooden bookshelf with three reading states: books currently being read, books saved for later, and books already read.

Each title appears as its own designed spine, with width derived from that edition's page count. Selecting a book opens a bookplate-style detail view with its real cover, author, page count, bilingual description, and Goodreads link.

## What this repository contains

- A responsive three-tier wooden bookshelf interface
- EN / ES language switching for titles, descriptions, shelf labels, controls, and footer copy
- Persistent light / dark theming that follows the visitor's system preference until manually overridden
- Distinct cover-derived spine colors and page-count-derived spine widths
- Keyboard-accessible book interactions and a focus-trapped bookplate detail view
- Real cover art with a readable fallback when an image cannot load
- A bilingual footer with a handwritten `Prasid` signature and visitor-local live date/time
- Reduced-motion, visible-focus, and mobile/touch support
- A standard-library HTTP server with no runtime package dependencies

## Run locally

```bash
python3 app.py
```

Then open `http://localhost:8000`.

An optional `PORT` environment variable can change the listening port.

## Tech stack

- Python 3 standard library (`http.server`, `json`, `urllib.parse`)
- HTML, CSS, and minimal browser JavaScript generated and served from `app.py`
- Google Fonts loaded by the generated page

There is no build step, Node runtime, package manager, web framework, or third-party Python dependency.

## Project structure

```text
mybookshelf/
├── app.py      # Book data, localized copy, generated page/CSS/JS, and HTTP server
└── README.md   # Project overview and local run instructions
```
