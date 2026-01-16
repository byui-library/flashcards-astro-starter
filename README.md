# A&P Flashcards — Astro + PWA + CSV→JSON Starter

Offline-first flashcards for anatomy & physiology. Author decks in CSV, build produces JSON, deploy anywhere (Vercel/Netlify/GitHub Pages).

## Quick start

```bash
# 1) install
npm i

# 2) run dev
npm run dev

# 3) build (csv -> json, then static site)
npm run build

# 4) preview prod build
npm run preview
```

Open http://localhost:4321

## Authoring decks

Edit CSV files in `./decks`. Columns:

- `image` (filename in `src/assets/images/`, e.g. `skull_lateral.svg`)
- `answer` (what the card reveals on flip)
- `alt` (accessible alt text for the image)
- `deck` (logical grouping)

Export from Excel/Sheets as CSV and drop into `./decks`. On build, files are converted to JavaScript modules in `src/data/`.

Example row:

```csv
Anterior Drawer ACL sprain.jpeg,Anterior Drawer/ACL sprain,Anterior Drawer Test for ACL,Knee
```

**Important**: Avoid apostrophes and special characters in image filenames (use `Lachmans` instead of `Lachman's`).

## Add more decks

Add another CSV to `./decks` and place images in `src/assets/images/`, then run `npm run build`. The system **automatically discovers and imports** new decks - no manual edits needed!

Current decks:
- Foot/Ankle Tests
- Hip Tests  
- Knee Tests
- Shoulder Tests

## Images

Place images in `src/assets/images/`. Astro optimizes them at build time to 400×400 WebP format. For best results, use high-quality source images. The PWA caches optimized images for offline use.

**Naming**: Avoid apostrophes and special characters in filenames (use underscores or remove them).

## Progress & spaced repetition

Client-side Leitner-style boxes (1..3) are tracked in `localStorage` per-deck. No backend required. If you later want cross-device sync, you can add Supabase and persist the `progress` map per user.

## PWA

- Installable on mobile (Add to Home Screen)
- Offline-first via `@vite-pwa/astro`
- Cached routes: app shell, `/decks/*`, `/images/*`

## Deploy

- Push repo to GitHub, import into Vercel, **framework: Astro**
- Build command: `npm run build`
- Output dir: `dist`

## License of media

Only include media you’re licensed to use (OpenStax/Wikimedia CC-BY, public domain, or your own). Keep attribution within your course materials as needed.
