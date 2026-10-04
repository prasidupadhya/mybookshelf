# My Bookshelf

A vanilla HTML/CSS/JavaScript bookshelf, deployed on Vercel with Neon Postgres. Its Reading Room design keeps the wooden bookcase, EN/ES copy, light/dark themes, CSS 3D books and lazy-loaded Three.js detail viewer. There is no frontend framework or build step.

Book records live only in Neon. No edition list, seed records, cover files or public JSON snapshot are checked into the current tree. `data.js` contains interface copy and shelf definitions only. Older Git commits still contain the former static library; deleting current files does not rewrite repository history.

## Reading Room features

- Deep green evening light and warm morning paper, with shared OKLCH color tokens. A small composited lamp follows a fine mouse pointer in the dark theme; touch devices use fixed light. The static grain and decorative motion simplify under reduced motion.
- Self-hosted Fraunces for titles, Public Sans for reading/UI, and IBM Plex Mono for catalogue metadata. Fraunces gives the room a literary voice, while Public Sans keeps controls and long descriptions quiet. The subsetted WOFF2 files include Spanish punctuation and accented letters, use `font-display: swap`, and preload only the display face.
- Numbered shelf headings with accessible counts, bilingual empty slots, deeper wooden ledges, stable subtle book leans and a decorative cloth bookmark for currently reading books. Natural cover proportions, paper edges, page-count thickness and the 340ms pull-out remain intact.
- An ex-libris bookplate with a comfortable description measure and a text link to Goodreads. Supported browsers morph the selected cover with same-document View Transitions; other browsers retain the clicked-book-origin animation. Focus trapping, Escape, outside-click dismissal and focus return are preserved.
- A freely rotatable Three.js book with drag/inertia, pinch/wheel zoom, keyboard controls, Reset/Spin and the existing CSS-solid fallback. Three.js is fetched only when a preview opens, and its resources are disposed on close.
- A compact bilingual header, system-aware theme toggle, signature colophon and live clock. Administration shares the typography and surfaces without the lamp or grain.

The redesign adds no runtime dependencies and does not change the schema, API contracts, authentication or administration logic. Its measurements, contrast table and review limits are recorded in [the Reading Room review](docs/reading-room-review.md).

## Architecture

```text
api/                        Vercel Node.js functions
  books.js                  Public, ordered collection
  books/[id]/cover.js       Cover texture relay for database book IDs
  admin/                    Authenticated login/session/CRUD/reorder/cover APIs
config/admin.js             Single ADMIN_SLUG constant
config/security.js          Shared security headers and CSP
lib/                        Parameterized queries, validation, auth and image handling
db/schema.sql               Idempotent tables, indexes and database functions
scripts/                    Migration, private import/export and admin setup
public/index.html           Public Reading Room and data-free loading cabinet
public/admin/index.html     Separate private administration interface
public/assets/css/          Shared tokens/fonts and public component styles
public/assets/js/           Vanilla public scripts, atmosphere and lazy 3D viewer
public/assets/admin/        Admin scripts and styling
public/assets/fonts/        Spanish-capable subsetted WOFF2 fonts and licenses
public/assets/images/       Signature outlines and their font license
public/assets/vendor/three/ Local, lazy-loaded Three.js engine
tests/                      Disposable Postgres-compatible fixtures and security tests
docs/reading-room-review.md Visual, accessibility and performance review
```

Only `@neondatabase/serverless` is a production npm dependency. Node.js 22 is specified for the API. PGlite is a development dependency used to test the real SQL and transactions without contacting production.

## Neon and local setup

The existing collection has already been migrated and verified in Neon. Do not rerun the private import after making admin edits unless you intentionally want to restore that import's values.

Run the setup commands from the repository root, the directory containing `package.json`.

For a fresh installation:

1. Create a Neon project and choose the branch/database that will hold the library. In **Connect**, enable **Connection pooling** and copy the pooled `postgresql://…` connection string. S3 credentials, storage endpoints and the Data API REST URL are not Postgres connection strings.
2. Install dependencies and create a local environment file:

   ```bash
   npm ci
   cp .env.example .env.local
   ```

   Set `DATABASE_URL` privately in `.env.local`. Keep the entire connection string, including its SSL parameters. Never put it in frontend scripts, command arguments, GitHub or chat. If `.env.local` already exists, preserve it instead of copying over it.
3. Generate `SESSION_SECRET` without printing it, then migrate:

   ```bash
   npm run session-secret
   npm run migrate
   ```

   The secret is 32 random bytes represented as hex. The schema can be applied repeatedly. It creates `books`, `admin_users`, hashed-token `sessions`, and rate-limit `login_attempts`; `updated_at` is maintained by a trigger. Extra edition fields preserve Spanish titles, natural cover proportions, accent color, optional texture URLs and spine-author overrides.
