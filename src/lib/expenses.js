import { supabase } from './supabaseClient'

/**
 * List a trip's expenses, newest first.
 *
 * @param {string} tripId
 * @returns {Promise<Array<{id: string, trip_id: string, paid_by: string, amount: number, description: string|null, created_at: string}>>}
 */
export async function listExpenses(tripId) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Add an expense to a trip. Amount is in EGP and must be > 0 (enforced by a DB
 * check as well). Description is optional and stored as null when blank.
 *
 * @param {string} tripId
 * @param {{ paidBy: string, amount: number, description?: string }} fields
 * @returns {Promise<{id: string, trip_id: string, paid_by: string, amount: number, description: string|null, created_at: string}>}
 */
export async function addExpense(tripId, { paidBy, amount, description }) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      trip_id: tripId,
      paid_by: paidBy,
      amount,
      description: description?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete an expense. Balances recompute from whatever's left.
 *
 * @param {string} expenseId
 */
export async function deleteExpense(expenseId) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
  if (error) throw error
}
