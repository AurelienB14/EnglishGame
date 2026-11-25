import Player from '../component/player'
import Button from '../component/button'
import { TEAM_COLOR, TEAM_LABEL } from '../constants'

function Trophy() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12">
      {/* Anses */}
      <path
        d="M14 10H7c0 8 4 12 9 13M34 10h7c0 8-4 12-9 13"
        fill="none"
        className="stroke-navy"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M14 10H7c0 8 4 12 9 13M34 10h7c0 8-4 12-9 13"
        fill="none"
        className="stroke-gold"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Coupe, pied et socle */}
      <path d="M13 5h22v13a11 11 0 0 1-22 0z" className="fill-gold stroke-navy" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="21" y="29" width="6" height="8" className="fill-gold stroke-navy" strokeWidth="2.5" />
      <rect x="14" y="37" width="20" height="6" rx="1.5" className="fill-gold stroke-navy" strokeWidth="2.5" />
    </svg>
  )
}

function TeamPanel({ team, players, score, winner }) {
  return (
    <section
      className={`flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-navy/80 p-3 ${
        winner ? 'border-2 border-gold' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {winner && <Trophy />}
        {/* Tableau des scores : nom sur navy, score sur doré */}
        <div className="flex overflow-hidden rounded-lg font-display text-3xl uppercase tracking-wide">
          <span className="bg-navy px-3 py-0.5 text-white" style={{ borderBottom: `4px solid ${TEAM_COLOR[team]}` }}>
            {TEAM_LABEL[team]}
          </span>
          <span className="bg-gold px-3 py-0.5 text-navy">{score}</span>
        </div>
      </div>

      <ul className="flex justify-center gap-3">
        {players.map((p, i) => (
          <li key={i} className="flex w-20 flex-col items-center">
            <div className="aspect-[100/140] h-24">
              <Player name={p.name} number={p.number} team={p.team} pose="shooter" />
            </div>
            <span className="w-full truncate text-center font-condensed text-sm font-semibold uppercase tracking-brand text-white">
              {p.name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Result({ allPlayers, score, onRestart }) {
  const draw = score.blue === score.green
  // Les gagnants en haut, les perdants en bas (en cas d'égalité : Blue en haut, sans trophée)
  const top = score.blue >= score.green ? 'blue' : 'green'
  const bottom = top === 'blue' ? 'green' : 'blue'

  const playersOf = (team) => allPlayers.filter((p) => p.team === team)

  return (
    <div className="flex h-dvh flex-col gap-3 p-4">
      <h2 className="text-center font-display text-5xl uppercase tracking-wide text-white [text-shadow:3px_3px_0_var(--color-navy)]">
        {draw ? 'Draw' : `${TEAM_LABEL[top]} wins`}
        <span className="text-gold">!</span>
      </h2>

      <TeamPanel team={top} players={playersOf(top)} score={score[top]} winner={!draw} />
      <TeamPanel team={bottom} players={playersOf(bottom)} score={score[bottom]} winner={false} />

      <Button onClick={onRestart} className="w-full shrink-0">
        New match
      </Button>
    </div>
  )
}

export default Result
