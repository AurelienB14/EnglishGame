import { useEffect, useRef, useState } from 'react'
import Player from '../component/player'
import Ball from '../component/ball'
import Star from '../component/star'
import Button from '../component/button'
import Scoreboard from '../component/scoreboard'
import BonusMenu from '../component/bonus_menu'
import {
  CHANCES,
  GOALS_TO_WIN,
  KEEPER_ZONE,
  LEVELS,
  MATCH_SECONDS,
  MISS_BALL,
  PLAYER_RATIO,
  ZONES,
} from '../constants'
import { goalToPx, useViewport } from '../viewport'

const SPEED = Math.PI / 1.6 // vitesse du gardien
const ROLL_TIME = 1500 // durée du tirage, en ms
// Hauteur du ballon, du tirage, du badge de niveau et du résultat (fraction de l'écran) :
// entre le goal et le tireur, sans chevaucher ni l'un ni l'autre
const MIDDLE_Y = 0.55

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

// Ballon + étoiles + nom du niveau (88 px de ballon, 52 px sur écran bas)
function LevelBadge({ level }) {
  const extreme = level.id === 'extreme'
  return (
    <div className="flex flex-col items-center">
      <div className="size-[88px] transition-transform duration-500 starting:scale-0 [@media(max-height:700px)]:size-[52px]">
        <Ball color={level.color} seam={extreme ? 'var(--color-white)' : undefined} />
      </div>
      <div className="-mt-3.5 flex gap-0.5">
        {Array.from({ length: level.stars }, (_, i) => (
          <Star key={i} className="size-6 fill-white stroke-navy" />
        ))}
      </div>
      <p className="mt-1.5 font-display text-level tracking-display text-outline [@media(max-height:700px)]:text-[28px]">
        {level.label}
      </p>
    </div>
  )
}

// Panneau de carte : couleur du niveau, Correct (doré) / Incorrect (navy)
function CardPanel({ role, player, level, onAnswer }) {
  return (
    <section className={`cardp lv-${level.id} w-full`} aria-label={`${role} card`}>
      <div className="flex h-8 items-center gap-2.5">
        <span className="tag max-w-[45%] truncate">
          {role} · {player.name}
        </span>
        <h2 className="font-cond text-[22px] font-bold uppercase leading-none tracking-label">Draw a card</h2>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <Button wide onClick={() => onAnswer(true)}>
          Correct
        </Button>
        <Button wide variant="navy" onClick={() => onAnswer(false)}>
          Incorrect
        </Button>
      </div>
    </section>
  )
}

