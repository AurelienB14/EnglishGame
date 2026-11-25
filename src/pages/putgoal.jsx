import { useRef } from 'react'
import Button from '../component/button'
import { clamp, goalToPx, useViewport } from '../viewport'

const MIN_WIDTH = 120 // largeur minimale du goal, en px (garde la poignée et le gardien utilisables)

function PutGoal({ goal, setGoal, onConfirm, goalimg }) {
  const viewport = useViewport()
  const pos = goalToPx(goal, viewport)

  const imgRef = useRef(null)
  const drag = useRef(null) // geste en cours : { mode: 'move' | 'resize', point de départ, goal de départ }

  const startDrag = (e, mode) => {
    // Le doigt reste "attaché" à l'élément même s'il en sort
    e.currentTarget.setPointerCapture(e.pointerId)
    // Sans ça, toucher la poignée déclencherait aussi le déplacement du goal
    e.stopPropagation()
    drag.current = { mode, px: e.clientX, py: e.clientY, x: pos.x, y: pos.y, w: pos.w }
  }

  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.px
    const dy = e.clientY - d.py
    // Proportions de l'image (hauteur / largeur), pour garder le goal dans l'écran
    const ratio = imgRef.current.offsetHeight / imgRef.current.offsetWidth || 0.5

    if (d.mode === 'move') {
      const x = clamp(d.x + dx, 0, Math.max(0, viewport.width - d.w))
      const y = clamp(d.y + dy, 0, Math.max(0, viewport.height - d.w * ratio))
      setGoal((prev) => ({ ...prev, x: x / viewport.width, y: y / viewport.height }))
    } else {
      const maxW = Math.min(viewport.width - d.x, (viewport.height - d.y) / ratio)
      const w = clamp(d.w + dx, MIN_WIDTH, Math.max(MIN_WIDTH, maxW))
      setGoal((prev) => ({ ...prev, w: w / viewport.width }))
    }
  }

  const endDrag = () => {
    drag.current = null
  }

  return (
    <div className="relative h-dvh">
      <h1 className="band absolute inset-x-0 h-[52px] text-[22px]" style={{ top: 'var(--pt)' }}>
        Cover the real goal
      </h1>

      <div
        className="absolute touch-none"
        style={{ left: pos.x, top: pos.y, width: pos.w }}
        aria-label="Goal overlay"
        onPointerDown={(e) => startDrag(e, 'move')}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img ref={imgRef} src={goalimg} alt="" draggable={false} className="w-full select-none" />
        {/* Poignée de 40 px (taille minimale pour un doigt) */}
        <button
          type="button"
          aria-label="Resize goal"
          className="btn btn-round absolute bottom-1 right-1 touch-none border-[3px] shadow-hard-sm"
          onPointerDown={(e) => startDrag(e, 'resize')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M6 14L14 6M9.5 6H14V10.5M6 9.5V14H10.5"
              className="stroke-navy"
              fill="none"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <Button
        onClick={onConfirm}
        className="absolute left-1/2 w-[220px] -translate-x-1/2"
        style={{ bottom: 'var(--pb)' }}
      >
        Set Goal
      </Button>
    </div>
  )
}

export default PutGoal
