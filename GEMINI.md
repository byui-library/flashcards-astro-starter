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
  This command first converts the CSV deck files in the `decks/` directory to JavaScript modules in `src/data/`, and then builds the static site to the `dist/` directory.

- **Preview the production build:**
  ```bash
  npm run preview
  ```

## Development Conventions

### Authoring Decks

- Create or edit CSV files in the `./decks` directory.
- The CSV files must have the following columns:
  - `image`: Path to the image file under `/images/` (e.g., `/images/skull_lateral.svg`). These images should be placed in `src/assets/images/`.
  - `answer`: The text to be revealed on the back of the card.
  - `alt`: Accessible alt text for the image.
  - `deck`: A logical grouping for the cards.
- After running `npm run build`, JavaScript modules for each deck will be generated in `src/data/`.

### Images

- Place images under `src/assets/images/`.
- For best performance, Astro's built-in `astro:assets` feature automatically optimizes images (compression, resizing, modern formats like WebP). The `src/pages/index.astro` file uses the `getImage` function to generate these optimized images at build time.

### PWA and Caching

- The application is an offline-first PWA, configured in `astro.config.mjs`. The `vite.config.ts` file is no longer used for PWA configuration.
- The service worker caches the application shell for offline use.

### Known Issues

- The client-side script in `src/pages/index.astro` has a bug. It attempts to access `c.image.src` on a string, which will cause a runtime error. The code should be updated to use the `optimizedImagePaths` array to get the correct image source.

### Deployment

- The project can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.
- The build command is `npm run build` and the output directory is `dist`.