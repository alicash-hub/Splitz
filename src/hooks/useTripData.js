import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { listMembers } from '../lib/members'
import { listExpenses } from '../lib/expenses'
import { listSettlements } from '../lib/settlements'

/**
 * Live trip data: loads members, expenses, and settlements for a trip and keeps
 * them in sync via Supabase realtime, so balances and the settlement plan update
 * the moment anyone adds an expense, joins, or records a payment.
 *
 * Settlements are loaded tolerantly — if that table doesn't exist yet (before the
 * migration lands) the rest of the dashboard still works.
 */
export function useTripData(tripId) {
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshMembers = useCallback(async () => {
    if (!tripId) return
    try {
      setMembers(await listMembers(tripId))
    } catch (err) {
      setError(err)
    }
  }, [tripId])

  const refreshExpenses = useCallback(async () => {
    if (!tripId) return
    try {
      setExpenses(await listExpenses(tripId))
    } catch (err) {
      setError(err)
    }
  }, [tripId])

  const refreshSettlements = useCallback(async () => {
    if (!tripId) return
    try {
      setSettlements(await listSettlements(tripId))
    } catch {
      // Table may not exist yet, or a transient hiccup — keep last good data.
    }
  }, [tripId])

  useEffect(() => {
    if (!tripId) return
    let active = true
    setLoading(true)

    async function loadAll() {
      try {
        const [m, e] = await Promise.all([
          listMembers(tripId),
          listExpenses(tripId),
        ])
        if (!active) return
        setMembers(m)
        setExpenses(e)
        try {
          const s = await listSettlements(tripId)
          if (active) setSettlements(s)
        } catch {
          // settlements table may not exist yet — non-fatal
        }
      } catch (err) {
        if (active) setError(err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAll()

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `trip_id=eq.${tripId}` },
        () => refreshMembers(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` },
        () => refreshExpenses(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter: `trip_id=eq.${tripId}` },
        () => refreshSettlements(),
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [tripId, refreshMembers, refreshExpenses, refreshSettlements])

  const refresh = useCallback(async () => {
    await Promise.all([refreshMembers(), refreshExpenses(), refreshSettlements()])
  }, [refreshMembers, refreshExpenses, refreshSettlements])

  return {
    members,
    expenses,
    settlements,
    loading,
    error,
    refreshExpenses,
    refreshSettlements,
    refresh,
  }
}
