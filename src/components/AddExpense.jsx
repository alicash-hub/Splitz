import { useState } from 'react'
import { addExpense, updateExpense } from '../lib/expenses'
import { initials } from '../lib/format'

// Bottom sheet (mobile) / centered modal (larger screens) for logging or editing
// an expense. Pass `expense` to edit it; omit to add a new one.
export default function AddExpense({
  trip,
  members,
  currentMemberId,
  expense,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(expense)

  const defaultPayer =
    currentMemberId && members.some((m) => m.id === currentMemberId)
      ? currentMemberId
      : (members[0]?.id ?? null)

  const [paidBy, setPaidBy] = useState(isEdit ? expense.paid_by : defaultPayer)
  const [amountStr, setAmountStr] = useState(isEdit ? String(expense.amount) : '')
  const [description, setDescription] = useState(
    isEdit ? (expense.description ?? '') : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const amount = Number(amountStr)
  const amountValid = Number.isFinite(amount) && amount > 0
  const canSubmit = !!paidBy && amountValid && !submitting

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError('')
    const fields = {
      paidBy,
      amount: Math.round(amount * 100) / 100,
      description,
    }
    try {
      if (isEdit) {
        await updateExpense(expense.id, fields)
      } else {
        await addExpense(trip.id, fields)
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setError(
        err.message ??
          `Could not ${isEdit ? 'save' : 'add'} the expense. Please try again.`,
      )
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit expense' : 'Add expense'}
      className="animate-overlay fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet w-full max-w-md rounded-t-2xl bg-bg p-6 shadow-lg sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/10 sm:hidden" />

        <h2 className="text-lg font-semibold text-text">
          {isEdit ? 'Edit expense' : 'Add expense'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          {/* Who paid */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Who paid?</span>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const selected = member.id === paidBy
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setPaidBy(member.id)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      selected
                        ? 'border-accent bg-accent text-white'
                        : 'border-black/10 bg-bg text-text hover:border-accent/60'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        selected ? 'bg-white/20 text-white' : 'bg-surface text-text'
                      }`}
                    >
                      {initials(member.name)}
                    </span>
                    {member.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <label htmlFor="expense-amount" className="text-sm font-medium text-text">
              Amount
            </label>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-medium text-text-muted">EGP</span>
              <input
                id="expense-amount"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) =>
                  setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))
                }
                placeholder="0"
                autoFocus
                autoComplete="off"
                className="w-full bg-transparent text-4xl font-semibold text-text outline-none placeholder:text-black/20"
              />
            </div>
          </div>

          {/* What for */}
          <div className="flex flex-col gap-2">
            <label htmlFor="expense-desc" className="text-sm font-medium text-text">
              What for? <span className="text-text-muted">(optional)</span>
            </label>
            <input
              id="expense-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lunch at the resort"
              autoComplete="off"
              maxLength={120}
              className="w-full rounded-card border border-black/10 bg-bg px-4 py-3 text-base text-text shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-negative">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-card border border-black/10 bg-bg px-4 py-3 text-base font-medium text-text transition hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-card bg-accent px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? isEdit
                  ? 'Saving…'
                  : 'Adding…'
                : isEdit
                  ? 'Save'
                  : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
