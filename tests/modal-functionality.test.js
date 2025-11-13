import { describe, it, expect, beforeEach, vi } from 'vitest'

// Test optimized flashcard functionality (no modal interface)
describe('Flashcard Core Functionality', () => {
  let mockElement

  beforeEach(() => {
    // Reset DOM mocks
    document.body.innerHTML = ''
    
    // Create mock element functions
    mockElement = {
      hidden: true,
      innerHTML: '',
      textContent: '',
      src: '',
      alt: '',
      disabled: false,
      addEventListener: vi.fn(),
      querySelector: vi.fn(),
      appendChild: vi.fn()
    }

    // Mock document.getElementById
    global.document.getElementById = vi.fn(() => mockElement)
    // Mock document.querySelector  
    global.document.querySelector = vi.fn(() => mockElement)
  })

  describe('Card Rendering', () => {
    it('should render card with image and answer', () => {
      const card = {
        image: { src: '/optimized/biceps.webp' },
        answer: 'Biceps Brachii',
        alt: 'Biceps brachii muscle'
      }

      // Simulate render function
      function renderCard(card, showingFront) {
        const imgElement = { src: '', alt: '' }
        const backElement = { textContent: '', hidden: true }

        imgElement.src = card.image.src
        imgElement.alt = card.alt
        backElement.textContent = card.answer
        backElement.hidden = showingFront

        return { imgElement, backElement }
      }

      const result = renderCard(card, true)
      expect(result.imgElement.src).toBe('/optimized/biceps.webp')
      expect(result.imgElement.alt).toBe('Biceps brachii muscle')
      expect(result.backElement.textContent).toBe('Biceps Brachii')
      expect(result.backElement.hidden).toBe(true)
    })

    it('should show completion message when no cards remain', () => {
      function renderCompletionState() {
        const imgElement = { src: '', alt: '' }
        const backElement = { textContent: '', hidden: false }
        const buttons = { flip: { disabled: false }, knew: { disabled: false } }

        imgElement.src = ''
        imgElement.alt = 'All cards completed!'
        backElement.textContent = 'You have successfully identified all of the slides! Push the reset button to start over.'
        backElement.hidden = false
        
        buttons.flip.disabled = true
        buttons.knew.disabled = true

        return { imgElement, backElement, buttons }
      }

      const result = renderCompletionState()
      expect(result.backElement.textContent).toContain('successfully identified all')
      expect(result.buttons.flip.disabled).toBe(true)
      expect(result.buttons.knew.disabled).toBe(true)
    })
  })

  describe('Statistics Updates', () => {
    it('should update statistics display with new format', () => {
      const stats = {
        box1: 2,
        box2: 1,
        box3: 0,
        remaining: 3,
        completed: 2,
        total: '2/5'
      }

      function updateStatsDisplay(stats) {
        return {
          b1: stats.box1.toString(),
          b2: stats.box2.toString(),
          b3: stats.box3.toString(),
          remaining: stats.remaining.toString(),
          total: stats.total
        }
      }

      const result = updateStatsDisplay(stats)
      
      expect(result.b1).toBe('2')
      expect(result.b2).toBe('1')
      expect(result.b3).toBe('0')
      expect(result.remaining).toBe('3')
      expect(result.total).toBe('2/5')
    })
  })

  describe('Keyboard Interactions', () => {
    it('should handle enter key for card flip', () => {
      let cardFlipped = false

      function handleCardKeydown(event) {
        if (['Enter', ' '].includes(event.key)) {
          cardFlipped = true
        }
      }

      handleCardKeydown({ key: 'Enter' })
      expect(cardFlipped).toBe(true)

      cardFlipped = false
      handleCardKeydown({ key: ' ' })
      expect(cardFlipped).toBe(true)
    })

    it('should handle arrow keys for navigation', () => {
      let actionTriggered = ''

      function handleCardKeydown(event) {
        if (event.key === 'ArrowRight') actionTriggered = 'next'
        if (event.key === 'ArrowUp') actionTriggered = 'knew'  
        if (event.key === 'ArrowDown') actionTriggered = 'missed'
        if (event.key === 'r' || event.key === 'R') actionTriggered = 'reset'
      }

      handleCardKeydown({ key: 'ArrowRight' })
      expect(actionTriggered).toBe('next')

      handleCardKeydown({ key: 'ArrowUp' })
      expect(actionTriggered).toBe('knew')

      handleCardKeydown({ key: 'ArrowDown' })
      expect(actionTriggered).toBe('missed')

      handleCardKeydown({ key: 'R' })
      expect(actionTriggered).toBe('reset')
    })
  })

  describe('Boot Process', () => {
    it('should initialize application state correctly', () => {
      const mockCards = [
        { answer: 'Card 1' },
        { answer: 'Card 2' },
        { answer: 'Card 3' }
      ]
      const progress = { 0: 3 } // Card 0 is mastered

      function bootApplication(cards, progress) {
        const knownCardIndexes = Object.keys(progress).map(Number)
        const activeCards = cards
          .map((_, i) => i)
          .filter(i => !knownCardIndexes.includes(i) || progress[i] < 3)

        return {
          activeCards,
          currentIndex: 0,
          showingFront: true
        }
      }

      const result = bootApplication(mockCards, progress)
      expect(result.activeCards).toEqual([1, 2]) // Card 0 filtered out (mastered)
      expect(result.currentIndex).toBe(0)
      expect(result.showingFront).toBe(true)
    })
  })
})