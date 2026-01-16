# Project Overview

This is an offline-first flashcard application for anatomy and physiology. It is built with [Astro](https://astro.build/) and is a Progressive Web App (PWA), which means it can be installed on mobile devices and used offline.

The flashcard decks are authored in CSV files and then converted to JavaScript modules. The application uses a Leitner-style system for spaced repetition, with progress tracked in the browser's `localStorage`.

## Building and Running

### Prerequisites

- [Node.js](https://nodejs.org/) (version specified in `.nvmrc` if available, otherwise latest LTS)
- [npm](https://www.npmjs.com/)

### Key Commands

- **Install dependencies:**
  ```bash
  npm install
  ```

- **Run the development server:**
  ```bash
  npm run dev
  ```
  The application will be available at http://localhost:4321.

- **Build the application:**
  ```bash
  npm run build
  ```
  This command first converts the CSV deck files in the `decks/` directory to JavaScript modules in `src/data/`, then automatically updates the deck imports in `src/pages/index.astro`, and finally builds the static site to the `dist/` directory.

- **Preview the production build:**
  ```bash
  npm run preview
  ```

## Development Conventions

### Component-Based Architecture

The application has been refactored into a component-based architecture using Astro components. This separates the UI into smaller, reusable pieces, making the codebase easier to maintain and understand. The main page (`src/pages/index.astro`) is now composed of several components from the `src/components/` directory:

- `ConfigModal.astro`: A modal dialog for configuring the flashcard session.
- `ControlButtons.astro`: Buttons for controlling the flashcard session (e.g., "Next", "Flip").
- `DeckSelector.astro`: A dropdown for selecting the flashcard deck.
- `Flashcard.astro`: The main flashcard component.
- `StatsDisplay.astro`: A display for showing statistics about the flashcard session.

### Client-Side Logic

All client-side JavaScript logic has been moved from inline `<script>` tags to a dedicated file: `src/scripts/flashcard-app.js`. The logic is encapsulated in a `FlashcardApp` class, which is instantiated in `src/pages/index.astro`. This separation of concerns makes the code more organized and easier to debug. The `FlashcardApp` class manages the application state, event handling, and all interactions with the DOM.

### Authoring Decks

- Create or edit CSV files in the `./decks` directory.
- The CSV files must have the following columns:
  - `image`: Path to the image file under `/images/` (e.g., `/images/skull_lateral.svg`). These images should be placed in `src/assets/images/`.
  - `answer`: The text to be revealed on the back of the card.
  - `alt`: Accessible alt text for the image.
  - `deck`: A logical grouping for the cards.
- After adding a new CSV file to the `decks` directory, run `npm run build`. The build process will automatically:
  1. Convert the CSV file to a JavaScript module in `src/data/`.
  2. Update `src/pages/index.astro` to import the new deck.
  3. Make the new deck available in the deck selector dropdown.

### Images

- Place images under `src/assets/images/`.
- For best performance, Astro's built-in `astro:assets` feature automatically optimizes images (compression, resizing, modern formats like WebP). The `src/pages/index.astro` file uses the `getImage` function to generate these optimized images at build time. This ensures that the application loads quickly and efficiently, even on slow networks.

### PWA and Caching

- The application is an offline-first PWA, configured in `astro.config.mjs`. The `vite.config.ts` file is no longer used for PWA configuration.
- The service worker, configured in `astro.config.mjs`, caches the application shell and all static assets for offline use. This allows the application to be used without an internet connection after the initial visit.

### Testing

The project includes a comprehensive test suite using Vitest. The tests cover the following areas:

- **Astro Integration:** Tests for the Astro components and pages.
- **Automated Deck Loading:** Tests for the automated deck loading system.
- **CSV Conversion:** Tests for the CSV to JavaScript module conversion process.
- **Deck Selection UI:** Tests for the deck selection UI.
- **Flashcard Utils:** Tests for the flashcard utility functions.
- **Modal Functionality:** Tests for the configuration modal.

To run the tests, use the following command:

```bash
npm test
```

### Deployment

- The project can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.
- The build command is `npm run build` and the output directory is `dist`.
