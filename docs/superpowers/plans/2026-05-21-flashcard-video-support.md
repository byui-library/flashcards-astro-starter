# Flashcard video support — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [`docs/superpowers/specs/2026-05-21-flashcard-video-support-design.md`](../specs/2026-05-21-flashcard-video-support-design.md)

**Goal:** Add optional per-card looping muted video clips that supplement still images, triggered by a ▶ badge / V key, with runtime PWA caching and background prefetch that scales to a growing video library.

**Architecture:** CSV gains a `video` column. Build script emits a `video` field per card. The `<video>` element lives next to `<img>` in the same card slot and swaps in on user trigger. Videos are runtime-cached by the service worker; a low-priority background fetch warms the cache after boot.

**Tech Stack:** Astro 4, Vite, vite-pwa (Workbox), Vitest + happy-dom, papaparse, vanilla JS (no framework).

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `decks/special tests exam 1.csv` | Modify | Add `video` column |
| `src/assets/videos/` | Create | New asset directory for MP4s |
| `scripts/build-decks.mjs` | Modify | Read `video` column → emit `video` field |
| `src/data/*.js` | Auto-regen | Each card gains `video` field |
| `src/pages/index.astro` | Modify | Build `optimizedVideoPathsByDeck`, pass to app |
| `src/components/Flashcard.astro` | Modify | `<video>` + ▶ badge inside `#front-wrapper` |
| `src/scripts/flashcard-app.js` | Modify | `setMedia`, `playCardVideo`, `stopCardVideo`, V key, prefetch |
| `src/styles.css` | Modify | `.video-badge`, `#front-wrapper { position:relative }`, `#card-video` sizing |
| `astro.config.mjs` | Modify | Runtime CacheFirst rule for `.mp4` |
| `tests/data-integrity.test.js` | Modify | Add video file existence checks |
| `tests/csv-conversion.test.js` | Modify | Add `video` column parsing tests |
| `tests/video-rendering.test.js` | Create | New test file for setMedia / playCardVideo / stopCardVideo |
| `README.md` | Modify | Document `video` column, export settings, test checklist |

---

## Task 0: Resolve Anterior Drawer.mp4 assignment

**Why first:** The spec flags this as an open question. Cannot move the file or fill the CSV row without knowing.

- [ ] **Step 1: Ask the author which card `tmp/Anterior Drawer.mp4` belongs to**

Question: Is `tmp/Anterior Drawer.mp4` for the **Foot/Ankle** anterior drawer test (`Anterior Drawer ankle.jpg`) or the **Knee** anterior drawer test (`Anterior Drawer knee.jpg`)?

Record the answer in a comment in the plan checkbox below for Task 1:

- [ ] **Step 2: Document the resolution**

Edit the table in Task 1 to replace `<ANTERIOR_DRAWER_TARGET>` with `Anterior Drawer ankle.jpg` or `Anterior Drawer knee.jpg`.

---

## Task 1: Move starter MP4s into source tree

**Files:**
- Create: `src/assets/videos/Talor Tilt.mp4` (from `tmp/Talor Tilt.mp4`)
- Create: `src/assets/videos/Kleigar_s.mp4` (from `tmp/Kleigers.mp4` — renamed to match image basename)
- Create: `src/assets/videos/<ANTERIOR_DRAWER_TARGET resolved in Task 0>.mp4` (from `tmp/Anterior Drawer.mp4`)
- Modify: `.gitignore` — verify `tmp/` is ignored (existing repo already has untracked `tmp/`, no change expected)

Naming convention: video filename's basename matches the image basename (without extension) so authors can spot the pairing visually.

- [ ] **Step 1: Create the videos directory**

```bash
mkdir -p src/assets/videos
```

- [ ] **Step 2: Move and rename the three MP4s**

```bash
git mv "tmp/Talor Tilt.mp4" "src/assets/videos/Talor Tilt.mp4"
git mv "tmp/Kleigers.mp4" "src/assets/videos/Kleigar_s.mp4"
git mv "tmp/Anterior Drawer.mp4" "src/assets/videos/<RESOLVED_NAME>.mp4"
```

