import { useEffect, useRef, useState } from 'react'
import Player from '../component/player'
import Ball from '../component/ball'
import Star from '../component/star'
import Button from '../component/button'
import Scoreboard from '../component/scoreboard'
import BonusMenu from '../component/bonus_menu'
import Wipe from '../component/wipe'
import Trajectory from '../component/trajectory'
import {
  CHANCES,
  GOALS_TO_WIN,
  LEVELS,
  MATCH_SECONDS,
  MAX_TILT,
  MISS_AREA,
  PLAYER_RATIO,
  TEAM_COLOR,
  ZONE_RANGE,
  ZONES,
} from '../constants'
import { AnswerBubble, CardIcon } from '../component/card_marks'
import { clamp, goalToPx, readBottomInset, useViewport } from '../viewport'
import { playSound, RESULT_SOUNDS, stopSounds } from '../sounds'

const SPEED = Math.PI / 1.6 // vitesse du gardien
const SHOOTER_WIDTH = 128 // largeur du tireur (px) ; 100 sur écran bas (hauteur ≤ 700)
const SHOOTER_WIDTH_SMALL = 100
const KEEPER_MAX_RATIO = 0.6 // le gardien fait au plus 60 % de la hauteur du tireur (effet de profondeur)
const ROLL_TIME = 1500 // durée du tirage, en ms
const RUN_MS = 650 // élan du tireur vers le ballon (il accélère), en ms
const STOP_MS = 130 // freinage du tireur après la frappe (il ralentit sans s'arrêter net), en ms
const BALL_FLIGHT_MS = 600 // durée du vol du ballon (doit correspondre à duration-[600ms] plus bas)
// Hauteur du tirage, du badge de niveau et du résultat (fraction de l'écran) :
// entre le goal et le tireur, sans chevaucher ni l'un ni l'autre
const MIDDLE_Y = 0.55
const MIDDLE_Y_SMALL = 0.5 // sur écran bas (≤ 700 px), un peu plus haut : le repère "?" / carte au-dessus du tireur occupe de la place
const SHOOTER_BOTTOM = 64 // le tireur est posé à 64 px au-dessus de la marge du bas (ses jambes passent derrière les panneaux)
const BALL_CLEARANCE = 36 // le ballon reste toujours au moins 36 px au-dessus de la tête du tireur

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
const rand = (min, max) => min + Math.random() * (max - min)
const between = ([min, max]) => rand(min, max)

