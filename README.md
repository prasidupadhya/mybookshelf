# My Bookshelf

My Bookshelf is a bilingual personal library for literary and philosophical classics. The site keeps its warm wooden bookshelf identity while remaining a small, dependency-free static project that can be deployed directly to Cloudflare Pages.

Each title appears as a designed spine whose width is derived from that edition's page count. Selecting a book opens a bookplate-style detail view with its real cover, author, page count, localized description, and Goodreads link.

## Features

- Three reading shelves: Currently reading, Want to read, and Read
- English and Spanish interface copy and book descriptions
- Persistent light/dark theme with system preference detection
- Cover-derived spine colors and page-count-derived spine widths
- Pointer-responsive 3D bookshelf perspective with physical book pull-forward depth
- Page-edge detailing and clicked-book-origin animation into the bookplate view
- Real book covers with a readable image fallback
- Keyboard-accessible modal with focus trapping, Escape close, and outside-click close
- Visitor-local live date and time
- Responsive desktop, tablet, and mobile layouts
- Reduced-motion support and visible focus states
- Cloudflare Pages headers for basic browser security hardening

## Project structure

```text
mybookshelf/
├── public/
│   ├── index.html
│   ├── _headers
│   └── assets/
│       ├── css/
│       │   ├── tokens.css       # Theme tokens and light/dark values
│       │   ├── base.css         # Global document and focus styles
│       │   ├── header.css       # Heading, language, and theme controls
│       │   ├── bookshelf.css    # Bookcase, shelves, spines, and empty slot
│       │   ├── footer.css       # Signature and live-clock presentation
│       │   ├── bookplate.css    # Book detail modal and cover treatment
│       │   └── responsive.css   # Tablet/mobile/reduced-motion rules
│       └── js/
│           ├── data.js          # Book data, shelf order, and localized UI copy
│           ├── theme.js         # System/manual theme selection and persistence
│           ├── library.js       # Shelf and book-spine rendering
│           ├── language.js      # EN/ES document copy and accessibility state
│           ├── bookplate.js     # Modal content, focus management, and close logic
│           ├── clock.js         # Visitor-local live date/time
│           ├── motion.js        # Shelf perspective, book tilt, and ambient pointer light
│           └── app.js           # Application initialization and event wiring
├── .agents/skills/frontend-design/ # Frontend design guidance used for UI work
├── skills-lock.json             # Installed design-skill lockfile
└── README.md
```

## Run locally

No packages are required. Serve the `public` directory with any static HTTP server. Python's standard library works well:

```bash
python3 -m http.server 8000 --directory public
```

Then open `http://localhost:8000`.

## Deploy to Cloudflare Pages

This repository is ready for Git-based Cloudflare Pages deployment without a framework or package installation.

Use these project settings in **Workers & Pages → Create application → Pages → Import an existing Git repository**:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | `exit 0` (or leave blank) |
| Build output directory | `public` |
| Root directory | repository root |
| Environment variables | none |

After the repository is connected, pushes to `main` deploy automatically. Preview deployments can be created from other Git branches if you use them later.

## Deployment model

The deployed application is plain static HTML, CSS, and JavaScript. There is no server runtime, Node application, Python application, npm install, package manager, database, API key, or secret required in production.

Google Fonts and the configured remote book-cover images are loaded by the visitor's browser. The rest of the application is served directly from Cloudflare's static asset network.