4. For an initial import, put your private array of book objects in ignored `.local-data/books-import.json`, using the column names in `db/schema.sql`. Then run:

   ```bash
   npm run seed
   ```

   This validates records and upserts by slug, preserving shelf order, page counts, images, colors, EN/ES descriptions, links and reading dates. It reports each field's before/after difference. Keep import sources and reports in ignored `.local-data/`. A new clone intentionally has no book data; use your private backup/import or add books through the admin.
5. From the repository root, create the single admin account:

   ```bash
   npm run create-admin
   ```

   Choose a username and enter/confirm a password of 12–128 characters. Password input is hidden. The script refuses passwords through arguments or environment variables. Running it again with the same username resets the password and revokes existing sessions. A different second account cannot be created.
6. Start the local API and static site:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` and `/prasid` for administration. `PORT=3036 npm run dev` selects another port. A plain static HTTP server cannot supply the database APIs.

`.env*`, `.vercel/`, `.local-data/` and `node_modules/` are ignored; `.env.example` contains placeholders only. `npm run export` writes a full book backup to ignored `.local-data/books-backup.json`, never to `public/`. To restore it, copy that private backup to `.local-data/books-import.json` and deliberately run the import. Database backups and branch management remain available in Neon.

## Vercel setup and deployment

Connect `prasidupadhya/mybookshelf` to the existing Vercel project. Use the repository root, framework **Other**, output directory `public`, the standard npm install command, and no build command. `vercel.json` configures the serverless functions, hidden-page rewrites and security headers.

Set `DATABASE_URL` and `SESSION_SECRET` as **Sensitive** variables for **Production** and **Preview** in Vercel's project settings. The values must match the intended Neon branch and local session secret. Nothing is exposed as a public/frontend variable.

Alternatively, after privately configuring `.env.local`:

```bash
npx vercel login
npx vercel link --project mybookshelf
npm run sync-vercel-env
```

The sync script sends both values through stdin, suppresses CLI output containing values, and saves them as sensitive variables for production and preview. It never passes secrets as command arguments. Preview deployments currently use the same database as production; use a separate Neon branch and override Preview's `DATABASE_URL` if preview edits should be isolated.

Push `main` to deploy through the connected Git integration. Environment changes require a new deployment; they do not update functions in an existing deployment. The CLI alternative is `npx vercel --prod` after linking the existing project.

The old Cloudflare Pages instructions are obsolete: this version needs Vercel's Node functions. The browser security headers from the historical `public/_headers` are ported to `vercel.json`, along with CSP and admin noindex/no-store headers.

## Private administration

Visit `/prasid` directly; it is not linked from the public shelf. Change only `ADMIN_SLUG` in `config/admin.js`, run `npm run configure-admin`, then redeploy. This updates rewrites, robots rules and route headers. The physical page `/admin/index.html` also requires authenticated APIs.

A hidden URL is obscurity, **not security**. Every admin API except login verifies a server-side session; no public signup endpoint exists. The admin page has `noindex,nofollow`, route/API `X-Robots-Tag`, and `robots.txt` exclusions. There is no sitemap entry.

The dashboard supports:

- Add/edit all edition fields, bilingual titles/descriptions, covers, colors, links and reading dates.
- A live, freely rotatable 360° Three.js preview with drag, pinch/wheel zoom, momentum, and only Reset/Spin buttons. Arrow keys rotate; `+`/`−` zoom; Home resets. Color and thickness edits preserve orientation, zoom and the current canvas.
- Automatic spine/back/text colors when a new cover URL is entered, using the existing cover sampling algorithm. Manual changes are retained; “Pick colors from cover” explicitly reapplies suggestions. A quick Save waits for pending suggestions. Existing editions are not recolored merely by opening the editor.
- Start reading, mark as read, or manually move to any shelf. One-click progress actions set reading timestamps; dates remain editable.
- Reordering within a shelf using drag/drop or labeled up/down buttons. Ordering is validated and saved atomically in Postgres.
- Delete confirmation, success/error notifications, disabled save controls, unsaved-change warnings, and draft retention if a session expires.

Cover handling uses URLs. File upload/Vercel Blob is not enabled. Authenticated image sampling and previews accept bounded JPEG/PNG/WebP images, validate DNS/IP addresses, reject private networks/credentials/nonstandard ports, and revalidate redirects. The public relay accepts database book IDs only; image bytes are downloaded from stored URLs, so CORS-disabled hosts work without tracked cover copies.

## Authentication and security

This preserves the requested username/password-only sign-in with accounts in Neon. Managed Neon Auth is not enabled: its [supported plugin list](https://neon.com/docs/auth/guides/plugins) currently does not include Better Auth's username plugin, and [Better Auth username registration](https://better-auth.com/docs/plugins/username) still requires email. The managed email-based service would change the requested no-email authentication design.

Passwords use native scrypt with a random per-user 16-byte salt and N=131072, r=8, p=1. Verification uses constant-time comparison; unknown users perform the same dummy derivation. Five failed username+IP attempts in 15 minutes trigger a temporary lockout with the same generic error. Reservation is serialized in Postgres to avoid concurrent bypasses; raw IP addresses are not stored.

Session tokens contain 32 random bytes. Only their SHA-256 hashes are stored, with a seven-day expiration; cookies also carry an HMAC and use `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict` and `Path=/`. Logout deletes the session. Mutating requests, including login, require `X-Requested-With: fetch` and an exact Origin/Host match. Cookies are sent only over HTTPS in production.

All fields are validated server-side: types, length limits, HTTP(S)-only URLs, six-digit hex colors, shelf enums, IDs and dates. Queries are parameterized; DB text is rendered using `textContent`, never `innerHTML`. Errors return useful generic messages without stack traces, SQL or credentials. CSP permits local scripts, existing font/image hosts and required inline style variables; framing and embedded objects are disabled.

## APIs and refresh behavior

| Route | Purpose |
| --- | --- |
| `GET /api/books` | Public fields grouped by shelf, ordered by `sort_order` |
| `GET /api/books/:id/cover` | Cached front/back texture from a stored edition |
| `POST /api/admin/login` | Rate-limited username/password sign-in |
| `POST /api/admin/logout` | Revoke the current authenticated session |
| `GET /api/admin/me` | Current authenticated username |
| `GET /api/admin/books` | All editable fields for the admin |
| `POST /api/admin/books` | Add at the end of the selected shelf |
| `PATCH /api/admin/books/:id` | Edit, move or update reading progress |
| `DELETE /api/admin/books/:id` | Delete a book |
| `POST /api/admin/books/reorder` | Atomically replace a shelf's ordering |
| `GET/POST /api/admin/cover` | Authenticated preview/sampling relay |

The public collection uses `s-maxage=60, stale-while-revalidate=300`. The public page uses a minute-specific cache key and refreshes at minute boundaries and on returning to the tab, making admin changes visible within about a minute without redeployment or cache purge. Refresh waits until an open bookplate closes, preserving its content and focus.

Per the final database-only requirement, there is **no checked-in snapshot fallback**. Initial requests show generic skeletons with no edition data. An initial outage shows a localized unavailable message and Retry button; a failed later refresh keeps the last database response in memory. Empty databases display the three shelf bays with bilingual empty-state copy. Cover download/WebGL failures preserve book details and use the existing cover/CSS 3D fallback. The Reading Room redesign leaves this outage policy unchanged.

## Verification

```bash
npm test
```

Tests apply the SQL migration twice to disposable Postgres-compatible databases, then check authentication, generic login errors, lockout expiry, cookie flags/token hashes, session expiry/logout, every unauthenticated admin route, CSRF, validation, create/edit/move/mark-read/reorder/delete persistence, and cover-relay SSRF defenses. Appearance tests exercise 4,913 binding colors to check that automatically chosen black/white spine ink meets AA. Fixtures are fictional; they contain no current library records or production account credentials.

Migration verification compared every imported editable field with the private original source, including EN/ES metadata and appearance. Reading Room browser review covers 320, 768, 1024 and 1440px, both languages/themes, reduced motion, native/fallback modal transitions, WebGL-unavailable previews, initial API failure and keyboard focus. Admin visual review uses a read-only fixture so it cannot modify the production collection. Earlier backend verification checked Neon persistence and removed its temporary records afterward.

The final local Lighthouse 12.8.2 mobile audits scored **95 Performance / 100 Accessibility** in light mode and **93 / 100** in dark mode, with **CLS 0** and **TBT 0ms** in both. Audits use simulated mobile throttling, not physical-device benchmarks. Total added public JavaScript is **3,172 bytes gzipped** (excluding the unchanged Three.js vendor files); self-hosted WOFF2 fonts total **70,036 bytes**. See the review for the full asset and contrast accounting.

The renderer retains the existing matte lighting and soft ground shadow, uses a small mesh without postprocessing/shadow-map passes, caps touch pixel ratio at 1.5, and reduces it if frames become slow. Updates reuse the canvas and dispose replaced geometry/materials; closing disposes textures, observers, listeners and the WebGL context. Responsive browser checks do not establish performance on physical mid-range mobile hardware.
