import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrip } from '../lib/trips'
import { listRecentTrips, rememberTrip } from '../lib/recentTrips'
import { initials, formatWhen } from '../lib/format'

export default function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recents] = useState(() => listRecentTrips())

  const canSubmit = name.trim().length > 0 && !submitting

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError('')
    try {
      const trip = await createTrip(name)
      rememberTrip({ id: trip.id, name: trip.name, slug: trip.slug })
      navigate(`/t/${trip.slug}`)
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-14 pb-12">
      <header className="mb-8 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-text">
          Bread &amp; Salt
        </h1>
        <p className="mt-3 text-text-muted">
          Split group expenses. Settle up the easy way.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-card border border-[var(--color-border)] bg-bg p-5 shadow-[0_2px_0_var(--color-border)]"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="trip-name" className="text-sm font-bold text-text">
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
            className="w-full rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base text-text shadow-[0_2px_0_var(--color-border)] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-negative">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xl leading-none">+</span>
          {submitting ? 'Starting…' : 'Start a new trip'}
        </button>
      </form>

      {recents.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-extrabold text-text">
            Your trips
          </h2>
          <ul className="flex flex-col gap-3">
            {recents.map((t) => (
              <li key={t.slug}>
                <button
                  type="button"
                  onClick={() => navigate(`/t/${t.slug}`)}
                  className="flex w-full items-center gap-3 rounded-card border border-[var(--color-border)] bg-bg p-3.5 text-left shadow-[0_2px_0_var(--color-border)] transition hover:border-accent active:translate-y-[1px] active:shadow-[0_1px_0_var(--color-border)]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chip font-display text-base font-extrabold text-text">
                    {initials(t.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-extrabold text-text">
                      {t.name}
                    </span>
                    <span className="block text-xs font-bold text-text-muted">
                      Opened {formatWhen(t.lastOpenedAt)}
                    </span>
                  </span>
                  <span aria-hidden className="text-text-muted">
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
