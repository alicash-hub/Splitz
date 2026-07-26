import { useMemo, useState } from 'react'
import { useTripData } from '../hooks/useTripData'
import { computeBalances, minimizeTransfers } from '../lib/settlement'
import { deleteSettlement } from '../lib/settlements'
import { initials } from '../lib/format'
import BalanceSummary from '../components/BalanceSummary'
import SettlementSection from '../components/SettlementSection'
import ExpenseCard from '../components/ExpenseCard'
import SettlementCard from '../components/SettlementCard'
import SwipeableRow from '../components/SwipeableRow'
import TabBar from '../components/TabBar'
import AddExpense from '../components/AddExpense'
import ExpenseSheet from '../components/ExpenseSheet'
import ShareSheet from '../components/ShareSheet'
import SettleSheet from '../components/SettleSheet'

// Shared trip header: emoji tile + trip name + current tab title, with the member
// avatars on their own line below (wraps, so a big group doesn't crowd the title)
// followed by a dashed add-people button.
function TripHeader({ tripName, tabTitle, members, onAdd }) {
  return (
    <header className="mb-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-chip text-xl">
          🏖️
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-text-muted">
            {tripName}
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-text">
            {tabTitle}
          </h1>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {members.map((m) => (
          <div
            key={m.id}
            title={m.name}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-xs font-extrabold text-text"
          >
            {initials(m.name)}
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          title="Add people"
          aria-label="Add people"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-[#b9c6d4] bg-bg text-accent2 transition hover:border-accent2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default function TripDashboard({ trip, memberId }) {
  const tripName = trip?.name ?? 'Trip'

  const {
    members,
    expenses,
    settlements,
    loading,
    refreshExpenses,
    refreshSettlements,
  } = useTripData(trip?.id)

  const [tab, setTab] = useState('activity')
  const [showAdd, setShowAdd] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [toast, setToast] = useState(null) // { text, actionLabel?, onAction? }
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [settlingTransfer, setSettlingTransfer] = useState(null)

  function openExpense(expense, { confirm = false } = {}) {
    setConfirmDelete(confirm)
    setSelectedExpense(expense)
  }

  const balances = useMemo(
    () => computeBalances(members, expenses, settlements),
    [members, expenses, settlements],
  )
  const transfers = useMemo(() => minimizeTransfers(balances), [balances])
  const memberNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  )

  // Expenses + settlements in one time-sorted feed.
  const activity = useMemo(() => {
    const items = [
      ...expenses.map((e) => ({ kind: 'expense', at: e.created_at, data: e })),
      ...settlements.map((s) => ({
        kind: 'settlement',
        at: s.created_at,
        data: s,
      })),
    ]
    return items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  }, [expenses, settlements])

  const myBalance = balances.find((b) => b.memberId === memberId)
  const myNet = myBalance ? myBalance.net : 0

  function showToast(text, action) {
    const t = { text, ...(action ?? {}) }
    setToast(t)
    setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 5000)
  }

  // Record a payment, then offer an immediate undo.
  function handleSettled(settlement, otherName) {
    setSettlingTransfer(null)
    refreshSettlements()
    showToast(`Settled with ${otherName} ✓`, {
      actionLabel: 'Undo',
      onAction: async () => {
        try {
          await deleteSettlement(settlement.id)
        } catch {
          /* best-effort undo */
        }
        refreshSettlements()
      },
    })
  }

  async function removeSettlement(settlement) {
    try {
      await deleteSettlement(settlement.id)
    } catch {
      /* best-effort */
    }
    refreshSettlements()
    showToast('Settlement removed')
  }

  // Solo trip: no one to settle with yet — lead with an invite instead of empty
  // balance/settle-up sections. Flips automatically once someone else joins.
  const solo = members.length <= 1

  if (loading) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12 text-center">
        <p className="text-text-muted">Loading…</p>
      </main>
    )
  }

  const inviteCard = (
    <div className="rounded-card border border-[var(--color-border)] bg-bg p-6 text-center shadow-[0_2px_0_var(--color-border)]">
      <div className="text-5xl">🕴️</div>
      <h2 className="mt-3 font-display text-xl font-extrabold text-text">
        It's just you in here
      </h2>
      <button
        type="button"
        onClick={() => setShowShare(true)}
        className="mt-6 w-full rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]"
      >
        Invite friends
      </button>
    </div>
  )

  const activityFeed =
    activity.length === 0 ? (
      <div className="rounded-card border border-[var(--color-border)] bg-bg p-6 text-center font-semibold text-text-muted shadow-[0_2px_0_var(--color-border)]">
        No activity yet. Tap the “+” below to log the first expense.
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        {activity.map((item) =>
          item.kind === 'expense' ? (
            <SwipeableRow
              key={`e-${item.data.id}`}
              actions={({ close }) => (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      setEditingExpense(item.data)
                    }}
                    className="flex flex-1 items-center justify-center bg-accent2 text-sm font-bold text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      openExpense(item.data, { confirm: true })
                    }}
                    className="flex flex-1 items-center justify-center bg-negative text-sm font-semibold text-white"
                  >
                    Delete
                  </button>
                </>
              )}
            >
              <ExpenseCard
                expense={item.data}
                payerName={memberNameById.get(item.data.paid_by) ?? 'Someone'}
                memberNameById={memberNameById}
                memberCount={members.length}
                onSelect={() => openExpense(item.data)}
              />
            </SwipeableRow>
          ) : (
            <SwipeableRow
              key={`s-${item.data.id}`}
              actions={({ close }) => (
                <button
                  type="button"
                  onClick={() => {
                    close()
                    removeSettlement(item.data)
                  }}
                  className="flex flex-1 items-center justify-center bg-negative text-sm font-bold text-white"
                >
                  Delete
                </button>
              )}
            >
              <SettlementCard
                settlement={item.data}
                memberNameById={memberNameById}
              />
            </SwipeableRow>
          ),
        )}
      </div>
    )

  return (
    <>
      <main className="mx-auto min-h-full max-w-md px-6 pt-10 pb-28">
        <TripHeader
          tripName={tripName}
          tabTitle={tab === 'activity' ? 'Activity' : 'Balances'}
          members={members}
          onAdd={() => setShowShare(true)}
        />

        {tab === 'activity' ? (
          <>
            {solo && <div className="mb-8">{inviteCard}</div>}
            <section>{activityFeed}</section>
          </>
        ) : solo ? (
          inviteCard
        ) : (
          <>
            <div className="mb-6">
              <BalanceSummary net={myNet} />
            </div>

            {transfers.length > 0 && (
              <SettlementSection
                tripName={tripName}
                transfers={transfers}
                memberId={memberId}
                onSettle={(t) => setSettlingTransfer(t)}
              />
            )}
          </>
        )}
      </main>

      <TabBar tab={tab} onTab={setTab} onAdd={() => setShowAdd(true)} />

      {showShare && (
        <ShareSheet trip={trip} onClose={() => setShowShare(false)} />
      )}

      {showAdd && (
        <AddExpense
          trip={trip}
          members={members}
          currentMemberId={memberId}
          onClose={() => setShowAdd(false)}
          onSaved={refreshExpenses}
        />
      )}

      {editingExpense && (
        <AddExpense
          trip={trip}
          members={members}
          currentMemberId={memberId}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={refreshExpenses}
        />
      )}

      {selectedExpense && (
        <ExpenseSheet
          expense={selectedExpense}
          payerName={memberNameById.get(selectedExpense.paid_by) ?? 'Someone'}
          initialConfirm={confirmDelete}
          onClose={() => setSelectedExpense(null)}
          onEdit={(exp) => {
            setSelectedExpense(null)
            setEditingExpense(exp)
          }}
          onDeleted={() => {
            setSelectedExpense(null)
            refreshExpenses()
          }}
        />
      )}

      {settlingTransfer && (
        <SettleSheet
          trip={trip}
          transfer={settlingTransfer}
          currentMemberId={memberId}
          onClose={() => setSettlingTransfer(null)}
          onSettled={handleSettled}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 mx-auto max-w-md px-6">
          <div className="pointer-events-auto mx-auto flex w-fit items-center gap-3 rounded-full bg-text px-4 py-2 text-sm font-bold text-white shadow-lg">
            <span>{toast.text}</span>
            {toast.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.()
                  setToast(null)
                }}
                className="font-extrabold text-chip underline"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
