import { useState } from 'react'
import { formatEGP } from '../lib/format'

// Builds a WhatsApp-friendly plain-text summary of the transfers.
function buildShareText(tripName, transfers) {
  const lines = transfers.map(
    (t) => `• ${t.fromName} → ${t.toName}: ${formatEGP(t.amount)}`,
  )
  return `🧾 ${tripName} — settle up\n\n${lines.join('\n')}`
}

export default function SettlementSection({ tripName, transfers }) {
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

  if (transfers.length === 0) {
    return (
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-text">
          Settle up
        </h2>
        <div className="rounded-card border border-[var(--color-border)] bg-bg p-4 text-center font-semibold text-text-muted shadow-[0_2px_0_var(--color-border)]">
          All settled up 🎉
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-text">Settle up</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-[var(--color-border)] bg-bg px-3 py-1.5 text-sm font-bold text-accent2 transition hover:border-accent2"
        >
          {copied ? 'Copied!' : 'Copy for WhatsApp'}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {transfers.map((t, i) => (
          <li
            key={`${t.fromId}-${t.toId}-${i}`}
            className="flex items-center justify-between rounded-card border border-[var(--color-border)] bg-bg p-4 shadow-[0_2px_0_var(--color-border)]"
          >
            <span className="min-w-0 truncate text-text">
              <span className="font-bold">{t.fromName}</span>
              <span className="text-text-muted"> → </span>
              <span className="font-bold">{t.toName}</span>
            </span>
            <span className="shrink-0 font-display font-extrabold text-text">
              {formatEGP(t.amount)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
