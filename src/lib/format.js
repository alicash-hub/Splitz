// Small, pure display helpers. Currency is EGP everywhere in the MVP.

const egp = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** "EGP 150" or "EGP 150.50" — no trailing .00 for whole amounts. */
export function formatEGP(amount) {
  const rounded = Math.round(Number(amount) * 100) / 100
  return `EGP ${egp.format(rounded)}`
}

/** Up to two uppercase initials from a name. "Yara Kamel" -> "YK", "Yara" -> "Y". */
export function initials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Compact relative time: "just now", "5m ago", "3h ago", "2d ago", else "18 Jun". */
export function formatWhen(iso, now = Date.now()) {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const diffSec = Math.max(0, Math.round((now - then) / 1000))

  if (diffSec < 60) return 'just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
