import { useState } from 'react'
import Star from './star'

const SHOT_BONUSES = [
  { id: 'double', title: 'Double Goal', text: 'If this shot goes in, it counts as 2 goals.' },
  { id: 'power', title: 'Power Shot', text: '+20% chance to score this shot.' },
]

function BonusIcon({ id }) {
  if (id === 'double') {
    return <span className="font-display text-2xl leading-none text-gold">×2</span>
  }
  if (id === 'var') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M4 6 H20 L12 19 Z" className="fill-hard" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path d="M13 2 L4 14 H11 L9 22 L20 9 H13 Z" className="fill-gold" />
    </svg>
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

  return (
    <>
      {/* Bouton rond */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Bonuses"
        className="absolute bottom-[176px] right-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-gold"
      >
        <Star className="h-7 w-7 fill-navy" />
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-navy font-condensed text-sm font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Fenêtre */}
      {open && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-navy/60 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border-2 border-white bg-navy p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-3xl uppercase tracking-wide">Bonus</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
              >
                ✕
              </button>
            </div>

            <ul className="flex flex-col gap-2">
              {SHOT_BONUSES.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <BonusIcon id={b.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-condensed font-bold uppercase tracking-brand">{b.title}</p>
                    <p className="text-sm opacity-70">{b.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggle(b.id)}
                    disabled={!canUseShotBonus}
                    className={`h-9 shrink-0 rounded-full px-3 font-condensed text-sm font-bold uppercase tracking-brand text-navy disabled:opacity-40 ${
                      active[b.id] ? 'bg-white' : 'bg-gold'
                    }`}
                  >
                    {active[b.id] ? '✓ Active' : 'Use'}
                  </button>
                </li>
              ))}

              <li className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <BonusIcon id="var" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-condensed font-bold uppercase tracking-brand">VAR Decision</p>
                    <p className="text-sm opacity-70">The opponent loses 1 goal.</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyVar('blue')}
                    disabled={score.blue === 0}
                    className="h-9 flex-1 rounded-full bg-royal font-condensed text-sm font-bold uppercase tracking-brand text-white disabled:opacity-40"
                  >
                    Blue −1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyVar('green')}
                    disabled={score.green === 0}
                    className="h-9 flex-1 rounded-full bg-team-green font-condensed text-sm font-bold uppercase tracking-brand text-white disabled:opacity-40"
                  >
                    Green −1
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

export default BonusMenu