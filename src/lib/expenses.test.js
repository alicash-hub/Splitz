import { describe, expect, it, vi, beforeEach } from 'vitest'

// Capture the row passed to insert so we can assert on normalization.
const single = vi.fn()
const insert = vi.fn(() => ({ select: () => ({ single }) }))
vi.mock('./supabaseClient', () => ({
  supabase: { from: () => ({ insert }) },
}))

const { addExpense } = await import('./expenses')

describe('addExpense', () => {
  beforeEach(() => {
    insert.mockClear()
    single.mockReset()
    single.mockResolvedValue({ data: { id: 'e1' }, error: null })
  })

  it('inserts the trip id, payer, amount and trimmed description', async () => {
    await addExpense('t1', { paidBy: 'm1', amount: 150, description: '  Lunch  ' })
    expect(insert).toHaveBeenCalledWith({
      trip_id: 't1',
      paid_by: 'm1',
      amount: 150,
      description: 'Lunch',
    })
  })

  it('stores a blank description as null', async () => {
    await addExpense('t1', { paidBy: 'm1', amount: 50, description: '   ' })
    expect(insert.mock.calls[0][0].description).toBeNull()
  })

  it('throws when Supabase returns an error', async () => {
    const error = new Error('insert failed')
    single.mockResolvedValue({ data: null, error })
    await expect(
      addExpense('t1', { paidBy: 'm1', amount: 10 }),
    ).rejects.toBe(error)
  })
})
