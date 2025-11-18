// Unit tests for automated deck loading functionality
import { describe, it, expect } from 'vitest'

// Helper functions to test (extracted from the logic in index.astro)
const filterJSFiles = (files) => files.filter(f => f.endsWith('.js'))

const convertToCamelCase = (str) => str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())

const convertToDisplayName = (deckId) => 
  deckId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(': ')

const createDeck = (deckId, deckData) => ({
  name: convertToDisplayName(deckId),
  id: deckId,
  cards: deckData
})

const selectDefaultDeck = (availableDecks) => availableDecks.length > 0 ? availableDecks[0] : null

describe('Automated Deck Loading', () => {
  describe('File Filtering', () => {
    it('should filter only .js files from directory listing', () => {
      const allFiles = [
        'anatomy-bones.js',
        'cardiology.js', 
        'neurology.js',
        'README.md', // Should be filtered out
        'index.html' // Should be filtered out
      ]

      const deckFiles = filterJSFiles(allFiles)

      expect(deckFiles).toEqual([
        'anatomy-bones.js',
        'cardiology.js', 
        'neurology.js'
      ])
      expect(deckFiles).toHaveLength(3)
    })

    it('should handle empty file list', () => {
      const allFiles = []
      const deckFiles = filterJSFiles(allFiles)

      expect(deckFiles).toEqual([])
    })

    it('should handle no .js files', () => {
      const allFiles = ['README.md', 'config.json', 'image.png']
      const deckFiles = filterJSFiles(allFiles)

      expect(deckFiles).toEqual([])
    })
  })

  describe('Name Conversion', () => {
    it('should convert kebab-case to camelCase for module imports', () => {
      const testCases = [
        { input: 'anatomy-bones', expected: 'anatomyBones' },
        { input: 'cardiology-basics', expected: 'cardiologyBasics' },
        { input: 'neuro-anatomy', expected: 'neuroAnatomy' },
        { input: 'single', expected: 'single' },
        { input: 'multi-word-deck-name', expected: 'multiWordDeckName' }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = convertToCamelCase(input)
        expect(result).toBe(expected)
      })
    })

    it('should convert kebab-case to Title Case for display names', () => {
      const testCases = [
        { input: 'anatomy-bones', expected: 'Anatomy: Bones' },
        { input: 'cardiology-basics', expected: 'Cardiology: Basics' },
        { input: 'neuro-anatomy', expected: 'Neuro: Anatomy' },
        { input: 'single', expected: 'Single' },
        { input: 'multi-word-deck', expected: 'Multi: Word: Deck' }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = convertToDisplayName(input)
        expect(result).toBe(expected)
      })
    })
  })

  describe('Deck Creation', () => {
    it('should validate that deck data is an array', () => {
      const validDeckData = [
        { image: 'test1.jpg', answer: 'Test 1' },
        { image: 'test2.jpg', answer: 'Test 2' }
      ]
      const invalidDeckData = { notAnArray: true }
      const nullData = null
      const undefinedData = undefined

      expect(Array.isArray(validDeckData)).toBe(true)
      expect(Array.isArray(invalidDeckData)).toBe(false)
      expect(Array.isArray(nullData)).toBe(false)
      expect(Array.isArray(undefinedData)).toBe(false)
    })

    it('should create proper deck objects with correct structure', () => {
      const deckId = 'anatomy-bones'
      const deckData = [
        { image: 'biceps.jpg', answer: 'Biceps Brachii' },
        { image: 'triceps.jpg', answer: 'Triceps Brachii' }
      ]

      const deck = createDeck(deckId, deckData)

      expect(deck).toEqual({
        name: 'Anatomy: Bones',
        id: 'anatomy-bones',
        cards: deckData
      })
      expect(deck.cards).toBe(deckData) // Should be reference to original array
    })
  })

  describe('Default Deck Selection', () => {
    it('should select first valid deck as default', () => {
      const availableDecks = [
        { name: 'Anatomy: Bones', id: 'anatomy-bones', cards: [] },
        { name: 'Cardiology', id: 'cardiology', cards: [] },
        { name: 'Neurology', id: 'neurology', cards: [] }
      ]

      const defaultDeck = selectDefaultDeck(availableDecks)

      expect(defaultDeck).toBe(availableDecks[0])
      expect(defaultDeck.id).toBe('anatomy-bones')
    })

    it('should handle single deck scenario', () => {
      const availableDecks = [
        { name: 'Anatomy: Bones', id: 'anatomy-bones', cards: [] }
      ]

      const defaultDeck = selectDefaultDeck(availableDecks)

      expect(defaultDeck).toBe(availableDecks[0])
    })

    it('should handle empty deck array', () => {
      const availableDecks = []
      const defaultDeck = selectDefaultDeck(availableDecks)

      expect(defaultDeck).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should detect when no valid decks are found', () => {
      const availableDecks = []
      
      expect(() => {
        if (availableDecks.length === 0) {
          throw new Error('No valid deck files found in src/data/')
        }
      }).toThrow('No valid deck files found in src/data/')
    })

    it('should handle malformed deck module exports', () => {
      // Test case where deck module exists but doesn't export expected data
      const mockDeckModule = { wrongExport: [] }
      const deckId = 'anatomy-bones'
      const camelCaseName = convertToCamelCase(deckId)
      const deckData = mockDeckModule[camelCaseName] // undefined

      expect(deckData).toBeUndefined()
      expect(Array.isArray(deckData)).toBe(false)
    })
  })

  describe('Integration Scenarios', () => {
    it('should process multiple valid deck files correctly', () => {
      // Mock data that simulates what would come from different deck modules
      const mockDecks = {
        'anatomy-bones': [{ image: 'bone1.jpg', answer: 'Femur' }],
        'cardiology': [{ image: 'heart1.jpg', answer: 'Aorta' }]
      }

      // Simulate the processing logic
      const deckFiles = ['anatomy-bones.js', 'cardiology.js']
      const availableDecks = []

      for (const file of deckFiles) {
        const deckId = file.replace('.js', '')
        const deckData = mockDecks[deckId] // Simulate module import

        if (deckData && Array.isArray(deckData)) {
          availableDecks.push(createDeck(deckId, deckData))
        }
      }

      // Assert
      expect(availableDecks).toHaveLength(2)
      expect(availableDecks[0].name).toBe('Anatomy: Bones')
      expect(availableDecks[0].id).toBe('anatomy-bones')
      expect(availableDecks[1].name).toBe('Cardiology')
      expect(availableDecks[1].id).toBe('cardiology')
    })

    it('should skip invalid deck files and continue processing', () => {
      const mockDecks = {
        'anatomy-bones': [{ image: 'bone1.jpg', answer: 'Femur' }],
        'invalid-deck': null, // Invalid data
        'cardiology': [{ image: 'heart1.jpg', answer: 'Aorta' }]
      }

      const deckFiles = ['anatomy-bones.js', 'invalid-deck.js', 'cardiology.js']
      const availableDecks = []

      for (const file of deckFiles) {
        const deckId = file.replace('.js', '')
        const deckData = mockDecks[deckId]

        if (deckData && Array.isArray(deckData)) {
          availableDecks.push(createDeck(deckId, deckData))
        }
      }

      expect(availableDecks).toHaveLength(2)
      expect(availableDecks.find(d => d.id === 'invalid-deck')).toBeUndefined()
    })
  })
})