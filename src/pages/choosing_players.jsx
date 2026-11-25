import ChoosingPlayersTeamCard from '../component/choosing_players_team_card'

const MAX_PLAYERS = 6
const MAX_TEAM = 3

const TEAMS = [
{ id: 'blue', label: 'Blue team', panel: 'bg-royal text-white' },
{ id: 'green', label: 'Green team', panel: 'bg-team-green text-white' },
]

function ChoosingPlayers({ allPlayers, newPlayers, deletePlayers, drawTeams, kickOff }) {
    const players = allPlayers.map((j, i) => ({ ...j, i }))
    const byTeam = (team) => players.filter((j) => j.team === team)

    const blue = byTeam('blue')
    const green = byTeam('green')
    const random = byTeam('random')

    const isFull = allPlayers.length >= MAX_PLAYERS
    const canKickOff = random.length === 0 && blue.length >= 1 && green.length >= 1

    const add = (e) => {
        e.preventDefault()
        const data = new FormData(e.target)
        const name = data.get('name').trim()
        const number = data.get('number')
        const team = data.get('team')

        if (name === '' || isFull) return
        if (team !== 'random' && byTeam(team).length >= MAX_TEAM) return
        newPlayers(name, number, team)
        e.target.reset()
    }

    return (
        <div className="flex h-dvh flex-col p-4">
        <h2 className="text-center font-display text-5xl uppercase tracking-wide text-white [text-shadow:3px_3px_0_var(--color-navy)]">
            Choose your players
        </h2>
        
        <form
            onSubmit={add}
            className="mt-4 flex shrink-0 items-center gap-2 rounded-full border-2 border-white bg-navy/80 p-[5px]"
        >
            <input
            type="number"
            inputMode="numeric"
            name="number"
            placeholder="#"
            disabled={isFull}
            className="h-10 w-10 shrink-0 rounded-full border-2 border-white bg-transparent text-center font-condensed font-bold text-white outline-none placeholder:text-white/50"
            />
            <input
            type="text"
            name="name"
            placeholder={isFull ? 'Squad full' : 'Name'}
            disabled={isFull}
            className="h-10 min-w-0 flex-1 bg-transparent text-center text-white outline-none placeholder:text-white/50"
            />
            <select
            name="team"
            defaultValue="random"
            disabled={isFull}
            className="h-10 rounded-full bg-white px-3 font-condensed font-bold uppercase tracking-brand text-navy outline-none"
            >
            <option value="random">Random</option>
            <option value="blue" disabled={blue.length >= MAX_TEAM}>Blue</option>
            <option value="green" disabled={green.length >= MAX_TEAM}>Green</option>
            </select>
            <button
            type="submit"
            aria-label="Add player"
            disabled={isFull}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-display text-3xl leading-none text-navy disabled:opacity-40"
            >
            +
            </button>
        </form>

        <div className="flex flex-1 flex-col justify-center gap-3">
            {TEAMS.map((t) => {
            const teamPlayers = byTeam(t.id)

            return (
                <section key={t.id} className={`rounded-2xl p-2 ${t.panel}`}>
                <h3 className="mb-1.5 text-center font-display text-xl uppercase tracking-wide">
                    {t.label}
                </h3>

                <ul className="flex h-[62px] items-center justify-center gap-2">
                    {teamPlayers.length === 0 ? (
                    <li className="text-sm opacity-60">No players yet</li>
                    ) : (
                    teamPlayers.map((j) => (
                        <ChoosingPlayersTeamCard
                        key={j.i}
                        name={j.name}
                        number={j.number}
                        dot="bg-navy text-white border-white"
                        onDelete={() => deletePlayers(j.i)}
                        />
                    ))
                    )}
                </ul>
                </section>
            )
            })}

            <div className="h-[182px] shrink-0">
            {random.length > 0 && (
                <section className="flex h-full flex-col rounded-2xl bg-white p-2 text-navy">
                <div className="mb-1.5 flex items-center justify-between px-1">
                    <h3 className="font-display text-xl uppercase tracking-wide">Random</h3>
                    <button
                        type="button"
                        onClick={drawTeams}
                        className="h-8 rounded-full bg-navy px-4 font-condensed text-sm font-bold uppercase tracking-brand text-white"
                    >
                        Draw teams
                    </button>
                    </div>

                <ul className="flex flex-1 flex-wrap content-center justify-center gap-2">
                    {random.map((j) => (
                    <ChoosingPlayersTeamCard
                        key={j.i}
                        name={j.name}
                        number={j.number}
                        dot="bg-navy text-gold border-gold"
                        onDelete={() => deletePlayers(j.i)}
                    />
                    ))}
                </ul>
                </section>
            )}
            </div>
        </div>

        <div className="flex shrink-0 gap-3">
            <button
            type="button"
            onClick={kickOff}
            disabled={!canKickOff}
            className="h-14 flex-1 rounded-full bg-gold font-condensed text-xl font-bold uppercase tracking-brand text-navy disabled:opacity-40"
            >
            Kick off
            </button>
        </div>
        </div>
    )
}

export default ChoosingPlayers