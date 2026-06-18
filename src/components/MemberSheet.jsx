import { useState } from 'react'
import { formatEGP } from '../lib/format'
import { deleteMember } from '../lib/members'

// Member options sheet. Removing a member is destructive (their expenses cascade
// with them), so it takes a deliberate second step that spells out the impact —
// the safety lives here in the UX, not in the database.
export default function MemberSheet({ member, net, expenseCount, onClose, onRemoved }) {
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')

  const settled = Math.abs(net) < 0.005

  async function handleRemove() {
    setRemoving(true)
    setError('')
    try {
      await deleteMember(member.id)
      onRemoved(member)
    } catch (err) {
      setError(err.message ?? 'Could not remove them. Please try again.')
      setRemoving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${member.name} options`}
      className="animate-overlay fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet w-full max-w-md rounded-t-2xl bg-bg p-6 shadow-lg sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/10 sm:hidden" />

        <h2 className="text-lg font-semibold text-text">{member.name}</h2>
        <p className="mt-1 text-sm text-text-muted">
          {settled
            ? 'Settled up'
            : net > 0
              ? `Gets back ${formatEGP(net)}`
              : `Owes ${formatEGP(Math.abs(net))}`}
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-negative">
            {error}
          </p>
        )}

        {!confirming ? (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="w-full rounded-card border border-negative/30 px-4 py-3 text-base font-medium text-negative transition hover:bg-negative/5"
            >
              Remove from trip
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-card border border-black/10 bg-bg px-4 py-3 text-base font-medium text-text transition hover:bg-surface"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-text">
              Remove <span className="font-semibold">{member.name}</span>? This
              also deletes{' '}
              <span className="font-semibold">
                {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}
              </span>{' '}
              they paid for, and everyone&apos;s balance will recalculate. This
              can&apos;t be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={removing}
                className="flex-1 rounded-card border border-black/10 bg-bg px-4 py-3 text-base font-medium text-text transition hover:bg-surface disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 rounded-card bg-negative px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removing ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
