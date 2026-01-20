// Flashcard Application Logic
class FlashcardApp {
  constructor(config) {
    this.seenKeyPrefix = 'deck-progress-v1:';
    this.selectedCardsKeyPrefix = 'selected-cards-v1:';
    
    this.currentDeck = config.availableDecks[0];
    this.allCards = this.currentDeck.cards;
    this.selectedCardIndices = new Set();
    this.activeCards = [];
    this.currentIndex = 0;
    this.showingFront = true;
    this.progress = {};
    
    // Store config
    this.availableDecks = config.availableDecks;
    this.optimizedImagePathsByDeck = config.optimizedImagePathsByDeck;
    
    this.init();
  }

  // Utility function for DOM selection
  $(id) {
    return document.getElementById(id);
  }

  // localStorage utilities
  loadProgress(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  saveProgress(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  loadSelectedCards(deckId) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.selectedCardsKeyPrefix + deckId) || 'null');
      return saved ? new Set(saved) : null;
    } catch {
      return null;
    }
  }

  saveSelectedCards(deckId, selectedSet) {
    localStorage.setItem(this.selectedCardsKeyPrefix + deckId, JSON.stringify([...selectedSet]));
  }

  // Statistics management
  updateStats() {
    let b1 = 0, b2 = 0, b3 = 0;
    const selectedIndices = [...this.selectedCardIndices];

    for (const k in this.progress) {
      const idx = parseInt(k);
      if (this.selectedCardIndices.has(idx)) {
        const v = this.progress[k];
        if (v === 1) b1++;
        else if (v === 2) b2++;
        else if (v === 3) b3++;
      }
    }

    this.$('b1').textContent = b1;
    this.$('b2').textContent = b2;
    this.$('b3').textContent = b3;
    this.$('remaining').textContent = this.activeCards.length;

    const completedSelected = selectedIndices.length - this.activeCards.length;
    this.$('total').textContent = `${completedSelected}/${selectedIndices.length}`;
  }

  // Celebration SVG for completion state (trophy icon)
  getCompletionImage() {
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
      <rect width="400" height="400" fill="#0f172a"/>
      <circle cx="200" cy="180" r="120" fill="#1e3a5f" opacity="0.5"/>
      <path d="M200 80 L220 140 L285 140 L232 178 L252 238 L200 200 L148 238 L168 178 L115 140 L180 140 Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="3"/>
      <circle cx="200" cy="160" r="30" fill="#fef3c7"/>
      <text x="200" y="320" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#22c55e">🎉 Complete! 🎉</text>
      <text x="200" y="355" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#94a3b8">All cards mastered</text>
    </svg>`)}`;
  }

  // Card rendering
  render() {
    const front = document.querySelector('#front-wrapper img');
    const back = this.$('back');

    if (this.activeCards.length === 0) {
      front.src = this.getCompletionImage();
      front.alt = 'All cards completed!';
      back.textContent = 'You have successfully identified all selected cards! Configure cards to select more or push reset to start over.';
      back.hidden = false;
      this.$('flip').disabled = true;
      this.$('knew').disabled = true;
      this.$('missed').disabled = true;
      this.$('next').disabled = true;
      return;
    }

    if (this.currentIndex >= this.activeCards.length) this.currentIndex = 0;

    const cardIndex = this.activeCards[this.currentIndex];
    const card = this.allCards[cardIndex];
    if (!card) return;

    const currentDeckImages = this.optimizedImagePathsByDeck[this.currentDeck.id];
    front.src = currentDeckImages[cardIndex];
    front.alt = card.alt || card.answer || 'Flashcard image';
    back.textContent = card.answer;
    back.hidden = this.showingFront;

    this.$('flip').disabled = false;
    this.$('knew').disabled = false;
    this.$('missed').disabled = false;
    this.$('next').disabled = false;
  }

  // Progress management
  setBox(delta) {
    if (this.activeCards.length === 0) return;

    const cardIndex = this.activeCards[this.currentIndex];
    const val = Math.max(1, Math.min(3, (this.progress[cardIndex] || 1) + delta));
    this.progress[cardIndex] = val;

    if (delta > 0) {
      this.activeCards.splice(this.currentIndex, 1);
      if (this.currentIndex >= this.activeCards.length && this.activeCards.length > 0) {
        this.currentIndex = 0;
      }
    }

    this.updateStats();
    this.updateResetButton();
    this.saveProgress(this.seenKeyPrefix + this.currentDeck.name, this.progress);

    if (this.activeCards.length === 0) {
      this.render();
    }
  }

  // Navigation
  next() {
    if (this.activeCards.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.activeCards.length;
    this.showingFront = true;
    this.render();
  }

  flip() {
    this.showingFront = !this.showingFront;
    this.render();
  }

  // Deck management
  switchDeck(deckId) {
    const deck = this.availableDecks.find(d => d.id === deckId);
    if (!deck) return;

    this.currentDeck = deck;
    this.allCards = deck.cards;

    const saved = this.loadSelectedCards(deckId);
    if (saved) {
      this.selectedCardIndices = saved;
    } else {
      this.selectedCardIndices = new Set(this.allCards.map((_, i) => i));
      this.saveSelectedCards(deckId, this.selectedCardIndices);
    }

    this.boot();
  }

  resetDeck() {
    this.progress = {};
    this.saveProgress(this.seenKeyPrefix + this.currentDeck.name, this.progress);
    this.boot();
  }

  updateResetButton() {
    const resetBtn = this.$('reset');
    if (this.activeCards.length < this.allCards.length) {
      resetBtn.hidden = false;
    } else {
      resetBtn.hidden = true;
    }
  }

  // Modal management
  showConfigModal() {
    this.populateCardList();
    this.$('configModal').hidden = false;
  }

  hideConfigModal() {
    this.$('configModal').hidden = true;
  }

  populateCardList() {
    const cardList = this.$('cardList');
    cardList.innerHTML = '';

    this.allCards.forEach((card, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `card-${index}`;
      checkbox.checked = this.selectedCardIndices.has(index);
      checkbox.onchange = () => {
        if (checkbox.checked) {
          this.selectedCardIndices.add(index);
        } else {
          this.selectedCardIndices.delete(index);
        }
      };

      const label = document.createElement('label');
      label.htmlFor = `card-${index}`;
      label.textContent = card.answer;

      div.appendChild(checkbox);
      div.appendChild(label);
      cardList.appendChild(div);
    });
  }

  selectAllCards() {
    this.selectedCardIndices = new Set(this.allCards.map((_, i) => i));
    this.populateCardList();
  }

  deselectAllCards() {
    this.selectedCardIndices = new Set();
    this.populateCardList();
  }

  applyConfiguration() {
    this.saveSelectedCards(this.currentDeck.id, this.selectedCardIndices);
    this.hideConfigModal();
    this.boot();
  }

  // Application bootstrap
  boot() {
    this.progress = this.loadProgress(this.seenKeyPrefix + this.currentDeck.name);

    const selectedIndices = [...this.selectedCardIndices];
    const knownCardIndexes = Object.keys(this.progress).map(Number);

    this.activeCards = selectedIndices.filter(i => {
      return !knownCardIndexes.includes(i) || this.progress[i] < 3;
    });

    this.currentIndex = 0;
    this.showingFront = true;
    this.render();
    this.updateStats();
    this.updateResetButton();
  }

  // Event handlers setup
  setupEventListeners() {
    // Card interactions
    this.$('flip').onclick = () => this.flip();
    this.$('knew').onclick = () => {
      this.setBox(+1);
      if (this.activeCards.length > 0) {
        this.next();
      }
    };
    this.$('missed').onclick = () => {
      this.setBox(-2);
      this.next();
    };
    this.$('next').onclick = () => this.next();
    this.$('reset').onclick = () => this.resetDeck();

    // Card click and keyboard
    this.$('card').onclick = () => this.flip();
    this.$('card').onkeydown = (e) => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        this.flip();
      }
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowUp') this.$('knew').click();
      if (e.key === 'ArrowDown') this.$('missed').click();
      if (e.key === 'r' || e.key === 'R') this.resetDeck();
    };

    // Deck selection
    this.$('deckSelect').onchange = (e) => this.switchDeck(e.target.value);

    // Modal controls
    this.$('configureBtn').onclick = () => this.showConfigModal();
    this.$('modalClose').onclick = () => this.hideConfigModal();
    this.$('cancelConfig').onclick = () => this.hideConfigModal();
    this.$('selectAll').onclick = () => this.selectAllCards();
    this.$('deselectAll').onclick = () => this.deselectAllCards();
    this.$('applyConfig').onclick = () => this.applyConfiguration();

    // Global keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.$('configModal').hidden) {
        this.hideConfigModal();
      }
    });
  }

  // Initialize application
  init() {
    this.setupEventListeners();
    this.switchDeck(this.availableDecks[0].id);
  }
}

// Export for use in Astro page
window.FlashcardApp = FlashcardApp;