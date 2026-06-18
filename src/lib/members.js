import { supabase } from './supabaseClient'

// Postgres unique_violation — here it fires on the case-insensitive unique index
// members (trip_id, lower(name)), i.e. the name is already taken in this trip.
const UNIQUE_VIOLATION = '23505'

/**
 * List a trip's members, oldest first.
 *
 * @param {string} tripId
 * @returns {Promise<Array<{id: string, trip_id: string, name: string, created_at: string}>>}
 */
export async function listMembers(tripId) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * Add a member to a trip. Names must be unique within a trip
 * (case-insensitive), enforced at the DB level.
 *
 * @param {string} tripId
 * @param {string} name - display name (trimmed here)
 * @returns {Promise<{id: string, trip_id: string, name: string, created_at: string}>}
 * @throws {Error} a friendly message when the name is already taken
 */
export async function joinTrip(tripId, name) {
  const trimmed = name.trim()

  const { data, error } = await supabase
    .from('members')
    .insert({ trip_id: tripId, name: trimmed })
    .select()
    .single()

  if (!error) return data

  if (error.code === UNIQUE_VIOLATION) {
    throw new Error(
      `Someone's already here as "${trimmed}". If that's you, pick your name ` +
        'from the list below — otherwise add a last initial.',
    )
  }
  throw error
}
