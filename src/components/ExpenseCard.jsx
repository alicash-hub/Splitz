import { formatEGP, formatWhen, initials } from '../lib/format'

// One card per expense: who paid, what for, how much, when. Tappable (opens
// expense options) when an onSelect handler is provided.
export default function ExpenseCard({ expense, payerName, onSelect }) {
  const base =
    'flex w-full items-center gap-3 rounded-card border border-black/5 bg-bg p-4 text-left shadow-sm'

  const inner = (
    <>
      <div
        title={payerName}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-text"
      >
        {initials(payerName)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text">
          {expense.description?.trim() || 'Expense'}
        </p>
        <p className="truncate text-sm text-text-muted">
          {payerName} paid · {formatWhen(expense.created_at)}
        </p>
      </div>

      <span className="shrink-0 font-semibold text-text">
        {formatEGP(expense.amount)}
      </span>
    </>
  )

  if (!onSelect) {
    return <div className={base}>{inner}</div>
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${base} transition hover:border-accent/60`}
    >
      {inner}
      <span aria-hidden className="-ml-1 shrink-0 text-text-muted">
        ›
      </span>
    </button>
  )
}
