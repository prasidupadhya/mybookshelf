# Reading Room review

Reviewed 4 October 2026, against the database-only baseline `eedca22`. The eight implementation commits follow the requested order: tokens/fonts, atmosphere, shelf polish, decorative ribbon, bookplate/transitions, header/colophon, admin surfaces, then accessibility/performance review.

## Scope and design decisions

The frontend remains vanilla HTML/CSS/JavaScript with no build step or new runtime dependencies. The wooden cabinet, six-face CSS books, shared perspective, natural cover proportions, page-count thickness, 340ms pull-out, database refresh and 360° viewer remain in place. The database schema, API contracts, auth helpers and admin JavaScript are unchanged.

The font pairing is [Fraunces](https://fontsource.org/fonts/fraunces) 500 for display, [Public Sans](https://fontsource.org/fonts/public-sans) 400–600 for reading and controls, and [IBM Plex Mono](https://fontsource.org/fonts/ibm-plex-mono) 400 for catalogue metadata. Fraunces supplies a bookish display voice without making paragraphs ornamental; Public Sans remains calm at small sizes. Fraunces retains its optical-size axis. All three local WOFF2 subsets were checked for `á é í ó ú ñ ü ¿ ¡` and their uppercase counterparts. Only the display face is preloaded; all faces use swap and metric-adjusted fallbacks where available. Sources, licenses and the optional asset-preparation script are documented beside the font files. Font preparation is not a deployment build step.

The dark lamp is a static radial image moved with a composited transform. Fine mouse events are coalesced through requestAnimationFrame, book positions are cached until layout changes, and no continuous frame loop runs for the room. Only cover faces receive extra illumination; the spine labels retain an opaque binding-color ink bed. Touch uses fixed light. Morning light and the tiny grain tile are static CSS. Reduced motion removes grain, lean and decorative transitions, and turns off viewer auto-spin. No shader library or animated noise was added.

## Performance and asset budget

Lighthouse 12.8.2, default mobile simulation: 412 × 823, 4× CPU slowdown, simulated slow 4G. These are local audits of the real Neon-backed page, without review mocks or an open viewer. Network timings can vary between runs.

| Theme | Performance | Accessibility | Best practices | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Light | 95 | 100 | 100 | 1.81s | 2.75s | 0ms | 0 |
| Dark | 93 | 100 | 100 | 1.81s | 2.99s | 0ms | 0 |

The initial audit exposed a cabinet insertion shift. Generic shelf markup now reserves the cabinet before modules initialize, without embedding edition data. Prioritizing the first visible cover improved LCP; remaining shelf covers retain lazy loading. Three.js is absent from initial resource requests and the public module graph until a book opens.

Asset accounting uses the sum of independently gzipped files (gzip level 9), compared with `eedca22`. WOFF2 is already compressed. HTML, licenses, unchanged images from external hosts and the unchanged Three.js vendor directory are excluded from this table; it is an asset budget, not a complete network waterfall.

| Asset group | Final raw bytes | Final gzip bytes | Added raw bytes | Added gzip bytes |
| --- | ---: | ---: | ---: | ---: |
| Public CSS | 44,698 | 13,506 | 4,687 | 2,545 |
| Public JS, excluding Three.js vendor | 62,579 | 20,872 | 9,590 | 3,172 |
| Admin CSS | 8,965 | 2,341 | 183 | −21 |
| Signature SVG outlines | 7,148 | 3,217 | 7,148 | 3,217 |
| Self-hosted WOFF2 fonts | 70,036 | — | 70,036 | — |

Added CSS/JS/signature transfer is 8,913 gzipped bytes plus 70,036 WOFF2 bytes. Public JS remains well inside the 15KB added-JS budget; its total initial modules are 14,625 gzipped bytes, with the viewer module deferred. The signature is an outlined version of the existing handwriting, preserving the colophon without downloading a fourth font. Admin JavaScript is unchanged.

For a fresh audit, start `npm run dev` and run from the repository root:

```bash
npx --package lighthouse@12.8.2 lighthouse http://localhost:3000 --only-categories=performance,accessibility,best-practices --chrome-flags="--headless" --output=html --output-path=.local-data/lighthouse-light.html
npx --package lighthouse@12.8.2 lighthouse http://localhost:3000 --only-categories=performance,accessibility,best-practices --chrome-flags="--headless --force-dark-mode" --output=html --output-path=.local-data/lighthouse-dark.html
```

Create `.local-data/` first if needed. Reports can include library text and screenshots, so keep them ignored. These commands are optional audit tools, not project/runtime dependencies. [Lighthouse documents its auditing and simulation model](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md).

## Contrast review

OKLCH tokens were resolved through the browser to sRGB, then evaluated using WCAG relative luminance and [APCA's reference implementation](https://github.com/Myndex/apca-w3) 0.1.9. The table shows absolute APCA Lc; reverse polarity has a negative signed value. [WCAG AA](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) remains the compliance threshold. APCA is an additional body-text check, not a claim of separate certification.

| Text / surface | Dark WCAG | Dark \|Lc\| | Light WCAG | Light \|Lc\| |
| --- | ---: | ---: | ---: | ---: |
| Body / page start | 14.98 | 94.5 | 11.54 | 93.0 |
| Body / page middle | 13.57 | 93.3 | 10.67 | 87.8 |
| Body / page end | 14.98 | 94.5 | 9.25 | 78.9 |
| Heading / cabinet | 13.71 | 93.4 | 8.93 | 76.8 |
| Body / admin panel | 12.17 | 91.8 | 10.67 | 87.8 |
| Body / raised or hovered control | 10.22 | 88.8 | 11.54 | 93.0 |
| Secondary / page middle | 11.13 | 80.0 | 9.89 | 86.1 |
| Secondary / cabinet | 11.24 | 80.1 | 8.27 | 75.0 |
| Secondary / admin panel | 9.98 | 78.5 | 9.89 | 86.1 |
| Secondary / raised surface | 8.38 | 75.6 | 10.69 | 91.3 |
| Colophon / page end | 12.28 | 81.2 | 8.57 | 77.2 |
| Bookplate body / paper | 10.55 | 87.6 | 10.55 | 87.6 |
| Bookplate metadata / paper | 6.28 | 75.0 | 6.28 | 75.0 |
| Goodreads link / paper | 7.07 | 78.0 | 7.07 | 78.0 |
| Error / page | 12.78 | 83.8 | 7.80 | 83.2 |
| Error / admin panel | 10.39 | 81.1 | 7.21 | 78.0 |
| Delete button text / danger fill | 7.80 | 87.2 | 7.80 | 87.2 |

Focus rings measure 8.55:1 on dark panels and 5.23:1 on light panels/paper. Control outlines measure 3.57–4.25:1 in dark and 3.68–3.98:1 in light, including hover surfaces, above the 3:1 non-text contrast threshold. Ornamental hairlines are decorative, not control boundaries.

Spine ink is chosen by measured contrast between pure black and white, regardless of the stored `spine_text_color`. This guarantees at least 4.58:1 on every valid sRGB binding color. A 4,913-color regression test verifies AA across the color cube. Cover artwork is unchanged. The ink guarantee refers to the CSS label's opaque binding bed; a lit, freely rotated WebGL texture also depends on its viewing angle.

Automated contrast tools cannot fully resolve the layered gradients and projected faces. Those backgrounds were also inspected visually; flat-token measurements above do not constitute an exhaustive pixel-by-pixel certification of decorative gradients.

## Browser and accessibility checks

- Public shelf and bookplate checked at 320, 768, 1024 and 1440px, dark/light, EN/ES and reduced motion on/off. No horizontal overflow, overlapping book boxes or clipped modal edges were found. A fictional landscape 2:1 cover also fits at 320px while books retain equal height and natural widths.
- Empty shelves were tested by temporarily changing only the browser's in-memory collection, then restoring it. All three bays retain bilingual empty-state copy. No production books were added, edited or deleted for this review.
- Modal review covers native same-document [View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document), the original clicked-cover fallback, Escape/outside close, inert background, Tab/Shift-Tab trapping and return to the selected book. Repeated open/close checks leave no viewer canvas behind.
- Three.js and CSS-solid fallback previews retain arrow-key rotation, zoom, Reset and Spin. WebGL was disabled in the review harness to exercise fallback. Viewer geometry, texture aborts and disposal remain intact; fallback depth now follows the same page-count thickness helper.
- API-disabled review confirms an initial localized failure with Retry and no edition snapshot. A later failed refresh retains the last response in memory. The unchanged minute refresh waits while a bookplate is open.
- Admin login, dashboard and editor reviewed across the four widths and both themes/reduced-motion settings. All form controls have labels; the admin has no grain or lamp. Mobile inputs/selects use 16px text to avoid focus zoom. Dashboard/editor browser checks use a read-only fixture, not an authenticated production editing session.
- Axe found no WCAG A/AA or best-practice violations on the public shelf/bookplate in both languages/themes, or on the admin dashboard/editor in both themes. Hidden-dialog `aria-controls` references and complex gradient contrast were manually reviewed. Accessible spine names now include their visible shortened labels; screen-reader shelf counts use real hidden text and singular/plural copy.
- `npm test` passes all four test groups, covering existing backend/security/persistence behavior and the new spine contrast test. All frontend modules pass `node --check`; `git diff --check` is clean.

## Deliberate omissions and limits

- Outage handling is unchanged by explicit instruction: no static book snapshot, no browser-storage backup, and no current edition records added to Git.
- `current_page` and progress ribbons were not added. The optional schema/API/admin-form change was not requested; the bookmark is purely decorative.
- Reading dates render when supplied to the bookplate. The current public API does not expose those fields, so this redesign does not make them visible by changing its contract. Admin date editing is preserved.
- No Paper Shaders, ambient drift, postprocessing, runtime font service, image upload or new application feature was added. Static lighting/grain keep the effect quiet and lightweight.
- The signature outline, data-free initial cabinet, landscape-cover sizing, accessible-name fixes and mobile input sizing are polish within the requested preservation/accessibility/performance work. No unrelated feature or data change was made.
- Browser viewport checks and Lighthouse simulation do not establish performance on physical mid-range mobile hardware, or replace a full screen-reader and cross-browser audit. Safari/Firefox receive feature-detected transition and 3D fallbacks but were not separately benchmarked here.

Secrets, account details, private environment files, raw audit reports and current-library screenshots remain outside Git. No Neon migration or Vercel environment change is needed for this redesign.
