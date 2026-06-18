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