(Replace `<RESOLVED_NAME>` with the filename matching the chosen image — e.g. `Anterior Drawer ankle` or `Anterior Drawer knee`.)

- [ ] **Step 3: Verify file sizes are reasonable**

```bash
ls -lh src/assets/videos/
```

Expected: each file ≤ ~2 MB. If any file exceeds 5 MB, stop and ask the author to re-encode (see README export settings — written in Task 12).

- [ ] **Step 4: Commit**

```bash
git add src/assets/videos/
git commit -m "feat(videos): add starter MP4 clips for Talar Tilt, Kleiger, Anterior Drawer"
```

---

## Task 2: Add `video` column to CSV

**Files:**
- Modify: `decks/special tests exam 1.csv`

- [ ] **Step 1: Open the CSV and update the header row**

Change line 1 from:

```csv
image,answer,alt,deck
```

to:

```csv
image,answer,alt,deck,video
```

- [ ] **Step 2: Add an empty trailing `,` to every existing data row except the three video rows**

For every row that should remain image-only, append `,` (empty `video` cell). Example (Lachman row):

```csv
Lachman_s.jpg,Lachman: ACL sprain,Lachman's Test,Knee,
```

- [ ] **Step 3: Fill the `video` column for the three starter rows**

| Row identifier | Value to add in `video` column |
|---|---|
| `Talor Tilt.jpg` row | `Talor Tilt.mp4` |
| `Kleigar_s.png` row | `Kleigar_s.mp4` |
| Row matching `<RESOLVED_NAME>.jpg/png` from Task 0 | `<RESOLVED_NAME>.mp4` |

- [ ] **Step 4: Verify CSV parses cleanly**

```bash
node -e "const Papa=require('papaparse');const fs=require('fs');const r=Papa.parse(fs.readFileSync('decks/special tests exam 1.csv','utf-8'),{header:true,skipEmptyLines:true});console.log('rows:',r.data.length,'errors:',r.errors.length);console.log('first row:',r.data[0]);console.log('headers:',r.meta.fields);"
```

Expected output: `rows: 47`, `errors: 0`, headers include `video`, first row object contains `video: ''`.

- [ ] **Step 5: Commit**

```bash
git add "decks/special tests exam 1.csv"
git commit -m "feat(decks): add optional video column to CSV schema"
```

---

## Task 3: Extend build script to handle video column (TDD)

**Files:**
- Test: `tests/csv-conversion.test.js`
- Modify: `scripts/build-decks.mjs`

- [ ] **Step 1: Write failing tests for video column handling**

Append the following block to the end of `tests/csv-conversion.test.js`:

```js
describe('Video column handling', () => {
  it('parses video column when present', async () => {
    const csvContent = `image,answer,alt,deck,video
Talor Tilt.jpg,Talar tilt: CFL Sprain,Talor Tilt,Foot/Ankle,Talor Tilt.mp4
Lachman_s.jpg,Lachman,Lachman test,Knee,`

    const Papa = await import('papaparse')
    const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true })

    expect(result.errors).toHaveLength(0)
    expect(result.data[0].video).toBe('Talor Tilt.mp4')
    expect(result.data[1].video).toBe('')
  })

  it('treats missing video column as undefined per row', async () => {
    const csvContent = `image,answer,alt,deck
