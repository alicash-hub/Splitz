import { supabase } from './supabaseClient'

/**
 * List a trip's expenses, newest first.
 *
 * @param {string} tripId
 * @returns {Promise<Array<{id: string, trip_id: string, paid_by: string, amount: number, description: string|null, split_between: string[]|null, created_at: string}>>}
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
 * `splitBetween` is the list of member ids sharing the cost; pass null (or a list
 * covering everyone) to split across the whole trip — stored as null.
 *
 * @param {string} tripId
 * @param {{ paidBy: string, amount: number, description?: string, splitBetween?: string[]|null }} fields
 * @returns {Promise<{id: string, trip_id: string, paid_by: string, amount: number, description: string|null, split_between: string[]|null, created_at: string}>}
 */
export async function addExpense(
  tripId,
  { paidBy, amount, description, splitBetween = null },
) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      trip_id: tripId,
      paid_by: paidBy,
      amount,
      description: description?.trim() || null,
      split_between: splitBetween?.length ? splitBetween : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an expense's payer, amount, description and/or split.
 *
 * @param {string} expenseId
 * @param {{ paidBy: string, amount: number, description?: string, splitBetween?: string[]|null }} fields
 * @returns {Promise<{id: string, trip_id: string, paid_by: string, amount: number, description: string|null, split_between: string[]|null, created_at: string}>}
 */
export async function updateExpense(
  expenseId,
  { paidBy, amount, description, splitBetween = null },
) {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      paid_by: paidBy,
      amount,
      description: description?.trim() || null,
      split_between: splitBetween?.length ? splitBetween : null,
    })
    .eq('id', expenseId)
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
