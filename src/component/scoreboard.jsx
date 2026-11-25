// Tableau des scores : noms des équipes sur navy, score sur doré
function Scoreboard({ blue, green }) {
  return (
    <div className="sb" role="group" aria-label="Score">
      <div className="sb-team sb-blue">Blue</div>
      <div className="sb-score">
        <span>{blue}</span>
        <span className="text-[22px]">–</span>
        <span>{green}</span>
      </div>
      <div className="sb-team sb-green">Green</div>
    </div>
  )
}

export default Scoreboard
