import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrip } from '../lib/trips'

export default function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = name.trim().length > 0 && !submitting

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError('')
    try {
      const trip = await createTrip(name)
      navigate(`/t/${trip.slug}`)
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-text">
          Bread &amp; Salt
        </h1>
        <p className="mt-3 text-text-muted">
          Split group expenses. Settle up the easy way.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="trip-name" className="text-sm font-medium text-text">
            What's the trip?
          </label>
          <input
            id="trip-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sahel weekend"
            autoFocus
            autoComplete="off"
            maxLength={80}
            className="w-full rounded-card border border-black/10 bg-bg px-4 py-3 text-base text-text shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-negative">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 w-full rounded-card bg-accent px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Starting…' : 'Start a new trip'}
        </button>
      </form>
    </main>
  )
}
