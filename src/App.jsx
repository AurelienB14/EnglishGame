import { useEffect, useState } from 'react'

import '@fontsource/bebas-neue'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/600.css'

import logomenu from './assets/logoMenu.png'
import goal_img from './assets/goal.svg'

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
  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement)
  const [step, setStep] = useState('menu')
  const [goal, setGoal] = useState({ x: 100, y: 200, w: 250 })
  const [allPlayers, setAllPlayers] = useState([])
  const [turn, setTurn] = useState(0)
  const [score, setScore] = useState({ blue: 0, green: 0 })

  useEffect(() => {
    const maj = () => setIsFullScreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', maj)
    return () => document.removeEventListener('fullscreenchange', maj)
  }, [])

  const pleinecran = () => {
    document.documentElement.requestFullscreen?.()
    setIsFullScreen(true)
    if (step === 'menu') setStep('putgoal')
  }

  const setgoalfunc = () => {
    setStep('choosingplayers')
  }

  const newPlayers = (name, number, team) => {
    setAllPlayers([...allPlayers, { name, number, team }])
  }

  const deletePlayers = (i) => {
    setAllPlayers(allPlayers.filter((_, index) => index !== i))
  }

  const drawTeams = () => {
    const updated = allPlayers.map((p) => ({ ...p }))

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

    setAllPlayers(updated)
  }

  const kickOff = () => {
    setStep('game')
  }

  const addGoal = (team) => {
    setScore((s) => ({ ...s, [team]: s[team] + 1 }))
  }

  const nextTurn = () => {
    setTurn((t) => t + 1)
  }

  let page
  if (!isFullScreen && step === 'menu') {
    page = <Menu text="PLAY" buttonMenu={pleinecran} logoImg={logomenu} />
  } else if (!isFullScreen) {
    page = <Menu text="CONTINUE" buttonMenu={pleinecran} logoImg={logomenu} />
  } else if (step === 'putgoal') {
    page = <PutGoal goal={goal} setGoal={setGoal} add={setgoalfunc} goalimg={goal_img} />
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
        goalimg={goal_img}
        score={score}
        addGoal={addGoal}
        nextTurn={nextTurn}
      />
    )
  }

  return (
    <>
      <Camera />
      {page}
    </>
  )
}

export default App