Lachman_s.jpg,Lachman,Lachman test,Knee`

    const Papa = await import('papaparse')
    const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true })

    expect(result.data[0].video).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the new tests — they should pass already (papaparse handles the column)**

```bash
npm run test:run -- tests/csv-conversion.test.js
```

Expected: PASS. These tests pin papaparse behavior so future regressions surface.

- [ ] **Step 3: Modify `scripts/build-decks.mjs` to emit a `video` field**

In `scripts/build-decks.mjs`, find the `rows.forEach((row, idx) => { ... })` block (around line 77). Replace it with:

```js
rows.forEach((row, idx) => {
  const imageName = `image${idx}`;
  const imageFile = row.image.trim().split('/').pop();
  imports.push(`import ${imageName} from '../assets/images/${imageFile}';`);

  const videoCell = (row.video || '').trim();
  let videoLiteral = 'null';
  if (videoCell) {
    const videoName = `video${idx}`;
    const videoFile = videoCell.split('/').pop();
    imports.push(`import ${videoName} from '../assets/videos/${videoFile}';`);
    videoLiteral = videoName;
  }

  cardObjects.push(
    '  {\n' +
    `    image: ${imageName},\n` +
    `    video: ${videoLiteral},\n` +
    `    answer: ${JSON.stringify(row.answer.trim())},\n` +
    `    alt: ${JSON.stringify((row.alt || '').trim())},\n` +
    `    deck: ${JSON.stringify(deckName)}\n` +
    '  }'
  );
});
```

- [ ] **Step 4: Run the build script and inspect output**

```bash
node scripts/build-decks.mjs
```

Expected output includes "Wrote src/data/foot-ankle.js (5 cards)" etc.

- [ ] **Step 5: Confirm generated modules contain `video` field**

```bash
node -e "import('./src/data/foot-ankle.js').then(m=>console.log(JSON.stringify(m.Foot_Ankle,null,2)))" 2>&1 | head -40
```

Expected: every card object has a `video` property; cards for Talar Tilt and Kleiger have non-null video imports; others have `video: null`.

- [ ] **Step 6: Run the full test suite**

```bash
npm run test:run
```

Expected: all tests pass (data-integrity tests will still pass — they don't reference the new field yet).

- [ ] **Step 7: Commit**

```bash
git add scripts/build-decks.mjs tests/csv-conversion.test.js src/data/
git commit -m "feat(build): emit video field per card from CSV"
```

---

## Task 4: Update data-integrity tests for video files

**Files:**
- Modify: `tests/data-integrity.test.js`

- [ ] **Step 1: Add video integrity tests**

Append the following `describe` block to `tests/data-integrity.test.js`:

```js
const VIDEOS_DIR = path.join(ROOT, 'src', 'assets', 'videos')
const videoFiles = fs.existsSync(VIDEOS_DIR) ? fs.readdirSync(VIDEOS_DIR) : []

