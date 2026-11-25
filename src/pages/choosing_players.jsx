import ChoosingPlayersTeamCard from '../component/choosing_players_team_card'
import Button from '../component/button'

const MAX_PLAYERS = 6
const MAX_TEAM = 3

const TEAMS = [
  { id: 'blue', label: 'Blue team', panel: 'p-blue' },
  { id: 'green', label: 'Green team', panel: 'p-green' }, // texte navy : le blanc sur vert est trop peu contrasté
]

function ChoosingPlayers({ allPlayers, newPlayers, deletePlayers, drawTeams, kickOff }) {
  const players = allPlayers.map((p, i) => ({ ...p, i }))
  const byTeam = (team) => players.filter((p) => p.team === team)

  const blue = byTeam('blue')
  const green = byTeam('green')
  const random = byTeam('random')

  const isFull = allPlayers.length >= MAX_PLAYERS
  const canKickOff = random.length === 0 && blue.length >= 1 && green.length >= 1

  const add = (e) => {
    e.preventDefault()
    if (isFull) return
    const data = new FormData(e.target)
    const name = data.get('name').trim()
    const number = data.get('number')
    const team = data.get('team')

    if (name === '') return
    if (team !== 'random' && byTeam(team).length >= MAX_TEAM) return
    newPlayers(name, number, team)
    e.target.reset()
  }

  return (
    <div className="flex h-dvh flex-col px-4" style={{ paddingTop: 'var(--pt)', paddingBottom: 'var(--pb)' }}>
      <h2 className="text-center font-display text-title tracking-display text-outline max-[380px]:text-[34px]">
        Choose your players
      </h2>

      {/* Formulaire : numéro, nom (8 lettres max pour tenir sur le maillot), équipe, + */}
      <form onSubmit={add} className={`player-form mt-4 ${isFull ? 'is-disabled' : ''}`} aria-label="Add a player">
        <label className="sr-only" htmlFor="player-number">Number</label>
        <input
          id="player-number"
          name="number"
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="#"
          disabled={isFull}
          className="player-num"
        />

        {isFull ? (
          <div className="flex min-w-0 flex-1 items-center pl-1">
            <span className="tag">Squad full</span>
          </div>
        ) : (
          <>
            <label className="sr-only" htmlFor="player-name">Player name</label>
            <input
              id="player-name"
              name="name"
              type="text"
              maxLength={8}
              placeholder="Player name"
              autoComplete="off"
              className="player-name"
            />
          </>
        )}

        <div className="relative flex-none">
          <label className="sr-only" htmlFor="player-team">Team</label>
          <select id="player-team" name="team" defaultValue="random" disabled={isFull} className="team-select">
            <option value="random">Random</option>
            <option value="blue" disabled={blue.length >= MAX_TEAM}>Blue</option>
            <option value="green" disabled={green.length >= MAX_TEAM}>Green</option>
          </select>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          >
            <path
              d="M1.5 1.5L6 6L10.5 1.5"
              fill="none"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isFull ? 'stroke-white/40' : 'stroke-white'}
            />
          </svg>
        </div>

        <button type="submit" disabled={isFull} aria-label="Add player" className="btn btn-round">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M9 2V16M2 9H16" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      {/* Panneaux d'équipe : 3 places chacun */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {TEAMS.map((t) => {
          const teamPlayers = byTeam(t.id)
          return (
            <section key={t.id} className={`panel ${t.panel} p-2.5`} aria-label={t.label}>
              <h3 className="mb-2 ml-1 font-display text-2xl leading-7 tracking-display uppercase">{t.label}</h3>
              <ul className="flex flex-col gap-1.5">
                {teamPlayers.map((p) => (
                  <ChoosingPlayersTeamCard
                    key={p.i}
                    name={p.name}
                    number={p.number}
                    onDelete={() => deletePlayers(p.i)}
                  />
                ))}
                {Array.from({ length: MAX_TEAM - teamPlayers.length }, (_, k) => (
                  <li key={`slot-${k}`} className="pslot" aria-hidden="true" />
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {/* Joueurs sans équipe */}
      {random.length > 0 && (
        <section className="panel p-white mt-3 p-3" aria-label="Random">
          <div className="mb-2 flex h-10 items-center justify-between">
            <h3 className="ml-1 font-display text-2xl leading-7 tracking-display uppercase">Random</h3>
            <Button size="sm" onClick={drawTeams}>
              Draw teams
            </Button>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {random.map((p) => (
              <ChoosingPlayersTeamCard
                key={p.i}
                name={p.name}
                number={p.number}
                onDelete={() => deletePlayers(p.i)}
              />
            ))}
          </ul>
        </section>
      )}

      <div className="mt-auto flex justify-center pt-3">
        <Button onClick={kickOff} disabled={!canKickOff} className="w-[220px]">
          Kick off
        </Button>
      </div>
    </div>
  )
}

export default ChoosingPlayers
