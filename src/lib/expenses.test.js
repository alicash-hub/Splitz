import { describe, expect, it, vi, beforeEach } from 'vitest'

// Capture the row passed to insert so we can assert on normalization.
const single = vi.fn()
const insert = vi.fn(() => ({ select: () => ({ single }) }))
const updatePayload = vi.fn()
const update = vi.fn(() => ({
  eq: () => ({ select: () => ({ single }) }),
}))
const eqDelete = vi.fn()
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: () => ({
      insert,
      update: (payload) => {
        updatePayload(payload)
        return update(payload)
      },
      delete: () => ({ eq: eqDelete }),
    }),
  },
}))

const { addExpense, updateExpense, deleteExpense } = await import('./expenses')

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

describe('updateExpense', () => {
  beforeEach(() => {
    updatePayload.mockClear()
    single.mockReset()
    single.mockResolvedValue({ data: { id: 'e1' }, error: null })
  })

  it('updates payer, amount and trimmed description', async () => {
    await updateExpense('e1', {
      paidBy: 'm2',
      amount: 80,
      description: '  Coffee  ',
    })
    expect(updatePayload).toHaveBeenCalledWith({
      paid_by: 'm2',
      amount: 80,
      description: 'Coffee',
    })
  })

  it('stores a blank description as null', async () => {
    await updateExpense('e1', { paidBy: 'm2', amount: 80, description: '  ' })
    expect(updatePayload.mock.calls[0][0].description).toBeNull()
  })

  it('throws when Supabase returns an error', async () => {
    const error = new Error('update failed')
    single.mockResolvedValue({ data: null, error })
    await expect(
      updateExpense('e1', { paidBy: 'm2', amount: 80 }),
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
