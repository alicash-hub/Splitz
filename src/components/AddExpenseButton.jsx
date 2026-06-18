// Bottom-anchored primary action (FAB-style), always visible and one-thumb
// reachable. The wrapper is centered to the same max-width as the content column.
export default function AddExpenseButton({ onClick }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-6 pb-6">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-accent-hover"
      >
        <span className="text-xl leading-none">+</span>
        Add expense
      </button>
    </div>
  )
}
