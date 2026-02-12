# Special Tests Flashcards — Astro + PWA

Offline-first flashcards for orthopedic special tests, branded to BYU-Idaho standards. Author decks in CSV, build produces optimized static site, deploy anywhere.

## Quick start

```bash
npm i
npm run dev        # http://localhost:4321/flashcards-astro-starter
npm run build      # csv → JS modules → static site
npm run preview    # preview production build
```

## Authoring decks

Edit `decks/special tests exam 1.csv` (or add more CSVs). Columns:

| Column | Description |
|--------|-------------|
| `image` | Filename in `src/assets/images/` (e.g. `Lachman_s.jpg`) |
| `answer` | Test name / condition separated by `/` |
| `alt` | Accessible alt text for the image |
| `deck` | Deck grouping (e.g. `Knee`, `Shoulder`) |

The build automatically groups rows by the `deck` column into separate deck modules. One CSV can produce multiple decks.

Example row:

```csv
Lachman_s.jpg,Lachman's Test/ACL sprain,Lachman's Test,Knee
```

**Image naming**: Avoid apostrophes and special characters in filenames (use underscores: `Lachman_s.jpg`).

## Current decks (35 cards)

- Foot/Ankle (5 cards)
- Knee (11 cards)
- Hip (5 cards)
- Shoulder (14 cards)

## Build pipeline

1. `scripts/build-decks.mjs` — Parses all CSVs, groups by `deck` column, generates one JS module per deck in `src/data/`
2. `scripts/update-deck-imports.mjs` — Scans generated modules and auto-updates imports + config in `src/pages/index.astro`
3. `astro build` — Builds static site, optimizes images to 400x400 WebP

## Adding new cards or decks

1. Add image to `src/assets/images/`
2. Add a row to the CSV (or add a new CSV file)
3. Run `npm run build`

New deck values in the `deck` column automatically create new entries in the dropdown.

## Images

Place images in `src/assets/images/`. Astro optimizes them at build time to 400x400 WebP. The PWA caches optimized images for offline use.

## Branding

The app follows [BYU-Idaho branding standards](https://www.byui.edu/branding/):

- **Colors**: Brand Blue `#006EB6`, Dark Blue `#214491`, Light Blue `#A0D4ED`
- **Fonts**: Source Sans 3 (UI/headlines), Source Serif 4 (card answers) — web alternatives to News Gothic and Minion
- **PWA theme**: Brand Blue browser chrome

## Progress & spaced repetition

Client-side Leitner-style boxes (1–3) tracked in `localStorage` per-deck. No backend required.

## Testing

```bash
npm test           # watch mode
npm run test:run   # single run (CI)
npm run test:coverage
```

107 tests across 7 test files including data integrity validation.

## Deploy

- GitHub Pages: `https://matjmiles.github.io/flashcards-astro-starter`
- Build command: `npm run build`
- Output dir: `dist`

## License of media

Only include media you're licensed to use (OpenStax/Wikimedia CC-BY, public domain, or your own).
