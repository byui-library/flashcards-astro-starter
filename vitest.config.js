import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use jsdom for DOM testing (better compatibility with browser APIs)
    environment: 'jsdom',
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'
    ],
    
    // Setup files to run before each test
    setupFiles: ['./tests/setup.js'],
    
    // Global test configuration
    globals: true,
    
    // Coverage configuration
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '*.config.*',
        'scripts/'
      ]
    },
    
    // Mock localStorage and other browser APIs
    mockReset: true,
    clearMocks: true,
    
    // Test timeout
    testTimeout: 10000
  }
})