// Panneau "Pick your spot" : l'attaquant choisit la zone du tir
function AimPanel({ onPick }) {
  return (
    <section className="panel p-glass w-full p-3.5" aria-label="Pick your spot">
      <h2 className="flex h-7 items-center justify-center font-cond text-[22px] font-bold uppercase leading-none tracking-label">
        Pick your spot
      </h2>
      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        {ZONES.map((z) => (
          <Button key={z} wide onClick={() => onPick(z)} className="text-xl">
            {ZONE_LABEL[z]}
          </Button>
        ))}
      </div>
    </section>
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

  // Taille du gardien : 36 % de la largeur du goal (sans dépasser 90 % de sa hauteur)
  const [ratio, setRatio] = useState(null)
  const goalH = ratio ? g.w * ratio : 0
  const keeperW = Math.min(g.w * 0.36, goalH * 0.9 * PLAYER_RATIO)
  const keeperH = keeperW / PLAYER_RATIO
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
    setBall({ x: viewport.width / 2, y: viewport.height * MIDDLE_Y, scale: 1 })

    // 2. Le ballon part, le gardien plonge
    later(() => {
      setBall({ ...ballTarget(res.ball), scale: 0.7 })
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

  // Ballon posé au milieu : blanc (rebondit) en attendant, couleur du niveau pendant le choix de la zone
  const restingBall = phase === 'ready' || phase === 'aim'
  const bouncing = phase === 'ready'

  return (
    <div className="relative h-dvh overflow-hidden">
      {/* Haut : tableau des scores + chrono */}
      <div className="absolute inset-x-0 flex flex-col items-center gap-2" style={{ top: 'var(--pt)' }}>
        <Scoreboard blue={score.blue} green={score.green} />
        {/* Chrono : devient "Last shot!" à 10:00, puis "Full time" au coup de sifflet final */}
        <div className={`chrono ${timeUp ? 'text-gold' : ''}`} role="timer" aria-label="Time">
          {matchOver ? 'Full time' : timeUp ? 'Last shot!' : formatTime(elapsed)}
        </div>
      </div>

      {/* Cages (invisibles) + gardien */}
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
            <span className="name-pill absolute left-1/2 top-full mt-0.5 -translate-x-1/2">{keeper.name}</span>
          </div>
        )}

        {/* Trois zones cliquables par-dessus le goal (phase aim) : trait navy sous un trait doré */}
        {ratio && phase === 'aim' && (
          <div className="absolute inset-0 flex gap-2">
            {ZONES.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => chooseSpot(z)}
                aria-label={ZONE_LABEL[z]}
                className="h-full flex-1 active:opacity-70"
              >
                <svg className="h-full w-full" aria-hidden="true">
                  <rect
                    x="4"
                    y="4"
                    rx="6"
                    style={{ width: 'calc(100% - 8px)', height: 'calc(100% - 8px)' }}
                    className="fill-gold/15 stroke-navy"
                    strokeWidth="7"
                    strokeDasharray="12 8"
                  />
                  <rect
                    x="4"
                    y="4"
                    rx="6"
                    style={{ width: 'calc(100% - 8px)', height: 'calc(100% - 8px)' }}
                    className="fill-none stroke-gold"
                    strokeWidth="3.5"
                    strokeDasharray="12 8"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Milieu de l'écran */}
      <div
        className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ top: `${MIDDLE_Y * 100}%` }}
      >
        {restingBall && (
          <div className="relative size-[52px]">
            <div className={bouncing ? 'size-full motion-safe:animate-ball' : 'size-full'}>
              {bouncing ? (
                // Ballon blanc, rond central noir pour faire ressortir le logo blanc
                <Ball color="var(--color-white)" core="var(--color-extreme)" />
              ) : (
                <Ball
                  color={shooterLevel.color}
                  seam={shooterLevel.id === 'extreme' ? 'var(--color-white)' : undefined}
                />
              )}
            </div>
            {/* Ombre plate (pas de flou) qui s'écrase pendant le rebond */}
            <div
              className={`absolute left-1/2 top-full h-2 w-11 -translate-x-1/2 rounded-full bg-navy/45 ${
                bouncing ? 'motion-safe:animate-squash' : ''
              }`}
            />
          </div>
        )}

        {phase === 'rolling' && (
          <div className="relative size-[150px] motion-safe:animate-draw">
            {LEVELS.slice(0, 3).map((l, i) => {
              const angle = (i * 2 * Math.PI) / 3
              return (
                <div
                  key={l.id}
                  className="absolute size-[50px]"
                  style={{ left: 50 + 48 * Math.sin(angle), top: 50 - 48 * Math.cos(angle) }}
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
          <p
            role="status"
            className={`whitespace-nowrap font-display tracking-display text-outline-lg ${
              shot.result === 'goal' && !bonus.double
                ? 'text-moment-xl max-[380px]:text-[88px]'
                : 'text-moment max-[380px]:text-[56px]'
            }`}
          >
            {shot.result === 'goal' && bonus.double ? 'Double goal' : OUTCOME[shot.result].text}
            {OUTCOME[shot.result].bang && <span className="text-gold">!</span>}
          </p>
        )}
      </div>

      {/* Ballon en vol */}
      {ball && (
        <div
          className="absolute size-[52px] -translate-x-1/2 -translate-y-1/2 transition-[left,top,transform] duration-[600ms] ease-out"
          style={{ left: ball.x, top: ball.y, transform: `scale(${ball.scale})` }}
        >
          <Ball
            color={shooterLevel.color}
            seam={shooterLevel.id === 'extreme' ? 'var(--color-white)' : undefined}
          />
        </div>
      )}

      {/* Tireur : ancré en bas, ses jambes passent derrière les panneaux */}
      <div
        className="pointer-events-none absolute left-1/2 w-[116px] -translate-x-1/2 [@media(max-height:700px)]:w-[92px]"
        style={{ bottom: 'calc(var(--pb) + 64px)', aspectRatio: PLAYER_RATIO }}
      >
        <Player name={shooter.name} number={shooter.number} team={shooter.team} pose="shooter" />
      </div>

      {/* Zone d'action */}
      <div
        className="absolute inset-x-4 flex items-end justify-center"
        style={{ bottom: 'var(--pb)', height: 'var(--action-h)' }}
      >
        {(phase === 'ready' || phase === 'rolling') && (
          <Button onClick={shoot} disabled={phase === 'rolling'} className="w-[220px]">
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
          <Button onClick={matchOver ? onFinish : next} className="w-[220px]">
            {matchOver ? 'See result' : 'Next shot'}
          </Button>
        )}
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
