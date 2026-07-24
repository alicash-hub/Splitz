import { supabase } from './supabaseClient'

/**
 * List a trip's recorded settlements, newest first.
 * @param {string} tripId
 * @returns {Promise<Array<{id: string, trip_id: string, from_id: string, to_id: string, amount: number, created_at: string}>>}
 */
export async function listSettlements(tripId) {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Record a payment: `fromId` paid `toId` `amount` (EGP). Nets their balances.
 * @param {string} tripId
 * @param {{ fromId: string, toId: string, amount: number }} fields
 * @returns {Promise<{id: string, trip_id: string, from_id: string, to_id: string, amount: number, created_at: string}>}
 */
export async function addSettlement(tripId, { fromId, toId, amount }) {
  const { data, error } = await supabase
    .from('settlements')
    .insert({ trip_id: tripId, from_id: fromId, to_id: toId, amount })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a settlement (undo). Balances revert to include the debt again.
 * @param {string} settlementId
 */
export async function deleteSettlement(settlementId) {
  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', settlementId)
  if (error) throw error
}
