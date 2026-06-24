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
| `answer` | Test name and condition, separated by `:` |
| `alt` | Accessible alt text for the image |
| `deck` | Deck grouping (e.g. `Knee`, `Shoulder`) |
| `video` | *(Optional)* Filename in `src/assets/videos/` (e.g. `Talor Tilt.mp4`). Blank for image-only cards. |

The build automatically groups rows by the `deck` column into separate deck modules. One CSV can produce multiple decks.

Example row:

```csv
Lachman_s.jpg,Lachman's Test: ACL sprain,Lachman's Test,Knee,
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

## Videos (optional, per-card)

Cards may include an optional short demonstration video. Place MP4 files in `src/assets/videos/` and reference the filename in the `video` column of the CSV.

**Behavior:**

- Cards with a video show a small ▶ badge in the corner of the image.
- Clicking the image or pressing `V` plays the video muted and looping in the same card slot.
- The video stops and resets when the user flips, advances, switches decks, or resets.

**Recommended export settings:**

- Container: MP4
- Codec: H.264 (baseline or main profile)
- Audio: **strip** (videos play muted, so audio bytes are wasted)
- Resolution: ≤ 400 px on the long edge
- Frame rate: 24–30 fps
- Duration: 3–8 seconds
- File size: ≤ ~2 MB per clip

**Offline caching:**

Videos are runtime-cached by the PWA (not precached). After the app loads, all videos are silently fetched in the background to warm the cache. On subsequent visits — including offline — they play instantly.

The video cache (`videos-cache`) is capped at 100 entries with a 1-year expiration. Sized against the ≤ 2 MB per-clip target above, that is roughly ~200 MB worst case. If you raise clip sizes well beyond the recommended target, watch browser storage quotas — at very large libraries you may want to lower the `maxEntries` cap in `astro.config.mjs` or restrict prefetch to the current deck.

**Quick ffmpeg snippet for re-encoding:**

```bash
ffmpeg -i input.mov -an -vf "scale='min(400,iw)':-2" -c:v libx264 -profile:v main -crf 26 -preset slow -movflags +faststart output.mp4
```

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

### Manual video test checklist

- [ ] Card with video shows ▶ badge
- [ ] Card without video does not show badge
- [ ] Click image on video card → video plays muted, loops
- [ ] Press `V` on video card → same
- [ ] Press `V` on image-only card → nothing happens
- [ ] Flip / Next / Know / Missed → video stops and resets
- [ ] Switching decks → video stops
- [ ] Reset deck → video stops
- [ ] Apply card-selection config → video stops
- [ ] Offline (after one full visit): video plays without network
- [ ] Offline + uncached video URL: image stays, toast appears, no crash

## Deploy

- GitHub Pages: `https://byui-library.github.io/flashcards-astro-starter`
- Build command: `npm run build`
- Output dir: `dist`

## License of media

Only include media you're licensed to use (OpenStax/Wikimedia CC-BY, public domain, or your own).
