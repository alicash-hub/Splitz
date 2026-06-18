import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { listMembers } from '../lib/members'
import { listExpenses } from '../lib/expenses'

/**
 * Live trip data: loads members + expenses for a trip and keeps them in sync via
 * Supabase realtime, so balances and the settlement plan update the moment anyone
 * adds an expense or joins.
 *
 * @param {string} tripId
 * @returns {{ members: Array, expenses: Array, loading: boolean, error: Error|null }}
 */
export function useTripData(tripId) {
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!tripId) return
    let active = true

    async function loadAll() {
      try {
        const [m, e] = await Promise.all([
          listMembers(tripId),
          listExpenses(tripId),
        ])
        if (!active) return
        setMembers(m)
        setExpenses(e)
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
        async () => {
          try {
            const m = await listMembers(tripId)
            if (active) setMembers(m)
          } catch {
            /* keep last good data on a refetch hiccup */
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` },
        async () => {
          try {
            const e = await listExpenses(tripId)
            if (active) setExpenses(e)
          } catch {
            /* keep last good data on a refetch hiccup */
          }
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [tripId])

  return { members, expenses, loading, error }
}
