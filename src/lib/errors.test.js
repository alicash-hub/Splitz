import { describe, expect, it } from 'vitest'
import { friendlyError } from './errors'

describe('friendlyError', () => {
  it('maps fetch/network failures to a friendly message', () => {
    for (const m of [
      'Load failed',
      'Failed to fetch',
      'fetch failed',
      'NetworkError when attempting to fetch resource',
    ]) {
      expect(friendlyError(new TypeError(m))).toMatch(/Couldn't reach the server/)
    }
  })

  it('passes through our own error messages', () => {
    expect(
      friendlyError(new Error('Someone\'s already here as "Ali".')),
    ).toMatch(/already here/)
  })

  it('uses the fallback when there is no message', () => {
    expect(friendlyError({}, 'Custom fallback')).toBe('Custom fallback')
  })
})
