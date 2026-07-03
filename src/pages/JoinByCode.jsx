import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// "Join a group" — type the group code (which is the trip slug) instead of
// needing the full link. We just navigate to /t/<code>; TripPage does the lookup
// and shows its "Trip not found" screen for bad codes.
export default function JoinByCode() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  const normalized = code.toLowerCase()
  const canSubmit = normalized.length > 0

  function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return
    navigate(`/t/${normalized}`)
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-14 pb-12">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mb-8 inline-flex items-center gap-1 self-start text-sm font-bold text-text-muted transition hover:text-text"
      >
        ‹ Back
      </button>

      <header className="mb-8 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-text">
          Join a group
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-text-muted">
          Enter the group code a friend shared — it's at the end of their link.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-card border border-[var(--color-border)] bg-bg p-4 shadow-[0_2px_0_var(--color-border)]">
          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
            }
            placeholder="e.g. K7M2QP"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={12}
            aria-label="Group code"
            className="w-full bg-transparent text-center font-display text-3xl font-extrabold uppercase tracking-[0.25em] text-text outline-none placeholder:tracking-normal placeholder:text-[var(--color-text-muted)]/50"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-card bg-accent px-4 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-accent-shadow)] transition hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Find group
        </button>
      </form>
    </main>
  )
}
