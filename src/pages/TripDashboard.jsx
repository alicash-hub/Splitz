import { useParams } from 'react-router-dom'

// Placeholder — the full dashboard (balances, settle-up, expenses, add-expense
// FAB) comes next. For now it confirms identity is resolved: it's only reached
// once the visitor is a recognized member of the trip.
export default function TripDashboard({ trip }) {
  const params = useParams()
  const tripName = trip?.name
  const slug = trip?.slug ?? params.slug

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-text">
        {tripName ? `You're in: ${tripName}` : "You're in 🎉"}
      </h1>
      <p className="mt-3 text-text-muted">
        Dashboard for <code className="text-text">/t/{slug}</code> is coming next.
      </p>
    </main>
  )
}
