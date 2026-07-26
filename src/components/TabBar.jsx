// Persistent bottom tab bar for the trip screen: Activity (left), a raised
// center "+" that opens the Add expense sheet, and Balances (right). Fixed to the
// viewport bottom so it never overlaps list rows or their CTAs.

function ActivityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BalancesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 20V10M12 20V4M18 20v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TabButton({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${
        active ? 'text-accent' : 'text-text-muted hover:text-text'
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

export default function TabBar({ tab, onTab, onAdd }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-bg pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto flex max-w-md items-stretch">
        <TabButton
          active={tab === 'activity'}
          onClick={() => onTab('activity')}
          label="Activity"
        >
          <ActivityIcon />
        </TabButton>

        {/* Reserve space for the raised + button between the two tabs */}
        <div className="w-20 shrink-0" aria-hidden />

        <TabButton
          active={tab === 'balances'}
          onClick={() => onTab('balances')}
          label="Balances"
        >
          <BalancesIcon />
        </TabButton>

        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add expense"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-accent-shadow)]"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
