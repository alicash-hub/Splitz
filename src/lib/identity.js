// Identity without login: we remember which member the current device is, per
// trip, in localStorage. Keyed by trip id (canonical). All access is guarded —
// Safari private mode and storage-disabled browsers can throw on access.

const KEY_PREFIX = 'breadsalt:member:'

function storage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function getCachedMemberId(tripId) {
  const store = storage()
  if (!store) return null
  try {
    return store.getItem(KEY_PREFIX + tripId)
  } catch {
    return null
  }
}

export function setCachedMemberId(tripId, memberId) {
  const store = storage()
  if (!store) return
  try {
    store.setItem(KEY_PREFIX + tripId, memberId)
  } catch {
    // Best-effort: if we can't persist identity, the user just re-picks next time.
  }
}

export function clearCachedMemberId(tripId) {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(KEY_PREFIX + tripId)
  } catch {
    // ignore
  }
}
