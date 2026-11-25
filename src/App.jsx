import { useEffect, useState } from 'react'

import '@fontsource/bebas-neue'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/600.css'

import logoMenu from './assets/logoMenu.png'
import goalImg from './assets/goal.svg'

import Menu from './pages/menu'
import Camera from './pages/camera'
import PutGoal from './pages/putgoal'
import ChoosingPlayers from './pages/choosing_players'
import Game from './pages/game'

const shuffle = (array) => {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

function App() {
  // 'menu' (pas encore commencé) | 'putgoal' | 'choosingplayers' | 'game'
  const [step, setStep] = useState('menu')
  const [menuOpen, setMenuOpen] = useState(true)
  // Le goal est en fractions de l'écran (0 à 1), pas en pixels : il suit les changements de taille
  const [goal, setGoal] = useState({ x: 0.2, y: 0.3, w: 0.6 })
  const [allPlayers, setAllPlayers] = useState([])
  const [turn, setTurn] = useState(0)
  const [score, setScore] = useState({ blue: 0, green: 0 })

  // Quitter le plein écran fait revenir le menu (avec CONTINUE)
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setMenuOpen(true)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const enterFullscreen = () => {
    // Sur iPhone requestFullscreen n'existe pas : le "?." évite le plantage et on continue quand même
    document.documentElement.requestFullscreen?.()?.catch(() => {})
    setMenuOpen(false)
    setStep((s) => (s === 'menu' ? 'putgoal' : s))
  }

  const goToPlayers = () => setStep('choosingplayers')

  const newPlayers = (name, number, team) => {
    setAllPlayers((prev) => [...prev, { name, number, team }])
  }

  const deletePlayers = (i) => {
    setAllPlayers((prev) => prev.filter((_, index) => index !== i))
  }

  const drawTeams = () => {
    setAllPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p }))

      const count = {
        blue: updated.filter((p) => p.team === 'blue').length,
        green: updated.filter((p) => p.team === 'green').length,
      }

      const randoms = shuffle(updated.filter((p) => p.team === 'random'))

      randoms.forEach((p) => {
        let team
        if (count.blue < count.green) team = 'blue'
        else if (count.green < count.blue) team = 'green'
        else team = Math.random() < 0.5 ? 'blue' : 'green'

        p.team = team
        count[team]++
      })

      return updated
    })
  }

  const kickOff = () => setStep('game')

  const nextTurn = () => setTurn((t) => t + 1)

  const addGoal = (team, amount = 1) => {
    setScore((s) => ({ ...s, [team]: s[team] + amount }))
  }

  const removeGoal = (team) => {
    setScore((s) => ({ ...s, [team]: Math.max(0, s[team] - 1) }))
  }

  let page = null
  if (step === 'putgoal') {
    page = <PutGoal goal={goal} setGoal={setGoal} onConfirm={goToPlayers} goalimg={goalImg} />
  } else if (step === 'choosingplayers') {
    page = (
      <ChoosingPlayers
        allPlayers={allPlayers}
        newPlayers={newPlayers}
        deletePlayers={deletePlayers}
        drawTeams={drawTeams}
        kickOff={kickOff}
      />
    )
  } else if (step === 'game') {
    page = (
      <Game
        allPlayers={allPlayers}
        turn={turn}
        goal={goal}
        goalimg={goalImg}
        score={score}
        addGoal={addGoal}
        nextTurn={nextTurn}
        removeGoal={removeGoal}
      />
    )
  }

  return (
    <>
      <Camera />
      {page}
      {/* Le menu passe par-dessus : la page reste montée, la partie en cours n'est pas perdue */}
      {menuOpen && (
        <Menu
          text={step === 'menu' ? 'PLAY' : 'CONTINUE'}
          onPress={enterFullscreen}
          logoImg={logoMenu}
        />
      )}
    </>
  )
}

export default App
