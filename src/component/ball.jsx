import logoBall from '../assets/logoBall.png'

// color : couleur du ballon · seam : couleur des coutures (blanc sur Extreme) · core : remplissage du rond central
function Ball({ color = 'var(--color-white)', seam = 'var(--color-navy)', core = 'none' }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full">
      <circle cx="50" cy="50" r="46" style={{ fill: color, stroke: seam }} strokeWidth="5" />

      {/* Coutures */}
      <g style={{ stroke: seam }} strokeWidth="3.5" strokeLinecap="round">
        <line x1="50" y1="18" x2="50" y2="4" />
        <line x1="80.4" y1="40.1" x2="93.7" y2="35.8" />
        <line x1="68.8" y1="75.9" x2="77" y2="87.2" />
        <line x1="31.2" y1="75.9" x2="23" y2="87.2" />
        <line x1="19.6" y1="40.1" x2="6.3" y2="35.8" />
      </g>
      <circle cx="50" cy="50" r="32" style={{ fill: core, stroke: seam }} strokeWidth="3" />

      {/* Logo */}
      <image href={logoBall} x="28" y="28" width="44" height="44" />
    </svg>
  )
}

export default Ball
