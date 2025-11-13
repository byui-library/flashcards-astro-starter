# Project Overview

This is an offline-first flashcard application for anatomy and physiology. It is built with [Astro](https://astro.build/) and is a Progressive Web App (PWA), which means it can be installed on mobile devices and used offline.

The flashcard decks are authored in CSV files and then converted to JSON format. The application uses a Leitner-style system for spaced repetition, with progress tracked in the browser's `localStorage`.

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
  This command first converts the CSV deck files in the `decks/` directory to JSON files in `public/decks/`, and then builds the static site to the `dist/` directory.

- **Preview the production build:**
  ```bash
  npm run preview
  ```

## Development Conventions

### Authoring Decks

- Create or edit CSV files in the `./decks` directory.
- The CSV files must have the following columns:
  - `image`: Path to the image file under `/public` (e.g., `/images/skull_lateral.svg`).
  - `answer`: The text to be revealed on the back of the card.
  - `alt`: Accessible alt text for the image.
  - `deck`: A logical grouping for the cards.
- After adding a new CSV file, you need to register it in `src/pages/index.astro` in the `decks` array.

### Images

- Place images under `public/images/`.
- For best performance, keep image widths at or below 1024px and use SVG or compressed PNG/JPG formats.

### PWA and Caching

- The application is an offline-first PWA, configured in `astro.config.mjs`.
- The service worker caches the application shell, decks, and images for offline use.

### Deployment

- The project can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.
- The build command is `npm run build` and the output directory is `dist`.
