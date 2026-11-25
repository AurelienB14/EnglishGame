import { useState } from 'react'

// Couleurs des trois bandes : royal, navy, vert d'équipe
const BANDS = ['var(--color-royal)', 'var(--color-navy)', 'var(--color-team-green)']

// Transition "wipe 28°" : se joue une fois à l'affichage puis disparaît.
// Mettre une `key` différente pour la rejouer.
function Wipe() {
  const [done, setDone] = useState(false)
  if (done) return null

  return (
    <div className="wipe pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden="true">
      {BANDS.map((color, i) => (
        <div
          key={color}
          className="wipe-band"
          style={{ background: color, animationDelay: `${i * 60}ms` }}
          // La dernière bande finit en dernier : on retire alors tout le wipe
          onAnimationEnd={i === BANDS.length - 1 ? () => setDone(true) : undefined}
        />
      ))}
    </div>
  )
}

export default Wipe
