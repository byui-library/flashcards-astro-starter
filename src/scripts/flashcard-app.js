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
    this.optimizedVideoPathsByDeck = config.optimizedVideoPathsByDeck || {};
    this.videoPlaying = false;

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
      <rect width="400" height="400" fill="#F5F9FC"/>
      <circle cx="200" cy="180" r="120" fill="#A0D4ED" opacity="0.5"/>
      <path d="M200 80 L220 140 L285 140 L232 178 L252 238 L200 200 L148 238 L168 178 L115 140 L180 140 Z" fill="#006EB6" stroke="#214491" stroke-width="3"/>
      <circle cx="200" cy="160" r="30" fill="#4F9ACF"/>
      <text x="200" y="320" text-anchor="middle" font-family="Source Sans 3, system-ui, sans-serif" font-size="28" font-weight="bold" fill="#006EB6">Complete!</text>
      <text x="200" y="355" text-anchor="middle" font-family="Source Sans 3, system-ui, sans-serif" font-size="16" fill="#949598">All cards mastered</text>
    </svg>`)}`;
  }

  // Card rendering
  render() {
    const front = this.$('card-image') || document.querySelector('#front-wrapper img');
    const back = this.$('back');

    if (this.activeCards.length === 0) {
      front.src = this.getCompletionImage();
      front.alt = 'All cards completed!';
      front.hidden = false;
      this.$('card-video').hidden = true;
      this.$('video-badge').hidden = true;
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

    this.setMedia(cardIndex);
    back.textContent = card.answer;
    back.hidden = this.showingFront;

    this.$('flip').disabled = false;
    this.$('knew').disabled = false;
    this.$('missed').disabled = false;
    this.$('next').disabled = false;
  }

  // Set image and video src for a card; show badge if card has video
  setMedia(cardIndex) {
    const card = this.allCards[cardIndex];
    const img = this.$('card-image') || document.querySelector('#front-wrapper img');
    const video = this.$('card-video');
    const badge = this.$('video-badge');

    const imagePath = this.optimizedImagePathsByDeck[this.currentDeck.id][cardIndex];
    const videoPath = (this.optimizedVideoPathsByDeck[this.currentDeck.id] || [])[cardIndex] || null;

    img.src = imagePath;
    img.alt = card.alt || card.answer || 'Flashcard image';
    img.hidden = false;

    if (videoPath) {
      if (video.getAttribute('src') !== videoPath) video.src = videoPath;
      video.hidden = true;
      badge.hidden = false;
    } else {
      video.removeAttribute('src');
      video.load();
      video.hidden = true;
      badge.hidden = true;
    }
    this.videoPlaying = false;
  }

  // Swap image -> video and start playback (loops, muted)
  playCardVideo() {
    const video = this.$('card-video');
    if (!video.src || this.videoPlaying) return;

    const img = this.$('card-image') || document.querySelector('#front-wrapper img');
    const badge = this.$('video-badge');

    img.hidden = true;
    badge.hidden = true;
    video.hidden = false;
    this.videoPlaying = true;

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => this.handleVideoError());
    }
  }

  // Stop video, reset, restore image and badge
  stopCardVideo() {
    if (!this.videoPlaying) return;
    const video = this.$('card-video');
    const img = this.$('card-image') || document.querySelector('#front-wrapper img');
    const badge = this.$('video-badge');

    video.pause();
    video.currentTime = 0;
    video.hidden = true;
    img.hidden = false;
    if (video.src) badge.hidden = false;
    this.videoPlaying = false;
  }

  // Fallback: video errored (offline + uncached, codec issue, etc.)
  handleVideoError() {
    this.stopCardVideo();
    this.showToast('Video not available offline yet.');
  }

  // Simple non-blocking toast
  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  // Warm the runtime cache with all video URLs in the background
  prefetchVideos() {
    const urls = new Set();
    for (const deckId of Object.keys(this.optimizedVideoPathsByDeck)) {
      for (const url of this.optimizedVideoPathsByDeck[deckId] || []) {
        if (url) urls.add(url);
      }
    }
    if (urls.size === 0) return;

    const queue = [...urls];
    const concurrency = 2;
    const next = () => {
      const url = queue.shift();
      if (!url) return;
      fetch(url, { cache: 'default', credentials: 'same-origin' })
        .catch(() => { /* swallow — runtime cache will warm on first play */ })
        .finally(next);
    };
    for (let i = 0; i < concurrency; i++) next();
  }

  // Progress management
  setBox(delta) {
    this.stopCardVideo();
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
    this.stopCardVideo();
    if (this.activeCards.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.activeCards.length;
    this.showingFront = true;
    this.render();
  }

  flip() {
    this.stopCardVideo();
    this.showingFront = !this.showingFront;
    this.render();
  }

  // Deck management
  switchDeck(deckId) {
    this.stopCardVideo();
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
    this.stopCardVideo();
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
    this.stopCardVideo();
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

    // Video badge and error handling
    this.$('video-badge').onclick = (e) => {
      e.stopPropagation();
      this.playCardVideo();
    };
    this.$('card-video').addEventListener('error', () => this.handleVideoError());

    // Card click and keyboard
    this.$('card').onclick = (e) => {
      const img = this.$('card-image') || document.querySelector('#front-wrapper img');
      if (e.target === img && !this.$('video-badge').hidden) {
        this.playCardVideo();
        return;
      }
      this.flip();
    };
    this.$('card').onkeydown = (e) => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        this.flip();
      }
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowUp') this.$('knew').click();
      if (e.key === 'ArrowDown') this.$('missed').click();
      if (e.key === 'r' || e.key === 'R') this.resetDeck();
      if (e.key === 'v' || e.key === 'V') this.playCardVideo();
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

    // Warm the cache after the app has settled
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
    schedule(() => this.prefetchVideos());
  }
}

// Export for use in Astro page
window.FlashcardApp = FlashcardApp;