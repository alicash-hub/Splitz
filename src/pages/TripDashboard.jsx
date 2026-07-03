import { useMemo, useState } from 'react'
import { useTripData } from '../hooks/useTripData'
import { computeBalances, minimizeTransfers } from '../lib/settlement'
import { clearCachedMemberId } from '../lib/identity'
import MemberInitials from '../components/MemberInitials'
import BalanceCard from '../components/BalanceCard'
import SettlementSection from '../components/SettlementSection'
import ExpenseCard from '../components/ExpenseCard'
import SwipeableRow from '../components/SwipeableRow'
import AddExpenseButton from '../components/AddExpenseButton'
import AddExpense from '../components/AddExpense'
import MemberSheet from '../components/MemberSheet'
import ExpenseSheet from '../components/ExpenseSheet'
import ShareSheet from '../components/ShareSheet'

export default function TripDashboard({ trip, memberId }) {
  const tripName = trip?.name ?? 'Trip'

  const { members, expenses, loading, refreshExpenses, refresh } = useTripData(
    trip?.id,
  )
  const [showAdd, setShowAdd] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  function openExpense(expense, { confirm = false } = {}) {
    setConfirmDelete(confirm)
    setSelectedExpense(expense)
  }

  const selectedExpenseCount = useMemo(
    () =>
      selectedMember
        ? expenses.filter((e) => e.paid_by === selectedMember.memberId).length
        : 0,
    [selectedMember, expenses],
  )

  function handleRemoved(removed) {
    // If you removed yourself, drop the cached identity so a reload re-prompts.
    if (removed.id === memberId) clearCachedMemberId(trip.id)
    setSelectedMember(null)
    refresh()
  }

  const balances = useMemo(
    () => computeBalances(members, expenses),
    [members, expenses],
  )
  const transfers = useMemo(() => minimizeTransfers(balances), [balances])
  const memberNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  )

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

  return (
    <>
      <main className="mx-auto max-w-md px-6 pt-10 pb-28">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text">
            {tripName}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {solo
              ? 'Just you so far'
              : `${members.length} ${members.length === 1 ? 'person' : 'people'}`}
          </p>
        </header>

        {solo ? (
          <section className="mb-8">
            <div className="rounded-card border border-[var(--color-border)] bg-bg p-6 text-center shadow-[0_2px_0_var(--color-border)]">
              <div className="text-5xl">👋</div>
              <h2 className="mt-3 font-display text-xl font-extrabold text-text">
                It's just you in here
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-text-muted">
                Invite the group so everyone can add what they paid — then you'll
                see who owes who.
              </p>
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className="mt-5 w-full rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]"
              >
                Invite friends
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between gap-3">
              <MemberInitials members={members} />
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className="shrink-0 rounded-full border border-[var(--color-border)] bg-bg px-3 py-1.5 text-sm font-bold text-accent2 shadow-[0_2px_0_var(--color-border)] transition hover:border-accent2"
              >
                Invite
              </button>
            </div>

            <section className="mb-8">
              <h2 className="mb-3 font-display text-lg font-bold text-text">
                Where everyone stands
              </h2>
              <div className="flex flex-col gap-2">
                {balances.map((b) => (
                  <BalanceCard
                    key={b.memberId}
                    name={b.name}
                    net={b.net}
                    onSelect={() => setSelectedMember(b)}
                  />
                ))}
              </div>
            </section>

            <div className="mb-8">
              <SettlementSection tripName={tripName} transfers={transfers} />
            </div>
          </>
        )}

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-text">
            Expenses
          </h2>
          {expenses.length === 0 ? (
            <div className="rounded-card border border-[var(--color-border)] bg-bg p-6 text-center font-semibold text-text-muted shadow-[0_2px_0_var(--color-border)]">
              No expenses yet. Tap “Add expense” to log the first one.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {expenses.map((expense) => (
                <SwipeableRow
                  key={expense.id}
                  actions={({ close }) => (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          close()
                          setEditingExpense(expense)
                        }}
                        className="flex flex-1 items-center justify-center bg-accent2 text-sm font-bold text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          close()
                          openExpense(expense, { confirm: true })
                        }}
                        className="flex flex-1 items-center justify-center bg-negative text-sm font-semibold text-white"
                      >
                        Delete
                      </button>
                    </>
                  )}
                >
                  <ExpenseCard
                    expense={expense}
                    payerName={memberNameById.get(expense.paid_by) ?? 'Someone'}
                    onSelect={() => openExpense(expense)}
                  />
                </SwipeableRow>
              ))}
            </div>
          )}
        </section>
      </main>

      <AddExpenseButton onClick={() => setShowAdd(true)} />

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

      {selectedMember && (
        <MemberSheet
          member={{ id: selectedMember.memberId, name: selectedMember.name }}
          net={selectedMember.net}
          expenseCount={selectedExpenseCount}
          onClose={() => setSelectedMember(null)}
          onRemoved={handleRemoved}
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
    </>
  )
}
