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
        <h2 className="mb-3 text-lg font-semibold text-text">Settle up</h2>
        <div className="rounded-card border border-black/5 bg-bg p-4 text-center text-text-muted shadow-sm">
          All settled up 🎉
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Settle up</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-black/10 bg-bg px-3 py-1.5 text-sm font-medium text-text transition hover:border-accent/60"
        >
          {copied ? 'Copied!' : 'Copy for WhatsApp'}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {transfers.map((t, i) => (
          <li
            key={`${t.fromId}-${t.toId}-${i}`}
            className="flex items-center justify-between rounded-card border border-black/5 bg-bg p-4 shadow-sm"
          >
            <span className="min-w-0 truncate text-text">
              <span className="font-medium">{t.fromName}</span>
              <span className="text-text-muted"> → </span>
              <span className="font-medium">{t.toName}</span>
            </span>
            <span className="shrink-0 font-semibold text-text">
              {formatEGP(t.amount)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
