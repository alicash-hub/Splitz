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
      { paid_by: 'a', amount: 100 },
      { paid_by: 'b', amount: 50 },
    ])
    // total 150, share 50 -> a:+50, b:0, c:-50
    const transfers = minimizeTransfers(balances)
    expect(transfers).toEqual([
      { fromId: 'c', fromName: 'Cairo', toId: 'a', toName: 'Aya', amount: 50 },
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
