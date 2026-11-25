import { TEAM_COLOR } from '../constants'

// Pictogramme joueur (viewBox 120 x 170).
// pose : 'keeper' (de face, gants dorés) · 'shooter' (de dos, nom et numéro) · 'front' (de face, sans gants)
// outline : 'navy' (défaut) ou 'white' (sur fond navy)
function Player({ name, number, team, pose, outline = 'navy' }) {
  const jersey = { fill: TEAM_COLOR[team] }
  const keeper = pose === 'keeper'
  const back = pose === 'shooter'
  const ol = outline === 'white' ? 'stroke-white' : 'stroke-navy'
  // Le texte du maillot est blanc sur Blue, navy sur Green (contraste)
  const ink = team === 'green' ? 'fill-navy' : 'fill-white'
  // Réduit la taille du nom sur le maillot quand il est long
  const nameSize = Math.min(11, 48 / (Math.max(name.length, 1) * 0.62))

  return (
    <svg viewBox="0 0 120 170" role="img" aria-label={`${name}, ${team} team`} className="block h-full w-full overflow-visible">
      {/* Bras */}
      <g transform={keeper ? 'rotate(35 31 60)' : undefined}>
        <rect x="25" y="56" width="12" height="38" rx="6" className={`fill-white ${ol}`} strokeWidth="3" />
      </g>
      <g transform={keeper ? 'rotate(-35 89 60)' : undefined}>
        <rect x="83" y="56" width="12" height="38" rx="6" className={`fill-white ${ol}`} strokeWidth="3" />
      </g>
      {keeper && (
        <>
          <circle cx="12" cy="88" r="8.5" className={`fill-gold ${ol}`} strokeWidth="3" />
          <circle cx="108" cy="88" r="8.5" className={`fill-gold ${ol}`} strokeWidth="3" />
        </>
      )}

      {/* Jambes, chaussettes aux couleurs de l'équipe, chaussures */}
      <rect x="43" y="116" width="13" height="38" rx="6" className={`fill-white ${ol}`} strokeWidth="3" />
      <rect x="64" y="116" width="13" height="38" rx="6" className={`fill-white ${ol}`} strokeWidth="3" />
      <rect x="43" y="133" width="13" height="21" rx="4" style={jersey} className={ol} strokeWidth="3" />
      <rect x="64" y="133" width="13" height="21" rx="4" style={jersey} className={ol} strokeWidth="3" />
      <rect x="37" y="150" width="21" height="12" rx="6" className={`fill-navy ${ol}`} strokeWidth="2.5" />
      <rect x="62" y="150" width="21" height="12" rx="6" className={`fill-navy ${ol}`} strokeWidth="2.5" />

      {/* Short */}
      <path
        d="M40 97H80L84 121H62L60 111L58 121H36Z"
        className={`fill-navy ${ol}`}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Maillot */}
      <path
        d="M37 42Q42 36 50 35H70Q78 36 83 42L93 60L82 67L80 62V100H40V62L38 67L27 60Z"
        style={jersey}
        className={ol}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Col (de face) */}
      {!back && <path d="M51 35L60 45L69 35Z" className={`fill-white ${ol}`} strokeWidth="3" strokeLinejoin="round" />}

      {/* Tête */}
      <circle cx="60" cy="19" r="14" className={`fill-white ${ol}`} strokeWidth="3" />

      {/* De dos : col, cheveux, nom et numéro */}
      {back && (
        <>
          <path d="M51 35Q60 40 69 35" fill="none" className={ol} strokeWidth="3" strokeLinecap="round" />
          <path d="M46.4 15.5A14 14 0 0 1 73.6 15.5Q60 21 46.4 15.5Z" className="fill-navy" />
          <text
            x="60"
            y="57"
            textAnchor="middle"
            fontSize={nameSize}
            letterSpacing="1"
            className={`font-cond font-bold ${ink}`}
          >
            {name.toUpperCase()}
          </text>
          <text x="60" y="91" textAnchor="middle" fontSize="32" className={`font-display ${ink}`}>
            {number || ''}
          </text>
        </>
      )}
    </svg>
  )
}

export default Player
