function ChoosingPlayersTeamCard({ name, number, dot, onDelete }) {
  return (
    <li className="relative flex w-[84px] flex-col items-center gap-1">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-condensed text-lg font-bold ${dot}`}
      >
        {number || '–'}
      </span>
      <span className="w-full truncate text-center font-condensed text-sm font-semibold uppercase tracking-brand">
        {name}
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Remove ${name}`}
        className="absolute -right-1 -top-3 flex h-10 w-10 items-center justify-center"
      >
        {/* Zone tactile de 40 px autour d'un petit rond visible de 24 px */}
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-navy bg-white text-[10px] text-navy">
          ✕
        </span>
      </button>
    </li>
  )
}

export default ChoosingPlayersTeamCard