import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listRecentTrips, pruneRecentTrips, rememberTrip } from './recentTrips'

function makeStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

const trip = (n) => ({ id: `id${n}`, name: `Trip ${n}`, slug: `slug${n}` })

describe('recentTrips', () => {
  beforeEach(() => {
    globalThis.localStorage = makeStorage()
  })
  afterEach(() => {
    delete globalThis.localStorage
  })

  it('returns [] when nothing is stored', () => {
    expect(listRecentTrips()).toEqual([])
  })

  it('adds new trips to the front (most recent first)', () => {
    rememberTrip(trip(1), 1)
    rememberTrip(trip(2), 2)
    expect(listRecentTrips().map((t) => t.slug)).toEqual(['slug2', 'slug1'])
  })

  it('de-dupes by slug and moves the re-opened trip to the front', () => {
    rememberTrip(trip(1), 1)
    rememberTrip(trip(2), 2)
    rememberTrip(trip(1), 3)
    const slugs = listRecentTrips().map((t) => t.slug)
    expect(slugs).toEqual(['slug1', 'slug2'])
    expect(listRecentTrips()[0].lastOpenedAt).toBe(3)
  })

  it('caps the list at 8', () => {
    for (let i = 1; i <= 10; i++) rememberTrip(trip(i), i)
    const list = listRecentTrips()
    expect(list).toHaveLength(8)
    expect(list[0].slug).toBe('slug10') // newest kept
    expect(list.some((t) => t.slug === 'slug1')).toBe(false) // oldest dropped
  })

  it('does not throw when storage is unavailable', () => {
    delete globalThis.localStorage
    expect(() => rememberTrip(trip(1))).not.toThrow()
    expect(listRecentTrips()).toEqual([])
  })

  describe('pruneRecentTrips', () => {
    it('drops trips whose slug is not in the keep set', () => {
      rememberTrip(trip(1), 1)
      rememberTrip(trip(2), 2)
      rememberTrip(trip(3), 3)
      const kept = pruneRecentTrips(new Set(['slug1', 'slug3']))
      expect(kept.map((t) => t.slug)).toEqual(['slug3', 'slug1'])
      // Persisted, so a fresh read reflects the prune.
      expect(listRecentTrips().map((t) => t.slug)).toEqual(['slug3', 'slug1'])
    })

    it('accepts an array of slugs and can empty the list', () => {
      rememberTrip(trip(1), 1)
      rememberTrip(trip(2), 2)
      expect(pruneRecentTrips(['slug2'])).toEqual([
        expect.objectContaining({ slug: 'slug2' }),
      ])
      expect(pruneRecentTrips([])).toEqual([])
      expect(listRecentTrips()).toEqual([])
    })

    it('leaves the list untouched when everything still exists', () => {
      rememberTrip(trip(1), 1)
      rememberTrip(trip(2), 2)
      const kept = pruneRecentTrips(['slug1', 'slug2'])
      expect(kept.map((t) => t.slug)).toEqual(['slug2', 'slug1'])
    })
  })
})
