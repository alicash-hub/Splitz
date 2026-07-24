import { formatEGP, formatWhen } from '../lib/format'

// A recorded payment in the Activity list. Names wrap (never truncate).
export default function SettlementCard({ settlement, memberNameById }) {
  const fromName = memberNameById.get(settlement.from_id) ?? 'Someone'
  const toName = memberNameById.get(settlement.to_id) ?? 'Someone'

  return (
    <div className="flex items-center gap-3 rounded-card border border-[var(--color-border)] bg-bg p-4 shadow-[0_2px_0_var(--color-border)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-lg">
        🤝
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-text">
          <span className="font-bold">{fromName}</span>
          <span className="text-text-muted"> paid </span>
          <span className="font-bold">{toName}</span>
        </p>
        <p className="text-sm text-text-muted">
          Settled up · {formatWhen(settlement.created_at)}
        </p>
      </div>

      <span className="shrink-0 font-display font-extrabold text-text-muted">
        {formatEGP(settlement.amount)}
      </span>
    </div>
  )
}
