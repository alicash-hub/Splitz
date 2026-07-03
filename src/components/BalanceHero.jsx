import { formatEGP } from '../lib/format'

// The current user's headline balance. Filled blue when they're owed, red when
// they owe, and a calm chip card when everyone's square.
export default function BalanceHero({ net }) {
  const settled = Math.abs(net) < 0.005

  if (settled) {
    return (
      <div className="rounded-card border border-[var(--color-border)] bg-chip p-6 text-center shadow-[0_2px_0_var(--color-border)]">
        <div className="text-3xl">🎉</div>
        <p className="mt-2 font-display text-lg font-extrabold text-text">
          All settled up
        </p>
        <p className="mt-1 text-sm font-semibold text-text-muted">
          Everyone's square.
        </p>
      </div>
    )
  }

  const owed = net > 0

  return (
    <div
      className={`rounded-card p-5 text-white ${
        owed
          ? 'bg-accent shadow-[0_4px_0_var(--color-accent-shadow)]'
          : 'bg-negative shadow-[0_4px_0_var(--color-negative-shadow)]'
      }`}
    >
      <p className="text-xs font-extrabold uppercase tracking-wide opacity-90">
        {owed ? "You're owed" : 'You owe'}
      </p>
      <p className="mt-2 font-display text-4xl font-extrabold">
        {formatEGP(Math.abs(net))}
      </p>
      <p className="mt-1 text-sm font-semibold opacity-85">
        {owed ? 'The group owes you overall.' : 'You owe the group overall.'}
      </p>
    </div>
  )
}
