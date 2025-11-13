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
})