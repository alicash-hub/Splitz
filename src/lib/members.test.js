import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock the shared client so we don't need env vars or a network — and so we can
// control the insert result. supabaseClient.js throws without env vars at import.
const single = vi.fn()
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({ single }),
      }),
    }),
  },
}))

const { joinTrip } = await import('./members')

describe('joinTrip', () => {
  beforeEach(() => {
    single.mockReset()
  })

  it('returns the inserted member on success', async () => {
    const member = { id: 'm1', trip_id: 't1', name: 'Yara' }
    single.mockResolvedValue({ data: member, error: null })

    await expect(joinTrip('t1', '  Yara  ')).resolves.toEqual(member)
  })

  it('maps a unique violation to a friendly duplicate-name error', async () => {
    single.mockResolvedValue({ data: null, error: { code: '23505' } })

    await expect(joinTrip('t1', 'Yara')).rejects.toThrow(/already here as "Yara"/)
  })

  it('rethrows other errors unchanged', async () => {
    const error = new Error('network down')
    error.code = '08006'
    single.mockResolvedValue({ data: null, error })

    await expect(joinTrip('t1', 'Yara')).rejects.toBe(error)
  })
})