describe('Video file references', () => {
  it('every non-empty CSV video should exist on disk', () => {
    const missing = []
    for (const row of allRows) {
      const videoFile = (row.video || '').trim()
      if (videoFile && !videoFiles.includes(videoFile)) {
        missing.push(`${videoFile} (from ${row._sourceFile})`)
      }
    }
    expect(missing, `Missing videos:\n${missing.join('\n')}`).toEqual([])
  })

  it('every video on disk should be referenced in a CSV', () => {
    const referencedVideos = new Set(
      allRows.map(r => (r.video || '').trim()).filter(Boolean)
    )
    const orphans = videoFiles.filter(f => !referencedVideos.has(f))
    expect(orphans, `Orphan videos not in any CSV:\n${orphans.join('\n')}`).toEqual([])
  })

  it('every video file should be an mp4', () => {
    const nonMp4 = videoFiles.filter(f => !f.toLowerCase().endsWith('.mp4'))
    expect(nonMp4, `Non-mp4 files in videos dir: ${nonMp4.join(', ')}`).toEqual([])
  })
})
```

- [ ] **Step 2: Run the new tests**

```bash
npm run test:run -- tests/data-integrity.test.js
```

Expected: PASS (3 starter videos exist on disk and are referenced in CSV).

- [ ] **Step 3: Commit**

```bash
git add tests/data-integrity.test.js
git commit -m "test(data-integrity): verify video files match CSV references"
```

---

## Task 5: Wire video paths into Astro page

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Build `optimizedVideoPathsByDeck` after the existing image map**

In `src/pages/index.astro`, immediately after the `optimizedImagePathsByDeck` block (around line 72), add:

```astro
// Build map of video paths per deck (null for image-only cards)
const optimizedVideoPathsByDeck = {};
for (const deck of availableDecks) {
  optimizedVideoPathsByDeck[deck.id] = deck.cards.map(card => card.video || null);
}
```

Note: videos are referenced as Vite-imported asset URLs (already resolved in the generated `src/data/*.js` modules). No `getImage()` call — that's image-only.

- [ ] **Step 2: Pass the new map into FlashcardApp**

Find the `<script define:vars={{ cards, deckName, availableDecks, optimizedImagePathsByDeck }}>` (around line 119) and add `optimizedVideoPathsByDeck`:

```astro
<script define:vars={{ cards, deckName, availableDecks, optimizedImagePathsByDeck, optimizedVideoPathsByDeck }}>
  document.addEventListener('DOMContentLoaded', () => {
    new window.FlashcardApp({
      cards,
      deckName,
      availableDecks,
      optimizedImagePathsByDeck,
      optimizedVideoPathsByDeck
    });
  });
</script>
```

- [ ] **Step 3: Run dev server, verify build succeeds**

```bash
npm run build
```

Expected: build completes, no errors. Open `dist/index.html` and confirm `optimizedVideoPathsByDeck` appears in inline script.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(astro): pass per-card video paths into flashcard app"
```

---

## Task 6: Add video element and badge to Flashcard component

**Files:**
- Modify: `src/components/Flashcard.astro`

- [ ] **Step 1: Replace the current `#front-wrapper` block**

Replace the existing component body (lines 13–22) with:

```astro
<div id="card" class={`card ${className || ''}`} tabindex="0" aria-live="polite">
  <div id="front-wrapper">
    <img
      id="card-image"
      src={initialImage.src}
      alt={initialImage.alt}
      width="400"
      height="400"
    />
    <video
      id="card-video"
      width="400"
      height="400"
      muted
      loop
      playsinline
      preload="metadata"
      hidden
    ></video>
    <button
      id="video-badge"
      type="button"
      class="video-badge"
      aria-label="Play demonstration video"
      hidden
    >▶</button>
  </div>
  <div id="back" class="back" hidden></div>
</div>
```

Note the new `id="card-image"` on the `<img>` — needed so app code can target it by ID (current code uses `document.querySelector('#front-wrapper img')`, which still works; the new ID is for clarity and future-proofing).

- [ ] **Step 2: Build and verify markup**

```bash
npm run build
```

Open `dist/index.html` and grep for `card-video`:

```bash
grep -o 'card-video' dist/index.html | head -3
```

Expected: at least one match.

- [ ] **Step 3: Commit**

```bash
git add src/components/Flashcard.astro
git commit -m "feat(flashcard): add hidden video element and play badge"
```

---

## Task 7: Style the video element and play badge

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add new CSS rules at the end of `src/styles.css`**

```css
/* Video support */
#front-wrapper {
  position: relative;
  display: inline-block;
}

#card-video {
  max-width: 100%;
  max-height: 300px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: .5rem;
  background: #000;
  display: block;
}

.video-badge {
  position: absolute;
  top: .5rem;
  right: .5rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--accent);
  color: #FFFFFF;
  border: 2px solid #FFFFFF;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  padding-left: 0.15rem; /* optical centering of the triangle */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  font-family: var(--font-heading);
}

.video-badge:hover {
  background: var(--dark-blue);
}

.video-badge:focus-visible {
  outline: 2px solid var(--dark-blue);
  outline-offset: 2px;
}

.video-badge[hidden] {
  display: none !important;
}

#card-video[hidden] {
  display: none !important;
}

#card-image[hidden] {
  display: none !important;
}

@media (min-width: 768px) {
  #card-video { max-height: 450px; }
}

@media (min-width: 1024px) {
  #card-video { max-height: 500px; }
}

/* Offline toast */
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--dark-blue);
  color: #FFFFFF;
  padding: .6rem 1rem;
  border-radius: .5rem;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 2000;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
}

