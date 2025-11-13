// Flashcard utility functions extracted for testing
// These functions mirror the logic from index.astro (updated for optimized version)

export class FlashcardUtils {
  static seenKeyPrefix = 'deck-progress-v1:';

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

  // Calculate box progression (Leitner system)
  static calculateBoxProgression(currentBox, delta) {
    return Math.max(1, Math.min(3, (currentBox || 1) + delta));
  }

  // Filter active cards based on progress (cards not yet mastered)
  static filterActiveCards(cards, progress) {
    const knownCardIndexes = Object.keys(progress).map(Number);
    return cards
      .map((_, i) => i)
      .filter(i => !knownCardIndexes.includes(i) || progress[i] < 3);
  }

  // Update statistics - simplified for new architecture
  static calculateStats(progress, activeCards, totalCards) {
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
      completed: totalCards - activeCards.length,
      total: `${totalCards - activeCards.length}/${totalCards}`
    };
  }

  // Remove card from active session when answered correctly
  static removeCardFromSession(activeCards, cardIndex) {
    const index = activeCards.indexOf(cardIndex);
    if (index > -1) {
      const newActiveCards = [...activeCards];
      newActiveCards.splice(index, 1);
      return newActiveCards;
    }
    return activeCards;
  }

  // Check if card should be removed (reached box 3)
  static shouldRemoveCard(progress, cardIndex) {
    return progress[cardIndex] === 3;
  }

  // Reset progress completely
  static resetProgress() {
    return {};
  }

  // Validate card data structure (for static imports)
  static validateCardData(card) {
    return !!(
      card &&
      typeof card === 'object' &&
      card.image &&
      typeof card.answer === 'string' &&
      card.answer.trim().length > 0
    );
  }

  // Process image object (for Astro Image component)
  static processImageSrc(imageObj) {
    // Astro Image objects have a 'src' property
    return imageObj && typeof imageObj === 'object' && imageObj.src 
      ? imageObj.src 
      : imageObj;
  }
}