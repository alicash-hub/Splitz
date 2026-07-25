import { formatEGP, formatWhen, initials } from '../lib/format'

// Name the members an expense is split among, or null when it's the whole trip
// (the default, which we leave unmarked to keep cards uncluttered).
function splitLabel(expense, memberNameById, memberCount) {
  const ids = Array.isArray(expense.split_between) ? expense.split_between : null
  if (!ids || ids.length === 0 || ids.length >= memberCount) return null
  const names = ids.map((id) => memberNameById?.get(id)).filter(Boolean)
  if (names.length === 0) return null
  if (names.length <= 2) return names.join(' & ')
  return `${names[0]} & ${names.length - 1} others`
}

// One card per expense: who paid, what for, how much, when. Tappable (opens
// expense options) when an onSelect handler is provided. When an expense is
// split with only some members (not the whole trip), a signifier line names them.
export default function ExpenseCard({
  expense,
  payerName,
  memberNameById,
  memberCount,
  onSelect,
}) {
  const base =
    'flex w-full items-center gap-3 rounded-card border border-[var(--color-border)] bg-bg p-4 text-left shadow-[0_2px_0_var(--color-border)]'

  const split = splitLabel(expense, memberNameById, memberCount)

  const inner = (
    <>
      <div
        title={payerName}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-sm font-bold text-text"
      >
        {initials(payerName)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-text">
          {expense.description?.trim() || 'Expense'}
        </p>
        <p className="truncate text-sm text-text-muted">
          {payerName} paid · {formatWhen(expense.created_at)}
        </p>
        {split && (
          <p className="truncate text-xs font-bold text-accent">
            Split with {split}
          </p>
        )}
      </div>

      <span className="shrink-0 font-display font-extrabold text-text">
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
      className={`${base} transition hover:border-accent`}
    >
      {inner}
      <span aria-hidden className="-ml-1 shrink-0 text-text-muted">
        ›
      </span>
    </button>
  )
}
