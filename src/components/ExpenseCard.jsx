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

// How many ways the cost is split: the participant count, or the whole trip.
function waysCount(expense, memberCount) {
  const ids = Array.isArray(expense.split_between) ? expense.split_between : null
  if (ids && ids.length > 0 && ids.length < memberCount) return ids.length
  return memberCount
}

// One compact card per expense: payer avatar, what for, "<payer> paid · <when>",
// amount and how many ways it split. When an expense is shared with only some
// members, a signifier line names them.
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
  const ways = memberCount > 1 ? waysCount(expense, memberCount) : 0

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

      <div className="shrink-0 text-right">
        <p className="font-display font-extrabold text-text">
          {formatEGP(expense.amount)}
        </p>
        {ways > 0 && (
          <p className="text-xs font-semibold text-text-muted">
            split {ways} {ways === 1 ? 'way' : 'ways'}
          </p>
        )}
      </div>
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
    </button>
  )
}
