import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const ROOT = path.resolve(import.meta.dirname, '..')
const DECKS_DIR = path.join(ROOT, 'decks')
const IMAGES_DIR = path.join(ROOT, 'src', 'assets', 'images')

// Read all CSV files from decks/
const csvFiles = fs.readdirSync(DECKS_DIR).filter(f => f.endsWith('.csv'))
const allRows = []

for (const file of csvFiles) {
  const csv = fs.readFileSync(path.join(DECKS_DIR, file), 'utf-8')
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  for (const row of parsed.data) {
    allRows.push({ ...row, _sourceFile: file })
  }
}

// Read all image files from src/assets/images/
const imageFiles = fs.readdirSync(IMAGES_DIR)

const VIDEOS_DIR = path.join(ROOT, 'src', 'assets', 'videos')
const videoFiles = fs.existsSync(VIDEOS_DIR) ? fs.readdirSync(VIDEOS_DIR) : []

describe('CSV data integrity', () => {
  it('should have at least one CSV file in decks/', () => {
    expect(csvFiles.length).toBeGreaterThan(0)
  })

  it('should have valid headers (image, answer, alt, deck)', () => {
    for (const file of csvFiles) {
      const csv = fs.readFileSync(path.join(DECKS_DIR, file), 'utf-8')
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const headers = parsed.meta.fields
      expect(headers, `Missing headers in ${file}`).toEqual(
        expect.arrayContaining(['image', 'answer', 'alt', 'deck'])
      )
    }
  })

  it('every row should have a non-empty image field', () => {
    for (const row of allRows) {
      expect(row.image?.trim().length, `Empty image in ${row._sourceFile}`).toBeGreaterThan(0)
    }
  })

  it('every row should have a non-empty answer field', () => {
    for (const row of allRows) {
      expect(row.answer?.trim().length, `Empty answer in ${row._sourceFile}`).toBeGreaterThan(0)
    }
  })

  it('every row should have a non-empty deck field', () => {
    for (const row of allRows) {
      expect(row.deck?.trim().length, `Empty deck in ${row._sourceFile}`).toBeGreaterThan(0)
    }
  })

  it('should not have duplicate image references', () => {
    const images = allRows.map(r => r.image.trim())
    const duplicates = images.filter((img, i) => images.indexOf(img) !== i)
    expect(duplicates, `Duplicate images: ${duplicates.join(', ')}`).toEqual([])
  })
})

describe('Image file references', () => {
  it('every CSV image should exist on disk', () => {
    const missing = []
    for (const row of allRows) {
      const imageFile = row.image.trim()
      if (!imageFiles.includes(imageFile)) {
        missing.push(`${imageFile} (from ${row._sourceFile})`)
      }
    }
    expect(missing, `Missing images:\n${missing.join('\n')}`).toEqual([])
  })

  it('every image on disk should be referenced in a CSV', () => {
    const referencedImages = new Set(allRows.map(r => r.image.trim()))
    const orphans = imageFiles.filter(f => !referencedImages.has(f))
    expect(orphans, `Orphan images not in any CSV:\n${orphans.join('\n')}`).toEqual([])
  })
})

describe('Video file references', () => {
  it('every non-empty CSV video should exist on disk', () => {
    const missing = []
    for (const row of allRows) {
      const videoFile = (row.video || '').trim()
      if (videoFile && !videoFiles.includes(videoFile)) {
        missing.push(`${videoFile} (from ${row._sourceFile})`)
      }
    }
    expect(missing, `Missing videos:\n${missing.join('\n')}`).toEqual([])
  })

  it('every video on disk should be referenced in a CSV', () => {
    const referencedVideos = new Set(
      allRows.map(r => (r.video || '').trim()).filter(Boolean)
    )
    const orphans = videoFiles.filter(f => !referencedVideos.has(f))
    expect(orphans, `Orphan videos not in any CSV:\n${orphans.join('\n')}`).toEqual([])
  })

  it('every video file should be an mp4', () => {
    const nonMp4 = videoFiles.filter(f => !f.toLowerCase().endsWith('.mp4'))
    expect(nonMp4, `Non-mp4 files in videos dir: ${nonMp4.join(', ')}`).toEqual([])
  })
})

describe('Deck grouping', () => {
  it('should have cards in every declared deck', () => {
    const decks = new Map()
    for (const row of allRows) {
      const deck = row.deck.trim()
      decks.set(deck, (decks.get(deck) || 0) + 1)
    }

    for (const [name, count] of decks) {
      expect(count, `Deck "${name}" has no cards`).toBeGreaterThan(0)
    }
  })

  it('should produce valid JS identifiers for deck names', () => {
    const deckNames = [...new Set(allRows.map(r => r.deck.trim()))]
    for (const name of deckNames) {
      const identifier = name
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/_([a-z])/g, (_, c) => c.toUpperCase())
        .replace(/^_|_$/g, '')
      expect(identifier.length, `Deck "${name}" produces empty identifier`).toBeGreaterThan(0)
      expect(/^[a-zA-Z_$]/.test(identifier), `Deck "${name}" → "${identifier}" is not a valid JS identifier`).toBe(true)
    }
  })
})
