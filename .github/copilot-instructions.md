# AI Coding Agent Instructions for Flashcards PWA

## Project Overview
An **offline-first PWA flashcard app** built with Astro + Vite. Authors create decks in CSV, which are automatically converted to JavaScript modules with optimized images at build time. Features Leitner-style spaced repetition tracked in localStorage.

## Architecture & Data Flow

### Build Pipeline (Critical)
The build process has **three sequential phases**:
1. `build-decks.mjs` → Converts CSV files in `decks/` to JS modules in `src/data/`
2. `update-deck-imports.mjs` → Auto-generates imports and configs in `src/pages/index.astro`
3. `astro build` → Builds static site with optimized images

**Never manually edit** auto-generated sections in [src/pages/index.astro](src/pages/index.astro) or [src/data/](src/data/) files - they have `// AUTO-GENERATED` comments.

### Deck Loading System
- **Source**: CSV files in `decks/` with columns: `image`, `answer`, `alt`, `deck`
- **Naming**: Use kebab-case (e.g., `anatomy-bones.csv`)
- **Images**: JS modules import from `src/assets/images/` (copied from CSV image paths)
- **Auto-discovery**: [scripts/update-deck-imports.mjs](scripts/update-deck-imports.mjs) scans `src/data/*.js` and generates:
  - Import statements: `import { anatomyBones } from '../data/anatomy-bones.js';`
  - Deck configs: `{ id: 'anatomy-bones', module: anatomyBones, name: 'Anatomy: Bones' }`

### Client-Side State Management
- **Storage key pattern**: `deck-progress-v1:<deck-name>` and `selected-cards-v1:<deck-id>`
- **Progress structure**: `{ [cardIndex]: box }` where box ∈ [1, 2, 3]
- **Leitner logic**: In [src/utils/flashcard-utils.js](src/utils/flashcard-utils.js), cards advance +1 box on "knew it", -1 on "missed it"
- **Active cards**: Filtered to exclude cards at box 3 (mastered)

### Component Architecture
- [src/pages/index.astro](src/pages/index.astro) - Main page, builds `availableDecks` array from generated configs
- [src/scripts/flashcard-app.js](src/scripts/flashcard-app.js) - Client-side `FlashcardApp` class manages state, rendering, deck switching
- Components in `src/components/` - Astro components (StatsDisplay, ControlButtons, DeckSelector, Flashcard, ConfigModal)
- [src/utils/flashcard-utils.js](src/utils/flashcard-utils.js) - Pure utility functions for testing

## Development Workflows

### Adding New Decks
1. Create CSV in `decks/` folder (kebab-case naming)
2. Place images in `public/images/` (referenced in CSV)
3. Run `npm run build` - auto-generates JS module and updates imports
4. **No manual edits needed** to index.astro

### Testing Strategy
- **Framework**: Vitest with jsdom environment
- **Config**: [vitest.config.js](vitest.config.js)
- **Setup**: [tests/setup.js](tests/setup.js) mocks localStorage
- **Test files**: `tests/*.test.js` cover:
  - `flashcard-utils.test.js` - Pure function logic
  - `automated-deck-loading.test.js` - Build script validation
  - `csv-conversion.test.js` - CSV parsing
  - `astro-integration.test.js` - Component integration
- **Run**: `npm test` (watch), `npm run test:run` (CI), `npm run test:coverage`

### Build Commands
```bash
npm run dev           # Dev server on :4321
npm run build         # Full build (CSV → JS → Astro)
npm run preview       # Preview production build
npm run deploy        # Build + test + git commit + push
```

### Deployment
- **Target**: GitHub Pages (configured in [astro.config.mjs](astro.config.mjs))
- **Base path**: `/flashcards-astro-starter`
- **Scripts**: [deploy.ps1](deploy.ps1) or [deploy.bat](deploy.bat) automate build → test → push
- **PWA**: Auto-updates via `@vite-pwa/astro`, caches `/decks/*` and `/images/*`

## Project-Specific Conventions

### File Naming & Structure
- Decks: `kebab-case.csv` in `decks/` → `kebab-case.js` in `src/data/`
- CamelCase conversion: `anatomy-bones` → `anatomyBones` (variable name)
- Display names: `anatomy-bones` → `Anatomy: Bones` (capitalize + colon split)

### Image Handling
- Source: `public/images/` (static assets)
- Build: Astro's `getImage()` optimizes to 400×400 WebP at build time
- Runtime: `optimizedImagePaths` array passed to client app
- PWA caches images for offline use

### State Persistence
- **Never use backend** - all state in localStorage
- **Versioned keys**: `deck-progress-v1:` prefix allows future migrations
- **Per-deck isolation**: Progress stored separately per deck name
- **Selected cards**: Subset of deck can be selected for focused practice

### Code Style
- **Auto-generated markers**: Check for `// THIS FILE IS AUTO-GENERATED` comments
- **Astro components**: Use TypeScript interfaces via `export interface Props`
- **Utilities**: Extract testable logic to [src/utils/flashcard-utils.js](src/utils/flashcard-utils.js)
- **Client JS**: Single `FlashcardApp` class in [src/scripts/flashcard-app.js](src/scripts/flashcard-app.js)

## Critical Patterns

### DO
- ✅ Run `npm run build` after adding/modifying CSV files
- ✅ Place images in `public/images/` before building (paths in CSV must match)
- ✅ Test utilities in isolation (see [tests/flashcard-utils.test.js](tests/flashcard-utils.test.js))
- ✅ Use `deck-progress-v1:` prefix for new localStorage keys
- ✅ Check [AUTOMATED-DECK-LOADING.md](AUTOMATED-DECK-LOADING.md) for deck system details

### DON'T
- ❌ Edit `src/data/*.js` files manually (auto-generated by [scripts/build-decks.mjs](scripts/build-decks.mjs))
- ❌ Modify import/config blocks in [src/pages/index.astro](src/pages/index.astro) (auto-generated by [scripts/update-deck-imports.mjs](scripts/update-deck-imports.mjs))
- ❌ Add backend dependencies (designed as offline-first SPA)
- ❌ Use `&&` in PowerShell scripts (use `;` for command chaining)

## Key Files Reference
- [scripts/build-decks.mjs](scripts/build-decks.mjs) - CSV → JS conversion with Papa Parse
- [scripts/update-deck-imports.mjs](scripts/update-deck-imports.mjs) - Auto-generate imports in index.astro
- [src/scripts/flashcard-app.js](src/scripts/flashcard-app.js) - Main client application logic
- [src/utils/flashcard-utils.js](src/utils/flashcard-utils.js) - Testable utility functions
- [astro.config.mjs](astro.config.mjs) - PWA config, GitHub Pages base path
- [vitest.config.js](vitest.config.js) - Test environment with jsdom + localStorage mock
