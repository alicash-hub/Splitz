import { useMemo, useState } from 'react'
import { useTripData } from '../hooks/useTripData'
import { computeBalances, minimizeTransfers } from '../lib/settlement'
import MemberInitials from '../components/MemberInitials'
import BalanceCard from '../components/BalanceCard'
import SettlementSection from '../components/SettlementSection'
import ExpenseCard from '../components/ExpenseCard'
import AddExpenseButton from '../components/AddExpenseButton'

export default function TripDashboard({ trip }) {
  const tripName = trip?.name ?? 'Trip'

  const { members, expenses, loading } = useTripData(trip?.id)
  const [showAdd, setShowAdd] = useState(false)

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
              <BalanceCard key={b.memberId} name={b.name} net={b.net} />
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
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-md rounded-card bg-bg p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text">Add expense</h2>
            <p className="mt-2 text-text-muted">
              Coming next — this is where you’ll log who paid, how much, and what
              it was for.
            </p>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="mt-6 w-full rounded-card border border-black/10 bg-bg px-4 py-3 text-base font-medium text-text transition hover:bg-surface"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
