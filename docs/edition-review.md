# Edition and binding review — September 16, 2026

Updated the five requested editions, including exact cover URLs, Goodreads links, page counts and intrinsic image ratios. Shelf ordering, typography, themes, language controls and layout rules remain unchanged.

Binding colors were selected from the new artwork: green for Metamorphosis, paper white for Siddhartha, ochre for Bhagavad Gita, white for White Nights and black for The Stranger. The WebGL spine, back and cover-board edges reuse one material. The CSS shelf's paper faces carry matching thin cover-board edges; these never cover or frame the front artwork. Artwork printed with its own border remains intact.

White Nights uses an identical local image for its WebGL texture because the publisher does not serve CORS headers. Other textures still use their supplied image URLs. No dependency was added.

## Reference application

The supplied references informed a restrained refinement of the established shelf:

- [Frontend design](https://www.skills.sh/anthropics/skills/frontend-design), [Anti-slop](https://github.com/miqdadbadjuber/anti-slop), and [Impeccable](https://impeccable.style/): keep the literary identity, let the artwork carry the color, remove unnecessary decoration, and review the finished responsive views.
- [Boneyard](https://boneyard.vercel.app/overview) and [UI UX Pro Max](https://uupm.cc/): stable intrinsic cover sizing, readable labels and accessible interaction.
- [Rare UI](https://www.rareui.com/), [Animated Heroicons](https://www.heroicons-animated.com/), and [Kinetics](https://kinetics.colorion.co/): reviewed interaction references; retained the existing two viewer controls and purposeful motion without introducing a component framework or decorative animations.
- [Engineering skills](https://github.com/mattpocock/skills/tree/main/skills/engineering): inspect divergent histories before integrating; preserve existing work and verify the resulting behavior. The fetched remote history was merged without rewriting the local history.

## Verification

- Chromium: all five real textures loaded; page counts and detail links match edition data; spine, back and cover edges use the same material instance.
- Shelf at 320, 375, 390, 520, 521, 760, 768, 1024 and 1440px: equal book heights, natural widths, no cover frames, title overflow, clipping or book overlap; pulled-book bounds remain within the viewport.
- Popup at 320, 390, 521, 768 and 1440px: no horizontal overflow. Visual screenshot review included light/dark themes and English/Spanish.
- Keyboard rotation, Reset/Spin only, Escape/cleanup, and forced WebGL-unavailable fallback passed.
- Mobile touch emulation: drag, inertia interruption by tap, pinch/twist, and no accidental modal scrolling passed. At 4× CPU throttling and device pixel ratio 3 (renderer capped to 1.5), animation frame intervals measured 16.7ms median / 16.8ms p95. This is an emulation result, not a physical-device benchmark.
- JavaScript syntax and `git diff --check` passed; no page errors during the checks.

Remaining limits: remote cover availability depends on the image hosts, and physical mobile hardware was not available. No deployment was performed.
