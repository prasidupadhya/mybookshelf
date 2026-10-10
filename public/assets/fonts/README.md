# Gallery typography

These self-hosted WOFF2 assets come from Fontsource 5.3.0 packages:

- [Instrument Serif](https://fontsource.org/fonts/instrument-serif/about): display serif for titles, counts and book spines, regular and italic. Its slightly condensed proportions keep long titles legible on narrow spines.
- [Inter](https://fontsource.org/fonts/inter/about): reading text and controls, variable weights. Fontsource's Latin file is shipped as-is because its variation tables do not survive re-subsetting.
- [IBM Plex Mono](https://fontsource.org/fonts/ibm-plex-mono/about): administration metadata, weight 400.

Each asset includes Latin-1, all required Spanish glyphs (`á é í ó ú ñ ü ¿ ¡`), and common typographic punctuation. The subset is independent of the current book collection. The accompanying OFL license files must remain with the fonts. Only the regular Instrument Serif face is preloaded; every face uses `font-display: swap`, and `font-synthesis: none` prevents faux bold display type.

The files are ready to serve. Optional one-time preparation, from the repository root:

```sh
python3 -m venv .local-data/font-tools
.local-data/font-tools/bin/pip install 'fonttools[woff]==4.60.2'
.local-data/font-tools/bin/python scripts/subset-fonts.py
```

This downloads pinned source packages and verifies Spanish coverage. It is not a deployment/build step and adds no browser or API dependency.
