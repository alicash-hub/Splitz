import { useMemo, useState } from 'react'
import { useTripData } from '../hooks/useTripData'
import { computeBalances, minimizeTransfers } from '../lib/settlement'
import { clearCachedMemberId } from '../lib/identity'
import { initials, formatEGP } from '../lib/format'
import AddExpense from '../components/AddExpense'
import MemberSheet from '../components/MemberSheet'
import ExpenseCard from '../components/ExpenseCard'

const AVATAR_COLORS = [
  '#4A9FE0',
  '#4CAF73',
  '#F5A623',
  '#9B59B6',
  '#E74C3C',
  '#1ABC9C',
  '#E67E22',
  '#2980B9',
]

function memberColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

export default function TripDashboard({ trip, memberId }) {
  const { members, expenses, loading, refreshExpenses, refresh } = useTripData(trip?.id)
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
    if (removed.id === memberId) clearCachedMemberId(trip.id)
    setSelectedMember(null)
    refresh()
  }

  const balances = useMemo(() => computeBalances(members, expenses), [members, expenses])
  const transfers = useMemo(() => minimizeTransfers(balances), [balances])

  const memberIndexById = useMemo(
    () => new Map(members.map((m, i) => [m.id, i])),
    [members],
  )
  const memberNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  )

  const currentMember = members.find((m) => m.id === memberId)
  const currentName = currentMember?.name ?? 'You'
  const currentInitials = initials(currentName)

  // Per-friend bilateral settlement amounts
  const friendBalance = useMemo(() => {
    const map = new Map()
    for (const t of transfers) {
      if (t.toId === memberId) {
        map.set(t.fromId, { amount: t.amount, direction: 'owes_me' })
      } else if (t.fromId === memberId) {
        map.set(t.toId, { amount: t.amount, direction: 'i_owe' })
      }
    }
    return map
  }, [transfers, memberId])

  // Personal summary totals
  const { owedToMe, iOwe } = useMemo(() => {
    let owedToMe = 0
    let iOwe = 0
    for (const t of transfers) {
      if (t.toId === memberId) owedToMe += t.amount
      else if (t.fromId === memberId) iOwe += t.amount
    }
    return { owedToMe, iOwe }
  }, [transfers, memberId])

  const netPersonal = owedToMe - iOwe

  const friends = members.filter((m) => m.id !== memberId)

  if (loading) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12 text-center">
        <p style={{ color: '#717171' }}>Loading…</p>
      </main>
    )
  }

  return (
    <>
      <main className="mx-auto max-w-md pb-28" style={{ background: '#f7f7f7', minHeight: '100vh' }}>
        {/* Header */}
        <div className="px-6 pt-12 pb-6" style={{ background: '#ffffff' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest" style={{ color: '#717171' }}>
                WELCOME BACK
              </p>
              <h1 className="mt-1 text-3xl font-bold" style={{ color: '#222222' }}>
                Hi, {currentName} 👋
              </h1>
            </div>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: memberColor(memberIndexById.get(memberId) ?? 0) }}
            >
              {currentInitials}
            </div>
          </div>
        </div>

        {/* Summary card */}
        <div className="px-4 pt-4">
          <div
            className="rounded-2xl p-5"
            style={{
              background: netPersonal >= 0 ? '#5dba40' : '#e0565b',
              color: '#ffffff',
            }}
          >
            <p className="text-xs font-semibold tracking-widest opacity-90">
              {netPersonal >= 0 ? 'YOU ARE OWED OVERALL' : 'YOU OWE OVERALL'}
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">
              {formatEGP(Math.abs(netPersonal))}
            </p>

            <div className="mt-4 flex gap-3">
              <div
                className="flex-1 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <p className="text-xs font-semibold tracking-wider opacity-80">YOU'RE OWED</p>
                <p className="mt-0.5 text-lg font-bold">+{formatEGP(owedToMe)}</p>
              </div>
              <div
                className="flex-1 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <p className="text-xs font-semibold tracking-wider opacity-80">YOU OWE</p>
                <p className="mt-0.5 text-lg font-bold">−{formatEGP(iOwe)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Friends section */}
        <div className="px-4 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: '#222222' }}>
              Friends
            </h2>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm font-semibold"
              style={{ color: '#4A9FE0' }}
            >
              + ADD EXPENSE
            </button>
          </div>

          {friends.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center text-sm"
              style={{ background: '#ffffff', color: '#717171' }}
            >
              No other members yet. Share the trip link so friends can join!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {friends.map((friend) => {
                const idx = memberIndexById.get(friend.id) ?? 0
                const fb = friendBalance.get(friend.id)
                const direction = fb?.direction
                const amount = fb?.amount ?? 0

                return (
                  <button
                    key={friend.id}
                    className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left"
                    style={{ background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    onClick={() => {
                      const b = balances.find((b) => b.memberId === friend.id)
                      if (b) setSelectedMember(b)
                    }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: memberColor(idx) }}
                    >
                      {initials(friend.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: '#222222' }}>
                        {friend.name}
                      </p>
                      <p className="text-sm" style={{ color: '#717171' }}>
                        {direction === 'owes_me'
                          ? 'owes you'
                          : direction === 'i_owe'
                          ? 'you owe them'
                          : 'settled up'}
                      </p>
                    </div>
                    {direction && (
                      <p
                        className="text-lg font-bold shrink-0"
                        style={{
                          color: direction === 'owes_me' ? '#4CAF73' : '#e0565b',
                        }}
                      >
                        {formatEGP(amount)}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Expenses */}
        {expenses.length > 0 && (
          <div className="px-4 pt-6">
            <h2 className="mb-3 text-xl font-bold" style={{ color: '#222222' }}>
              Expenses
            </h2>
            <div className="flex flex-col gap-3">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  payerName={memberNameById.get(expense.paid_by) ?? 'Someone'}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-lg"
        style={{ background: '#ff5a5f' }}
        aria-label="Add expense"
      >
        +
      </button>

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
