import { describe, it, expect, beforeEach, vi } from 'vitest'

// Minimal harness that mirrors the relevant subset of FlashcardApp behavior.
// We test setMedia, playCardVideo, and stopCardVideo by constructing the
// methods on a plain object with stub DOM elements.

function makeStubElement(extras = {}) {
  return {
    src: '',
    alt: '',
    hidden: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    currentTime: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...extras
  }
}

function makeApp() {
  const img = makeStubElement()
  const video = makeStubElement()
  const badge = makeStubElement({ hidden: true })

  const app = {
    img,
    video,
    badge,
    optimizedImagePathsByDeck: {
      knee: ['/img/0.webp', '/img/1.webp']
    },
    optimizedVideoPathsByDeck: {
      knee: [null, '/vid/1.mp4']
    },
    currentDeck: { id: 'knee' },
    allCards: [
      { answer: 'a0', alt: 'alt0', video: null },
      { answer: 'a1', alt: 'alt1', video: '/vid/1.mp4' }
    ],
    videoPlaying: false
  }

  // Methods under test — these mirror the implementation that will be
  // added to flashcard-app.js. They're copy-pasted here as the contract.
  app.setMedia = function (cardIndex) {
    const card = this.allCards[cardIndex]
    const imagePath = this.optimizedImagePathsByDeck[this.currentDeck.id][cardIndex]
    const videoPath = this.optimizedVideoPathsByDeck[this.currentDeck.id][cardIndex]

    this.img.src = imagePath
    this.img.alt = card.alt || card.answer || 'Flashcard image'
    this.img.hidden = false

    if (videoPath) {
      this.video.src = videoPath
      this.video.hidden = true
      this.badge.hidden = false
    } else {
      this.video.removeAttribute && this.video.removeAttribute('src')
      this.video.src = ''
      this.video.hidden = true
      this.badge.hidden = true
    }
    this.videoPlaying = false
  }

  app.playCardVideo = function () {
    if (!this.video.src || this.videoPlaying) return
    this.img.hidden = true
    this.badge.hidden = true
    this.video.hidden = false
    this.videoPlaying = true
    this.video.play()
  }

  app.stopCardVideo = function () {
    if (!this.videoPlaying) return
    this.video.pause()
    this.video.currentTime = 0
    this.video.hidden = true
    this.img.hidden = false
    if (this.video.src) this.badge.hidden = false
    this.videoPlaying = false
  }

  return app
}

describe('setMedia', () => {
  it('image-only card hides video and badge', () => {
    const app = makeApp()
    app.setMedia(0)
    expect(app.img.src).toBe('/img/0.webp')
    expect(app.img.hidden).toBe(false)
    expect(app.video.hidden).toBe(true)
    expect(app.badge.hidden).toBe(true)
  })

  it('video card sets video src and shows badge', () => {
    const app = makeApp()
    app.setMedia(1)
    expect(app.img.src).toBe('/img/1.webp')
    expect(app.video.src).toBe('/vid/1.mp4')
    expect(app.video.hidden).toBe(true)
    expect(app.badge.hidden).toBe(false)
  })

  it('switching from video card to image-only card clears badge', () => {
    const app = makeApp()
    app.setMedia(1)
    app.setMedia(0)
    expect(app.badge.hidden).toBe(true)
    expect(app.video.src).toBe('')
  })
})

describe('playCardVideo', () => {
  it('on a video card hides image and plays video', () => {
    const app = makeApp()
    app.setMedia(1)
    app.playCardVideo()
    expect(app.img.hidden).toBe(true)
    expect(app.badge.hidden).toBe(true)
    expect(app.video.hidden).toBe(false)
    expect(app.video.play).toHaveBeenCalledOnce()
  })

  it('on an image-only card is a no-op', () => {
    const app = makeApp()
    app.setMedia(0)
    app.playCardVideo()
    expect(app.video.play).not.toHaveBeenCalled()
    expect(app.img.hidden).toBe(false)
  })

  it('calling twice does not double-play', () => {
    const app = makeApp()
    app.setMedia(1)
    app.playCardVideo()
    app.playCardVideo()
    expect(app.video.play).toHaveBeenCalledOnce()
  })
})

describe('stopCardVideo', () => {
  it('pauses, resets, restores image and badge', () => {
    const app = makeApp()
    app.setMedia(1)
    app.playCardVideo()
    app.stopCardVideo()
    expect(app.video.pause).toHaveBeenCalledOnce()
    expect(app.video.currentTime).toBe(0)
    expect(app.video.hidden).toBe(true)
    expect(app.img.hidden).toBe(false)
    expect(app.badge.hidden).toBe(false)
  })

  it('on a card that never started video is a no-op', () => {
    const app = makeApp()
    app.setMedia(1)
    app.stopCardVideo()
    expect(app.video.pause).not.toHaveBeenCalled()
  })
})
