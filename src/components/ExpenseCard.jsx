import { formatEGP, formatWhen, initials } from '../lib/format'

// One card per expense: who paid, what for, how much, when.
export default function ExpenseCard({ expense, payerName }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-black/5 bg-bg p-4 shadow-sm">
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
    </div>
  )
}
