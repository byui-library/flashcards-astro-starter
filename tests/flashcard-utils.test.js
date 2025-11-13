import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FlashcardUtils } from '../src/utils/flashcard-utils.js'

describe('FlashcardUtils', () => {
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
  })

  describe('Selected Cards Management', () => {
    it('should return all cards when no selection exists', () => {
      const selected = FlashcardUtils.loadSelectedCards('test-deck', 5)
      expect(selected).toEqual([0, 1, 2, 3, 4])
    })

    it('should load existing selections', () => {
      const testSelection = [0, 2, 4]
      localStorage.setItem(
        FlashcardUtils.selectedCardsKeyPrefix + 'test-deck', 
        JSON.stringify(testSelection)
      )
      
      const selected = FlashcardUtils.loadSelectedCards('test-deck', 5)
      expect(selected).toEqual([0, 2, 4])
    })

    it('should filter out invalid indices', () => {
      const testSelection = [0, 2, 4, 10] // 10 is invalid for 5 cards
      localStorage.setItem(
        FlashcardUtils.selectedCardsKeyPrefix + 'test-deck', 
        JSON.stringify(testSelection)
      )
      
      const selected = FlashcardUtils.loadSelectedCards('test-deck', 5)
      expect(selected).toEqual([0, 2, 4])
    })

    it('should save selected cards', () => {
      const testSelection = [1, 3, 4]
      FlashcardUtils.saveSelectedCards('test-deck', testSelection)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        FlashcardUtils.selectedCardsKeyPrefix + 'test-deck',
        JSON.stringify(testSelection)
      )
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

  describe('Statistics Calculation', () => {
    it('should calculate box distribution correctly', () => {
      const progress = { 0: 1, 1: 1, 2: 2, 3: 2, 4: 3 }
      const activeCards = [0, 1, 2]
      const selectedCards = [0, 1, 2, 3, 4]
      
      const stats = FlashcardUtils.calculateStats(progress, activeCards, selectedCards, 7)
      
      expect(stats).toEqual({
        box1: 2,
        box2: 2,
        box3: 1,
        remaining: 3,
        total: '5/7'
      })
    })

    it('should handle empty progress', () => {
      const stats = FlashcardUtils.calculateStats({}, [0, 1], [0, 1], 5)
      
      expect(stats).toEqual({
        box1: 0,
        box2: 0,
        box3: 0,
        remaining: 2,
        total: '2/5'
      })
    })
  })

  describe('Card Selection Validation', () => {
    it('should validate correct selection arrays', () => {
      expect(FlashcardUtils.validateCardSelection([0, 1, 2], 5)).toBe(true)
      expect(FlashcardUtils.validateCardSelection([4], 5)).toBe(true)
    })

    it('should reject invalid selections', () => {
      expect(FlashcardUtils.validateCardSelection([], 5)).toBe(false)
      expect(FlashcardUtils.validateCardSelection('not-array', 5)).toBe(false)
      expect(FlashcardUtils.validateCardSelection([0, 5], 5)).toBe(false) // 5 is out of bounds
      expect(FlashcardUtils.validateCardSelection([-1, 0], 5)).toBe(false) // negative index
    })
  })

  describe('Select All Toggle', () => {
    it('should select all cards when toggling on', () => {
      const result = FlashcardUtils.toggleSelectAll([], 5, true)
      expect(result).toEqual([0, 1, 2, 3, 4])
    })

    it('should deselect all cards when toggling off', () => {
      const result = FlashcardUtils.toggleSelectAll([0, 1, 2], 5, false)
      expect(result).toEqual([])
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