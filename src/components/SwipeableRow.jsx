import { useRef, useState } from 'react'

// Swipe-to-reveal row (WhatsApp/iOS style). Drag the foreground left to expose
// trailing actions; release past the halfway point to snap open. Dependency-free,
// uses Pointer Events so it works for touch and mouse.
//
// `actions` is a render prop receiving { close } so action handlers can collapse
// the row after firing.
export default function SwipeableRow({ children, actions, actionsWidth = 144 }) {
  const [offset, setOffset] = useState(0) // translateX, in [-actionsWidth, 0]
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)

  const startX = useRef(0)
  const startY = useRef(0)
  const active = useRef(false)
  const horizontal = useRef(false)
  const moved = useRef(false)
  const offsetRef = useRef(0)

  function setOffsetBoth(next) {
    offsetRef.current = next
    setOffset(next)
  }

  function close() {
    setOpen(false)
    setOffsetBoth(0)
  }

  function onPointerDown(e) {
    active.current = true
    horizontal.current = false
    moved.current = false
    startX.current = e.clientX
    startY.current = e.clientY
  }

  function onPointerMove(e) {
    if (!active.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current

    if (!horizontal.current) {
      // Decide gesture direction once past a small threshold.
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        horizontal.current = true
        setDragging(true)
        e.currentTarget.setPointerCapture?.(e.pointerId)
      } else if (Math.abs(dy) > 8) {
        active.current = false // vertical scroll — let the page handle it
        return
      } else {
        return
      }
    }

    moved.current = true
    const base = open ? -actionsWidth : 0
    const next = Math.min(0, Math.max(-actionsWidth, base + dx))
    setOffsetBoth(next)
  }

  function endDrag() {
    if (!active.current) return
    active.current = false
    setDragging(false)
    if (!horizontal.current) return
    const shouldOpen = offsetRef.current <= -actionsWidth / 2
    setOpen(shouldOpen)
    setOffsetBoth(shouldOpen ? -actionsWidth : 0)
  }

  // Capture clicks: swallow the click that ends a drag, and treat a tap on an
  // open row as "close" rather than letting it reach the card.
  function onClickCapture(e) {
    if (moved.current) {
      e.stopPropagation()
      e.preventDefault()
      moved.current = false
      return
    }
    if (open) {
      e.stopPropagation()
      e.preventDefault()
      close()
    }
  }

  return (
    <div className="relative overflow-hidden rounded-card">
      {/* Trailing actions, revealed behind the foreground */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: actionsWidth }}
        aria-hidden={!open}
      >
        {actions({ close })}
      </div>

      {/* Foreground (the card) */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  )
}
