import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  output: 'static',
  server: { port: 4321 },
  vite: {
    server: { fs: { strict: false } },
  },
  site: 'https://byui-library.github.io',
  base: '/flashcards-astro-starter',
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,webp,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/byui-library\.github\.io\/flashcards-astro-starter\/decks\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'decks-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/byui-library\.github\.io\/flashcards-astro-starter\/images\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/byui-library\.github\.io\/flashcards-astro-starter\/.*\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'videos-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      includeAssets: ['**/*'],
      manifest: {
        name: 'Marvelous Martin\'s Special Tests Flashcards',
        short_name: 'Special Tests',
        description: 'Offline-first flashcards for special orthopedic tests',
        theme_color: '#006EB6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/flashcards-astro-starter/',
        icons: [
          {
            src: '/flashcards-astro-starter/icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/flashcards-astro-starter/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/flashcards-astro-starter/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});
