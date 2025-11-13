import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('Deck Selection UI Components', () => {
  let mockElements
  let mockEventListeners

  beforeEach(() => {
    // Reset DOM state
    document.body.innerHTML = ''
    mockEventListeners = new Map()
    
    // Mock DOM elements
    mockElements = {
      deckSelect: {
        value: 'anatomy-bones',
        onchange: null,
        innerHTML: '',
        appendChild: vi.fn(),
        addEventListener: vi.fn((event, handler) => {
          mockEventListeners.set(`deckSelect:${event}`, handler)
        })
      },
      configureBtn: {
        onclick: null,
        disabled: false,
        addEventListener: vi.fn((event, handler) => {
          mockEventListeners.set(`configureBtn:${event}`, handler)
        })
      },
      configModal: {
        hidden: true,
        addEventListener: vi.fn()
      },
      modalClose: {
        onclick: null,
        addEventListener: vi.fn((event, handler) => {
          mockEventListeners.set(`modalClose:${event}`, handler)
        })
      },
      cardList: {
        innerHTML: '',
        appendChild: vi.fn()
      },
      selectAll: {
        onclick: null,
        addEventListener: vi.fn((event, handler) => {
          mockEventListeners.set(`selectAll:${event}`, handler)
        })
      },
      deselectAll: {
        onclick: null,
        addEventListener: vi.fn((event, handler) => {
          mockEventListeners.set(`deselectAll:${event}`, handler)
        })
      },
      applyConfig: {
        onclick: null,
        addEventListener: vi.fn((event, handler) => {
          mockEventListeners.set(`applyConfig:${event}`, handler)
        })
      }
    }

    // Mock document.getElementById
    global.document.getElementById = vi.fn((id) => mockElements[id] || null)
    
    // Mock document.createElement
    global.document.createElement = vi.fn((tagName) => {
      if (tagName === 'option') {
        return {
          value: '',
          textContent: '',
          selected: false
        }
      }
      if (tagName === 'div') {
        return {
          className: '',
          appendChild: vi.fn(),
          innerHTML: ''
        }
      }
      if (tagName === 'input') {
        return {
          type: '',
          id: '',
          checked: false,
          onchange: null
        }
      }
      if (tagName === 'label') {
        return {
          htmlFor: '',
          textContent: ''
        }
      }
      return {}
    })

    // Mock document.addEventListener for keyboard events
    global.document.addEventListener = vi.fn((event, handler) => {
      mockEventListeners.set(`document:${event}`, handler)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Deck Selector Component', () => {
    it('should populate deck dropdown with available options', () => {
      const decks = [
        { id: 'anatomy-bones', name: 'Anatomy: Bones' },
        { id: 'anatomy-muscles', name: 'Anatomy: Muscles' }
      ]

      function populateDeckSelector(availableDecks, currentDeckId) {
        const selector = mockElements.deckSelect
        selector.innerHTML = ''
        
        const options = []
        for (const deck of availableDecks) {
          const option = document.createElement('option')
          option.value = deck.id
          option.textContent = deck.name
          option.selected = deck.id === currentDeckId
          selector.appendChild(option)
          options.push(option)
        }
        return options
      }

      const options = populateDeckSelector(decks, 'anatomy-bones')
      
      expect(options).toHaveLength(2)
      expect(options[0].value).toBe('anatomy-bones')
      expect(options[0].textContent).toBe('Anatomy: Bones')
      expect(options[0].selected).toBe(true)
      expect(options[1].selected).toBe(false)
      expect(mockElements.deckSelect.appendChild).toHaveBeenCalledTimes(2)
    })

    it('should handle deck selection change events', () => {
      let selectedDeck = null

      function handleDeckChange(event) {
        selectedDeck = event.target.value
        return selectedDeck
      }

      // Simulate deck change event
      const changeEvent = { target: { value: 'anatomy-muscles' } }
      const result = handleDeckChange(changeEvent)

      expect(result).toBe('anatomy-muscles')
      expect(selectedDeck).toBe('anatomy-muscles')
    })

    it('should update deck selector when switching decks programmatically', () => {
      function updateDeckSelector(deckId) {
        const selector = mockElements.deckSelect
        selector.value = deckId
        return selector.value
      }

      const result = updateDeckSelector('anatomy-muscles')
      expect(result).toBe('anatomy-muscles')
      expect(mockElements.deckSelect.value).toBe('anatomy-muscles')
    })
  })

  describe('Configuration Modal Component', () => {
    it('should show modal when configure button is clicked', () => {
      function showConfigModal() {
        const modal = mockElements.configModal
        modal.hidden = false
        return !modal.hidden
      }

      const isVisible = showConfigModal()
      expect(isVisible).toBe(true)
      expect(mockElements.configModal.hidden).toBe(false)
    })

    it('should hide modal when close button is clicked', () => {
      // Start with modal open
      mockElements.configModal.hidden = false

      function hideConfigModal() {
        const modal = mockElements.configModal
        modal.hidden = true
        return modal.hidden
      }

      const isHidden = hideConfigModal()
      expect(isHidden).toBe(true)
      expect(mockElements.configModal.hidden).toBe(true)
    })

    it('should populate card list with checkboxes', () => {
      const cards = [
        { answer: 'Femur' },
        { answer: 'Tibia' },
        { answer: 'Fibula' }
      ]
      const selectedIndices = new Set([0, 2])

      function populateCardList(allCards, selectedCardIndices) {
        const cardList = mockElements.cardList
        cardList.innerHTML = ''
        
        const cardItems = []
        
        allCards.forEach((card, index) => {
          const div = document.createElement('div')
          div.className = 'card-item'
          
          const checkbox = document.createElement('input')
          checkbox.type = 'checkbox'
          checkbox.id = `card-${index}`
          checkbox.checked = selectedCardIndices.has(index)
          
          const label = document.createElement('label')
          label.htmlFor = `card-${index}`
          label.textContent = card.answer
          
          div.appendChild(checkbox)
          div.appendChild(label)
          cardList.appendChild(div)
          
          cardItems.push({ div, checkbox, label })
        })
        
        return cardItems
      }

      const cardItems = populateCardList(cards, selectedIndices)
      
      expect(cardItems).toHaveLength(3)
      expect(cardItems[0].checkbox.checked).toBe(true)  // Index 0 selected
      expect(cardItems[1].checkbox.checked).toBe(false) // Index 1 not selected
      expect(cardItems[2].checkbox.checked).toBe(true)  // Index 2 selected
      expect(cardItems[1].label.textContent).toBe('Tibia')
      expect(mockElements.cardList.appendChild).toHaveBeenCalledTimes(3)
    })

    it('should handle checkbox toggle events', () => {
      let selectedCards = new Set([0, 2])

      function handleCheckboxChange(index, checked) {
        if (checked) {
          selectedCards.add(index)
        } else {
          selectedCards.delete(index)
        }
        return [...selectedCards].sort()
      }

      // Uncheck card 0
      let result = handleCheckboxChange(0, false)
      expect(result).toEqual([2])

      // Check card 1
      result = handleCheckboxChange(1, true)
      expect(result).toEqual([1, 2])
    })
  })

  describe('Modal Control Buttons', () => {
    it('should handle select all button click', () => {
      let selectedCards = new Set([0])
      const totalCards = 3

      function handleSelectAll() {
        selectedCards = new Set(Array.from({ length: totalCards }, (_, i) => i))
        return [...selectedCards]
      }

      const result = handleSelectAll()
      expect(result).toEqual([0, 1, 2])
      expect(selectedCards.size).toBe(3)
    })

    it('should handle deselect all button click', () => {
      let selectedCards = new Set([0, 1, 2])

      function handleDeselectAll() {
        selectedCards = new Set()
        return [...selectedCards]
      }

      const result = handleDeselectAll()
      expect(result).toEqual([])
      expect(selectedCards.size).toBe(0)
    })

    it('should apply configuration and save to storage', () => {
      const mockStorage = new Map()
      let selectedCards = new Set([0, 2])
      const deckId = 'anatomy-bones'

      function applyConfiguration(deckId, selectedCardIndices) {
        // Save to mock localStorage
        mockStorage.set(`selected-cards-v1:${deckId}`, JSON.stringify([...selectedCardIndices]))
        
        // Hide modal
        mockElements.configModal.hidden = true
        
        return {
          saved: mockStorage.has(`selected-cards-v1:${deckId}`),
          modalHidden: mockElements.configModal.hidden
        }
      }

      const result = applyConfiguration(deckId, selectedCards)
      
      expect(result.saved).toBe(true)
      expect(result.modalHidden).toBe(true)
      
      const saved = JSON.parse(mockStorage.get('selected-cards-v1:anatomy-bones'))
      expect(saved).toEqual([0, 2])
    })
  })

  describe('Keyboard Event Handling', () => {
    it('should close modal on Escape key press', () => {
      // Start with modal open
      mockElements.configModal.hidden = false

      function handleKeydown(event) {
        if (event.key === 'Escape' && !mockElements.configModal.hidden) {
          mockElements.configModal.hidden = true
          return true // Modal was closed
        }
        return false // No action taken
      }

      const wasHandled = handleKeydown({ key: 'Escape' })
      expect(wasHandled).toBe(true)
      expect(mockElements.configModal.hidden).toBe(true)
    })

    it('should not close modal on other key presses', () => {
      // Start with modal open
      mockElements.configModal.hidden = false

      function handleKeydown(event) {
        if (event.key === 'Escape' && !mockElements.configModal.hidden) {
          mockElements.configModal.hidden = true
          return true
        }
        return false
      }

      const wasHandled = handleKeydown({ key: 'Enter' })
      expect(wasHandled).toBe(false)
      expect(mockElements.configModal.hidden).toBe(false)
    })
  })

  describe('Event Listener Setup', () => {
    it('should set up all required event listeners', () => {
      function setupEventListeners() {
        const elements = mockElements
        
        // Setup deck selector
        elements.deckSelect.addEventListener('change', () => {})
        
        // Setup modal controls
        elements.configureBtn.addEventListener('click', () => {})
        elements.modalClose.addEventListener('click', () => {})
        elements.selectAll.addEventListener('click', () => {})
        elements.deselectAll.addEventListener('click', () => {})
        elements.applyConfig.addEventListener('click', () => {})
        
        // Setup keyboard events
        document.addEventListener('keydown', () => {})
        
        return true
      }

      const result = setupEventListeners()
      
      expect(result).toBe(true)
      expect(mockElements.deckSelect.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
      expect(mockElements.configureBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(mockElements.modalClose.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Integration with Flashcard System', () => {
    it('should update active cards when configuration changes', () => {
      const allCards = [
        { answer: 'Card 0' },
        { answer: 'Card 1' },
        { answer: 'Card 2' },
        { answer: 'Card 3' }
      ]
      let selectedCards = new Set([0, 1, 2, 3])
      let progress = { 1: 3, 2: 2 } // Card 1 mastered, Card 2 in progress

      function updateActiveCardsAfterConfig() {
        const activeCards = [...selectedCards].filter(i => {
          return !progress[i] || progress[i] < 3
        })
        
        return {
          totalCards: allCards.length,
          selectedCount: selectedCards.size,
          activeCards: activeCards,
          remainingCount: activeCards.length
        }
      }

      // Initial state - all cards selected
      let result = updateActiveCardsAfterConfig()
      expect(result.selectedCount).toBe(4)
      expect(result.activeCards).toEqual([0, 2, 3]) // Card 1 filtered out (mastered)
      expect(result.remainingCount).toBe(3)

      // User deselects card 3
      selectedCards.delete(3)
      result = updateActiveCardsAfterConfig()
      expect(result.selectedCount).toBe(3)
      expect(result.activeCards).toEqual([0, 2])
      expect(result.remainingCount).toBe(2)
    })

    it('should recalculate statistics when deck or selection changes', () => {
      const selectedCards = new Set([0, 1, 3, 4])
      const progress = { 0: 1, 1: 3, 2: 1, 3: 2, 4: 1 }

      function calculateUpdatedStats(selectedIndices, progressData) {
        let b1 = 0, b2 = 0, b3 = 0, remaining = 0

        for (const idx of selectedIndices) {
          const box = progressData[idx] || 0
          if (box === 1) b1++
          else if (box === 2) b2++
          else if (box === 3) b3++
          else remaining++ // Box 0 or undefined
        }

        const completedSelected = [...selectedIndices].filter(i => progressData[i] === 3).length
        
        return {
          b1,
          b2, 
          b3,
          remaining: selectedIndices.size - completedSelected,
          total: `${completedSelected}/${selectedIndices.size}`
        }
      }

      const stats = calculateUpdatedStats(selectedCards, progress)
      
      expect(stats.b1).toBe(2) // Cards 0 and 4
      expect(stats.b2).toBe(1) // Card 3
      expect(stats.b3).toBe(1) // Card 1
      expect(stats.remaining).toBe(3) // Total selected minus completed
      expect(stats.total).toBe('1/4') // 1 completed out of 4 selected
    })
  })
})