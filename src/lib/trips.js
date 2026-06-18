import { supabase } from './supabaseClient'
import { generateSlug } from './slug'

// Postgres unique_violation — thrown when a generated slug already exists.
const UNIQUE_VIOLATION = '23505'

/**
 * Create a trip with a unique slug. Retries a few times on the (rare) chance of
 * a slug collision before giving up.
 *
 * @param {string} name - trip name (already validated non-empty by the caller)
 * @returns {Promise<{id: string, name: string, slug: string, created_at: string}>}
 */
export async function createTrip(name, { maxAttempts = 5 } = {}) {
  const trimmed = name.trim()

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = generateSlug()
    const { data, error } = await supabase
      .from('trips')
      .insert({ name: trimmed, slug })
      .select()
      .single()

    if (!error) return data
    if (error.code !== UNIQUE_VIOLATION) throw error
    // Slug collided — loop and try a fresh one.
  }

  throw new Error('Could not generate a unique trip link. Please try again.')
}

/**
 * Look up a trip by its URL slug.
 *
 * @param {string} slug
 * @returns {Promise<{id: string, name: string, slug: string, created_at: string} | null>}
 *   the trip row, or null if no trip has that slug (unknown link).
 */
export async function getTripBySlug(slug) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}
