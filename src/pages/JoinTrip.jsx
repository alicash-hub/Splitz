import { useEffect, useState } from 'react'
import { listMembers, joinTrip } from '../lib/members'

export default function JoinTrip({ trip, onJoined }) {
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // The member tapped in "Already here?", awaiting confirmation.
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(() => {
    let active = true
    listMembers(trip.id)
      .then((rows) => {
        if (active) setMembers(rows)
      })
      .catch(() => {
        // A failed members fetch shouldn't block joining by name.
        if (active) setMembers([])
      })
      .finally(() => {
        if (active) setLoadingMembers(false)
      })
    return () => {
      active = false
    }
  }, [trip.id])

  const canSubmit = name.trim().length > 0 && !submitting

  async function handleJoin(event) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError('')
    try {
      const member = await joinTrip(trip.id, name)
      onJoined(member)
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12">
      <header className="mb-10 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-text-muted">
          Joining
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-text">
          {trip.name}
        </h1>
      </header>

      <form onSubmit={handleJoin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="member-name" className="text-sm font-bold text-text">
            What's your name?
          </label>
          <input
            id="member-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Yara"
            autoFocus
            autoComplete="off"
            maxLength={80}
            className="w-full rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base text-text shadow-[0_2px_0_var(--color-border)] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-semibold text-negative">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 w-full rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Joining…' : 'Join'}
        </button>
      </form>

      {!loadingMembers && members.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-sm font-bold text-text">
            Already here?
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Pick your name to continue.
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {members.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setSelectedMember(member)
                  }}
                  className="w-full rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-left text-base font-semibold text-text shadow-[0_2px_0_var(--color-border)] transition hover:border-accent active:translate-y-[1px] active:shadow-[0_1px_0_var(--color-border)]"
                >
                  {member.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-overlay fixed inset-0 z-10 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="animate-sheet w-full max-w-md rounded-card bg-bg p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg text-text">
              You're continuing as{' '}
              <span className="font-display font-extrabold">
                {selectedMember.name}
              </span>{' '}
              — is that right?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="flex-1 rounded-card border border-[var(--color-border)] bg-bg px-4 py-3 text-base font-bold text-text shadow-[0_2px_0_var(--color-border)] transition hover:bg-surface active:translate-y-[1px] active:shadow-[0_1px_0_var(--color-border)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onJoined(selectedMember)}
                className="flex-1 rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]"
              >
                Yes, that's me
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
