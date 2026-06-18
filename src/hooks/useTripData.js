import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { listMembers } from '../lib/members'
import { listExpenses } from '../lib/expenses'

/**
 * Live trip data: loads members + expenses for a trip and keeps them in sync via
 * Supabase realtime, so balances and the settlement plan update the moment anyone
 * adds an expense or joins.
 *
 * @param {string} tripId
 * @returns {{ members: Array, expenses: Array, loading: boolean, error: Error|null, refreshExpenses: () => Promise<void> }}
 */
export function useTripData(tripId) {
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState([])
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

  useEffect(() => {
    if (!tripId) return
    let active = true
    setLoading(true)

    Promise.all([listMembers(tripId), listExpenses(tripId)])
      .then(([m, e]) => {
        if (!active) return
        setMembers(m)
        setExpenses(e)
      })
      .catch((err) => {
        if (active) setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

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
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [tripId, refreshMembers, refreshExpenses])

  return { members, expenses, loading, error, refreshExpenses }
}
