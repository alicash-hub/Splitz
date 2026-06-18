import { useParams } from 'react-router-dom'

// Placeholder — the full dashboard (balances, settle-up, expenses, add-expense
// FAB) comes next. For now it just confirms the slug-based route works so Home
// has somewhere to redirect to.
export default function TripDashboard() {
  const { slug } = useParams()

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-text">Trip created 🎉</h1>
      <p className="mt-3 text-text-muted">
        Dashboard for <code className="text-text">/t/{slug}</code> is coming next.
      </p>
    </main>
  )
}