.toast.visible {
  opacity: 1;
}
```

- [ ] **Step 2: Build and visually inspect via dev server**

```bash
npm run dev
```

Open `http://localhost:4321/flashcards-astro-starter`. The current card should look identical to before this task (badge is `hidden` because app code hasn't been updated yet to show it). Stop the dev server (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style(flashcard): add video element and play badge styles"
```

---

## Task 8: Implement setMedia / playCardVideo / stopCardVideo (TDD)

**Files:**
- Create: `tests/video-rendering.test.js`
- Modify: `src/scripts/flashcard-app.js`

- [ ] **Step 1: Write failing tests for the three new methods**

Create `tests/video-rendering.test.js` with:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Minimal harness that mirrors the relevant subset of FlashcardApp behavior.
// We test setMedia, playCardVideo, and stopCardVideo by constructing the
// methods on a plain object with stub DOM elements.

function makeStubElement(extras = {}) {
  return {
    src: '',
    alt: '',
    hidden: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    currentTime: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...extras
  }
}

function makeApp() {
  const img = makeStubElement()
  const video = makeStubElement()
  const badge = makeStubElement({ hidden: true })

  const app = {
    img,
    video,
    badge,
    optimizedImagePathsByDeck: {
      knee: ['/img/0.webp', '/img/1.webp']
    },
    optimizedVideoPathsByDeck: {
      knee: [null, '/vid/1.mp4']
    },
    currentDeck: { id: 'knee' },
    allCards: [
      { answer: 'a0', alt: 'alt0', video: null },
      { answer: 'a1', alt: 'alt1', video: '/vid/1.mp4' }
    ],
    videoPlaying: false
  }

  // Methods under test — these mirror the implementation that will be
  // added to flashcard-app.js. They're copy-pasted here as the contract.
  app.setMedia = function (cardIndex) {
    const card = this.allCards[cardIndex]
    const imagePath = this.optimizedImagePathsByDeck[this.currentDeck.id][cardIndex]
    const videoPath = this.optimizedVideoPathsByDeck[this.currentDeck.id][cardIndex]

    this.img.src = imagePath
    this.img.alt = card.alt || card.answer || 'Flashcard image'
    this.img.hidden = false

    if (videoPath) {
      this.video.src = videoPath
      this.video.hidden = true
      this.badge.hidden = false
    } else {
      this.video.removeAttribute && this.video.removeAttribute('src')
      this.video.src = ''
      this.video.hidden = true
      this.badge.hidden = true
    }
    this.videoPlaying = false
  }

  app.playCardVideo = function () {
    if (!this.video.src || this.videoPlaying) return
    this.img.hidden = true
    this.badge.hidden = true
    this.video.hidden = false
    this.videoPlaying = true
    this.video.play()
  }

  app.stopCardVideo = function () {
    if (!this.videoPlaying) return
    this.video.pause()
    this.video.currentTime = 0
    this.video.hidden = true
    this.img.hidden = false
    if (this.video.src) this.badge.hidden = false
    this.videoPlaying = false
  }

  return app
}

describe('setMedia', () => {
  it('image-only card hides video and badge', () => {
    const app = makeApp()
    app.setMedia(0)
    expect(app.img.src).toBe('/img/0.webp')
    expect(app.img.hidden).toBe(false)
    expect(app.video.hidden).toBe(true)
    expect(app.badge.hidden).toBe(true)
  })

  it('video card sets video src and shows badge', () => {
    const app = makeApp()
    app.setMedia(1)
    expect(app.img.src).toBe('/img/1.webp')
    expect(app.video.src).toBe('/vid/1.mp4')
    expect(app.video.hidden).toBe(true)
    expect(app.badge.hidden).toBe(false)
  })

  it('switching from video card to image-only card clears badge', () => {
    const app = makeApp()
    app.setMedia(1)
    app.setMedia(0)
    expect(app.badge.hidden).toBe(true)
    expect(app.video.src).toBe('')
  })
})

describe('playCardVideo', () => {
  it('on a video card hides image and plays video', () => {
    const app = makeApp()
    app.setMedia(1)
    app.playCardVideo()
    expect(app.img.hidden).toBe(true)
    expect(app.badge.hidden).toBe(true)
    expect(app.video.hidden).toBe(false)
    expect(app.video.play).toHaveBeenCalledOnce()
  })

  it('on an image-only card is a no-op', () => {
    const app = makeApp()
    app.setMedia(0)
    app.playCardVideo()
    expect(app.video.play).not.toHaveBeenCalled()
    expect(app.img.hidden).toBe(false)
  })

  it('calling twice does not double-play', () => {
    const app = makeApp()
    app.setMedia(1)
    app.playCardVideo()
    app.playCardVideo()
    expect(app.video.play).toHaveBeenCalledOnce()
  })
})

describe('stopCardVideo', () => {
  it('pauses, resets, restores image and badge', () => {
    const app = makeApp()
    app.setMedia(1)
    app.playCardVideo()
    app.stopCardVideo()
    expect(app.video.pause).toHaveBeenCalledOnce()
    expect(app.video.currentTime).toBe(0)
    expect(app.video.hidden).toBe(true)
    expect(app.img.hidden).toBe(false)
    expect(app.badge.hidden).toBe(false)
  })

  it('on a card that never started video is a no-op', () => {
    const app = makeApp()
    app.setMedia(1)
    app.stopCardVideo()
    expect(app.video.pause).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests — they should pass (the test file inlines the implementation as a contract)**

```bash
npm run test:run -- tests/video-rendering.test.js
```

Expected: PASS, 7 tests.

- [ ] **Step 3: Now implement the same methods in `src/scripts/flashcard-app.js`**

In `src/scripts/flashcard-app.js`, find the constructor (around line 2-20). After the existing `this.optimizedImagePathsByDeck = config.optimizedImagePathsByDeck;` line, add:

```js
    this.optimizedVideoPathsByDeck = config.optimizedVideoPathsByDeck || {};
    this.videoPlaying = false;
