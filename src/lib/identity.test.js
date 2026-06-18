import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getCachedMemberId,
  setCachedMemberId,
  clearCachedMemberId,
} from './identity'

// Minimal in-memory localStorage stub so we can test without jsdom.
function makeStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

describe('identity', () => {
  beforeEach(() => {
    globalThis.localStorage = makeStorage()
  })
  afterEach(() => {
    delete globalThis.localStorage
  })

  it('returns null when nothing is cached', () => {
    expect(getCachedMemberId('trip-1')).toBeNull()
  })

  it('round-trips a member id per trip', () => {
    setCachedMemberId('trip-1', 'member-a')
    setCachedMemberId('trip-2', 'member-b')
    expect(getCachedMemberId('trip-1')).toBe('member-a')
    expect(getCachedMemberId('trip-2')).toBe('member-b')
  })

  it('clears a cached member id', () => {
    setCachedMemberId('trip-1', 'member-a')
    clearCachedMemberId('trip-1')
    expect(getCachedMemberId('trip-1')).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    delete globalThis.localStorage
    expect(() => setCachedMemberId('trip-1', 'member-a')).not.toThrow()
    expect(getCachedMemberId('trip-1')).toBeNull()
  })
})
