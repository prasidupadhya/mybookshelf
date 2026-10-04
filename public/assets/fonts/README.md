# Reading Room typography

These self-hosted WOFF2 assets come from Fontsource 5.3.0 packages:

- [Fraunces](https://fontsource.org/fonts/fraunces/about): display serif, weight 500, optical sizing retained, softness 20, wonky forms disabled.
- [Public Sans](https://fontsource.org/fonts/public-sans/about): UI and body text, variable weights 400–600.
- [IBM Plex Mono](https://fontsource.org/fonts/ibm-plex-mono/about): catalogue metadata, weight 400.

Each asset includes Latin-1, all required Spanish glyphs (`á é í ó ú ñ ü ¿ ¡`), and common typographic punctuation. The subset is independent of the current book collection. The accompanying OFL license files must remain with the fonts. Only the critical Fraunces 500 face is preloaded; every face uses `font-display: swap`.

The files are ready to serve. Optional one-time preparation, from the repository root:

```sh
python3 -m venv .local-data/font-tools
.local-data/font-tools/bin/pip install 'fonttools[woff]==4.60.2'
.local-data/font-tools/bin/python scripts/subset-fonts.py
```

This downloads pinned source packages and verifies Spanish coverage. It is not a deployment/build step and adds no browser or API dependency.
