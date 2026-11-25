import { useState } from 'react'
import Star from './star'

const SHOT_BONUSES = [
  { id: 'double', title: 'Double Goal', text: 'Counts as 2 goals' },
  { id: 'power', title: 'Power Shot', text: '+20% to score' },
]

// Pastille ronde de 40 px à gauche de chaque ligne
function BonusIcon({ id }) {
  if (id === 'double') {
    return (
      <span className="flex size-10 flex-none items-center justify-center rounded-full border-2 border-navy bg-gold pt-0.5 font-display text-[22px] leading-none text-navy">
        ×2
      </span>
    )
  }
  if (id === 'var') {
    return (
      <span className="flex size-10 flex-none items-center justify-center rounded-full border-2 border-hard bg-navy">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5L22.5 20.5H1.5Z" className="fill-hard stroke-white" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 8.5V14" className="stroke-white" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="12" cy="17.4" r="1.5" className="fill-white" />
        </svg>
      </span>
    )
  }
  return (
    <span className="flex size-10 flex-none items-center justify-center rounded-full border-2 border-gold bg-navy">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2L4 14h7l-1 8 10-13h-7z" className="fill-gold stroke-navy" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function BonusMenu({ active, onToggle, canUseShotBonus, score, onVar }) {
  const [open, setOpen] = useState(false)
  const activeCount = Object.values(active).filter(Boolean).length

  // Retire un but à l'équipe choisie puis ferme la fenêtre
  // (ce n'est pas un hook : on évite le préfixe "use")
  const applyVar = (team) => {
    onVar(team)
    setOpen(false)
  }

  // Le bouton rond est posé juste au-dessus de la zone d'action (hauteur définie dans index.css)
  const fabBottom = 'calc(var(--pb) + var(--action-h) + 8px)'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Bonuses"
        aria-expanded={open}
        className={`btn btn-fab absolute right-4 z-30 ${open ? 'btn-navy' : ''}`}
        style={{ bottom: fabBottom }}
      >
        <Star className={`h-7 w-7 ${open ? 'fill-gold' : 'fill-navy'}`} />
        {activeCount > 0 && <span className="fab-badge">{activeCount}</span>}
      </button>

      {open && (
        // Un toucher en dehors de la fenêtre la ferme
        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)}>
          <section
            role="dialog"
            aria-label="Bonuses"
            className="panel p-navy absolute right-4 w-[300px] max-w-[calc(100%-2rem)] border-white p-4 shadow-hard-lg"
            style={{ bottom: `calc(${fabBottom} + 64px)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2.5 ml-1 font-display text-[30px] leading-[30px] tracking-display uppercase">
              Bonuses
            </h2>

            <div className="flex flex-col gap-2">
              {SHOT_BONUSES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={active[b.id]}
                  disabled={!canUseShotBonus}
                  onClick={() => onToggle(b.id)}
                  className={`flex h-14 w-full items-center gap-3 rounded-full border-2 bg-white/5 pl-1.5 pr-3 text-left text-white disabled:opacity-40 ${
                    active[b.id] ? 'border-gold' : 'border-white/25'
                  }`}
                >
                  <BonusIcon id={b.id} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-cond text-xl font-bold uppercase leading-none tracking-label">
                      {b.title}
                    </span>
                    <span className="mt-0.5 block font-body text-xs font-normal leading-none opacity-70">{b.text}</span>
                  </span>
                  {active[b.id] && <span className="tag">Active</span>}
                </button>
              ))}

              <div className="rounded-2xl border-2 border-white/25 bg-white/5 py-2 pl-1.5 pr-2">
                <div className="flex h-10 items-center gap-3 font-cond text-xl font-bold uppercase leading-none tracking-label">
                  <BonusIcon id="var" />
                  <span>VAR Decision</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyVar('blue')}
                    disabled={score.blue === 0}
                    className="btn btn-sm btn-wide"
                  >
                    <span className="size-3 rounded-full border-2 border-navy bg-team-blue" />
                    Blue −1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyVar('green')}
                    disabled={score.green === 0}
                    className="btn btn-sm btn-wide"
                  >
                    <span className="size-3 rounded-full border-2 border-navy bg-team-green" />
                    Green −1
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default BonusMenu
