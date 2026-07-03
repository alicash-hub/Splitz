import { useState } from 'react'

// Invite sheet: shows the shareable link and the group code (= the slug), plus a
// ready-to-send WhatsApp message. Uses the native share sheet when available.
export default function ShareSheet({ trip, onClose }) {
  const [copied, setCopied] = useState(null) // 'link' | 'code' | 'message' | null

  const origin =
    typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${origin}/t/${trip.slug}`
  const code = trip.slug.toUpperCase()
  const message = `Join our "${trip.name}" trip on Bread & Salt 👋\n${link}\n…or join with group code ${code}`

  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 2000)
    } catch {
      // Clipboard can be blocked (insecure context); fail quietly.
    }
  }

  async function share() {
    try {
      await navigator.share({ title: `${trip.name} on Bread & Salt`, text: message })
    } catch {
      // User dismissed the share sheet, or it's unavailable — no-op.
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invite the group"
      className="animate-overlay fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet w-full max-w-md rounded-t-2xl bg-bg p-6 shadow-lg sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--color-border)] sm:hidden" />

        <h2 className="font-display text-lg font-extrabold text-text">
          Invite the group
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Anyone with the link or the code can join.
        </p>

        {/* Invite link */}
        <div className="mt-5 flex flex-col gap-2">
          <span className="text-sm font-bold text-text">Invite link</span>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-card border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm text-text-muted">
              {link}
            </div>
            <button
              type="button"
              onClick={() => copy(link, 'link')}
              className="shrink-0 rounded-card border border-[var(--color-border)] bg-bg px-3 py-2.5 text-sm font-bold text-accent2 transition hover:border-accent2"
            >
              {copied === 'link' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Group code */}
        <div className="mt-4 flex flex-col gap-2">
          <span className="text-sm font-bold text-text">Group code</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-card border border-[var(--color-border)] bg-chip px-3 py-2.5 text-center font-display text-2xl font-extrabold tracking-[0.25em] text-text">
              {code}
            </div>
            <button
              type="button"
              onClick={() => copy(code, 'code')}
              className="shrink-0 rounded-card border border-[var(--color-border)] bg-bg px-3 py-2.5 text-sm font-bold text-accent2 transition hover:border-accent2"
            >
              {copied === 'code' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-6 flex flex-col gap-3">
          {canShare ? (
            <button
              type="button"
              onClick={share}
              className="w-full rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]"
            >
              Share invite
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => copy(message, 'message')}
            className={
              canShare
                ? 'w-full rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base font-bold text-text shadow-[0_2px_0_var(--color-border)] transition hover:bg-surface active:translate-y-[1px] active:shadow-[0_1px_0_var(--color-border)]'
                : 'w-full rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]'
            }
          >
            {copied === 'message' ? 'Message copied!' : 'Copy invite message'}
          </button>
        </div>
      </div>
    </div>
  )
}
