# Automated Deck Loading System

## Overview
The flashcard application now features an automated deck loading system that automatically discovers and includes new flashcard decks when they are added to the project.

## How It Works

### 1. CSV to JavaScript Conversion
- **Script**: `scripts/build-decks.mjs`
- **Input**: CSV files in `decks/` directory
- **Output**: JavaScript modules in `src/data/`
- **Process**: Converts each CSV file to a JavaScript module with proper imports for images

### 2. Automatic Import Generation  
- **Script**: `scripts/update-deck-imports.mjs`
- **Process**: 
  - Scans `src/data/` for deck JavaScript files
  - Automatically generates import statements in `src/pages/index.astro`
  - Creates deck configuration objects with proper naming
  - Updates the availableDecks array

### 3. Build Pipeline Integration
The build process runs in this order:
1. `build-decks.mjs` - Converts CSV files to JS modules
2. `update-deck-imports.mjs` - Updates index.astro with imports
3. `astro build` - Builds the final application

## Adding New Decks

### Step 1: Create CSV File
Add a new CSV file to the `decks/` directory:

```csv
image,answer,alt,deck
image1.png,Answer 1,Alt text 1,Category
image2.png,Answer 2,Alt text 2,Category
```

**File naming**: Use kebab-case (e.g., `cardiology-basics.csv`)

### Step 2: Build
Run the build command:
```bash
npm run build
```

The system will automatically:
- ✅ Convert your CSV to a JavaScript module
- ✅ Add the import to index.astro
- ✅ Create the deck configuration
- ✅ Include it in the dropdown menu
- ✅ Embed the data in the built HTML

### Step 3: Done!
Your new deck will be available in the application dropdown with a properly formatted name.

## Naming Conventions

### File Names → Display Names
- `anatomy-bones.csv` → "Anatomy: Bones"
- `cardiology-basics.csv` → "Cardiology: Basics"
- `neurology-advanced.csv` → "Neurology: Advanced"

### Module Names (for imports)
- `anatomy-bones` → `anatomyBones`
- `cardiology-basics` → `cardiologyBasics`
- `neurology-advanced` → `neurologyAdvanced`

## Test Coverage

The automated deck loading system includes comprehensive unit tests:

### Core Functionality Tests (`automated-deck-loading.test.js`)
- ✅ File filtering (14 tests)
- ✅ Name conversion (kebab-case to camelCase and Title Case)
- ✅ Deck creation and validation
- ✅ Default deck selection
- ✅ Error handling
- ✅ Integration scenarios

### Astro Integration Tests (`astro-integration.test.js`)  
- ✅ Build process simulation (7 tests)
- ✅ Dynamic import handling
- ✅ Component prop validation
- ✅ Backward compatibility
- ✅ Error scenarios

**Total Tests**: 97 tests (21 new + 76 existing)

## Error Handling

### No Decks Found
- Build fails with clear error message
- Prevents deployment of broken application

### Invalid Deck Files
- Malformed CSV files are logged and skipped
- Build continues with valid decks

### Missing Images
- Warnings logged for missing image references
- Build continues (may result in broken image links)

## Files Modified/Added

### New Files
- `scripts/update-deck-imports.mjs` - Import generation script
- `tests/automated-deck-loading.test.js` - Core functionality tests  
- `tests/astro-integration.test.js` - Integration tests

### Modified Files
- `src/pages/index.astro` - Updated with automated deck loading
- `package.json` - Updated build script to include automation

## Benefits

1. **Zero Manual Configuration**: Add CSV file → Build → Done
2. **Type Safety**: Automatic TypeScript-friendly imports
3. **Performance**: No runtime filesystem access
4. **SEO Friendly**: All data embedded at build time
5. **Developer Experience**: Clear naming conventions and error messages
6. **Maintainable**: Well-tested with comprehensive unit tests

## Backward Compatibility

✅ All existing functionality preserved  
✅ All 76 existing tests continue to pass  
✅ No breaking changes to user interface  
✅ Same flashcard behavior and features