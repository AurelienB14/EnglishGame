// Repères posés au-dessus d'un joueur pendant les phases de carte (formes plates, sans flou).
// Le parent doit être positionné (relative ou absolute) : ces repères se placent au-dessus de sa tête.

// Bulle « ? » dorée : ce joueur répond à la question
export function AnswerBubble() {
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2" aria-hidden="true">
      <div className="grid size-8 place-items-center rounded-full border-2 border-navy bg-gold pt-0.5 font-display text-xl leading-none text-navy">
        ?
      </div>
      {/* Petite pointe de la bulle : un carré tourné de 45° */}
      <div className="absolute left-1/2 top-full -mt-1.5 size-2.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-navy bg-gold" />
    </div>
  )
}

// Petite carte : ce joueur tire la carte papier et la lit à voix haute
export function CardIcon() {
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 -rotate-6" aria-hidden="true">
      <svg width="24" height="32" viewBox="0 0 24 32">
        <rect x="2" y="2" width="20" height="28" rx="3" className="fill-white stroke-navy" strokeWidth="2.5" />
        <path d="M12 8l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" className="fill-gold" />
        <path d="M7 25h10" className="stroke-navy" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
