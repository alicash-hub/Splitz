import { useState } from 'react'
import { formatEGP } from '../lib/format'
import { addSettlement } from '../lib/settlements'
import { friendlyError } from '../lib/errors'

// Confirm-before-recording sheet for a transfer. Records that the payment
// happened (no money moves through the app) and nets it out of balances.
export default function SettleSheet({ trip, transfer, currentMemberId, onClose, onSettled }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fromMe = transfer.fromId === currentMemberId
  const otherName = fromMe ? transfer.toName : transfer.fromName
  const question = fromMe
    ? `Did you pay ${transfer.toName}?`
    : `Did ${transfer.fromName} pay you?`

  async function handleConfirm() {
    setSaving(true)
    setError('')
    try {
      const settlement = await addSettlement(trip.id, {
        fromId: transfer.fromId,
        toId: transfer.toId,
        amount: transfer.amount,
      })
      onSettled(settlement, otherName)
    } catch (err) {
      setError(friendlyError(err, 'Could not record that. Please try again.'))
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Record payment"
      className="animate-overlay fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet w-full max-w-md rounded-t-2xl bg-bg p-6 shadow-lg sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--color-border)] sm:hidden" />

        <h2 className="font-display text-lg font-extrabold text-text">
          {question}
        </h2>
        <p className="mt-2 font-display text-3xl font-extrabold text-text">
          {formatEGP(transfer.amount)}
        </p>
        <p className="mt-3 text-sm text-text-muted">
          This just records it for the group. You can undo it anytime.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm font-semibold text-negative">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base font-bold text-text shadow-[0_2px_0_var(--color-border)] transition hover:bg-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Mark as paid'}
          </button>
        </div>
      </div>
    </div>
  )
}
