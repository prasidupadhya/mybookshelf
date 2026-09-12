# My Bookshelf

My Bookshelf is a bilingual personal library for literary and philosophical classics. The site keeps its warm wooden bookshelf identity while remaining a small, dependency-free static project that can be deployed directly to Cloudflare Pages.

Each title appears as a solid CSS book with its original cover, a colored spine, and paper edges. Thickness is derived from the edition's page count. Selecting a book opens a bookplate-style detail view with its real cover, author, page count, localized description, and Goodreads link.

## Features

- Three reading shelves: Currently reading, Want to read, and Read
- English and Spanish interface copy and book descriptions
- Persistent light/dark theme with system preference detection
- Cover-derived spine colors and page-count-derived spine widths
- One shared 3D perspective across the bookcase, with joined cover, spine, and paper faces
- A 340ms transform-only pull-out on desktop hover or keyboard focus; touch taps play the pull-out before opening details
- Proportional book sizing and wrapping rows with continuing shelf ledges
- Shared shelf shadows, with a flat cover and shadow fallback when CSS 3D is unsupported
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
│           ├── motion.js        # Touch pull-out, selection cancellation, and reduced motion
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

## Interactive detail preview

Opening a book lazy-loads a locally served Three.js 0.186.0 WebGL viewer. The shelf itself is unchanged. The viewer uses matte cover boards, a page-count-sized paper block, the actual front-cover texture, a labeled spine, a neutral back, and a soft ground shadow.

- Drag to rotate freely around X/Y; two fingers also support pinch zoom and twist.
- Release a drag for decaying momentum; tap to stop. Idle rotation pauses on interaction and can be resumed with the Spin control.
- Arrow keys or the directional buttons rotate, `+`/`−` zoom, and `Home`/Reset returns to the front. Space toggles idle rotation while the viewer is focused.
- Reduced motion disables automatic rotation and momentum by default. The explicit Spin control is still available.
- WebGL failure or context loss uses an interactive CSS solid. A failed engine download preserves the static cover and all book details.
- The animation pauses offscreen, in a background tab, and immediately on close. At the end of the existing close transition, textures, geometry, materials, listeners, observers, and the WebGL context are released. Closing during the lazy import cannot create a late viewer.

The renderer uses a small scene without shadow-map or postprocessing passes, limits the front-cover texture to 512×768 (other maps are at most 128×1024), caps pixel ratio at 1.5 for touch devices (2 on desktop), and reduces it if sustained frame times are slow. The local engine chunk is about 131 KiB gzipped and is never requested on initial page load. Vendor provenance and reproduction instructions are in `public/assets/vendor/three/README.md`.

Review covered 320–1440px layouts, unchanged shelf DOM/geometry, mouse and touch gestures, complete X/Y turns, zoom limits, keyboard focus/escape, EN/ES, both themes, reduced motion, repeated resource disposal, unavailable WebGL, failed imports, and close-during-load races. A Chromium touch-emulation run with 4× CPU throttling measured 16.7ms median / 16.8ms p95 frames; physical mid-range mobile hardware was not available for testing.
