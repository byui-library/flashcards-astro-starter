// Flashcard utility functions extracted for testing
// These functions mirror the logic from index.astro

export class FlashcardUtils {
  static seenKeyPrefix = 'deck-progress-v1:';
  static selectedCardsKeyPrefix = 'selected-cards-v1:';

  // Load progress from localStorage
  static loadProgress(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  // Save progress to localStorage
  static saveProgress(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Load selected cards from localStorage
  static loadSelectedCards(deckFile, totalCards = 0) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.selectedCardsKeyPrefix + deckFile) || '[]');
      if (saved.length > 0 && totalCards > 0) {
        // Filter out any indices that are no longer valid
        return saved.filter(index => index < totalCards);
      }
      return Array.from({ length: totalCards }, (_, index) => index);
    } catch {
      return Array.from({ length: totalCards }, (_, index) => index);
    }
  }

  // Save selected cards to localStorage
  static saveSelectedCards(deckFile, selected) {
    localStorage.setItem(this.selectedCardsKeyPrefix + deckFile, JSON.stringify(selected));
  }

  // Calculate box progression (Leitner system)
  static calculateBoxProgression(currentBox, delta) {
    return Math.max(1, Math.min(3, (currentBox || 1) + delta));
  }

  // Update statistics
  static calculateStats(progress, activeCards, selectedCards, totalCards) {
    let b1 = 0, b2 = 0, b3 = 0;
    
    for (const k in progress) {
      const v = progress[k];
      if (v === 1) b1++;
      else if (v === 2) b2++;
      else if (v === 3) b3++;
    }
    
    return {
      box1: b1,
      box2: b2,
      box3: b3,
      remaining: activeCards.length,
      total: `${selectedCards.length}/${totalCards}`
    };
  }

  // Validate card selection
  static validateCardSelection(selectedCards, totalCards) {
    if (!Array.isArray(selectedCards)) return false;
    if (selectedCards.length === 0) return false;
    
    // Check all indices are valid
    return selectedCards.every(index => 
      typeof index === 'number' && 
      index >= 0 && 
      index < totalCards
    );
  }

  // Toggle select all functionality
  static toggleSelectAll(currentSelection, totalCards, selectAll) {
    if (selectAll) {
      return Array.from({ length: totalCards }, (_, index) => index);
    } else {
      return [];
    }
  }

  // Remove card from active session
  static removeCardFromSession(activeCards, cardIndex) {
    const index = activeCards.indexOf(cardIndex);
    if (index > -1) {
      const newActiveCards = [...activeCards];
      newActiveCards.splice(index, 1);
      return newActiveCards;
    }
    return activeCards;
  }
}