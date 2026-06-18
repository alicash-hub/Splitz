import { useMemo, useState } from 'react'
import { useTripData } from '../hooks/useTripData'
import { computeBalances, minimizeTransfers } from '../lib/settlement'
import { clearCachedMemberId } from '../lib/identity'
import MemberInitials from '../components/MemberInitials'
import BalanceCard from '../components/BalanceCard'
import SettlementSection from '../components/SettlementSection'
import ExpenseCard from '../components/ExpenseCard'
import AddExpenseButton from '../components/AddExpenseButton'
import AddExpense from '../components/AddExpense'
import MemberSheet from '../components/MemberSheet'

export default function TripDashboard({ trip, memberId }) {
  const tripName = trip?.name ?? 'Trip'

  const { members, expenses, loading, refreshExpenses, refresh } = useTripData(
    trip?.id,
  )
  const [showAdd, setShowAdd] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

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
          <h1 className="text-3xl font-semibold tracking-tight text-text">
            {tripName}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </p>
        </header>

        <div className="mb-8">
          <MemberInitials members={members} />
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-text">
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

        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">Expenses</h2>
          {expenses.length === 0 ? (
            <div className="rounded-card border border-black/5 bg-bg p-6 text-center text-text-muted shadow-sm">
              No expenses yet. Tap “Add expense” to log the first one.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  payerName={memberNameById.get(expense.paid_by) ?? 'Someone'}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <AddExpenseButton onClick={() => setShowAdd(true)} />

      {showAdd && (
        <AddExpense
          trip={trip}
          members={members}
          currentMemberId={memberId}
          onClose={() => setShowAdd(false)}
          onAdded={refreshExpenses}
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
    </>
  )
}