// Calcule le résultat d'un tir (l'attaquant a répondu Correct) vers la zone choisie.
// Les probabilités viennent de CHANCES. Le choix de la zone ne change que la direction.
// Les points d'arrivée (ballon et gardien) sont des fractions du goal tirées au hasard :
// fx = position en largeur (0 poteau gauche, 1 poteau droit), fy = en hauteur (0 barre, 1 sol).
function resolveShot(levelId, keeperOk, power, zone) {
  const [onTarget, saveChance] = CHANCES[levelId]
  const save = keeperOk ? saveChance : 0
  const goalChance = Math.min(1, onTarget - save + (power ? 0.2 : 0))
  const r = Math.random()

  // But : le ballon entre dans la zone choisie, le gardien plonge dans une autre zone
  if (r < goalChance) {
    const other = pick(ZONES.filter((z) => z !== zone))
    return {
      result: 'goal',
      ball: { fx: between(ZONE_RANGE[zone]), fy: rand(0.2, 0.8) },
      keeper: { fx: between(ZONE_RANGE[other]), fy: rand(0.3, 0.8) },
    }
  }
  // Arrêt : le gardien plonge à peu près là où va le ballon
  if (r < goalChance + save) {
    const ball = { fx: between(ZONE_RANGE[zone]), fy: rand(0.2, 0.8) }
    return { result: 'save', ball, keeper: { fx: ball.fx + rand(-0.04, 0.04), fy: ball.fy } }
  }
  // Raté : le ballon sort du côté choisi, à un endroit au hasard ; le gardien plonge au hasard
  const out = MISS_AREA[zone]
  return {
    result: 'miss',
    ball: { fx: between(out.x), fy: between(out.y) },
    keeper: { fx: rand(0.1, 0.9), fy: rand(0.3, 0.8) },
  }
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

// Puce d'un joueur : rond (numéro, couleur d'équipe), nom et rôle ("Reads" ou "Answers").
// highlight : la puce de celui qui répond est dorée pour ressortir.
function PlayerChip({ player, role, highlight }) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-full border-2 border-navy p-0.5 pr-2.5 ${
        highlight ? 'bg-gold text-navy' : 'bg-navy text-white'
      }`}
    >
      <span
        className={`grid size-7 flex-none place-items-center rounded-full border-2 border-navy pt-0.5 font-display text-base leading-none ${
          player.team === 'green' ? 'text-navy' : 'text-white' // le blanc sur le vert est trop peu contrasté
        }`}
        style={{ backgroundColor: TEAM_COLOR[player.team] }}
      >
        {player.number}
      </span>
      <span className="min-w-0 leading-none">
        <span className="block truncate font-cond text-[15px] font-bold uppercase tracking-label">{player.name}</span>
        <span className="mt-0.5 block font-cond text-[11px] font-semibold uppercase tracking-label opacity-80">
          {role}
        </span>
      </span>
    </div>
  )
}

// "a" ou "an" devant le nom du niveau : an Easy card, an Extreme card, a Medium card, a Hard card
const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a')

// Panneau de carte : c'est toujours l'adversaire qui tire la carte papier et la lit à voix haute.
//   reader   = celui qui tire la carte et lit la question
//   answerer = celui qui répond (Correct / Incorrect jugent SA réponse)
function CardPanel({ reader, answerer, level, onAnswer }) {
  return (
    <section className={`cardp lv-${level.id} flex w-full flex-col gap-1.5 !p-3`} aria-label="Card question">
      {/* 1. Qui lit -> qui répond */}
      <div className="flex items-center gap-1.5">
        <PlayerChip player={reader} role="Reads" />
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="flex-none">
          <path
            d="M2 8h10M8 3l5 5-5 5"
            fill="none"
            className="stroke-current"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <PlayerChip player={answerer} role="Answers" highlight />
      </div>

      {/* 2. La carte à tirer : nom du niveau et étoiles */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[28px] uppercase leading-none tracking-display">{level.label} card</h2>
        <div className="flex gap-0.5" aria-label={`${level.stars} stars`}>
          {Array.from({ length: level.stars }, (_, i) => (
            <Star key={i} className="size-5 fill-white stroke-navy" />
          ))}
        </div>
      </div>

      {/* 3. Consigne */}
      <p className="truncate font-body text-sm leading-tight">
        {reader.name}, draw {article(level.label)} {level.label} card. Read it to {answerer.name}.
      </p>

      {/* 4. Question de jugement, puis 5. boutons */}
      <p className="truncate font-cond text-base font-bold uppercase leading-none tracking-label">
        {answerer.name}&apos;s answer?
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <Button wide className="h-11" onClick={() => onAnswer(true)}>
          Correct
        </Button>
        <Button wide variant="navy" className="h-11" onClick={() => onAnswer(false)}>
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

function Game({ allPlayers, turn, goal, score, addGoal, removeGoal, nextTurn, paused, onFinish }) {
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
  const [flight, setFlight] = useState(null) // trajectoire { from, to } une fois le ballon parti

  const shooterLevel = LEVELS[levelIndex]
  const keeperLevel = LEVELS[levelIndex + 1]

  // Taille du gardien : 36 % de la largeur du goal (sans dépasser 90 % de sa hauteur)
  const goalH = g.h
  // Profondeur : le gardien est plus loin que le tireur, donc toujours plus petit que lui,
  // même si le goal est très haut. Il suit la taille du goal (36 % de large, 90 % de haut) sans dépasser ce plafond.
  const shooterW = viewport.height > 700 ? SHOOTER_WIDTH : SHOOTER_WIDTH_SMALL
  const shooterH = shooterW / PLAYER_RATIO
  const keeperH = Math.min((g.w * 0.36) / PLAYER_RATIO, goalH * 0.9, shooterH * KEEPER_MAX_RATIO)
  const keeperW = keeperH * PLAYER_RATIO
  const range = g.w - keeperW

  // Position du ballon : au tiers du chemin entre le tireur et le gardien en partant du tireur
  // (donc à 1/3 du tireur et 2/3 du gardien), pour qu'il soit proche de l'attaquant.
  // Si le goal est très bas, il reste au moins BALL_CLEARANCE px au-dessus de la tête du tireur.
  const [bottomInset] = useState(readBottomInset) // marge de sécurité du bas, en px (mesurée une fois)
  const shooterTop = viewport.height - bottomInset - SHOOTER_BOTTOM - shooterH
  const keeperFeet = g.y + g.h
  const ballY = Math.min(shooterTop + (keeperFeet - shooterTop) / 3, shooterTop - BALL_CLEARANCE)

  // Gardien : va-et-vient tant que patrol vaut true
  const keeperRef = useRef(null) // la case du gardien (position)
  const keeperBodyRef = useRef(null) // son pictogramme (inclinaison pendant le plongeon)
  const patrol = useRef(true)
  const shooterRef = useRef(null) // le tireur (il court vers le ballon)
  const runFrame = useRef(0) // image d'animation de l'élan en cours, pour l'annuler si besoin

  const [bonus, setBonus] = useState({ double: false, power: false })

  // Chrono du match (en secondes). Il s'arrête à 10:00 et se met en pause quand le menu est ouvert.
  const [elapsed, setElapsed] = useState(0)
  const timeUp = elapsed >= MATCH_SECONDS

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setElapsed((e) => Math.min(e + 1, MATCH_SECONDS)), 1000)
    return () => clearInterval(id)
  }, [paused])

  // Timers du tir : on les garde pour pouvoir les annuler si le composant disparaît
  const timers = useRef([])
  const later = (fn, ms) => {
    timers.current.push(setTimeout(fn, ms))
  }
  useEffect(() => {
    const list = timers.current
    return () => {
      list.forEach(clearTimeout)
      cancelAnimationFrame(runFrame.current)
    }
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

  // Déplace le gardien vers un point du goal { fx, fy } (fractions de sa largeur et de sa hauteur).
  // Quand il plonge, il s'incline selon la distance parcourue (avec un peu de hasard) et saute
  // plus ou moins haut selon la hauteur du point visé. dive = false : retour au centre, bien droit.
  const moveKeeper = (target, ms, dive = true) => {
    const el = keeperRef.current
    const body = keeperBodyRef.current
    if (!el || !body) return
    const left = clamp(target.fx * g.w - keeperW / 2, 0, range)
    const tilt = dive ? clamp((target.fx - 0.5) * 2 * MAX_TILT + rand(-6, 6), -MAX_TILT, MAX_TILT) : 0
    const lift = dive ? clamp((0.6 - target.fy) * g.h, 0, keeperH * 0.45) : 0
    el.style.transition = `left ${ms}ms ease-out, bottom ${ms}ms ease-out`
    el.style.left = `${left}px`
    el.style.bottom = `${lift}px`
    body.style.transition = `transform ${ms}ms ease-out`
    body.style.transform = `rotate(${tilt}deg)`
  }

  // Élan du tireur : il court vers le ballon en accélérant ; quand ses pieds arrivent au ballon,
  // onKick() est appelé (le ballon part), puis il freine progressivement sans s'arrêter net.
  const runUp = (onKick) => {
    const el = shooterRef.current
    if (!el) return
    const feetY = el.getBoundingClientRect().bottom - shooterH * 0.06 // le bas des chaussures
    const dist = Math.max(0, feetY - ballY) // distance jusqu'au ballon
    const speed = (2 * dist) / RUN_MS // vitesse (px par ms) atteinte à l'arrivée sur le ballon
    let start = null // l'heure de la première image
    let kicked = false

    const step = (now) => {
      if (start === null) start = now
      const t = now - start
      let y
      if (t < RUN_MS) {
        y = dist * (t / RUN_MS) ** 2 // accélération constante
      } else {
        if (!kicked) {
          kicked = true
          onKick()
        }
        const u = Math.min(t - RUN_MS, STOP_MS)
        y = dist + speed * u - (speed / (2 * STOP_MS)) * u * u // décélération constante jusqu'à l'arrêt
      }
      // Il s'éloigne vers le haut : un peu plus petit pour la profondeur
      el.style.transform = `translateY(${-y}px) scale(${1 - 0.0006 * y})`
      if (t < RUN_MS + STOP_MS) runFrame.current = requestAnimationFrame(step)
    }
    runFrame.current = requestAnimationFrame(step)
  }

  // Tirage au sort de la difficulté
  useEffect(() => {
    if (phase !== 'rolling') return

    const timer = setTimeout(() => {
      // Le badge de niveau apparaît : fin du tirage, on coupe spin et on joue reveal
      // (dans le callback du timer, qui est annulé par le nettoyage : un seul appel même en StrictMode)
      stopSounds(['spin'])
      playSound('reveal')
      setLevelIndex(Math.floor(Math.random() * 3)) // easy, medium ou hard
      setPhase('shooterCard')
    }, ROLL_TIME)

    return () => clearTimeout(timer)
  }, [phase])

  // Point d'arrivée du ballon en coordonnées écran, depuis une position { fx, fy } dans le goal
  const toScreen = ({ fx, fy }) => ({ x: g.x + g.w * fx, y: g.y + g.h * fy })

  const playShot = (res) => {
    setPhase('shot')

    // 1. Le gardien arrête son va-et-vient et revient au milieu ; le ballon est posé, le tireur prend son élan
    patrol.current = false
    moveKeeper({ fx: 0.5, fy: 1 }, 400, false)
    const from = { x: viewport.width / 2, y: ballY }
    setBall({ ...from, scale: 1 })

    // 2. Quand le tireur arrive sur le ballon, il part (avec sa trajectoire en points) et le gardien plonge
    runUp(() => {
      playSound('kick') // le ballon part
      const to = toScreen(res.ball)
      setBall({ ...to, scale: 0.7 })
      setFlight({ from, to })
      moveKeeper(res.keeper, 300)

      // 3. Résultat, une fois le ballon arrivé (compté depuis la frappe, pas depuis le début de l'élan)
      later(() => {
        if (res.result === 'goal') addGoal(attacking, bonus.double ? 2 : 1)
        RESULT_SOUNDS[res.result].forEach(playSound) // le texte du résultat s'affiche
        setPhase('outcome')
      }, BALL_FLIGHT_MS + 100)
    })
  }

  const shoot = () => {
    playSound('spin') // les 3 ballons commencent à tourner
    setPhase('rolling')
  }

  const shooterAnswer = (ok) => {
    playSound(ok ? 'correct' : 'incorrect')
    setShooterOk(ok)
    setPhase('keeperCard')
  }

  const keeperAnswer = (ok) => {
    playSound(ok ? 'correct' : 'incorrect')
    setKeeperOk(ok)
    if (shooterOk) {
      // L'attaquant a bon : il choisit où tirer
      setPhase('aim')
    } else {
      // Pas de tir : "Keeper bonus" si le gardien a bon, sinon "No shot"
      const result = ok ? 'bonus' : 'nothing'
      setShot({ result })
      RESULT_SOUNDS[result].forEach(playSound)
      setPhase('outcome')
    }
  }

  // Le résultat est calculé ici, au moment où l'attaquant choisit sa zone
  const chooseSpot = (zone) => {
    const res = resolveShot(shooterLevel.id, keeperOk, bonus.power, zone)
    setShot(res)
    playShot(res)
  }

  const next = () => {
    // On coupe les réactions de la foule, mais pas l'ambiance du stade
    stopSounds(['goal', 'save', 'saveCheer', 'miss'])
    // Le gardien reprend son va-et-vient, sans animation de retour et sans inclinaison
    if (keeperRef.current) {
      keeperRef.current.style.transition = 'none'
      keeperRef.current.style.bottom = ''
    }
    if (keeperBodyRef.current) {
      keeperBodyRef.current.style.transition = 'none'
      keeperBodyRef.current.style.transform = ''
    }
    // Le tireur revient à sa place de départ
    if (shooterRef.current) shooterRef.current.style.transform = ''
    patrol.current = true
    setBonus({ double: false, power: false })
    setPhase('ready')
    setLevelIndex(null)
    setShooterOk(null)
    setKeeperOk(null)
    setShot(null)
    setBall(null)
    setFlight(null)
    nextTurn()
  }

  // Le match se termine sur le résultat d'un tir : 7 buts, ou temps écoulé.
  // Le tir en cours (ou le prochain si aucun n'est lancé) est donc le dernier : même si le chrono
  // finit pendant qu'on regarde le résultat, on ne peut plus relancer de tir.
  // (Calculé à chaque affichage : un VAR qui retire un but peut relancer le match.)
  const matchOver =
    phase === 'outcome' && (timeUp || score.blue >= GOALS_TO_WIN || score.green >= GOALS_TO_WIN)

  const toggleBonus = (id) => {
    setBonus((b) => ({ ...b, [id]: !b[id] }))
  }

  const canUseShotBonus = ['ready', 'rolling', 'shooterCard', 'keeperCard', 'aim'].includes(phase)

  // Ballon posé au milieu : blanc (rebondit) en attendant, couleur du niveau pendant le choix de la zone
  const restingBall = phase === 'ready' || phase === 'aim'
  const bouncing = phase === 'ready'

  // Phases de carte : l'adversaire tire la carte papier et la lit, l'autre joueur répond
  //   shooterCard : le gardien lit, le tireur répond · keeperCard : le tireur lit, le gardien répond
  const shooterAnswers = phase === 'shooterCard'
  const asking = shooterAnswers || phase === 'keeperCard'

  return (
    // has-card : la zone d'action est plus haute pendant les phases de carte (voir index.css)
    <div className={`relative h-dvh overflow-hidden ${asking ? 'has-card' : ''}`}>
      {/* Haut : tableau des scores + chrono */}
      <div className="absolute inset-x-0 flex flex-col items-center gap-2" style={{ top: 'var(--pt)' }}>
        <Scoreboard blue={score.blue} green={score.green} />
        {/* Chrono : devient "Last shot!" à 10:00, puis "Full time" au coup de sifflet final */}
        <div className={`chrono ${timeUp ? 'text-gold' : ''}`} role="timer" aria-label="Time">
          {matchOver ? 'Full time' : timeUp ? 'Last shot!' : formatTime(elapsed)}
        </div>
      </div>

      {/* Cages (invisibles) + gardien */}
      <div className="absolute" style={{ left: g.x, top: g.y, width: g.w, height: g.h }}>
        <div ref={keeperRef} className="absolute bottom-0" style={{ width: keeperW, height: keeperH }}>
          <div ref={keeperBodyRef} className="size-full">
            <Player name={keeper.name} number={keeper.number} team={keeper.team} pose="keeper" />
          </div>
          <span className="name-pill absolute left-1/2 top-full mt-0.5 -translate-x-1/2">{keeper.name}</span>
          {/* Repère pendant les cartes : "?" s'il répond, carte s'il lit */}
          {asking && (shooterAnswers ? <CardIcon /> : <AnswerBubble />)}
        </div>

        {/* Trois zones cliquables par-dessus le goal (phase aim) : trait navy sous un trait doré */}
        {phase === 'aim' && (
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

      {/* Tireur : ancré en bas, ses jambes passent derrière les panneaux. Il court vers le ballon
          au moment du tir (runUp) ; le ballon est dessiné par-dessus lui. */}
      <div
        ref={shooterRef}
        className="pointer-events-none absolute left-1/2 origin-bottom -translate-x-1/2"
        style={{ bottom: `calc(var(--pb) + ${SHOOTER_BOTTOM}px)`, width: shooterW, aspectRatio: PLAYER_RATIO }}
      >
        <Player name={shooter.name} number={shooter.number} team={shooter.team} pose="shooter" />
        {asking && (shooterAnswers ? <AnswerBubble /> : <CardIcon />)}
      </div>

      {/* Ballon posé : à 1/3 du tireur et 2/3 du gardien (ballY) */}
      {restingBall && (
        <div
          className="absolute left-1/2 size-[52px] -translate-x-1/2 -translate-y-1/2"
          style={{ top: ballY }}
        >
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

      {/* Milieu de l'écran : tirage, badge de niveau, résultat */}
      <div
        className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ top: `${(viewport.height > 700 ? MIDDLE_Y : MIDDLE_Y_SMALL) * 100}%` }}
      >
        {phase === 'rolling' && (
          <div className="relative size-[150px] animate-draw">
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
            // Après un but, le texte apparaît une fois le wipe passé
            style={{ animationDelay: shot.result === 'goal' ? '300ms' : '0ms' }}
            className={`reveal whitespace-nowrap font-display tracking-display text-outline-lg ${
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

      {/* Wipe 28° sur un but */}
      {phase === 'outcome' && shot.result === 'goal' && <Wipe key={turn} />}

      {/* Trajectoire du ballon (sous le ballon) */}
      {flight && <Trajectory from={flight.from} to={flight.to} />}

      {/* Ballon en vol */}
      {ball && shooterLevel && (
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
          <CardPanel reader={keeper} answerer={shooter} level={shooterLevel} onAnswer={shooterAnswer} />
        )}

        {phase === 'keeperCard' && (
          <CardPanel reader={shooter} answerer={keeper} level={keeperLevel} onAnswer={keeperAnswer} />
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
