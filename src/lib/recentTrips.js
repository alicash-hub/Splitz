// A small local "Your trips" history for the Home screen. Purely a convenience —
// NOT a synced "my trips" feature: it lives only in this browser's localStorage
// and stores no expense data. Guarded the same way as identity.js (Safari private
// mode / disabled storage can throw).

const KEY = 'breadsalt:recent-trips'
const CAP = 8

function storage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** Recent trips, most-recently-opened first. Each: { id, name, slug, lastOpenedAt }. */
export function listRecentTrips() {
  const store = storage()
  if (!store) return []
  try {
    const raw = store.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Record a trip visit: upsert to the front, de-dupe by slug, cap the list.
 * @param {{id: string, name: string, slug: string}} trip
 */
export function rememberTrip({ id, name, slug }, now = Date.now()) {
  if (!slug) return
  const store = storage()
  if (!store) return
  try {
    const rest = listRecentTrips().filter((t) => t.slug !== slug)
    const next = [{ id, name, slug, lastOpenedAt: now }, ...rest].slice(0, CAP)
    store.setItem(KEY, JSON.stringify(next))
  } catch {
    // Best-effort: if we can't persist, the list just won't include this trip.
  }
}
