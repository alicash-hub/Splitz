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

  it('understands Arabic', () => {
    expect(categoryEmoji('عشاء في زوبا')).toBe('🍽️')
    expect(categoryEmoji('قهوة')).toBe('☕')
    expect(categoryEmoji('بنزين العربية')).toBe('⛽')
    expect(categoryEmoji('شاليه الساحل')).toBe('🏠')
  })

  it('understands Franco-Arabic', () => {
    expect(categoryEmoji('3asha m3a el shabab')).toBe('🍽️')
    expect(categoryEmoji('2ahwa')).toBe('☕')
    expect(categoryEmoji('banzine')).toBe('⛽')
  })

  it('only matches at a word start (no mid-word false hits)', () => {
    expect(categoryEmoji('Trip to Las Vegas')).toBe('🧾') // not ⛽ from "gas"
  })

  it('falls back to a receipt when blank or unrecognized', () => {
    expect(categoryEmoji('')).toBe('🧾')
    expect(categoryEmoji('   ')).toBe('🧾')
    expect(categoryEmoji(null)).toBe('🧾')
    expect(categoryEmoji('random note')).toBe('🧾')
  })
})
