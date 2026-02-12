# Automated Deck Loading System

## Overview

The build pipeline automatically converts CSV files into deck modules grouped by the `deck` column. A single CSV can produce multiple decks — no manual configuration needed.

## How It Works

### 1. CSV to JavaScript Conversion
- **Script**: `scripts/build-decks.mjs`
- **Input**: CSV files in `decks/` directory
- **Output**: One JavaScript module per unique `deck` value in `src/data/`
- **Process**: Reads all CSVs, groups rows by `deck` column, generates JS modules with image imports

### 2. Automatic Import Generation
- **Script**: `scripts/update-deck-imports.mjs`
- **Process**:
  - Scans `src/data/` for generated JS files
  - Reads actual export names from each file
  - Updates `src/pages/index.astro` with correct imports and deck config
  - Generates display names from filenames (e.g. `foot-ankle` -> `Foot/Ankle`)

### 3. Build Pipeline
```bash
npm run build
```
Runs in order:
1. `build-decks.mjs` — CSV -> JS modules (grouped by deck column)
2. `update-deck-imports.mjs` — Updates index.astro imports
3. `astro build` — Builds static site

## Adding New Decks

### Option A: Add rows to existing CSV
Add rows with a new `deck` value:
```csv
image,answer,alt,deck
new-image.png,New Test/New Condition,New Test,Neurology
```
The new "Neurology" deck appears automatically in the dropdown.

### Option B: Add a new CSV file
Add a new `.csv` file to `decks/` with the standard columns. All CSVs are merged and grouped by `deck` column.

### Then build:
```bash
npm run build
```

## Naming Conventions

### Deck column -> Generated files
| Deck value | Filename | Export name | Display name |
|------------|----------|-------------|--------------|
| `Foot/Ankle` | `foot-ankle.js` | `Foot_Ankle` | `Foot/Ankle` |
| `Knee` | `knee.js` | `Knee` | `Knee` |
| `Hip` | `hip.js` | `Hip` | `Hip` |
| `Shoulder` | `shoulder.js` | `Shoulder` | `Shoulder` |

## Error Handling

- **No CSVs found**: Build fails with clear error
- **Missing image/answer fields**: Row skipped with warning
- **No valid deck data**: Build fails
- **Old generated files**: Automatically cleaned before regeneration

## Test Coverage

- `tests/automated-deck-loading.test.js` — 14 tests (file filtering, name conversion, deck creation)
- `tests/astro-integration.test.js` — 7 tests (build simulation, import handling)
- `tests/data-integrity.test.js` — 10 tests (CSV structure, image references, orphan detection)

**Total**: 107 tests across 7 test files
