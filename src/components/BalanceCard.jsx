import { formatEGP } from '../lib/format'

// One card per member showing their net balance.
export default function BalanceCard({ name, net }) {
  const settled = Math.abs(net) < 0.005
  const positive = net > 0

  const amountColor = settled
    ? 'text-text-muted'
    : positive
      ? 'text-positive'
      : 'text-negative'
  const label = settled ? 'settled up' : positive ? 'gets back' : 'owes'

  return (
    <div className="flex items-center justify-between rounded-card border border-black/5 bg-bg p-4 shadow-sm">
      <span className="font-medium text-text">{name}</span>
      <span className="text-right">
        <span className={`block text-lg font-semibold ${amountColor}`}>
          {settled ? '—' : formatEGP(Math.abs(net))}
        </span>
        <span className="block text-xs text-text-muted">{label}</span>
      </span>
    </div>
  )
}
