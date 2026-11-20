# Leonida Nights — Neon Noir Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/TUHIN729/gta6-cover-art-8/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/TUHIN729/gta6-cover-art-8/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your photo and a caption into GTA-style cover art
— the diagonal split-panel poster look, with bold condensed lettering and a
neon dusk colour grade — exported as a PNG to share. Built for the
[make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Three panels, one poster.** A large diagonal hero panel plus two stacked
  side panels, divided by glowing neon lines — the multi-panel cover look.
- **Any photo.** Load a photo into each panel, or fill all three with one photo.
  Drag a photo inside its panel to reframe it, scroll to zoom, or use the
  sliders. Sample scenes are included so it works with no upload at all.
- **Your words.** Edit the title, the neon subtitle and the date line; the
  title is set in condensed black caps with a magenta outline and a cyan drop
  shadow, slightly tilted like a poster.
- **Three neon grades.** Neon Dusk (magenta/cyan), Sunset Gold and Midnight
  Teal — each re-grades every panel, the dividers and the title block.
- **One-click export.** 1080×1080, 1080×1350 and 1920×1080 PNGs, straight from
  the browser. No upload, no network, no build step: `app/index.html` opens in
  desktop Chrome and works offline.

The skyline-and-palm band above the title, the palm silhouettes and the grain
are all drawn in the app itself, on canvas. The sample scenes under
`app/samples/` are canvas-drawn too — no real person, no Rockstar artwork.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Files

- `app/index.html`, `app/style.css` — the editor page and its neon styling.
- `app/src/cover.js` — the cover engine: panels, grades, skyline, palms, title.
- `app/src/main.js` — the editor wiring: uploads, drag/zoom, export.
- `app/src/shots.js` — fixed scenes for the screenshots.
- `app/fonts/` — Noto Sans Condensed Black and Condensed Bold Italic under the
  SIL Open Font License (`OFL.txt`).
- `app/samples/` — two canvas-drawn sample scenes.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output`
  and writes `/output/dossier.json`.

## License

MIT — see `LICENSE`.