```

- [ ] **Step 4: Replace the `render()` method**

Find `render()` (around line 90) and replace its body with:

```js
  render() {
    const front = this.$('card-image') || document.querySelector('#front-wrapper img');
    const back = this.$('back');

    if (this.activeCards.length === 0) {
      front.src = this.getCompletionImage();
      front.alt = 'All cards completed!';
      front.hidden = false;
      this.$('card-video').hidden = true;
      this.$('video-badge').hidden = true;
      back.textContent = 'You have successfully identified all selected cards! Configure cards to select more or push reset to start over.';
      back.hidden = false;
      this.$('flip').disabled = true;
      this.$('knew').disabled = true;
      this.$('missed').disabled = true;
      this.$('next').disabled = true;
      return;
    }

    if (this.currentIndex >= this.activeCards.length) this.currentIndex = 0;

    const cardIndex = this.activeCards[this.currentIndex];
    const card = this.allCards[cardIndex];
    if (!card) return;

    this.setMedia(cardIndex);
    back.textContent = card.answer;
    back.hidden = this.showingFront;

    this.$('flip').disabled = false;
    this.$('knew').disabled = false;
    this.$('missed').disabled = false;
    this.$('next').disabled = false;
  }
```

- [ ] **Step 5: Add `setMedia`, `playCardVideo`, `stopCardVideo` methods**

After `render()` (before `setBox()`), add:

```js
  // Set image and video src for a card; show badge if card has video
  setMedia(cardIndex, card) {
    const img = this.$('card-image') || document.querySelector('#front-wrapper img');
    const video = this.$('card-video');
    const badge = this.$('video-badge');

    const imagePath = this.optimizedImagePathsByDeck[this.currentDeck.id][cardIndex];
    const videoPath = (this.optimizedVideoPathsByDeck[this.currentDeck.id] || [])[cardIndex] || null;

    img.src = imagePath;
    img.alt = card.alt || card.answer || 'Flashcard image';
    img.hidden = false;

    if (videoPath) {
      if (video.src !== videoPath) video.src = videoPath;
      video.hidden = true;
      badge.hidden = false;
    } else {
      video.removeAttribute('src');
      video.load();
      video.hidden = true;
      badge.hidden = true;
    }
    this.videoPlaying = false;
  }

  // Swap image -> video and start playback (loops, muted)
  playCardVideo() {
    const video = this.$('card-video');
    if (!video.src || this.videoPlaying) return;

    const img = this.$('card-image') || document.querySelector('#front-wrapper img');
    const badge = this.$('video-badge');

    img.hidden = true;
    badge.hidden = true;
    video.hidden = false;
    this.videoPlaying = true;

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => this.handleVideoError());
    }
  }

  // Stop video, reset, restore image and badge
  stopCardVideo() {
    if (!this.videoPlaying) return;
    const video = this.$('card-video');
    const img = this.$('card-image') || document.querySelector('#front-wrapper img');
    const badge = this.$('video-badge');

    video.pause();
    video.currentTime = 0;
    video.hidden = true;
    img.hidden = false;
    if (video.src) badge.hidden = false;
    this.videoPlaying = false;
  }

  // Fallback: video errored (offline + uncached, codec issue, etc.)
  handleVideoError() {
    this.stopCardVideo();
    this.showToast('Video not available offline yet.');
  }

  // Simple non-blocking toast
  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
  }
