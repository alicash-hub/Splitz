import { describe, expect, it } from 'vitest'
import { categoryEmoji } from './format'

describe('categoryEmoji', () => {
  it('maps common expenses to an emoji (case-insensitive)', () => {
    expect(categoryEmoji('Dinner at Zööba')).toBe('🍽️')
    expect(categoryEmoji('Gas — road trip')).toBe('⛽')
    expect(categoryEmoji('Chalet — 2 nights')).toBe('🏠')
    expect(categoryEmoji('Groceries')).toBe('🛒')
    expect(categoryEmoji('UBER to the beach')).toBe('🚗')
  })

  it('falls back to a receipt when blank or unrecognized', () => {
    expect(categoryEmoji('')).toBe('🧾')
    expect(categoryEmoji('   ')).toBe('🧾')
    expect(categoryEmoji(null)).toBe('🧾')
    expect(categoryEmoji('random note')).toBe('🧾')
  })
})
