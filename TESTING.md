# Flashcard Application Testing

This project uses **Vitest** for unit testing, providing fast and reliable testing for the flashcard functionality.

## 🚀 Quick Start

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/production)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run test:ui
```

## 📋 Test Structure

### Core Test Files

- **`tests/flashcard-utils.test.js`** - Tests for core flashcard logic
  - Progress management (localStorage)
  - Card selection functionality  
  - Leitner spaced repetition algorithm
  - Statistics calculations
  - Data validation

- **`tests/csv-conversion.test.js`** - Tests for data processing
  - CSV to JSON conversion
  - Data validation
  - Error handling

- **`tests/modal-functionality.test.js`** - Tests for UI interactions
  - Modal state management
  - Card selection interface
  - Keyboard shortcuts
  - Statistics updates

### Test Coverage Areas

✅ **Progress Management**
- localStorage persistence
- Cross-session data integrity
- Error handling for corrupted data

✅ **Leitner Algorithm**
- Box progression logic (+1 for correct, -2 for incorrect)
- Boundary conditions (boxes 1-3)
- Statistics calculation

✅ **Card Selection**
- Individual card selection/deselection
- Select all/deselect all functionality
- Data validation and bounds checking

✅ **Session Management**
- Active card filtering
- Reset functionality
- Completion detection

✅ **Data Processing**
- CSV parsing with PapaParse
- Field validation
- Default value handling

## 🛠️ Testing Utilities

### Mock Setup (`tests/setup.js`)
- **localStorage Mock**: Simulates browser localStorage with Map-based storage
- **fetch Mock**: For testing API calls
- **DOM Mocks**: Basic DOM element simulation

### Utility Functions (`src/utils/flashcard-utils.js`)
Extracted core logic for easier testing:
- `loadProgress()` / `saveProgress()` - Progress persistence
- `loadSelectedCards()` / `saveSelectedCards()` - Card selection
- `calculateBoxProgression()` - Leitner algorithm
- `validateCardSelection()` - Input validation

## 📊 Running Coverage

```bash
npm run test:coverage
```

Generates coverage reports in:
- **Terminal**: Summary view
- **HTML**: `coverage/index.html` - Detailed interactive report
- **JSON**: `coverage/coverage.json` - Machine-readable data

## 🎯 Testing Best Practices

### Unit Tests Focus On:
- **Pure Functions**: Logic without side effects
- **Data Transformations**: Input → processing → output
- **Edge Cases**: Boundary conditions and error states
- **Business Logic**: Leitner algorithm, card selection rules

### Integration Points:
- localStorage persistence
- CSV data processing
- Modal interactions
- Statistics calculations

## 🔧 Configuration

### Vitest Config (`vitest.config.js`)
- **Environment**: jsdom for DOM testing
- **Globals**: Available test functions without imports
- **Coverage**: v8 provider with HTML/JSON reports
- **Setup**: Automatic mock initialization

### Test Scripts (`package.json`)
- `npm test` - Watch mode for development
- `npm run test:run` - Single run for CI
- `npm run test:ui` - Visual test interface
- `npm run test:coverage` - Coverage analysis

## 🚨 Common Issues

### localStorage Mock
If localStorage tests fail, ensure the mock in `tests/setup.js` properly implements:
```javascript
const store = new Map()
getItem: (key) => store.get(key) || null
setItem: (key, value) => store.set(key, value)
```

### Module Imports
Use ES modules syntax consistently:
```javascript
import { describe, it, expect } from 'vitest'
import { FlashcardUtils } from '../src/utils/flashcard-utils.js'
```

## 📈 Future Testing

Consider adding:
- **E2E Tests**: Full user journey testing with Playwright
- **Visual Regression**: Screenshot comparison testing  
- **Performance Tests**: Load time and interaction benchmarks
- **Accessibility Tests**: Screen reader and keyboard navigation

## 🎉 Success Metrics

Current test suite provides:
- ✅ **37 passing tests** across 3 test files
- ✅ **Core logic coverage** for all major functions
- ✅ **Fast execution** (~1.3s full suite)
- ✅ **Reliable mocking** for browser APIs