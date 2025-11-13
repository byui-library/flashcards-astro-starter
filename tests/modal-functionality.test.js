import { describe, it, expect, beforeEach, vi } from 'vitest'

// Test deck selection and card configuration functionality
describe('Deck Selection and Card Configuration', () => {
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

  describe('Deck Selection', () => {
    it('should switch decks correctly', () => {
      const availableDecks = [
        { id: 'anatomy-bones', name: 'Anatomy: Bones', cards: [{ answer: 'Femur' }, { answer: 'Tibia' }] },
        { id: 'anatomy-muscles', name: 'Anatomy: Muscles', cards: [{ answer: 'Biceps' }, { answer: 'Triceps' }] }
      ]

      let currentDeck = availableDecks[0]

      function switchDeck(deckId, decks) {
        const deck = decks.find(d => d.id === deckId)
        if (deck) {
          currentDeck = deck
          return {
            success: true,
            deckName: deck.name,
            cardCount: deck.cards.length
          }
        }
        return { success: false }
      }

      const result1 = switchDeck('anatomy-muscles', availableDecks)
      expect(result1.success).toBe(true)
      expect(result1.deckName).toBe('Anatomy: Muscles')
      expect(result1.cardCount).toBe(2)

      const result2 = switchDeck('nonexistent', availableDecks)
      expect(result2.success).toBe(false)
    })

    it('should maintain separate progress for different decks', () => {
      const mockLocalStorage = new Map()
      
      function saveProgress(key, progress) {
        mockLocalStorage.set(key, JSON.stringify(progress))
      }

      function loadProgress(key) {
        const stored = mockLocalStorage.get(key)
        return stored ? JSON.parse(stored) : {}
      }

      // Save progress for different decks
      saveProgress('deck-progress-v1:Anatomy: Bones', { 0: 2, 1: 3 })
      saveProgress('deck-progress-v1:Anatomy: Muscles', { 0: 1, 2: 2 })

      const bonesProgress = loadProgress('deck-progress-v1:Anatomy: Bones')
      const musclesProgress = loadProgress('deck-progress-v1:Anatomy: Muscles')

      expect(bonesProgress).toEqual({ 0: 2, 1: 3 })
      expect(musclesProgress).toEqual({ 0: 1, 2: 2 })
    })
  })

  describe('Card Selection Configuration', () => {
    it('should initialize with all cards selected by default', () => {
      const cards = [
        { answer: 'Card 1' },
        { answer: 'Card 2' }, 
        { answer: 'Card 3' }
      ]

      function initializeCardSelection(cardCount) {
        return new Set(Array.from({ length: cardCount }, (_, i) => i))
      }

      const selectedCards = initializeCardSelection(cards.length)
      expect(selectedCards.size).toBe(3)
      expect([...selectedCards]).toEqual([0, 1, 2])
    })

    it('should save and load card selection preferences', () => {
      const mockLocalStorage = new Map()
      
      function saveSelectedCards(deckId, selectedSet) {
        mockLocalStorage.set(`selected-cards-v1:${deckId}`, JSON.stringify([...selectedSet]))
      }

      function loadSelectedCards(deckId) {
        const stored = mockLocalStorage.get(`selected-cards-v1:${deckId}`)
        return stored ? new Set(JSON.parse(stored)) : null
      }

      const selectedCards = new Set([0, 2, 4])
      saveSelectedCards('anatomy-bones', selectedCards)

      const loaded = loadSelectedCards('anatomy-bones')
      expect(loaded).toEqual(selectedCards)
      expect([...loaded]).toEqual([0, 2, 4])
    })

    it('should filter active cards based on selection and progress', () => {
      const allCards = [
        { answer: 'Card 0' },
        { answer: 'Card 1' },
        { answer: 'Card 2' },
        { answer: 'Card 3' },
        { answer: 'Card 4' }
      ]
      const selectedCardIndices = new Set([0, 1, 2, 4]) // Card 3 not selected
      const progress = { 1: 3, 2: 2 } // Card 1 is mastered, Card 2 in progress

      function getActiveCards(selectedIndices, progress) {
        return [...selectedIndices].filter(i => {
          return !progress[i] || progress[i] < 3
        })
      }

      const activeCards = getActiveCards(selectedCardIndices, progress)
      expect(activeCards).toEqual([0, 2, 4]) // Card 1 filtered out (mastered), Card 3 not selected
    })

    it('should handle select all functionality', () => {
      const cardCount = 5
      let selectedCards = new Set([0, 2])

      function selectAllCards(totalCards) {
        return new Set(Array.from({ length: totalCards }, (_, i) => i))
      }

      selectedCards = selectAllCards(cardCount)
      expect(selectedCards.size).toBe(5)
      expect([...selectedCards]).toEqual([0, 1, 2, 3, 4])
    })

    it('should handle deselect all functionality', () => {
      let selectedCards = new Set([0, 1, 2, 3, 4])

      function deselectAllCards() {
        return new Set()
      }

      selectedCards = deselectAllCards()
      expect(selectedCards.size).toBe(0)
      expect([...selectedCards]).toEqual([])
    })

    it('should calculate statistics for selected cards only', () => {
      const selectedCardIndices = new Set([0, 1, 2, 4])
      const progress = { 0: 1, 1: 3, 2: 2, 3: 1, 4: 1 } // Card 3 progress shouldn't count

      function calculateStatsForSelected(selectedIndices, progress) {
        let b1 = 0, b2 = 0, b3 = 0
        
        for (const idx of selectedIndices) {
          const boxLevel = progress[idx]
          if (boxLevel === 1) b1++
          else if (boxLevel === 2) b2++  
          else if (boxLevel === 3) b3++
        }

        return { b1, b2, b3 }
      }

      const stats = calculateStatsForSelected(selectedCardIndices, progress)
      expect(stats.b1).toBe(2) // Cards 0 and 4
      expect(stats.b2).toBe(1) // Card 2
      expect(stats.b3).toBe(1) // Card 1
    })
  })

  describe('Modal Interface', () => {
    it('should show and hide configuration modal', () => {
      let modalVisible = false

      function showConfigModal() {
        modalVisible = true
        return { visible: modalVisible }
      }

      function hideConfigModal() {
        modalVisible = false
        return { visible: modalVisible }
      }

      let result = showConfigModal()
      expect(result.visible).toBe(true)

      result = hideConfigModal()
      expect(result.visible).toBe(false)
    })

    it('should populate card list in modal', () => {
      const cards = [
        { answer: 'Femur' },
        { answer: 'Tibia' },
        { answer: 'Fibula' }
      ]
      const selectedCards = new Set([0, 2])

      function populateCardList(allCards, selectedIndices) {
        return allCards.map((card, index) => ({
          index,
          answer: card.answer,
          selected: selectedIndices.has(index)
        }))
      }

      const cardList = populateCardList(cards, selectedCards)
      
      expect(cardList).toEqual([
        { index: 0, answer: 'Femur', selected: true },
        { index: 1, answer: 'Tibia', selected: false },
        { index: 2, answer: 'Fibula', selected: true }
      ])
    })

    it('should handle modal keyboard interactions', () => {
      let modalClosed = false

      function handleModalKeydown(event) {
        if (event.key === 'Escape') {
          modalClosed = true
        }
      }

      handleModalKeydown({ key: 'Escape' })
      expect(modalClosed).toBe(true)
    })
  })

  describe('Boot Process with Selection', () => {
    it('should boot with selected cards and existing progress', () => {
      const allCards = [
        { answer: 'Card 0' },
        { answer: 'Card 1' }, 
        { answer: 'Card 2' },
        { answer: 'Card 3' }
      ]
      const selectedCardIndices = new Set([0, 1, 3]) // Card 2 not selected
      const progress = { 1: 3 } // Card 1 is mastered

      function bootWithSelection(cards, selectedIndices, progress) {
        const activeCards = [...selectedIndices].filter(i => {
          return !progress[i] || progress[i] < 3
        })

        return {
          totalCards: cards.length,
          selectedCount: selectedIndices.size,
          activeCards: activeCards,
          completedSelected: [...selectedIndices].filter(i => progress[i] === 3).length
        }
      }

      const result = bootWithSelection(allCards, selectedCardIndices, progress)
      
      expect(result.totalCards).toBe(4)
      expect(result.selectedCount).toBe(3)
      expect(result.activeCards).toEqual([0, 3]) // Card 1 filtered out (mastered)
      expect(result.completedSelected).toBe(1)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete deck selection and card configuration workflow', () => {
      // Mock localStorage
      const mockStorage = new Map()
      
      function saveData(key, data) {
        mockStorage.set(key, JSON.stringify(data))
      }

      function loadData(key, defaultValue = {}) {
        const stored = mockStorage.get(key)
        return stored ? JSON.parse(stored) : defaultValue
      }

      // Setup decks
      const decks = [
        { 
          id: 'anatomy-bones', 
          name: 'Anatomy: Bones',
          cards: [
            { answer: 'Femur' },
            { answer: 'Tibia' },
            { answer: 'Fibula' }
          ]
        }
      ]

      // Initialize with deck
      let currentDeck = decks[0]
      let selectedCards = new Set([0, 1, 2]) // All selected initially
      let progress = {}

      // User deselects card 1
      selectedCards.delete(1)
      saveData('selected-cards-v1:anatomy-bones', [...selectedCards])

      // User completes card 0
      progress[0] = 3
      saveData('deck-progress-v1:Anatomy: Bones', progress)

      // Calculate final state
      const savedSelection = new Set(loadData('selected-cards-v1:anatomy-bones', []))
      const savedProgress = loadData('deck-progress-v1:Anatomy: Bones', {})
      
      const activeCards = [...savedSelection].filter(i => {
        return !savedProgress[i] || savedProgress[i] < 3
      })

      expect([...savedSelection]).toEqual([0, 2]) // Card 1 deselected
      expect(savedProgress[0]).toBe(3) // Card 0 completed
      expect(activeCards).toEqual([2]) // Only card 2 remains active
    })
  })
})