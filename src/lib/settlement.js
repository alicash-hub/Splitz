// The heart of the product: turn a list of expenses into per-person balances and
// the minimum set of transfers to settle up. Pure and UI-free — keep it tested.
//
// All arithmetic is done in integer piastres (1 EGP = 100) to avoid floating
// point drift, so balances always sum to exactly zero and transfers leave no
// residual.

/**
 * Net balance per member: what they paid minus their fair (equal) share.
 *
 * @param {Array<{id: string, name: string}>} members
 * @param {Array<{paid_by: string, amount: number|string}>} expenses
 * @returns {Array<{memberId: string, name: string, paid: number, net: number}>}
 *   `paid` and `net` are in EGP. Positive net = overpaid (gets money back),
 *   negative = underpaid (owes). Order matches `members`.
 */
export function computeBalances(members, expenses) {
  if (!members || members.length === 0) return []

  const paidCents = new Map(members.map((m) => [m.id, 0]))
  let totalCents = 0

  for (const expense of expenses ?? []) {
    if (!paidCents.has(expense.paid_by)) continue // safety; FK should prevent this
    const cents = Math.round(Number(expense.amount) * 100)
    if (!Number.isFinite(cents)) continue
    paidCents.set(expense.paid_by, paidCents.get(expense.paid_by) + cents)
    totalCents += cents
  }

  const n = members.length
  const baseShare = Math.floor(totalCents / n)
  // Spread the leftover piastres across the first members so shares sum exactly
  // to the total (and nets sum to zero).
  const remainder = totalCents - baseShare * n

  return members.map((member, idx) => {
    const shareCents = baseShare + (idx < remainder ? 1 : 0)
    const paid = paidCents.get(member.id)
    return {
      memberId: member.id,
      name: member.name,
      paid: paid / 100,
      net: (paid - shareCents) / 100,
    }
  })
}

/**
 * Greedily match the largest debtor with the largest creditor until everyone is
 * settled, minimizing the number of transfers.
 *
 * @param {Array<{memberId: string, name: string, net: number}>} balances
 * @returns {Array<{fromId: string, fromName: string, toId: string, toName: string, amount: number}>}
 *   transfers in EGP: `from` sends `amount` to `to`.
 */
export function minimizeTransfers(balances) {
  const creditors = []
  const debtors = []
  for (const b of balances ?? []) {
    const cents = Math.round(b.net * 100)
    if (cents > 0) creditors.push({ ...b, cents })
    else if (cents < 0) debtors.push({ ...b, cents: -cents })
  }

  const transfers = []
  const largest = (list) =>
    list.reduce((best, x) => (x.cents > (best?.cents ?? 0) ? x : best), null)

  while (true) {
    const creditor = largest(creditors)
    const debtor = largest(debtors)
    if (!creditor || !debtor || creditor.cents === 0 || debtor.cents === 0) break

    const amount = Math.min(creditor.cents, debtor.cents)
    transfers.push({
      fromId: debtor.memberId,
      fromName: debtor.name,
      toId: creditor.memberId,
      toName: creditor.name,
      amount: amount / 100,
    })
    creditor.cents -= amount
    debtor.cents -= amount
  }

  return transfers
}
