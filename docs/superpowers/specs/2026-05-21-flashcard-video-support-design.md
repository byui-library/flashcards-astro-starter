# Flashcard video support — design

**Status:** Draft for review
**Date:** 2026-05-21
**Author:** matjmiles (with Claude)

## Goal

Let individual flashcards optionally include a short video clip that demonstrates
the orthopedic test in motion, while keeping the still image as the default
front-of-card view. Video supplements the image — it never replaces it.

## Why

Some tests are easier to recognize from motion than from a still pose
(e.g. anterior drawer's joint translation). Today every card is a single
optimized WebP. Adding optional motion gives students a closer-to-clinical
reference without disrupting the existing fast keyboard-driven study flow.

## Non-goals

- No build-time video transcoding (no `ffmpeg` dependency).
- No multi-format output (WebM + MP4). MP4/H.264 only.
- No video on the back of the card. Front only.
- No autoplay anywhere.
- No video scrubber or pause controls. Loops muted, no chrome.
- No analytics or playback-progress persistence.
- No GIF fallback.

## User-facing behavior

- A card with a video shows a small ▶ badge in the top-right of the image.
  Cards without a video look identical to today.
- The user activates the video by **clicking the image** or pressing **V**.
- On activation the still image is replaced **in place** (same 400×400 slot) by
  a `<video>` element that plays **muted** and **loops** until the user advances.
- Any navigation action stops the video, resets it to the first frame, and
  re-shows the still image. Actions that stop video:
  - Flip
  - Next
  - Know / Missed
  - Switch deck
  - Reset deck
  - Apply card-selection config
- Flip behavior is unchanged: the back panel slides in with the answer text.
  When flipping, we pause+reset the video and show the image — flip is "I'm
  reading the answer now."
- Audio is always muted; the audio track is expected to be absent from the
  source MP4 (author responsibility).

## Authoring model

Videos are authored CSV-first, matching the existing image flow.

### CSV schema change

Add an optional `video` column to [`decks/special tests exam 1.csv`](../../../decks/special%20tests%20exam%201.csv)
(and any future CSV in `decks/`):

```csv
image,answer,alt,deck,video
Talor Tilt.jpg,Talar tilt: CFL Sprain,Talor Tilt,Foot/Ankle,Talor Tilt.mp4
Anterior Drawer knee.jpg,Anterior drawer: ACL sprain,Anterior Drawer knee,Knee,
```

- Blank `video` cell → image-only card (current behavior).
- Filled `video` cell → filename relative to `src/assets/videos/`.

### Video file location

New directory: **`src/assets/videos/`**, sibling to `src/assets/images/`.
Astro/Vite hashes and fingerprints these at build for cache-busting.

### Recommended export settings (documented in README)

Authors pre-encode. The build ships files as-is.

- Container: MP4
- Video codec: H.264 (baseline or main profile)
- Audio: **none** (strip audio track)
- Resolution: ≤ 400 px on the long edge
- Frame rate: 24–30 fps
- Duration: 3–8 seconds
- Target file size: ≤ ~2 MB per clip

### Starter videos

Three MP4s currently in [`tmp/`](../../../tmp/) get renamed and moved to
`src/assets/videos/` to populate the first three video cards:

| Source file | Target card | Notes |
|---|---|---|
| `tmp/Talor Tilt.mp4` | Talar Tilt (Foot/Ankle) | `Talor Tilt.jpg` |
| `tmp/Kleigers.mp4` | Kleiger's (Foot/Ankle) | `Kleigar_s.png` |
| `tmp/Anterior Drawer.mp4` | **TBD — confirm with author** | Could be Foot/Ankle or Knee Anterior Drawer |

The Anterior Drawer assignment will be confirmed with the author at
implementation time before the file is moved.

## Architecture

### Build pipeline changes

[`scripts/build-decks.mjs`](../../../scripts/build-decks.mjs):
- Parse the new `video` column.
- For each card with a video, emit an additional `import imageN_video from '../assets/videos/<file>'` line and add `video: imageN_video` to the card object.
- Cards without a video get `video: null`.

[`src/pages/index.astro`](../../../src/pages/index.astro):
- Build a new map `optimizedVideoPathsByDeck` parallel to the existing
  `optimizedImagePathsByDeck`. For each deck and each card index, store either
  the resolved video URL (Vite-hashed path) or `null`.
- Pass `optimizedVideoPathsByDeck` into `new FlashcardApp({ ... })`.

Videos are **not** passed through `astro:assets`' `getImage()` — that helper is
for raster images only. Vite handles `.mp4` imports natively and produces a
hashed asset URL.

### Component changes

[`src/components/Flashcard.astro`](../../../src/components/Flashcard.astro):

- Inside `#front-wrapper`, add a `<video>` element and a ▶ badge, both hidden by default:

```html
<div id="front-wrapper">
  <img src={initialImage.src} alt={initialImage.alt} width="400" height="400" />
  <video id="card-video" width="400" height="400"
         muted loop playsinline preload="metadata" hidden></video>
  <button id="video-badge" class="video-badge" type="button" hidden
          aria-label="Play video">▶</button>
</div>
```

- The badge is a real `<button>` (not a decorative span) so it's keyboard-focusable and screen-reader-announced. Clicking the image OR the badge OR pressing V all dispatch the same play action.

### App logic changes

[`src/scripts/flashcard-app.js`](../../../src/scripts/flashcard-app.js):

New constructor field:

```js
this.optimizedVideoPathsByDeck = config.optimizedVideoPathsByDeck;
```

New methods:

- **`setMedia(card, deckId, cardIndex)`** — called from `render()`.
  - Always sets `<img>` src/alt (unchanged from today).
  - Looks up `videoPath = this.optimizedVideoPathsByDeck[deckId][cardIndex]`.
  - If `videoPath` is non-null: set `<video>.src = videoPath`, keep `<video>` hidden, show ▶ badge.
  - If `videoPath` is null: hide `<video>` and badge entirely; clear `<video>.src` to release any buffer.

- **`playCardVideo()`**
  - No-op if current card has no video, or if video is already playing.
  - Hide `<img>` and badge, show `<video>`, call `.play()`.
  - On the video's `error` event (e.g. offline + uncached): hide video, restore image+badge, fire a small non-blocking toast "Video not available offline yet."

- **`stopCardVideo()`**
  - Pause video, set `currentTime = 0`.
  - Hide video, show image and (if applicable) badge.

`stopCardVideo()` is invoked at the top of:
- `next()`
- `flip()`
- `setBox()`
- `switchDeck()`
- `resetDeck()`
- `applyConfiguration()`

`render()` calls `setMedia()` after determining the active card.

### Keyboard model

Existing bindings unchanged. New binding:

- **`v` / `V`** → `playCardVideo()`

Added to both the `#card` `onkeydown` handler and the global keydown listener
(to match how `Escape` is handled today).

### Styles

[`src/styles.css`](../../../src/styles.css):
- `#front-wrapper` becomes `position: relative` (if it isn't already).
- `.video-badge` is absolutely positioned top-right, ~36 px, semi-transparent
  BYU-Idaho brand-blue background, white triangle glyph, subtle shadow, focus
  ring for keyboard users.
- `#card-video` is sized exactly like the image (`width:400; height:400;
  object-fit: cover`) so swapping is layout-stable.

## PWA / offline caching

Designed to scale to a growing video library (eventually dozens of clips).

[`astro.config.mjs`](../../../astro.config.mjs) changes:

- **No precache change.** Leave `globPatterns` as-is (no `mp4`). Install size is
  independent of video library size.
- **Add a runtime CacheFirst rule for `.mp4`:**

  ```js
  {
    urlPattern: /\.mp4$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'videos-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      }
    }
  }
  ```

- `cleanupOutdatedCaches` stays effectively on via `registerType: 'autoUpdate'`,
  so when Vite emits new hashed filenames on a content change, old entries are
  dropped on next service-worker update.

[`src/scripts/flashcard-app.js`](../../../src/scripts/flashcard-app.js) gains a
**background prefetch** after boot:

- On `init()`'s tail end, schedule via `requestIdleCallback` (or `setTimeout(0)`
  fallback) a routine that:
  - Flattens `optimizedVideoPathsByDeck` into a deduplicated URL list.
  - Issues `fetch(url, { priority: 'low', cache: 'default' })` calls with
    concurrency 2.
  - Errors are swallowed (offline / blocked is fine — they'll cache on first
    interactive play instead).
- Each successful fetch hits the runtime CacheFirst rule and warms the cache.

**Net behavior:**

- 3 starter videos today (~6 MB): warms quietly after first app load. By the
  next session everything is offline-available.
- 50 videos later (~100 MB): same code path. Eviction bounded by `maxEntries:
  100`.

**Future tuning (out of scope now):**

- Gate prefetch on `navigator.connection.saveData === false` and
  `effectiveType !== '2g'`.
- Swap CacheFirst → StaleWhileRevalidate if revision churn becomes painful.

## Error handling

- **Missing video file at build time:** Vite will fail the build with an
  unresolved import. That's the desired behavior — keeps the data layer honest.
- **Video fails to play at runtime (offline + uncached, codec issue, etc.):**
  Caught via the `<video>` element's `error` event. Fallback to image, show
  a non-blocking toast.
- **`optimizedVideoPathsByDeck[deckId]` undefined:** Treat as image-only deck
  (no video on any card). Backward compatibility with any deck that pre-dates
  this feature.

## Testing

### Unit tests (Vitest, match existing 107-test suite layout)

- `scripts/build-decks.mjs`:
  - Row with `video` column populated → emits `import` + `video: imageN_video`.
  - Row with blank `video` column → emits `video: null`.
  - Existing image-only behavior unchanged for legacy CSVs (no `video` column).
- Data integrity:
  - Every non-null `video` filename referenced from `src/data/*.js` resolves to
    an actual file in `src/assets/videos/`.
- Render logic (`flashcard-app.js`):
  - `setMedia()` on image-only card: `<video>.hidden = true`, badge hidden.
  - `setMedia()` on video card: `<video>.src` set, badge visible.
  - `stopCardVideo()` called from each of: `next`, `flip`, `setBox`,
    `switchDeck`, `resetDeck`, `applyConfiguration`. Verified via method spy.
  - Keyboard `V` triggers `playCardVideo()`.

### Manual test checklist (added to README)

- [ ] Card with video shows ▶ badge.
- [ ] Card without video does not show badge.
- [ ] Click image on video card → video plays muted, loops.
- [ ] Press `V` on video card → same.
- [ ] Press `V` on image-only card → nothing happens.
- [ ] Flip / Next / Know / Missed → video stops and resets.
- [ ] Switching decks → video stops.
- [ ] Reset deck → video stops.
- [ ] Apply card-selection config → video stops.
- [ ] Offline (after one full visit): video plays without network.
- [ ] Offline + uncached video URL: image stays, toast appears, no crash.
- [ ] Lighthouse PWA score unchanged.

## File-by-file change summary

| File | Change |
|---|---|
| [decks/special tests exam 1.csv](../../../decks/special%20tests%20exam%201.csv) | Add `video` column header; fill 3 starter rows |
| `src/assets/videos/` | **New directory.** Move/rename 3 MP4s from `tmp/` |
| [scripts/build-decks.mjs](../../../scripts/build-decks.mjs) | Read `video` column; emit imports + `video: …` field |
| `src/data/*.js` | Auto-regenerated — each card gains `video` field |
| [src/pages/index.astro](../../../src/pages/index.astro) | Build + pass `optimizedVideoPathsByDeck` |
| [src/components/Flashcard.astro](../../../src/components/Flashcard.astro) | Add `<video>` + ▶ badge inside `#front-wrapper` |
| [src/scripts/flashcard-app.js](../../../src/scripts/flashcard-app.js) | `setMedia`, `playCardVideo`, `stopCardVideo`; wire stops to nav; `V` key; background prefetch |
| [src/styles.css](../../../src/styles.css) | `.video-badge` styles; `<video>` sized 400×400 |
| [astro.config.mjs](../../../astro.config.mjs) | Add runtime cache rule for `.mp4` |
| [README.md](../../../README.md) | Document `video` column + export settings + test checklist |

## Open question for implementation

- Which card does `tmp/Anterior Drawer.mp4` belong to — the Foot/Ankle
  `Anterior Drawer ankle.jpg` row or the Knee `Anterior Drawer knee.jpg` row?
  Resolve before moving the file.
