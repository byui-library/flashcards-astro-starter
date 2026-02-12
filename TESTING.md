# Testing

This project uses **Vitest** for unit and integration testing.

## Quick Start

```bash
npm test              # watch mode (development)
npm run test:run      # single run (CI)
npm run test:coverage # coverage report
npm run test:ui       # visual test interface
```

## Test Files

| File | Tests | Purpose |
|------|-------|---------|
| `tests/flashcard-utils.test.js` | 33 | Core flashcard logic, Leitner algorithm, progress management |
| `tests/modal-functionality.test.js` | 18 | Deck switching, card configuration, modal interface |
| `tests/deck-selection-ui.test.js` | 15 | UI components, DOM interactions, keyboard events |
| `tests/automated-deck-loading.test.js` | 14 | File filtering, name conversion, deck creation |
| `tests/csv-conversion.test.js` | 10 | CSV parsing, data validation, error handling |
| `tests/data-integrity.test.js` | 10 | CSV-to-image validation, orphan detection, deck grouping |
| `tests/astro-integration.test.js` | 7 | Build simulation, dynamic imports, component props |

**Total: 107 tests**

## Coverage Areas

- **Progress Management** — localStorage persistence, cross-session integrity, corrupted data handling
- **Leitner Algorithm** — Box progression (+1 correct, -2 incorrect), boundary conditions (boxes 1-3)
- **Card Selection** — Individual select/deselect, select all, validation
- **Session Management** — Active card filtering, reset, completion detection
- **Data Processing** — CSV parsing with PapaParse, field validation
- **Data Integrity** — Every CSV image exists on disk, no orphan images, valid deck grouping

## Test Setup

### Mock Setup (`tests/setup.js`)
- **localStorage Mock**: Map-based storage simulation
- **fetch Mock**: For API call testing
- **DOM Mocks**: Basic DOM element simulation

### Configuration (`vitest.config.js`)
- **Environment**: jsdom
- **Globals**: Test functions available without imports
- **Coverage**: v8 provider with HTML/JSON reports

## Running Coverage

```bash
npm run test:coverage
```

Reports generated in `coverage/`:
- Terminal summary
- HTML interactive report (`coverage/index.html`)
- JSON machine-readable data
