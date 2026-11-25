import { useEffect, useRef, useState } from 'react'
import Player from '../component/player'
import Ball from '../component/ball'
import { TEAM_COLOR } from '../component/teams'

const SPEED = Math.PI / 1.6 // vitesse du gardien
const ROLL_TIME = 1500 // durée du tirage, en ms

const LEVELS = [
  { id: 'easy', label: 'Easy', article: 'an', color: '#2FB463', stars: 1 },
  { id: 'medium', label: 'Medium', article: 'a', color: '#F28C1E', stars: 2 },
  { id: 'hard', label: 'Hard', article: 'a', color: '#D7263D', stars: 3 },
  { id: 'extreme', label: 'Extreme', article: 'an', color: '#121417', stars: 4 },
]

// [chance de cadrer, chance d'arrêt si le gardien a bon]
const CHANCES = {
  easy: [0.3, 0.1],
  medium: [0.6, 0.2],
  hard: [0.9, 0.3],
}

// Position du gardien dans les cages : 0 = poteau gauche, 1 = poteau droit
const KEEPER_ZONE = { left: 0, middle: 0.5, right: 1 }

const OUTCOME = {
  goal: { text: 'Goal', bang: true },
  save: { text: 'What a save', bang: true },
  miss: { text: 'Off target', bang: false },
  nothing: { text: 'No shot', bang: false },
  bonus: { text: 'Keeper bonus', bang: false },
}

const pick = (array) => array[Math.floor(Math.random() * array.length)]

