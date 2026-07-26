import { formatEGP } from '../lib/format'

// Slim one-line balance summary for the top of the Balances tab: a colored bar +
// label + amount, no full-bleed hero. Red when the user owes, brand blue when
// they're owed, and a calm green "All settled" pill when they're square.
export default function BalanceSummary({ net }) {
  const settled = Math.abs(net) < 0.005
  const owed = net > 0

  const bar = settled ? 'bg-[#2fc08a]' : owed ? 'bg-accent' : 'bg-negative'
  const amountColor = settled
    ? 'text-[#2fc08a]'
    : owed
      ? 'text-accent'
      : 'text-negative'
  const label = settled
    ? 'Your balance'
    : owed
      ? "You're owed overall"
      : 'You owe overall'

  return (
    <div className="flex items-center gap-3 rounded-card border border-[var(--color-border)] bg-bg p-4 shadow-[0_2px_0_var(--color-border)]">
      <div className={`h-10 w-2.5 shrink-0 rounded-full ${bar}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-muted">
          {label}
        </p>
        <p className={`mt-0.5 font-display text-2xl font-extrabold ${amountColor}`}>
          {formatEGP(Math.abs(net))}
        </p>
      </div>
      {settled && (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#e7f9f1] px-3 py-1.5 text-xs font-extrabold text-[#2fc08a]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All settled
        </span>
      )}
    </div>
  )
}
