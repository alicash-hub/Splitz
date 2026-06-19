import { describe, expect, it, vi, beforeEach } from 'vitest'

// Capture the row passed to insert so we can assert on normalization.
const single = vi.fn()
const insert = vi.fn(() => ({ select: () => ({ single }) }))
const eqDelete = vi.fn()
vi.mock('./supabaseClient', () => ({
  supabase: { from: () => ({ insert, delete: () => ({ eq: eqDelete }) }) },
}))

const { addExpense, deleteExpense } = await import('./expenses')

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

describe('deleteExpense', () => {
  beforeEach(() => {
    eqDelete.mockReset()
  })

  it('resolves when the delete succeeds', async () => {
    eqDelete.mockResolvedValue({ error: null })
    await expect(deleteExpense('e1')).resolves.toBeUndefined()
    expect(eqDelete).toHaveBeenCalledWith('id', 'e1')
  })

  it('throws when Supabase returns an error', async () => {
    const error = new Error('delete failed')
    eqDelete.mockResolvedValue({ error })
    await expect(deleteExpense('e1')).rejects.toBe(error)
  })
})
