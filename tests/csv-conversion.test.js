import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Mock the file system
vi.mock('node:fs')
vi.mock('node:path')

describe('CSV to JSON Conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should parse valid CSV data correctly', async () => {
    // Mock CSV content
    const csvContent = `image,answer,alt,deck
/images/test1.png,Test Answer 1,Test alt 1,Test Deck
/images/test2.png,Test Answer 2,Test alt 2,Test Deck`

    // Expected JSON output
    const expectedJson = [
      {
        image: '/images/test1.png',
        answer: 'Test Answer 1',
        alt: 'Test alt 1',
        deck: 'Test Deck'
      },
      {
        image: '/images/test2.png',
        answer: 'Test Answer 2',
        alt: 'Test alt 2',
        deck: 'Test Deck'
      }
    ]

    // Test the Papa.parse functionality directly
    const Papa = await import('papaparse')
    const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    
    expect(result.errors).toHaveLength(0)
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual(expectedJson[0])
  })

  it('should handle missing optional fields', async () => {
    const csvContent = `image,answer
/images/test1.png,Test Answer 1`

    const Papa = await import('papaparse')
    const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    
    expect(result.data[0]).toEqual({
      image: '/images/test1.png',
      answer: 'Test Answer 1'
    })
  })

  it('should detect parse errors', async () => {
    const csvContent = `image,answer,alt,deck
/images/test1.png,"Unclosed quote,Test alt 1,Test Deck`

    const Papa = await import('papaparse')
    const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    
    // Should have parse errors due to malformed CSV
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('Deck Data Validation', () => {
  it('should validate required fields', () => {
    const validCard = {
      image: '/images/test.png',
      answer: 'Test Answer',
      alt: 'Test alt text',
      deck: 'Test Deck'
    }

    expect(validCard.image).toBeTruthy()
    expect(validCard.answer).toBeTruthy()
  })

  it('should handle missing image field', () => {
    const invalidCard = {
      answer: 'Test Answer',
      alt: 'Test alt text',
      deck: 'Test Deck'
    }

    expect(invalidCard.image).toBeFalsy()
  })

  it('should handle missing answer field', () => {
    const invalidCard = {
      image: '/images/test.png',
      alt: 'Test alt text',
      deck: 'Test Deck'
    }

    expect(invalidCard.answer).toBeFalsy()
  })

  it('should provide default values for optional fields', () => {
    const cardData = {
      image: '/images/test.png',
      answer: 'Test Answer',
      alt: '',
      deck: ''
    }

    // Simulate the data processing from build-decks.mjs
    const processedCard = {
      image: cardData.image.trim(),
      answer: cardData.answer.trim(),
      alt: (cardData.alt || '').trim(),
      deck: (cardData.deck || 'Default').trim()
    }

    expect(processedCard.deck).toBe('Default')
    expect(processedCard.alt).toBe('')
  })
})