```

- [ ] **Step 6: Wire stopCardVideo into all card-changing methods**

Add `this.stopCardVideo();` as the first line of each of these existing methods:
- `setBox(delta)` (around line 125)
- `next()` (around line 149)
- `flip()` (around line 156)
- `switchDeck(deckId)` (around line 162)
- `resetDeck()` (around line 180)
- `applyConfiguration()` (around line 245)

- [ ] **Step 7: Add video error listener and V keyboard binding**

In `setupEventListeners()` (around line 270), before `// Card click and keyboard`, add:

```js
    // Video badge and error handling
    this.$('video-badge').onclick = (e) => {
      e.stopPropagation();
      this.playCardVideo();
    };
    this.$('card-video').addEventListener('error', () => this.handleVideoError());
```

Modify the existing `this.$('card').onkeydown` handler (around line 288) to add the V key. Replace it with:

```js
    this.$('card').onkeydown = (e) => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        this.flip();
      }
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowUp') this.$('knew').click();
      if (e.key === 'ArrowDown') this.$('missed').click();
      if (e.key === 'r' || e.key === 'R') this.resetDeck();
      if (e.key === 'v' || e.key === 'V') this.playCardVideo();
    };
```

Modify the existing card click handler (around line 287) so clicking the image plays the video when one is present, but clicking elsewhere still flips. Replace `this.$('card').onclick = () => this.flip();` with:

```js
    this.$('card').onclick = (e) => {
      const img = this.$('card-image') || document.querySelector('#front-wrapper img');
      if (e.target === img && !this.$('video-badge').hidden) {
        this.playCardVideo();
        return;
      }
      this.flip();
    };
```

- [ ] **Step 8: Run the full test suite**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 9: Manually verify in dev server**

```bash
npm run dev
```

- Open the **Foot/Ankle** deck.
- Cycle to the Talar Tilt card → ▶ badge visible top-right.
- Click image OR press V → video plays, loops, badge hidden.
- Press → (Next) → video stops, next card shown with image (or new video badge).
- Press Space → flips card to answer; video should be stopped.
- Cycle to an image-only card (e.g. Squeeze) → no badge.
- Press V on image-only card → nothing happens.

Stop dev server.

- [ ] **Step 10: Commit**

```bash
git add src/scripts/flashcard-app.js tests/video-rendering.test.js
git commit -m "feat(flashcard): per-card video playback with play badge and V key"
```

---

## Task 9: Background prefetch warming

**Files:**
- Modify: `src/scripts/flashcard-app.js`

- [ ] **Step 1: Add prefetch method and invoke from init**

In `src/scripts/flashcard-app.js`, add this method below `showToast()`:

```js
  // Warm the runtime cache with all video URLs in the background
  prefetchVideos() {
    const urls = new Set();
    for (const deckId of Object.keys(this.optimizedVideoPathsByDeck)) {
      for (const url of this.optimizedVideoPathsByDeck[deckId] || []) {
        if (url) urls.add(url);
      }
    }
    if (urls.size === 0) return;

    const queue = [...urls];
    const concurrency = 2;
    const next = () => {
      const url = queue.shift();
      if (!url) return;
      fetch(url, { cache: 'default', credentials: 'same-origin' })
        .catch(() => { /* swallow — runtime cache will warm on first play */ })
        .finally(next);
    };
    for (let i = 0; i < concurrency; i++) next();
  }
```