function resolveShot(levelId, shooterOk, keeperOk) {
  if (!shooterOk) return { result: keeperOk ? 'bonus' : 'nothing' }

  const [onTarget, saveChance] = CHANCES[levelId]
  const save = keeperOk ? saveChance : 0
  const r = Math.random()
  const zones = ['left', 'middle', 'right']

  if (r < onTarget - save) {
    const ball = pick(zones)
    return { result: 'goal', ball, keeper: pick(zones.filter((z) => z !== ball)) }
  }
  if (r < onTarget) {
    const ball = pick(zones)
    return { result: 'save', ball, keeper: ball }
  }
  return { result: 'miss', ball: pick(['wideLeft', 'over', 'wideRight']), keeper: pick(zones) }
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
        fill="#FFFFFF"
        stroke="#061A40"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LevelBadge({ level }) {
  return (
    <>
      <div className="h-24 w-24 transition-transform duration-500 starting:scale-0">
        <Ball color={level.color} />
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: level.stars }, (_, i) => (
          <Star key={i} />
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
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="h-12 flex-1 rounded-full bg-white font-condensed text-lg font-bold uppercase tracking-brand text-navy"
        >
          ✓ Correct
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="h-12 flex-1 rounded-full border-2 border-white bg-navy font-condensed text-lg font-bold uppercase tracking-brand text-white"
        >
          ✕ Incorrect
        </button>
      </div>
    </div>
  )
}

function Game({ allPlayers, turn, goal, goalimg, score, addGoal, nextTurn }) {
  // Qui joue
  const attacking = turn % 2 === 0 ? 'blue' : 'green'
  const defending = attacking === 'blue' ? 'green' : 'blue'

  const attackers = allPlayers.filter((p) => p.team === attacking)
  const defenders = allPlayers.filter((p) => p.team === defending)

  const round = Math.floor(turn / 2)
  const shooter = attackers[round % attackers.length]
  const keeper = defenders[round % defenders.length]

  // État du tour
  // 'ready' | 'rolling' | 'shooterCard' | 'keeperCard' | 'shot' | 'outcome'
  const [phase, setPhase] = useState('ready')
  const [levelIndex, setLevelIndex] = useState(null)
  const [shooterOk, setShooterOk] = useState(null)
  const [shot, setShot] = useState(null)
  const [ball, setBall] = useState(null) // position du ballon pendant le tir

  const shooterLevel = LEVELS[levelIndex]
  const keeperLevel = LEVELS[levelIndex + 1]

  // Taille du gardien
  const [ratio, setRatio] = useState(null)
  const goalH = ratio ? goal.w * ratio : 0
  const keeperH = goalH * 0.9
  const keeperW = keeperH * (100 / 140)
  const range = goal.w - keeperW

  // Gardien : va-et-vient tant que patrol vaut true
  const keeperRef = useRef(null)
  const patrol = useRef(true)

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
    const y = goal.y + goalH * 0.55
    const targets = {
      left: { x: goal.x + goal.w * 0.18, y },
      middle: { x: goal.x + goal.w * 0.5, y },
      right: { x: goal.x + goal.w * 0.82, y },
      wideLeft: { x: goal.x - 24, y },
      over: { x: goal.x + goal.w * 0.5, y: goal.y - 24 },
      wideRight: { x: goal.x + goal.w + 24, y },
    }
    return targets[zone]
  }

  const playShot = (res) => {
    setPhase('shot')

    // 1. Le gardien arrête son va-et-vient et revient au milieu
    patrol.current = false
    moveKeeper(KEEPER_ZONE.middle, 400)
    setBall({ x: window.innerWidth / 2, y: window.innerHeight * 0.38, scale: 1 })

    // 2. Le ballon part, le gardien plonge
    setTimeout(() => {
      setBall({ ...ballTarget(res.ball), scale: 0.5 })
      moveKeeper(KEEPER_ZONE[res.keeper], 300)
    }, 500)

    // 3. Résultat
    setTimeout(() => {
      if (res.result === 'goal') addGoal(attacking)
      setPhase('outcome')
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
    const res = resolveShot(shooterLevel.id, shooterOk, ok)
    setShot(res)
    if (shooterOk) playShot(res)
    else setPhase('outcome')
  }

  const next = () => {
    if (keeperRef.current) keeperRef.current.style.transition = 'none'
    patrol.current = true
    setPhase('ready')
    setLevelIndex(null)
    setShooterOk(null)
    setShot(null)
    setBall(null)
    nextTurn()
  }

  return (
    <div className="relative h-dvh overflow-hidden">
      {/* Tableau des scores */}
      <div className="absolute inset-x-0 top-0 flex justify-center p-3">
        <div className="flex overflow-hidden rounded-lg font-display text-2xl uppercase tracking-wide">
          <span className="border-b-4 border-royal bg-navy px-3 py-1 text-white">Blue</span>
          <span className="bg-gold px-4 py-1 text-navy">
            {score.blue} - {score.green}
          </span>
          <span className="border-b-4 border-team-green bg-navy px-3 py-1 text-white">Green</span>
        </div>
      </div>

      {/* Cages + gardien */}
      <div className="absolute" style={{ left: goal.x, top: goal.y, width: goal.w }}>
        <img
          src={goalimg}
          alt=""
          draggable={false}
          className="w-full select-none"
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
      </div>

      {/* Milieu */}
      <div className="absolute left-1/2 top-[38%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        {phase === 'ready' && (
          <div className="h-14 w-14">
            <Ball color={TEAM_COLOR[shooter.team]} />
          </div>
        )}

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
            {OUTCOME[shot.result].text}
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
        <div className="aspect-[100/140] h-36">
          <Player name={shooter.name} number={shooter.number} team={shooter.team} pose="shooter" />
        </div>

        <div className="flex h-[148px] w-full items-end">
          {(phase === 'ready' || phase === 'rolling') && (
            <button
              type="button"
              onClick={shoot}
              disabled={phase === 'rolling'}
              className="h-14 w-full rounded-full bg-gold font-condensed text-xl font-bold uppercase tracking-brand text-navy disabled:opacity-40"
            >
              Shoot
            </button>
          )}

          {phase === 'shooterCard' && (
            <CardPanel role="Shooter" player={shooter} level={shooterLevel} onAnswer={shooterAnswer} />
          )}

          {phase === 'keeperCard' && (
            <CardPanel role="Keeper" player={keeper} level={keeperLevel} onAnswer={keeperAnswer} />
          )}

          {phase === 'outcome' && (
            <button
              type="button"
              onClick={next}
              className="h-14 w-full rounded-full bg-gold font-condensed text-xl font-bold uppercase tracking-brand text-navy"
            >
              Next shot
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Game