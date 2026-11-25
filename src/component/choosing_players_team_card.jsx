// Carte d'un joueur : numéro, nom, croix de suppression (zone tactile de 40 px)
function ChoosingPlayersTeamCard({ name, number, onDelete }) {
  return (
    <li className="pcard">
      <span className="pcard-num">{number || '–'}</span>
      <span className="pcard-name">{name}</span>
      <button type="button" onClick={onDelete} aria-label={`Remove ${name}`} className="pcard-x">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 2L12 12M12 2L2 12" className="stroke-white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  )
}

export default ChoosingPlayersTeamCard
