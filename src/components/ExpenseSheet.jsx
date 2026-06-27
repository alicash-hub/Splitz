import { useState } from 'react'
import { formatEGP, formatWhen } from '../lib/format'
import { deleteExpense } from '../lib/expenses'

// Expense options sheet. Deleting takes a deliberate second step so it isn't a
// one-tap mistake; balances recompute from whatever's left.
export default function ExpenseSheet({
  expense,
  payerName,
  initialConfirm = false,
  onClose,
  onEdit,
  onDeleted,
}) {
  const [confirming, setConfirming] = useState(initialConfirm)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await deleteExpense(expense.id)
      onDeleted(expense)
    } catch (err) {
      setError(err.message ?? 'Could not delete it. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Expense options"
      className="animate-overlay fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet w-full max-w-md rounded-t-2xl bg-bg p-6 shadow-lg sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--color-border)] sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-extrabold text-text">
              {expense.description?.trim() || 'Expense'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-text-muted">
              {payerName} paid · {formatWhen(expense.created_at)}
            </p>
          </div>
          <span className="shrink-0 font-display text-lg font-extrabold text-text">
            {formatEGP(expense.amount)}
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-semibold text-negative">
            {error}
          </p>
        )}

        {!confirming ? (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onEdit(expense)}
              className="w-full rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]"
            >
              Edit expense
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="w-full rounded-card border border-negative/40 px-4 py-3 text-base font-bold text-negative transition hover:bg-negative/5"
            >
              Delete expense
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base font-bold text-text shadow-[0_2px_0_var(--color-border)] transition hover:bg-surface active:translate-y-[1px] active:shadow-[0_1px_0_var(--color-border)]"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-text">
              Delete this expense? Everyone&apos;s balance will recalculate. This
              can&apos;t be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="flex-1 rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base font-bold text-text shadow-[0_2px_0_var(--color-border)] transition hover:bg-surface disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-card bg-negative px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-negative-shadow)] transition hover:opacity-90 active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-negative-shadow)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