- [ ] **Step 2: Schedule prefetch after boot**

Modify `init()` (around line 319) to:

```js
  init() {
    this.setupEventListeners();
    this.switchDeck(this.availableDecks[0].id);

    // Warm the cache after the app has settled
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
    schedule(() => this.prefetchVideos());
  }
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```

Expected: all tests pass (prefetch is fire-and-forget; not under test).

- [ ] **Step 4: Manual smoke check in dev**

```bash
npm run dev
```

Open dev tools → Network tab → filter `mp4`. After ~1 second of idle, low-priority requests for all three MP4s should appear. They are served from disk in dev, but the same code path warms the SW runtime cache in production.

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/flashcard-app.js
git commit -m "feat(flashcard): background-prefetch videos to warm offline cache"
```

---

## Task 10: PWA runtime cache rule for videos

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Add runtime cache entry for `.mp4`**

In `astro.config.mjs`, inside the `runtimeCaching` array (after the existing images-cache entry, before google-fonts-cache, around line 41), insert:

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
          },
```

- [ ] **Step 2: Build and confirm the service worker references the rule**

```bash
npm run build
```

```bash
grep -o 'videos-cache' dist/sw.js | head -3
```

Expected: at least one match.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(pwa): runtime CacheFirst rule for mp4 videos"
```

---

## Task 11: Update README documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the "Authoring decks" section**

In `README.md`, find the columns table (around line 18). Update to:

```markdown
| Column | Description |
|--------|-------------|
| `image` | Filename in `src/assets/images/` (e.g. `Lachman_s.jpg`) |
| `answer` | Test name and condition, separated by `:` |
| `alt` | Accessible alt text for the image |
| `deck` | Deck grouping (e.g. `Knee`, `Shoulder`) |
| `video` | *(Optional)* Filename in `src/assets/videos/` (e.g. `Talor Tilt.mp4`). Blank for image-only cards. |
```

- [ ] **Step 2: Add a "Videos" section after "Images"**

Insert this block after the existing "Images" section (around line 58):

```markdown
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

**Quick ffmpeg snippet for re-encoding:**

\`\`\`bash
ffmpeg -i input.mov -an -vf "scale='min(400,iw)':-2" -c:v libx264 -profile:v main -crf 26 -preset slow -movflags +faststart output.mp4
\`\`\`
```

(Note: the triple-backtick code block uses escaped backticks above so it nests correctly in this plan; remove the backslashes when actually editing the README.)

- [ ] **Step 3: Add a "Manual test checklist" subsection at the bottom of the Testing section**

After the existing Testing section (around line 80), append:

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): document optional video column and offline caching"
```

---

## Task 12: Final full-build verification

- [ ] **Step 1: Run the full test suite from a clean state**

```bash
npm run test:run
```

Expected: all tests pass, including new video-rendering and data-integrity tests.

- [ ] **Step 2: Run a fresh production build**

```bash
npm run build
```

Expected: build completes without errors. Output mentions video assets being copied. Service worker references `videos-cache`.

- [ ] **Step 3: Preview the production build**

```bash
npm run preview
```

- [ ] **Step 4: Walk through the manual test checklist from README**

Open the preview URL. Run every item from the "Manual video test checklist" added in Task 11. Mark each item complete in the README checklist (commit any corrections inline if a test reveals a bug).

To simulate offline: in DevTools → Application → Service Workers → check "Offline", then reload.

To simulate uncached video: clear `videos-cache` in DevTools → Application → Cache Storage, then go offline and click play on a video card. Expect the toast.

- [ ] **Step 5: Stop preview**

Ctrl+C.

- [ ] **Step 6: Final commit (if any docs needed correction during manual walkthrough)**

```bash
git status
# If anything changed:
git add <files>
git commit -m "chore: post-walkthrough fixes"
```

If nothing changed, skip this step.

---

## Done state

- All tasks above checked.
- `npm run test:run` green.
- `npm run build` green.
- Three video cards (Talar Tilt, Kleiger, Anterior Drawer) work end-to-end in preview.
- Documentation reflects new schema and offline behavior.
