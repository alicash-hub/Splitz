import { formatEGP } from '../lib/format'

// One card per member showing their net balance. Tappable (opens member options)
// when an onSelect handler is provided.
export default function BalanceCard({ name, net, onSelect }) {
  const settled = Math.abs(net) < 0.005
  const positive = net > 0

  const amountColor = settled
    ? 'text-text-muted'
    : positive
      ? 'text-positive'
      : 'text-negative'
  const label = settled ? 'settled up' : positive ? 'gets back' : 'owes'

  const amount = (
    <span className="text-right">
      <span className={`block font-display text-lg font-extrabold ${amountColor}`}>
        {settled ? '—' : formatEGP(Math.abs(net))}
      </span>
      <span className="block text-xs text-text-muted">{label}</span>
    </span>
  )

  const base =
    'flex w-full items-center justify-between rounded-card border border-[var(--color-border)] bg-bg p-4 text-left shadow-[0_2px_0_var(--color-border)]'

  if (!onSelect) {
    return (
      <div className={base}>
        <span className="font-bold text-text">{name}</span>
        {amount}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${base} transition hover:border-accent`}
    >
      <span className="font-bold text-text">{name}</span>
      <span className="flex items-center gap-2">
        {amount}
        <span aria-hidden className="text-text-muted">
          ›
        </span>
      </span>
    </button>
  )
}
