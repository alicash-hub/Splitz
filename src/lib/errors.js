// Map thrown errors to friendly, user-facing copy. A failed network request
// (Supabase unreachable / offline) surfaces as a fetch TypeError with a message
// like "Load failed" (Safari), "Failed to fetch" (Chrome), or "fetch failed"
// (undici) — none of which mean anything to a user.
const NETWORK_HINTS = [
  'load failed',
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'network request failed',
]

export function friendlyError(
  err,
  fallback = 'Something went wrong. Please try again.',
) {
  const message = (err?.message ?? '').toString()
  if (NETWORK_HINTS.some((hint) => message.toLowerCase().includes(hint))) {
    return "Couldn't reach the server. Check your connection and try again."
  }
  // Our own thrown errors (e.g. duplicate name) already carry friendly copy.
  return message || fallback
}
