import { describe, expect, it } from 'vitest'
import { computeBalances, minimizeTransfers } from './settlement'

const members = [
  { id: 'a', name: 'Aya' },
  { id: 'b', name: 'Basel' },
  { id: 'c', name: 'Cairo' },
]

function netOf(balances, id) {
  return balances.find((b) => b.memberId === id).net
}

describe('computeBalances', () => {
  it('returns [] when there are no members', () => {
    expect(computeBalances([], [{ paid_by: 'a', amount: 100 }])).toEqual([])
  })

  it('gives everyone a zero balance when there are no expenses', () => {
    const balances = computeBalances(members, [])
    expect(balances.map((b) => b.net)).toEqual([0, 0, 0])
  })

  it('splits a single payer equally', () => {
    const balances = computeBalances(members, [{ paid_by: 'a', amount: 300 }])
    expect(netOf(balances, 'a')).toBe(200)
    expect(netOf(balances, 'b')).toBe(-100)
    expect(netOf(balances, 'c')).toBe(-100)
  })

  it('always sums to zero, even with an uneven split', () => {
    const balances = computeBalances(members, [{ paid_by: 'a', amount: 100 }])
    const sum = balances.reduce((t, b) => t + b.net, 0)
    expect(sum).toBeCloseTo(0, 10)
    // 100 / 3 -> shares of 33.34, 33.33, 33.33
    expect(netOf(balances, 'a')).toBeCloseTo(66.66, 10)
    expect(netOf(balances, 'b')).toBeCloseTo(-33.33, 10)
    expect(netOf(balances, 'c')).toBeCloseTo(-33.33, 10)
  })

  it('tracks how much each member paid', () => {
    const balances = computeBalances(members, [
      { paid_by: 'a', amount: 100 },
      { paid_by: 'a', amount: 50 },
      { paid_by: 'b', amount: 30 },
    ])
    expect(balances.find((b) => b.memberId === 'a').paid).toBe(150)
    expect(balances.find((b) => b.memberId === 'b').paid).toBe(30)
    expect(balances.find((b) => b.memberId === 'c').paid).toBe(0)
  })
})

describe('computeBalances with a per-expense split', () => {
  it('only charges the members an expense is split between', () => {
    // Aya pays 100, split just between Aya and Basel. Cairo owes nothing.
    const balances = computeBalances(members, [
      { paid_by: 'a', amount: 100, split_between: ['a', 'b'] },
    ])
    expect(netOf(balances, 'a')).toBe(50)
    expect(netOf(balances, 'b')).toBe(-50)
    expect(netOf(balances, 'c')).toBe(0)
    expect(balances.reduce((t, x) => t + x.net, 0)).toBeCloseTo(0, 10)
  })

  it('treats an empty or full split_between as everyone', () => {
    const empty = computeBalances(members, [
      { paid_by: 'a', amount: 300, split_between: [] },
    ])
    const full = computeBalances(members, [
      { paid_by: 'a', amount: 300, split_between: ['a', 'b', 'c'] },
    ])
    const everyone = computeBalances(members, [{ paid_by: 'a', amount: 300 }])
    expect(empty.map((b) => b.net)).toEqual(everyone.map((b) => b.net))
    expect(full.map((b) => b.net)).toEqual(everyone.map((b) => b.net))
  })

  it('lets someone pay only for themselves (split of one)', () => {
    const balances = computeBalances(members, [
      { paid_by: 'a', amount: 40, split_between: ['a'] },
    ])
    expect(balances.map((b) => b.net)).toEqual([0, 0, 0])
  })

  it('ignores split ids that are no longer members', () => {
    // Split named Basel and a removed member; only Basel still counts, so the
    // whole 100 lands on Basel.
    const balances = computeBalances(members, [
      { paid_by: 'a', amount: 100, split_between: ['b', 'ghost'] },
    ])
    expect(netOf(balances, 'a')).toBe(100)
    expect(netOf(balances, 'b')).toBe(-100)
    expect(netOf(balances, 'c')).toBe(0)
  })

  it('spreads the remainder so a subset split still sums to zero', () => {
    // 1.11 split between two -> 0.56 / 0.55, no residual.
    const balances = computeBalances(members, [
      { paid_by: 'a', amount: 1.11, split_between: ['a', 'b'] },
    ])
    expect(netOf(balances, 'a')).toBeCloseTo(0.55, 10)
    expect(netOf(balances, 'b')).toBeCloseTo(-0.55, 10)
    expect(netOf(balances, 'c')).toBe(0)
    expect(balances.reduce((t, x) => t + x.net, 0)).toBeCloseTo(0, 10)
  })
})

