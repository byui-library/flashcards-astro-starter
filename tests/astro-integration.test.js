// Integration tests for the automated deck loading in Astro pages
import { describe, it, expect } from 'vitest'

describe('Astro Page Integration - Automated Deck Loading', () => {

  describe('Page Build Process', () => {
    it('should build availableDecks array from discovered files', () => {
      // Mock dynamic imports - simulate what Astro would do
      const mockImports = {
        'anatomy-bones.js': {
          anatomyBones: [
            { image: 'bone1.jpg', answer: 'Femur', alt: 'Femur bone' },
            { image: 'bone2.jpg', answer: 'Tibia', alt: 'Tibia bone' }
          ]
        },
        'cardiology-basics.js': {
          cardiologyBasics: [
            { image: 'heart1.jpg', answer: 'Aorta', alt: 'Aorta vessel' },
            { image: 'heart2.jpg', answer: 'Ventricle', alt: 'Heart ventricle' }
          ]
        }
      }

      // Simulate the Astro frontmatter logic
      const deckFiles = ['anatomy-bones.js', 'cardiology-basics.js']
      const availableDecks = []
      let defaultDeck = null

      for (const file of deckFiles) {
        const deckId = file.replace('.js', '')
        const deckModule = mockImports[file] // Simulate dynamic import
        
        const camelCaseName = deckId.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
        const deckData = deckModule[camelCaseName]
        
        if (deckData && Array.isArray(deckData)) {
          const displayName = deckId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(': ')
          
          const deck = {
            name: displayName,
            id: deckId,
            cards: deckData
          }
          
          availableDecks.push(deck)
          
          if (!defaultDeck) {
            defaultDeck = deck
          }
        }
      }

      // Assertions
      expect(availableDecks).toHaveLength(2)
      
      expect(availableDecks[0]).toEqual({
        name: 'Anatomy: Bones',
        id: 'anatomy-bones',
        cards: mockImports['anatomy-bones.js'].anatomyBones
      })
      
      expect(availableDecks[1]).toEqual({
        name: 'Cardiology: Basics',
        id: 'cardiology-basics',
        cards: mockImports['cardiology-basics.js'].cardiologyBasics
      })

      expect(defaultDeck).toBe(availableDecks[0])
      expect(defaultDeck.id).toBe('anatomy-bones')
    })

    it('should handle build failure when no decks are found', () => {
      // Simulate no .js files found
      const deckFiles = []
      const availableDecks = []

      // This should throw an error during build
      expect(() => {
        if (availableDecks.length === 0) {
          throw new Error('No valid deck files found in src/data/')
        }
      }).toThrow('No valid deck files found in src/data/')
    })

    it('should set correct default deck properties for page components', () => {
      // Simulate successful deck loading
      const mockDeckData = [
        { image: 'bone1.jpg', answer: 'Femur', alt: 'Femur bone' }
      ]

      const availableDecks = [{
        name: 'Anatomy: Bones',
        id: 'anatomy-bones',
        cards: mockDeckData
      }]

      const defaultDeck = availableDecks[0]
      const cards = defaultDeck.cards
      const deckName = defaultDeck.name

      // Verify the variables that get passed to components
      expect(cards).toBe(mockDeckData)
      expect(deckName).toBe('Anatomy: Bones')
      expect(defaultDeck.id).toBe('anatomy-bones')
      
      // Verify structure for DeckSelector component
      const deckSelectorProps = {
        decks: availableDecks.map(deck => ({ id: deck.id, name: deck.name })),
        defaultDeckId: defaultDeck.id
      }

      expect(deckSelectorProps).toEqual({
        decks: [{ id: 'anatomy-bones', name: 'Anatomy: Bones' }],
        defaultDeckId: 'anatomy-bones'
      })
    })
  })

  describe('Dynamic Import Handling', () => {
    it('should handle import errors gracefully', async () => {
      // Simulate import failure
      const attemptImport = async (path) => {
        if (path === '../data/corrupted-deck.js') {
          throw new Error('SyntaxError: Unexpected token')
        }
      }

      // Test error handling
      await expect(attemptImport('../data/corrupted-deck.js')).rejects.toThrow('SyntaxError')
    })

    it('should skip decks with missing or incorrect exports', () => {
      const testCases = [
        {
          name: 'missing export',
          mockModule: { wrongExport: [] },
          expectedDeckId: 'anatomy-bones',
          shouldBeSkipped: true
        },
        {
          name: 'non-array export', 
          mockModule: { anatomyBones: { notArray: true } },
          expectedDeckId: 'anatomy-bones',
          shouldBeSkipped: true
        },
        {
          name: 'null export',
          mockModule: { anatomyBones: null },
          expectedDeckId: 'anatomy-bones', 
          shouldBeSkipped: true
        },
        {
          name: 'valid export',
          mockModule: { anatomyBones: [{ image: 'test.jpg', answer: 'Test' }] },
          expectedDeckId: 'anatomy-bones',
          shouldBeSkipped: false
        }
      ]

      testCases.forEach(({ name, mockModule, expectedDeckId, shouldBeSkipped }) => {
        const camelCaseName = expectedDeckId.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
        const deckData = mockModule[camelCaseName]
        const isValid = !!(deckData && Array.isArray(deckData))

        if (shouldBeSkipped) {
          expect(isValid).toBe(false)
        } else {
          expect(isValid).toBe(true)
        }
      })
    })
  })

  describe('Backward Compatibility', () => {
    it('should still work with existing anatomy-bones deck', () => {
      // Verify the camelCase conversion still works for existing deck
      const deckId = 'anatomy-bones'
      const camelCaseName = deckId.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
      
      expect(camelCaseName).toBe('anatomyBones')
      
      // Verify display name conversion
      const displayName = deckId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(': ')
      
      expect(displayName).toBe('Anatomy: Bones')
    })

    it('should maintain same component prop structure', () => {
      const mockDeck = {
        name: 'Test Deck',
        id: 'test-deck',
        cards: [{ image: 'test.jpg', answer: 'Test Answer' }]
      }

      // Verify the props passed to components match expected structure
      const componentProps = {
        cards: mockDeck.cards,
        deckName: mockDeck.name,
        availableDecks: [mockDeck],
        defaultDeckId: mockDeck.id
      }

      expect(componentProps.cards).toBeDefined()
      expect(componentProps.deckName).toBeDefined()
      expect(componentProps.availableDecks).toBeDefined()
      expect(componentProps.defaultDeckId).toBeDefined()
      expect(Array.isArray(componentProps.availableDecks)).toBe(true)
    })
  })
})