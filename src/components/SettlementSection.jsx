import { useState } from 'react'
import { formatEGP, initials } from '../lib/format'

// Builds a WhatsApp-friendly plain-text summary of the transfers.
function buildShareText(tripName, transfers) {
  const lines = transfers.map(
    (t) => `• ${t.fromName} → ${t.toName}: ${formatEGP(t.amount)}`,
  )
  return `🧾 ${tripName} — settle up\n\n${lines.join('\n')}`
}

function Avatar({ name }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chip text-xs font-bold text-text">
      {initials(name)}
    </span>
  )
}

// The settle-up list: EVERY outstanding transfer, calm and display-first. Rows
// that involve the current user get a "You pay"/"You're owed" sub-label and a
// full-width action pill (which opens the confirm sheet via `onSettle`); rows
// between other people are muted, display-only. Copy-all lives here, not per row.
export default function SettlementSection({
  tripName,
  transfers,
  memberId,
  onSettle,
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildShareText(tripName, transfers))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (e.g. insecure context); fail quietly.
    }
  }

  if (transfers.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-text">Settle up</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-bg px-3 py-1.5 text-sm font-bold text-accent2 shadow-[0_2px_0_var(--color-border)] transition hover:border-accent2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect
              x="8"
              y="8"
              width="12"
              height="13"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="2.2"
            />
            <path
              d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {transfers.map((t, i) => {
          const fromMe = t.fromId === memberId
          const toMe = t.toId === memberId
          const involvesMe = fromMe || toMe
          // Show the counterparty's avatar (your own face is uninformative).
          const avatarName = fromMe ? t.toName : t.fromName
          const fromLabel = fromMe ? 'You' : t.fromName
          const toLabel = toMe ? 'You' : t.toName
          const sub = fromMe ? 'You pay' : toMe ? "You're owed" : null
          const actionLabel = fromMe ? 'Mark as sent' : 'Mark as received'

          return (
            <li
              key={`${t.fromId}-${t.toId}-${i}`}
              className={`rounded-card border p-4 shadow-[0_2px_0_var(--color-border)] ${
                involvesMe ? 'border-[#cdeeff] bg-bg' : 'border-[var(--color-border)] bg-bg'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar name={avatarName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-extrabold text-text">
                    {fromLabel} <span className="text-text-muted">→</span>{' '}
                    {toLabel}
                  </p>
                  {sub && (
                    <p className="mt-0.5 text-xs font-extrabold text-accent">
                      {sub}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 font-display text-lg font-extrabold ${
                    involvesMe ? 'text-text' : 'text-text-muted'
                  }`}
                >
                  {formatEGP(t.amount)}
                </span>
              </div>

              {involvesMe && (
                <button
                  type="button"
                  onClick={() => onSettle?.(t)}
                  className="mt-3 w-full rounded-card bg-accent px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]"
                >
                  {actionLabel}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
