import { useEffect, useRef, useState } from 'react'
import Player from '../component/player'
import Ball from '../component/ball'
import Star from '../component/star'
import Button from '../component/button'
import BonusMenu from '../component/bonus_menu'
import { CHANCES, GOALS_TO_WIN, KEEPER_ZONE, LEVELS, MATCH_SECONDS, MISS_BALL, ZONES } from '../constants'
import { goalToPx, useViewport } from '../viewport'

const SPEED = Math.PI / 1.6 // vitesse du gardien
const ROLL_TIME = 1500 // durée du tirage, en ms
const MIDDLE_Y = 0.38 // hauteur de la zone centrale (tirage, niveau, résultat), en fraction de l'écran
const BALL_Y = 0.5 // hauteur du ballon d'attente et départ du tir : le milieu de l'écran

const ZONE_LABEL = { left: 'Left', center: 'Center', right: 'Right' }

const OUTCOME = {
  goal: { text: 'Goal', bang: true },
  save: { text: 'What a save', bang: true },
  miss: { text: 'Off target', bang: false },
  nothing: { text: 'No shot', bang: false },
  bonus: { text: 'Keeper bonus', bang: false },
}

// 605 secondes -> "10:05"
const formatTime = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

const pick = (array) => array[Math.floor(Math.random() * array.length)]

// Calcule le résultat d'un tir (l'attaquant a répondu Correct) vers la zone choisie.
// Les probabilités viennent de CHANCES. Le choix de la zone ne change que la direction.
function resolveShot(levelId, keeperOk, power, zone) {
  const [onTarget, saveChance] = CHANCES[levelId]
  const save = keeperOk ? saveChance : 0
  const goalChance = Math.min(1, onTarget - save + (power ? 0.2 : 0))
  const r = Math.random()

  // But : le gardien plonge dans une autre zone
  if (r < goalChance) {
    return { result: 'goal', ball: zone, keeper: pick(ZONES.filter((z) => z !== zone)) }
  }
  // Arrêt : le gardien plonge dans la même zone
  if (r < goalChance + save) {
    return { result: 'save', ball: zone, keeper: zone }
  }
  // Raté : le ballon sort du côté choisi, le gardien plonge au hasard
  return { result: 'miss', ball: MISS_BALL[zone], keeper: pick(ZONES) }
}

function LevelBadge({ level }) {
  return (
    <>
      <div className="h-20 w-20 transition-transform duration-500 starting:scale-0 [@media(min-height:700px)]:h-24 [@media(min-height:700px)]:w-24">
        <Ball color={level.color} />
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: level.stars }, (_, i) => (
          <Star key={i} className="h-7 w-7 fill-white stroke-navy" />
        ))}
      </div>
      <p className="font-display text-4xl uppercase tracking-wide text-white [text-shadow:3px_3px_0_var(--color-navy)]">
        {level.label}
      </p>
    </>
  )
}

function CardPanel({ role, player, level, onAnswer }) {
  return (
    <div className="w-full rounded-2xl p-4 text-white" style={{ backgroundColor: level.color }}>
      <p className="truncate text-center font-condensed text-sm font-bold uppercase tracking-brand opacity-80">
        {role} · {player.name}
      </p>
      <p className="text-center font-display text-3xl uppercase tracking-wide">
        Draw {level.article} {level.label} card
      </p>
      <div className="mt-3 flex gap-3">
        <Button onClick={() => onAnswer(true)} className="flex-1">
          ✓ Correct
        </Button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="h-14 flex-1 rounded-full border-2 border-white bg-navy font-condensed text-xl font-bold uppercase tracking-brand text-white"
        >
          ✕ Incorrect
        </button>
      </div>
    </div>
  )
}

// Panneau "Pick your spot" : l'attaquant choisit la zone du tir
function AimPanel({ onPick }) {
  return (
    <div className="w-full rounded-2xl bg-navy/80 p-4">
      <p className="text-center font-display text-3xl uppercase tracking-wide text-white">
        Pick your spot
      </p>
      <div className="mt-3 flex gap-2">
        {ZONES.map((z) => (
          <Button key={z} onClick={() => onPick(z)} className="flex-1">
            {ZONE_LABEL[z]}
          </Button>
        ))}
      </div>
    </div>
  )
}

