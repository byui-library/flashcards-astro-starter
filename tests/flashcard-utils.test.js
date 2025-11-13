import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FlashcardUtils } from '../src/utils/flashcard-utils.js'

describe('FlashcardUtils - Optimized Version', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Progress Management', () => {
    it('should load empty progress when no data exists', () => {
      const progress = FlashcardUtils.loadProgress('test-key')
      expect(progress).toEqual({})
    })

    it('should load existing progress from localStorage', () => {
      const testProgress = { 0: 2, 1: 3, 2: 1 }
      localStorage.setItem('test-key', JSON.stringify(testProgress))
      
      const progress = FlashcardUtils.loadProgress('test-key')
      expect(progress).toEqual(testProgress)
    })

    it('should save progress to localStorage', () => {
      const testProgress = { 0: 2, 1: 3, 2: 1 }
      FlashcardUtils.saveProgress('test-key', testProgress)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test-key', 
        JSON.stringify(testProgress)
      )
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid-json')
      
      const progress = FlashcardUtils.loadProgress('test-key')
      expect(progress).toEqual({})
    })

    it('should reset progress to empty object', () => {
      const resetProgress = FlashcardUtils.resetProgress()
      expect(resetProgress).toEqual({})
    })
  })

  describe('Active Card Filtering', () => {
    const mockCards = [
      { answer: 'Card 1' },
      { answer: 'Card 2' }, 
      { answer: 'Card 3' },
      { answer: 'Card 4' },
      { answer: 'Card 5' }
    ]

    it('should return all cards when no progress exists', () => {
      const progress = {}
      const activeCards = FlashcardUtils.filterActiveCards(mockCards, progress)
      expect(activeCards).toEqual([0, 1, 2, 3, 4])
    })

    it('should exclude mastered cards (box 3)', () => {
      const progress = { 0: 3, 2: 3, 4: 2 }
      const activeCards = FlashcardUtils.filterActiveCards(mockCards, progress)
      expect(activeCards).toEqual([1, 3, 4]) // Cards 0 and 2 are mastered
    })

    it('should include cards in boxes 1 and 2', () => {
      const progress = { 0: 1, 1: 2, 2: 3, 3: 1 }
      const activeCards = FlashcardUtils.filterActiveCards(mockCards, progress)
      expect(activeCards).toEqual([0, 1, 3, 4]) // Card 2 is mastered (box 3)
    })

    it('should handle empty cards array', () => {
      const progress = { 0: 1, 1: 2 }
      const activeCards = FlashcardUtils.filterActiveCards([], progress)
      expect(activeCards).toEqual([])
    })
  })

  describe('Leitner Box System', () => {
    it('should progress box forward when answered correctly', () => {
      expect(FlashcardUtils.calculateBoxProgression(1, 1)).toBe(2)
      expect(FlashcardUtils.calculateBoxProgression(2, 1)).toBe(3)
    })

    it('should regress box when answered incorrectly', () => {
      expect(FlashcardUtils.calculateBoxProgression(3, -2)).toBe(1)
      expect(FlashcardUtils.calculateBoxProgression(2, -2)).toBe(1)
    })

    it('should not go below box 1', () => {
      expect(FlashcardUtils.calculateBoxProgression(1, -2)).toBe(1)
    })

    it('should not go above box 3', () => {
      expect(FlashcardUtils.calculateBoxProgression(3, 1)).toBe(3)
    })

    it('should handle undefined current box', () => {
      expect(FlashcardUtils.calculateBoxProgression(undefined, 1)).toBe(2)
    })
  })

  describe('Statistics Calculation - Optimized Version', () => {
    it('should calculate box distribution correctly', () => {
      const progress = { 0: 1, 1: 1, 2: 2, 3: 2, 4: 3 }
      const activeCards = [0, 1, 2] // Cards still being studied
      
      const stats = FlashcardUtils.calculateStats(progress, activeCards, 7)
      
      expect(stats).toEqual({
        box1: 2,
        box2: 2, 
        box3: 1,
        remaining: 3,
        completed: 4, // 7 - 3 remaining
        total: '4/7'
      })
    })

    it('should handle empty progress', () => {
      const activeCards = [0, 1, 2, 3, 4] // All cards still active
      const stats = FlashcardUtils.calculateStats({}, activeCards, 5)
      
      expect(stats).toEqual({
        box1: 0,
        box2: 0,
        box3: 0,
        remaining: 5,
        completed: 0,
        total: '0/5'
      })
    })

    it('should handle all cards completed', () => {
      const progress = { 0: 3, 1: 3, 2: 3 }
      const activeCards = [] // No cards remaining
      
      const stats = FlashcardUtils.calculateStats(progress, activeCards, 3)
      
      expect(stats).toEqual({
        box1: 0,
        box2: 0,
        box3: 3,
        remaining: 0,
        completed: 3,
        total: '3/3'
      })
    })
  })

  describe('Card Removal Logic', () => {
    it('should identify cards that should be removed (mastered)', () => {
      expect(FlashcardUtils.shouldRemoveCard({ 0: 3 }, 0)).toBe(true)
      expect(FlashcardUtils.shouldRemoveCard({ 0: 2 }, 0)).toBe(false)
      expect(FlashcardUtils.shouldRemoveCard({ 0: 1 }, 0)).toBe(false)
      expect(FlashcardUtils.shouldRemoveCard({}, 0)).toBe(false)
    })
  })

  describe('Card Data Validation', () => {
    it('should validate correct card objects', () => {
      const validCard = {
        image: { src: 'test.jpg' },
        answer: 'Test Answer',
        alt: 'Test Alt',
        deck: 'Test'
      }
      expect(FlashcardUtils.validateCardData(validCard)).toBe(true)
    })

    it('should reject invalid card objects', () => {
      expect(FlashcardUtils.validateCardData(null)).toBe(false)
      expect(FlashcardUtils.validateCardData({})).toBe(false)
      expect(FlashcardUtils.validateCardData({ image: null })).toBe(false)
      expect(FlashcardUtils.validateCardData({ image: 'test.jpg' })).toBe(false) // missing answer
      expect(FlashcardUtils.validateCardData({ image: 'test.jpg', answer: '' })).toBe(false) // empty answer
    })
  })

  describe('Image Processing', () => {
    it('should extract src from Astro Image objects', () => {
      const astroImageObj = { src: '/optimized-image.webp', width: 500, height: 300 }
      expect(FlashcardUtils.processImageSrc(astroImageObj)).toBe('/optimized-image.webp')
    })

    it('should handle regular image paths', () => {
      const regularPath = '/images/test.jpg'
      expect(FlashcardUtils.processImageSrc(regularPath)).toBe('/images/test.jpg')
    })

    it('should handle null/undefined images', () => {
      expect(FlashcardUtils.processImageSrc(null)).toBe(null)
      expect(FlashcardUtils.processImageSrc(undefined)).toBe(undefined)
    })
  })

  describe('Session Management', () => {
    it('should remove card from active session', () => {
      const activeCards = [0, 1, 2, 3]
      const result = FlashcardUtils.removeCardFromSession(activeCards, 1)
      expect(result).toEqual([0, 2, 3])
    })

    it('should handle removing non-existent card', () => {
      const activeCards = [0, 1, 2]
      const result = FlashcardUtils.removeCardFromSession(activeCards, 5)
      expect(result).toEqual([0, 1, 2])
    })

    it('should not modify original array', () => {
      const activeCards = [0, 1, 2, 3]
      const result = FlashcardUtils.removeCardFromSession(activeCards, 1)
      expect(activeCards).toEqual([0, 1, 2, 3]) // original unchanged
      expect(result).not.toBe(activeCards) // different reference
    })
  })

  describe('Deck Selection Support', () => {
    it('should handle multiple deck progress tracking', () => {
      const mockLocalStorage = {}
      
      // Mock localStorage methods
      const originalGetItem = localStorage.getItem
      const originalSetItem = localStorage.setItem
      
      localStorage.getItem = vi.fn((key) => mockLocalStorage[key] || null)
      localStorage.setItem = vi.fn((key, value) => { mockLocalStorage[key] = value })

      try {
        // Save progress for different decks
        FlashcardUtils.saveProgress('deck-progress-v1:Anatomy: Bones', { 0: 2, 1: 3 })
        FlashcardUtils.saveProgress('deck-progress-v1:Anatomy: Muscles', { 0: 1, 2: 2 })

        const bonesProgress = FlashcardUtils.loadProgress('deck-progress-v1:Anatomy: Bones')
        const musclesProgress = FlashcardUtils.loadProgress('deck-progress-v1:Anatomy: Muscles')

        expect(bonesProgress).toEqual({ 0: 2, 1: 3 })
        expect(musclesProgress).toEqual({ 0: 1, 2: 2 })
        expect(localStorage.setItem).toHaveBeenCalledTimes(2)
      } finally {
        localStorage.getItem = originalGetItem
        localStorage.setItem = originalSetItem
      }
    })

    it('should calculate active cards for selected subset', () => {
      // Test filtering cards based on both selection and progress
      const allCardIndices = [0, 1, 2, 3, 4]
      const selectedCardIndices = new Set([0, 1, 3, 4]) // Card 2 not selected
      const progress = { 1: 3, 3: 2 } // Card 1 mastered, Card 3 in progress

      function getActiveCardsFromSelection(selectedIndices, progressData) {
        return [...selectedIndices].filter(i => {
          return !progressData[i] || progressData[i] < 3
        })
      }

      const activeCards = getActiveCardsFromSelection(selectedCardIndices, progress)
      expect(activeCards).toEqual([0, 3, 4]) // Card 1 filtered out (mastered), Card 2 not selected
    })
  })

  describe('Card Selection Utilities', () => {
    it('should save and load card selection preferences', () => {
      const mockLocalStorage = {}
      
      const originalGetItem = localStorage.getItem
      const originalSetItem = localStorage.setItem
      
      localStorage.getItem = vi.fn((key) => mockLocalStorage[key] || null)
      localStorage.setItem = vi.fn((key, value) => { mockLocalStorage[key] = value })

      try {
        function saveSelectedCards(deckId, selectedSet) {
          const key = `selected-cards-v1:${deckId}`
          const value = JSON.stringify([...selectedSet])
          localStorage.setItem(key, value)
        }

        function loadSelectedCards(deckId) {
          const key = `selected-cards-v1:${deckId}`
          const stored = localStorage.getItem(key)
          return stored ? new Set(JSON.parse(stored)) : null
        }

        const selectedCards = new Set([0, 2, 4])
        saveSelectedCards('anatomy-bones', selectedCards)

        const loaded = loadSelectedCards('anatomy-bones')
        expect(loaded).toEqual(selectedCards)
        expect([...loaded]).toEqual([0, 2, 4])

        const nonExistent = loadSelectedCards('non-existent-deck')
        expect(nonExistent).toBeNull()
      } finally {
        localStorage.getItem = originalGetItem
        localStorage.setItem = originalSetItem
      }
    })

    it('should initialize default selection for new decks', () => {
      function initializeDefaultSelection(cardCount) {
        return new Set(Array.from({ length: cardCount }, (_, i) => i))
      }

      const selection5 = initializeDefaultSelection(5)
      expect(selection5.size).toBe(5)
      expect([...selection5]).toEqual([0, 1, 2, 3, 4])

      const selection0 = initializeDefaultSelection(0)
      expect(selection0.size).toBe(0)
      expect([...selection0]).toEqual([])
    })

    it('should calculate statistics for selected cards only', () => {
      const selectedCardIndices = new Set([0, 1, 2, 4, 5])
      const progress = { 0: 1, 1: 3, 2: 2, 3: 1, 4: 1, 5: 3 }

      function calculateSelectedStats(selectedIndices, progressData) {
        let b1 = 0, b2 = 0, b3 = 0

        for (const idx of selectedIndices) {
          const box = progressData[idx]
          if (box === 1) b1++
          else if (box === 2) b2++
          else if (box === 3) b3++
        }

        const activeCount = [...selectedIndices].filter(i => {
          return !progressData[i] || progressData[i] < 3
        }).length

        const completedCount = [...selectedIndices].filter(i => {
          return progressData[i] === 3
        }).length

        return {
          box1: b1,
          box2: b2, 
          box3: b3,
          active: activeCount,
          completed: completedCount,
          total: selectedIndices.size,
          progressText: `${completedCount}/${selectedIndices.size}`
        }
      }

      const stats = calculateSelectedStats(selectedCardIndices, progress)
      
      expect(stats.box1).toBe(2) // Cards 0 and 4
      expect(stats.box2).toBe(1) // Card 2
      expect(stats.box3).toBe(2) // Cards 1 and 5
      expect(stats.active).toBe(3) // Cards 0, 2, 4 (not mastered)
      expect(stats.completed).toBe(2) // Cards 1 and 5 (mastered)
      expect(stats.total).toBe(5)
      expect(stats.progressText).toBe('2/5')
    })
  })

  describe('Integration Tests for Selection System', () => {
    it('should handle complete workflow of deck switching and card selection', () => {
      // Mock complete application state
      const mockStorage = new Map()
      
      function mockSave(key, data) {
        mockStorage.set(key, JSON.stringify(data))
      }

      function mockLoad(key, defaultValue = null) {
        const stored = mockStorage.get(key)
        return stored ? JSON.parse(stored) : defaultValue
      }

      // Setup multiple decks
      const decks = {
        'anatomy-bones': {
          name: 'Anatomy: Bones',
          cards: [
            { answer: 'Femur' },
            { answer: 'Tibia' },
            { answer: 'Fibula' },
            { answer: 'Humerus' }
          ]
        },
        'anatomy-muscles': {
          name: 'Anatomy: Muscles', 
          cards: [
            { answer: 'Biceps' },
            { answer: 'Triceps' },
            { answer: 'Quadriceps' }
          ]
        }
      }

      // Simulate user workflow
      let currentDeck = 'anatomy-bones'
      
      // 1. Initialize with default selection
      let selectedCards = new Set([0, 1, 2, 3]) // All cards selected
      mockSave(`selected-cards-v1:${currentDeck}`, [...selectedCards])
      
      // 2. User studies and completes some cards
      let progress = { 0: 3, 1: 2 } // Femur mastered, Tibia in box 2
      mockSave(`deck-progress-v1:${decks[currentDeck].name}`, progress)
      
      // 3. User deselects Fibula (index 2) 
      selectedCards.delete(2)
      mockSave(`selected-cards-v1:${currentDeck}`, [...selectedCards])
      
      // 4. Switch to muscle deck
      currentDeck = 'anatomy-muscles'
      const muscleSelection = mockLoad(`selected-cards-v1:${currentDeck}`) || [0, 1, 2]
      selectedCards = new Set(muscleSelection)
      
      // 5. Calculate final state for bones deck
      const bonesSelection = new Set(mockLoad('selected-cards-v1:anatomy-bones'))
      const bonesProgress = mockLoad('deck-progress-v1:Anatomy: Bones', {})
      const activeBones = [...bonesSelection].filter(i => !bonesProgress[i] || bonesProgress[i] < 3)
      
      // Verify results
      expect([...bonesSelection]).toEqual([0, 1, 3]) // Fibula deselected
      expect(bonesProgress).toEqual({ 0: 3, 1: 2 })
      expect(activeBones).toEqual([1, 3]) // Femur filtered out (mastered), Fibula deselected
      
      expect([...selectedCards]).toEqual([0, 1, 2]) // All muscles selected by default
    })

    it('should validate flashcard system integration with selection', () => {
      // Test that selection system works with existing FlashcardUtils
      const cards = [
        { answer: 'Card A', image: { src: '/a.jpg' } },
        { answer: 'Card B', image: { src: '/b.jpg' } },
        { answer: 'Card C', image: { src: '/c.jpg' } },
        { answer: 'Card D', image: { src: '/d.jpg' } }
      ]
      
      const selectedIndices = new Set([0, 2, 3]) // Skip card B
      const progress = { 0: 2, 2: 1 } // Card A in box 2, Card C in box 1
      
      // Calculate active cards from selection
      const selectedCards = cards.filter((_, i) => selectedIndices.has(i))
      const activeCardIndices = [...selectedIndices].filter(i => !progress[i] || progress[i] < 3)
      
      // Calculate stats using FlashcardUtils methods
      const stats = FlashcardUtils.calculateStats(progress, activeCardIndices, selectedCards.length)
      
      expect(stats.box1).toBe(1) // Card C (index 2)
      expect(stats.box2).toBe(1) // Card A (index 0)
      expect(stats.box3).toBe(0)
      expect(stats.remaining).toBe(3) // activeCardIndices.length = [0, 2, 3] (A still active in box 2, C in box 1, D not started)
      
      // Validate cards
      const allValid = selectedCards.every(card => FlashcardUtils.validateCardData(card))
      expect(allValid).toBe(true)
      
      // Test card removal from session
      const updatedActive = FlashcardUtils.removeCardFromSession(activeCardIndices, 2)
      expect(updatedActive).toEqual([0, 3])
    })
  })
})