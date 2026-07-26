import { useState } from 'react'
import { addExpense, updateExpense } from '../lib/expenses'
import { initials, formatEGP } from '../lib/format'
import { friendlyError } from '../lib/errors'

// Bottom sheet (mobile) / centered modal (larger screens) for logging or editing
// an expense. Pass `expense` to edit it; omit to add a new one.
//
// "Paid by" and "Split" both stay collapsed to a one-line summary by default —
// the common case is "you paid, everyone splits" — and only reveal their pickers
// when tapped, so the sheet doesn't overwhelm with two member lists at once.
export default function AddExpense({
  trip,
  members,
  currentMemberId,
  expense,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(expense)
  const allIds = members.map((m) => m.id)

  const defaultPayer =
    currentMemberId && members.some((m) => m.id === currentMemberId)
      ? currentMemberId
      : (members[0]?.id ?? null)

  const [paidBy, setPaidBy] = useState(isEdit ? expense.paid_by : defaultPayer)
  const [amountStr, setAmountStr] = useState(isEdit ? String(expense.amount) : '')
  const [description, setDescription] = useState(
    isEdit ? (expense.description ?? '') : '',
  )

  // Who shares the cost. Default = everyone. Editing an expense that was split
  // with a subset restores that subset (dropping anyone since removed).
  const [splitIds, setSplitIds] = useState(() => {
    const saved =
      isEdit && Array.isArray(expense.split_between)
        ? expense.split_between.filter((id) => allIds.includes(id))
        : []
    return new Set(saved.length ? saved : allIds)
  })

  const [editingPayer, setEditingPayer] = useState(false)
  const [editingSplit, setEditingSplit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const amount = Number(amountStr)
  const amountValid = Number.isFinite(amount) && amount > 0
  const everyone = splitIds.size === members.length
  const canSubmit = !!paidBy && amountValid && splitIds.size >= 1 && !submitting

  const payerName = members.find((m) => m.id === paidBy)?.name ?? '—'
  const payerLabel = paidBy === currentMemberId ? 'You' : payerName

  function choosePayer(id) {
    setPaidBy(id)
    setEditingPayer(false)
  }

  function toggleShare(id) {
    setSplitIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // never allow an empty split
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError('')
    const fields = {
      paidBy,
      amount: Math.round(amount * 100) / 100,
      description,
      splitBetween: everyone ? null : [...splitIds],
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
        friendlyError(
          err,
          `Could not ${isEdit ? 'save' : 'add'} the expense. Please try again.`,
        ),
      )
      setSubmitting(false)
    }
  }

  const rowClass =
    'flex w-full items-center justify-between gap-3 rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-left shadow-[0_2px_0_var(--color-border)] transition hover:border-accent'

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
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--color-border)] sm:hidden" />

        <h2 className="font-display text-lg font-extrabold text-text">
          {isEdit ? 'Edit expense' : 'Add expense'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          {/* Amount */}
          <div className="flex flex-col gap-2">
            <label htmlFor="expense-amount" className="text-sm font-bold text-text">
              Amount
            </label>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-text-muted">EGP</span>
              <input
                id="expense-amount"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) =>
                  setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))
                }
                placeholder="0"
                autoComplete="off"
                className="w-full bg-transparent font-display text-4xl font-extrabold text-text outline-none placeholder:text-[var(--color-text-muted)]/40"
              />
            </div>
          </div>

          {/* What for — right after the amount; optional (drives the title + emoji) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="expense-desc" className="text-sm font-bold text-text">
              What for? <span className="text-text-muted">(optional)</span>
            </label>
            <input
              id="expense-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at Zööba"
              autoComplete="off"
              maxLength={120}
              className="w-full rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base text-text shadow-[0_2px_0_var(--color-border)] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Who paid — collapsed to a summary, expands to a single-select */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setEditingPayer((v) => !v)}
              className={rowClass}
              aria-expanded={editingPayer}
            >
              <span className="text-base font-bold text-text">
                Paid by <span className="text-accent">{payerLabel}</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-accent2">
                {editingPayer ? 'Done' : 'Change'}
              </span>
            </button>
            {editingPayer && (
              <div className="flex flex-wrap gap-2 px-1 pt-1">
                {members.map((member) => {
                  const selected = member.id === paidBy
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => choosePayer(member.id)}
                      aria-pressed={selected}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                        selected
                          ? 'border-accent bg-accent text-white'
                          : 'border-[var(--color-border)] bg-bg text-text hover:border-accent'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          selected ? 'bg-white/20 text-white' : 'bg-chip text-text'
                        }`}
                      >
                        {initials(member.name)}
                      </span>
                      {member.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Split between — collapsed to a summary, expands to a multi-select */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setEditingSplit((v) => !v)}
              className={rowClass}
              aria-expanded={editingSplit}
            >
              <span className="text-base font-bold text-text">
                Split{' '}
                <span className="text-accent">
                  {everyone ? 'with everyone' : `between ${splitIds.size}`}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-accent2">
                {editingSplit ? 'Done' : 'Change'}
              </span>
            </button>
            {editingSplit && (
              <div className="flex flex-col gap-1 rounded-card border border-[var(--color-border)] bg-surface p-2">
                <button
                  type="button"
                  onClick={() => setSplitIds(new Set(allIds))}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-accent2 hover:bg-bg"
                >
                  Everyone
                  {everyone && <span aria-hidden>✓</span>}
                </button>
                {members.map((member) => {
                  const checked = splitIds.has(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleShare(member.id)}
                      aria-pressed={checked}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-bg"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                          checked
                            ? 'border-accent bg-accent text-white'
                            : 'border-[var(--color-border)] bg-bg text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chip text-xs font-bold text-text">
                        {initials(member.name)}
                      </span>
                      <span className="font-bold text-text">{member.name}</span>
                    </button>
                  )
                })}
                {amountValid && (
                  <p className="px-3 pt-1 text-sm font-semibold text-text-muted">
                    {formatEGP(amount / splitIds.size)} each · {splitIds.size}{' '}
                    {splitIds.size === 1 ? 'person' : 'people'}
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm font-semibold text-negative">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base font-bold text-text shadow-[0_2px_0_var(--color-border)] transition hover:bg-surface active:translate-y-[1px] active:shadow-[0_1px_0_var(--color-border)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-50"
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
