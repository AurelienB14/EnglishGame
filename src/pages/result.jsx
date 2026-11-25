import Player from '../component/player'
import Button from '../component/button'
import { PLAYER_RATIO, TEAM_LABEL } from '../constants'
import { useViewport } from '../viewport'

function Trophy() {
  return (
    <svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true">
      {/* Anses */}
      <path
        d="M18 13H10Q7 13 7 17Q7 28 20 30M46 13H54Q57 13 57 17Q57 28 44 30"
        fill="none"
        className="stroke-navy"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 13H10Q7 13 7 17Q7 28 20 30M46 13H54Q57 13 57 17Q57 28 44 30"
        fill="none"
        className="stroke-gold"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Coupe, pied, socle, étoile */}
      <path d="M17 7H47V22C47 32 40 39 32 39C24 39 17 32 17 22Z" className="fill-gold stroke-navy" strokeWidth="3" strokeLinejoin="round" />
      <rect x="28" y="38" width="8" height="9" className="fill-gold stroke-navy" strokeWidth="3" />
      <rect x="19" y="46" width="26" height="9" rx="2" className="fill-gold stroke-navy" strokeWidth="3" />
      <path d="M32 13l2.2 4.6 5 .6-3.7 3.4 1 5L32 24.1 27.5 26.6l1-5-3.7-3.4 5-.6z" className="fill-white" />
    </svg>
  )
}

// Tableau d'une équipe : nom sur navy, score sur doré (même style que le tableau du match)
function TeamScore({ team, score }) {
  return (
    <div className="sb mx-auto h-11 w-max">
      <div className={`sb-team w-[120px] ${team === 'blue' ? 'sb-blue' : 'sb-green'}`}>{TEAM_LABEL[team]}</div>
      <div className="sb-score w-16 text-[32px]">{score}</div>
    </div>
  )
}

// size : largeur du pictogramme, en px (plus petite sur écran bas)
function TeamPanel({ team, players, score, winner, size }) {
  return (
    <section
      aria-label={winner ? 'Winners' : 'Losers'}
      className={`panel p-glass relative ${winner ? 'mt-8 border-[3px] border-gold px-4 pb-4 pt-9' : 'p-3.5'}`}
    >
      {winner && (
        <div className="absolute -top-8 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-gold bg-navy">
          <Trophy />
        </div>
      )}
      <TeamScore team={team} score={score} />
      <ul className="mt-3.5 flex justify-around">
        {players.map((p, i) => (
          <li key={i} className="flex flex-col items-center gap-0.5">
            <div style={{ width: size, aspectRatio: PLAYER_RATIO }}>
              <Player name={p.name} number={p.number} team={p.team} pose="front" outline="white" />
            </div>
            <span className="name-pill">{p.name}</span>
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

  // Tailles des pictogrammes : 80 / 64 (Draw : 72) ; plus petits sur écran bas
  const tall = useViewport().height > 700
  const topSize = draw ? (tall ? 72 : 52) : tall ? 80 : 56
  const bottomSize = draw ? topSize : tall ? 64 : 48

  return (
    <div className="flex h-dvh flex-col px-4" style={{ paddingTop: 'var(--pt)', paddingBottom: 'var(--pb)' }}>
      <h2
        className={`text-center font-display tracking-display text-outline-lg max-[380px]:text-[56px] ${
          draw ? 'text-[96px] leading-[86px] max-[380px]:text-[76px]' : 'text-moment leading-[64px]'
        }`}
      >
        {draw ? 'Draw' : `${TEAM_LABEL[top]} wins`}
        <span className="text-gold">!</span>
      </h2>

      {draw ? (
        <div className="mt-3 flex flex-col gap-3">
          <TeamPanel team={top} players={playersOf(top)} score={score[top]} winner={false} size={topSize} />
          <TeamPanel team={bottom} players={playersOf(bottom)} score={score[bottom]} winner={false} size={bottomSize} />
        </div>
      ) : (
        <>
          <TeamPanel team={top} players={playersOf(top)} score={score[top]} winner size={topSize} />
          <div className="mt-3">
            <TeamPanel team={bottom} players={playersOf(bottom)} score={score[bottom]} winner={false} size={bottomSize} />
          </div>
        </>
      )}

      <div className="mt-auto flex justify-center pt-3">
        <Button onClick={onRestart} className="w-[220px]">
          New match
        </Button>
      </div>
    </div>
  )
}

export default Result
