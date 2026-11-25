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
        className="absolute -top-1.5 right-4 flex h-6 w-6 items-center justify-center rounded-full border-2 border-navy bg-white text-[10px] text-navy"
      >
        ✕
      </button>
    </li>
  )
}

export default ChoosingPlayersTeamCard