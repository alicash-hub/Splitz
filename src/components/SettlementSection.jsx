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

// `onSettle(transfer)` fires on the per-row CTA (Settle up / Mark received) and
// opens the SettleSheet to record the real-world payment.
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
          className="rounded-full border border-[var(--color-border)] bg-bg px-3 py-1.5 text-sm font-bold text-accent2 transition hover:border-accent2"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {transfers.map((t, i) => {
          const fromMe = t.fromId === memberId
          const toMe = t.toId === memberId
          const involvesMe = fromMe || toMe
          const accent = fromMe
            ? 'text-negative'
            : toMe
              ? 'text-positive'
              : 'text-text'
          const tag = fromMe ? 'You pay' : toMe ? 'You get' : null

          return (
            <li
              key={`${t.fromId}-${t.toId}-${i}`}
              className={`rounded-card border border-[var(--color-border)] p-4 shadow-[0_2px_0_var(--color-border)] ${
                involvesMe ? 'bg-chip' : 'bg-bg'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={t.fromName} />
                  <span aria-hidden className="text-text-muted">
                    →
                  </span>
                  <Avatar name={t.toName} />
                </div>
                <span
                  className={`shrink-0 font-display text-lg font-extrabold ${accent}`}
                >
                  {formatEGP(t.amount)}
                </span>
              </div>

              <p className="mt-2 text-sm text-text">
                <span className="font-bold">{t.fromName}</span>
                <span className="text-text-muted"> pays </span>
                <span className="font-bold">{t.toName}</span>
              </p>
              {tag && (
                <p
                  className={`mt-0.5 text-xs font-extrabold uppercase tracking-wide ${accent}`}
                >
                  {tag}
                </p>
              )}

              {involvesMe && (
                <button
                  type="button"
                  onClick={() => onSettle?.(t)}
                  className="mt-3 w-full rounded-card bg-accent px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]"
                >
                  {fromMe ? 'Settle up' : 'Mark received'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
