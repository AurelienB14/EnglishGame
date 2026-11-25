const GAP = 16 // écart entre deux points, en px
const REVEAL_MS = 450 // les points apparaissent de la gauche vers la cible pendant le vol

// Trajectoire du ballon : points ronds (navy + blanc) de `from` vers `to`
function Trajectory({ from, to }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.hypot(dx, dy)

  // On laisse un peu de place autour du ballon, au départ et à l'arrivée
  const dots = []
  for (let d = 32; d < dist - 14; d += GAP) {
    const t = d / dist
    dots.push({ x: from.x + dx * t, y: from.y + dy * t, delay: Math.round(t * REVEAL_MS) })
  }

  return (
    <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      {dots.map((p, i) => (
        <g key={i} className="dot" style={{ animationDelay: `${p.delay}ms` }}>
          <circle cx={p.x} cy={p.y} r="4.5" className="fill-navy" />
          <circle cx={p.x} cy={p.y} r="2.5" className="fill-white" />
        </g>
      ))}
    </svg>
  )
}

export default Trajectory
