import { TEAM_COLOR } from './teams'
const NAVY = '#061A40'
const GOLD = '#DBA111'

function Player({ name, number, team, pose }) {
  const kit = TEAM_COLOR[team]
  const isKeeper = pose === 'keeper'
  const nameSize = Math.min(10, 68 / Math.max(name.length, 1))

  const arms = isKeeper
    ? [[32, 40, 10, 18], [68, 40, 90, 18]]
    : [[33, 40, 24, 74], [67, 40, 76, 74]]

  return (
    <svg viewBox="0 0 100 140" className="h-full w-full overflow-visible">
      {/* Jambes + chaussettes */}
      {[36, 53].map((x) => (
        <g key={x}>
          <rect x={x} y="92" width="11" height="36" rx="5" fill="#FFFFFF" stroke={NAVY} strokeWidth="3" />
          <rect x={x} y="110" width="11" height="18" rx="4" fill={kit} stroke={NAVY} strokeWidth="3" />
        </g>
      ))}

      {/* Chaussures */}
      <ellipse cx="41" cy="131" rx="8" ry="4.5" fill={NAVY} />
      <ellipse cx="59" cy="131" rx="8" ry="4.5" fill={NAVY} />

      {/* Short */}
      <path d="M32 76 H68 L70 98 H53 L50 90 L47 98 H30 Z" fill={NAVY} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />

      {/* Bras : contour navy, manche couleur équipe, main ou gant */}
      {arms.map(([x1, y1, x2, y2], i) => (
        <g key={i} strokeLinecap="round">
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={NAVY} strokeWidth="15" />
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={kit} strokeWidth="9" />
          <circle
            cx={x2}
            cy={y2}
            r={isKeeper ? 7 : 5}
            fill={isKeeper ? GOLD : '#FFFFFF'}
            stroke={NAVY}
            strokeWidth="3"
          />
        </g>
      ))}

      {/* Maillot */}
      <path d="M30 35 Q50 28 70 35 L68 80 H32 Z" fill={kit} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />

      {/* Tête : visage (de face) ou cheveux (de dos) */}
      <circle cx="50" cy="17" r="12" fill={isKeeper ? '#FFFFFF' : NAVY} stroke={NAVY} strokeWidth="3" />

      {/* Nom dans le dos (tireur seulement) */}
      {!isKeeper && (
        <text x="50" y="48" textAnchor="middle" fontSize={nameSize} fill="#FFFFFF" className="font-condensed font-bold">
          {name.toUpperCase()}
        </text>
      )}

      {/* Numéro */}
      <text x="50" y={isKeeper ? 66 : 72} textAnchor="middle" fontSize="26" fill="#FFFFFF" className="font-display">
        {number || ''}
      </text>
    </svg>
  )
}

export default Player