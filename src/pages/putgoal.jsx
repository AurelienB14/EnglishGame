import { useRef } from 'react'
import Button from '../component/button'
import { clamp, goalToPx, useViewport } from '../viewport'

const MIN_WIDTH = 80 // largeur minimale du goal, en px

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
      <p className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy/80 px-4 py-1 font-condensed text-sm font-semibold uppercase tracking-brand text-white">
        Cover the real goal
      </p>

      <div
        className="absolute touch-none"
        style={{ left: pos.x, top: pos.y, width: pos.w }}
        onPointerDown={(e) => startDrag(e, 'move')}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img ref={imgRef} src={goalimg} alt="" draggable={false} className="w-full select-none" />
        {/* Poignée de 40 px (taille minimale pour un doigt) */}
        <div
          className="absolute bottom-0 right-0 h-10 w-10 touch-none rounded-full border-2 border-navy bg-gold"
          onPointerDown={(e) => startDrag(e, 'resize')}
        />
      </div>

      <Button onClick={onConfirm} className="absolute bottom-12 left-1/2 w-52 -translate-x-1/2">
        Set Goal
      </Button>
    </div>
  )
}

export default PutGoal