function Game({ allPlayers, turn, goal, goalimg, score, addGoal, removeGoal, nextTurn, paused, onFinish }) {
  const viewport = useViewport()
  const g = goalToPx(goal, viewport) // le goal en pixels pour la taille actuelle de l'écran

  // Qui joue
  const attacking = turn % 2 === 0 ? 'blue' : 'green'
  const defending = attacking === 'blue' ? 'green' : 'blue'

  const attackers = allPlayers.filter((p) => p.team === attacking)
  const defenders = allPlayers.filter((p) => p.team === defending)

  const round = Math.floor(turn / 2)
  const shooter = attackers[round % attackers.length]
  const keeper = defenders[round % defenders.length]

  // État du tour
  // 'ready' | 'rolling' | 'shooterCard' | 'keeperCard' | 'aim' | 'shot' | 'outcome'
  const [phase, setPhase] = useState('ready')
  const [levelIndex, setLevelIndex] = useState(null)
  const [shooterOk, setShooterOk] = useState(null)
  const [keeperOk, setKeeperOk] = useState(null)
  const [shot, setShot] = useState(null)
  const [ball, setBall] = useState(null) // position du ballon pendant le tir

  const shooterLevel = LEVELS[levelIndex]
  const keeperLevel = LEVELS[levelIndex + 1]

  // Taille du gardien
  const [ratio, setRatio] = useState(null)
  const goalH = ratio ? g.w * ratio : 0
  const keeperH = goalH * 0.9
  const keeperW = keeperH * (100 / 140)
  const range = g.w - keeperW

  // Gardien : va-et-vient tant que patrol vaut true
  const keeperRef = useRef(null)
  const patrol = useRef(true)

  const [bonus, setBonus] = useState({ double: false, power: false })

  // Chrono du match (en secondes). Il s'arrête à 10:00 et se met en pause quand le menu est ouvert.
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0) // copie lisible depuis les timers du tir (sinon ils verraient une valeur périmée)
  const [lastShot, setLastShot] = useState(false) // vrai si le tir qui vient d'être joué était le dernier
  const timeUp = elapsed >= MATCH_SECONDS

  useEffect(() => {
    elapsedRef.current = elapsed
  }, [elapsed])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setElapsed((e) => Math.min(e + 1, MATCH_SECONDS)), 1000)
    return () => clearInterval(id)
  }, [paused])

  // Affiche le résultat du tir. Si le temps était déjà écoulé, c'était le dernier tir.
  const showOutcome = () => {
    setLastShot(elapsedRef.current >= MATCH_SECONDS)
    setPhase('outcome')
  }

  // Timers du tir : on les garde pour pouvoir les annuler si le composant disparaît
  const timers = useRef([])
  const later = (fn, ms) => {
    timers.current.push(setTimeout(fn, ms))
  }
  useEffect(() => {
    const list = timers.current
    return () => list.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    let frame
    const loop = (now) => {
      if (patrol.current && keeperRef.current) {
        const p = (Math.sin((now / 1000) * SPEED) + 1) / 2
        keeperRef.current.style.left = `${p * range}px`
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [range])

  const moveKeeper = (fraction, ms) => {
    const el = keeperRef.current
    if (!el) return
    el.style.transition = `left ${ms}ms ease-out`
    el.style.left = `${fraction * range}px`
  }

  // Tirage au sort de la difficulté
  useEffect(() => {
    if (phase !== 'rolling') return

    const timer = setTimeout(() => {
      setLevelIndex(Math.floor(Math.random() * 3)) // easy, medium ou hard
      setPhase('shooterCard')
    }, ROLL_TIME)

    return () => clearTimeout(timer)
  }, [phase])

  // Où va le ballon (coordonnées écran)
  const ballTarget = (zone) => {
    const y = g.y + goalH * 0.55
    const targets = {
      left: { x: g.x + g.w * 0.18, y },
      center: { x: g.x + g.w * 0.5, y },
      right: { x: g.x + g.w * 0.82, y },
      wideLeft: { x: g.x - 24, y },
      over: { x: g.x + g.w * 0.5, y: g.y - 24 },
      wideRight: { x: g.x + g.w + 24, y },
    }
    return targets[zone]
  }

  const playShot = (res) => {
    setPhase('shot')

    // 1. Le gardien arrête son va-et-vient et revient au milieu
    patrol.current = false
    moveKeeper(KEEPER_ZONE.center, 400)
    setBall({ x: viewport.width / 2, y: viewport.height * BALL_Y, scale: 1 })

    // 2. Le ballon part, le gardien plonge
    later(() => {
      setBall({ ...ballTarget(res.ball), scale: 0.5 })
      moveKeeper(KEEPER_ZONE[res.keeper], 300)
    }, 500)

    // 3. Résultat
    later(() => {
      if (res.result === 'goal') addGoal(attacking, bonus.double ? 2 : 1)
      showOutcome()
    }, 1300)
  }

  const shoot = () => {
    setPhase('rolling')
  }

  const shooterAnswer = (ok) => {
    setShooterOk(ok)
    setPhase('keeperCard')
  }

  const keeperAnswer = (ok) => {
    setKeeperOk(ok)
    if (shooterOk) {
      // L'attaquant a bon : il choisit où tirer
      setPhase('aim')
    } else {
      // Pas de tir : "Keeper bonus" si le gardien a bon, sinon "No shot"
      setShot({ result: ok ? 'bonus' : 'nothing' })
      showOutcome()
    }
  }

  // Le résultat est calculé ici, au moment où l'attaquant choisit sa zone
  const chooseSpot = (zone) => {
    const res = resolveShot(shooterLevel.id, keeperOk, bonus.power, zone)
    setShot(res)
    playShot(res)
  }

  const next = () => {
    if (keeperRef.current) keeperRef.current.style.transition = 'none'
    patrol.current = true
    setBonus({ double: false, power: false })
    setPhase('ready')
    setLevelIndex(null)
    setShooterOk(null)
    setKeeperOk(null)
    setShot(null)
    setBall(null)
    setLastShot(false)
    nextTurn()
  }

  // Le match se termine sur le résultat d'un tir : 7 buts, ou dernier tir joué après les 10 minutes.
  // (Calculé à chaque affichage : un VAR qui retire un but peut donc relancer le match.)
  const matchOver =
    phase === 'outcome' && (lastShot || score.blue >= GOALS_TO_WIN || score.green >= GOALS_TO_WIN)

  const toggleBonus = (id) => {
    setBonus((b) => ({ ...b, [id]: !b[id] }))
  }

  const canUseShotBonus = ['ready', 'rolling', 'shooterCard', 'keeperCard', 'aim'].includes(phase)

  return (
    <div className="relative h-dvh overflow-hidden">
      {/* Tableau des scores */}
      <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-1 p-3">
        <div className="flex overflow-hidden rounded-lg font-display text-2xl uppercase tracking-wide">
          <span className="border-b-4 border-royal bg-navy px-3 py-1 text-white">Blue</span>
          <span className="bg-gold px-4 py-1 text-navy">
            {score.blue} - {score.green}
          </span>
          <span className="border-b-4 border-team-green bg-navy px-3 py-1 text-white">Green</span>
        </div>

        {/* Chrono : devient "Last shot!" à 10:00, puis "Full time" au coup de sifflet final */}
        <p
          className={`rounded-full bg-navy/80 px-3 font-condensed text-sm font-semibold uppercase tracking-brand ${
            timeUp ? 'text-gold' : 'text-white'
          }`}
        >
          {matchOver ? 'Full time' : timeUp ? 'Last shot!' : formatTime(elapsed)}
        </p>
      </div>

      {/* Cages + gardien */}
      <div className="absolute" style={{ left: g.x, top: g.y, width: g.w }}>
        <img
          src={goalimg}
          alt=""
          draggable={false}
          className="invisible w-full select-none"
          onLoad={(e) => setRatio(e.target.naturalHeight / e.target.naturalWidth)}
        />

        {ratio && (
          <div ref={keeperRef} className="absolute bottom-0" style={{ width: keeperW, height: keeperH }}>
            <Player name={keeper.name} number={keeper.number} team={keeper.team} pose="keeper" />
            <p className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy/80 px-2 font-condensed text-xs font-semibold uppercase tracking-brand text-white">
              {keeper.name}
            </p>
          </div>
        )}

        {/* Trois zones cliquables par-dessus le goal (phase aim) */}
        {ratio && phase === 'aim' && (
          <div className="absolute inset-0 flex">
            {ZONES.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => chooseSpot(z)}
                aria-label={ZONE_LABEL[z]}
                className="h-full flex-1 border-2 border-dashed border-gold bg-gold/15 active:bg-gold/40"
              />
            ))}
          </div>
        )}
      </div>

      {/* Milieu */}
      {/* Ballon d'attente : pile au milieu de l'écran. Blanc, rond central noir pour faire ressortir le logo */}
      {phase === 'ready' && (
        <div
          className="absolute left-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${BALL_Y * 100}%` }}
        >
          {/* Ombre plate (pas de flou) sous le ballon */}
          <div className="absolute inset-x-2 -bottom-1 h-2 rounded-full bg-navy/40" />
          <div className="relative h-full w-full motion-safe:animate-ball-idle">
            <Ball color="var(--color-white)" core="var(--color-extreme)" />
          </div>
        </div>
      )}

      {/* Placé à 38 % de la hauteur (et non 50 %) pour ne pas chevaucher le tireur sur petit écran */}
      <div
        className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ top: `${MIDDLE_Y * 100}%` }}
      >
        {phase === 'rolling' && (
          <div className="relative h-36 w-36 animate-spin [animation-duration:0.6s]">
            {LEVELS.slice(0, 3).map((l, i) => {
              const angle = (i * 2 * Math.PI) / 3
              return (
                <div
                  key={l.id}
                  className="absolute h-12 w-12"
                  style={{ left: 48 + 48 * Math.sin(angle), top: 48 - 48 * Math.cos(angle) }}
                >
                  <Ball color={l.color} />
                </div>
              )
            })}
          </div>
        )}

        {phase === 'shooterCard' && <LevelBadge level={shooterLevel} />}
        {phase === 'keeperCard' && <LevelBadge level={keeperLevel} />}

        {phase === 'outcome' && (
          <p className="whitespace-nowrap font-display text-6xl uppercase tracking-wide text-white [text-shadow:4px_4px_0_var(--color-navy)]">
            {shot.result === 'goal' && bonus.double ? 'Double goal' : OUTCOME[shot.result].text}
            {OUTCOME[shot.result].bang && <span className="text-gold">!</span>}
          </p>
        )}
      </div>

      {/* Ballon en vol */}
      {ball && (
        <div
          className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 transition-[left,top,transform] duration-[600ms] ease-out"
          style={{ left: ball.x, top: ball.y, transform: `scale(${ball.scale})` }}
        >
          <Ball color={shooterLevel.color} />
        </div>
      )}

      {/* Bas : attaquant + zone d'action */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4">
        <div className="aspect-[100/140] h-28 [@media(min-height:700px)]:h-36">
          <Player name={shooter.name} number={shooter.number} team={shooter.team} pose="shooter" />
        </div>

        <div className="flex h-[148px] w-full items-end">
          {(phase === 'ready' || phase === 'rolling') && (
            <Button onClick={shoot} disabled={phase === 'rolling'} className="w-full">
              Shoot
            </Button>
          )}

          {phase === 'shooterCard' && (
            <CardPanel role="Shooter" player={shooter} level={shooterLevel} onAnswer={shooterAnswer} />
          )}

          {phase === 'keeperCard' && (
            <CardPanel role="Keeper" player={keeper} level={keeperLevel} onAnswer={keeperAnswer} />
          )}

          {phase === 'aim' && <AimPanel onPick={chooseSpot} />}

          {phase === 'outcome' && (
            <Button onClick={matchOver ? onFinish : next} className="w-full">
              {matchOver ? 'See result' : 'Next shot'}
            </Button>
          )}
        </div>
      </div>

      <BonusMenu
        active={bonus}
        onToggle={toggleBonus}
        canUseShotBonus={canUseShotBonus}
        score={score}
        onVar={removeGoal}
      />
    </div>
  )
}

export default Game