describe('computeBalances with settlements', () => {
  it('nets a recorded payment: debtor up, creditor down, sum still zero', () => {
    // Aya paid 300 -> a:+200, b:-100, c:-100. Basel pays Aya 100.
    const balances = computeBalances(
      members,
      [{ paid_by: 'a', amount: 300 }],
      [{ from_id: 'b', to_id: 'a', amount: 100 }],
    )
    expect(netOf(balances, 'a')).toBe(100)
    expect(netOf(balances, 'b')).toBe(0)
    expect(netOf(balances, 'c')).toBe(-100)
    expect(balances.reduce((t, x) => t + x.net, 0)).toBeCloseTo(0, 10)
  })

  it('a full round of settlements clears everyone', () => {
    const balances = computeBalances(
      members,
      [{ paid_by: 'a', amount: 300 }],
      [
        { from_id: 'b', to_id: 'a', amount: 100 },
        { from_id: 'c', to_id: 'a', amount: 100 },
      ],
    )
    expect(balances.map((b) => b.net)).toEqual([0, 0, 0])
    expect(minimizeTransfers(balances)).toEqual([])
  })

  it('settling one transfer removes just that pair, no reverse debt', () => {
    const balances = computeBalances(
      members,
      [{ paid_by: 'a', amount: 300 }],
      [{ from_id: 'b', to_id: 'a', amount: 100 }],
    )
    const transfers = minimizeTransfers(balances)
    expect(transfers).toEqual([
      { fromId: 'c', fromName: 'Cairo', toId: 'a', toName: 'Aya', amount: 100 },
    ])
  })

  it('ignores settlements referencing unknown members', () => {
    const balances = computeBalances(
      members,
      [{ paid_by: 'a', amount: 300 }],
      [{ from_id: 'b', to_id: 'ghost', amount: 100 }],
    )
    // unchanged from the no-settlement case
    expect(netOf(balances, 'a')).toBe(200)
    expect(netOf(balances, 'b')).toBe(-100)
  })
})

describe('minimizeTransfers', () => {
  it('returns no transfers when everyone is settled', () => {
    const balances = computeBalances(members, [])
    expect(minimizeTransfers(balances)).toEqual([])
  })

  it('settles a single payer with one transfer per debtor', () => {
    const balances = computeBalances(members, [{ paid_by: 'a', amount: 300 }])
    const transfers = minimizeTransfers(balances)
    expect(transfers).toHaveLength(2)
    for (const t of transfers) {
      expect(t.toId).toBe('a')
      expect(t.amount).toBe(100)
    }
    expect(transfers.map((t) => t.fromId).sort()).toEqual(['b', 'c'])
  })

  it('omits members who are already even', () => {
    const balances = computeBalances(members, [
      { paid_by: 'a', amount: 60 },
      { paid_by: 'b', amount: 30 },
    ])
    // total 90, share 30 -> a:+30, b:0, c:-30
    const transfers = minimizeTransfers(balances)
    expect(transfers).toEqual([
      { fromId: 'c', fromName: 'Cairo', toId: 'a', toName: 'Aya', amount: 30 },
    ])
  })

  it('leaves no residual with uneven splits', () => {
    const balances = computeBalances(members, [{ paid_by: 'a', amount: 100 }])
    const transfers = minimizeTransfers(balances)
    const total = transfers.reduce((t, x) => t + x.amount, 0)
    expect(total).toBeCloseTo(66.66, 10)
    expect(transfers.every((t) => t.toId === 'a')).toBe(true)
  })

  it('produces a valid plan for a multi-payer trip', () => {
    const balances = computeBalances(members, [
      { paid_by: 'a', amount: 120 },
      { paid_by: 'b', amount: 60 },
      { paid_by: 'c', amount: 0 },
    ])
    // total 180, share 60 -> a:+60, b:0, c:-60
    const transfers = minimizeTransfers(balances)
    expect(transfers).toEqual([
      { fromId: 'c', fromName: 'Cairo', toId: 'a', toName: 'Aya', amount: 60 },
    ])
  })
})
