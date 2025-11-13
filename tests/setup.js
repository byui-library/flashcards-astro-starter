// Test setup file - runs before each test
import { vi } from 'vitest'

// Create a proper localStorage mock
const createLocalStorageMock = () => {
  const store = new Map()
  
  return {
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    length: 0,
    key: vi.fn()
  }
}

// Make localStorage available globally in tests
global.localStorage = createLocalStorageMock()

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock DOM APIs that might be used
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:4321/flashcards-astro-starter'
  }
})

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  // Reset localStorage to a fresh instance
  global.localStorage = createLocalStorageMock()
})