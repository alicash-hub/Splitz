import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getTripBySlug } from '../lib/trips'
import { getCachedMemberId, setCachedMemberId } from '../lib/identity'
import { rememberTrip } from '../lib/recentTrips'
import JoinTrip from './JoinTrip'
import TripDashboard from './TripDashboard'

// Gate for /t/:slug — loads the trip, then shows the dashboard for a recognized
// member (cached in localStorage) or the join screen for everyone else.
export default function TripPage() {
  const { slug } = useParams()

  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [memberId, setMemberId] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    getTripBySlug(slug)
      .then((row) => {
        if (!active) return
        if (!row) {
          setNotFound(true)
          return
        }
        setTrip(row)
        setMemberId(getCachedMemberId(row.id))
        rememberTrip({ id: row.id, name: row.name, slug: row.slug })
      })
      .catch(() => {
        if (active) setNotFound(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  function handleJoined(member) {
    setCachedMemberId(trip.id, member.id)
    setMemberId(member.id)
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12 text-center">
        <p className="text-text-muted">Loading…</p>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12 text-center">
        <h1 className="font-display text-2xl font-extrabold text-text">
          Trip not found
        </h1>
        <p className="mt-3 text-text-muted">
          This trip link doesn't seem to exist. Double-check the link, or start a
          new trip.
        </p>
      </main>
    )
  }

  if (memberId) {
    return <TripDashboard trip={trip} memberId={memberId} />
  }

  return <JoinTrip trip={trip} onJoined={handleJoined} />
}
