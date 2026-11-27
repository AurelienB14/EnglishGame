import { Howl, Howler } from 'howler'

// Les fichiers sont dans public/sounds/. BASE_URL permet de les trouver même si l'app
// est servie dans un sous-dossier (ex. /mon-app/).
const url = (file) => `${import.meta.env.BASE_URL}sounds/${file}`

// Howler coupe le moteur audio après 30 s de silence (autoSuspend) puis doit le relancer : sur téléphone,
// ce redémarrage fait parfois perdre le son suivant (ex. le sifflet du 2e Kick off). On le désactive.
Howler.autoSuspend = false

const sounds = {
  kickoff: new Howl({ src: [url('kickoff.mp3')], volume: 0.7 }), // coup de sifflet du Kick off (un peu moins fort)
  kick: new Howl({ src: [url('kick.mp3')] }), // frappe du ballon
  goal: new Howl({ src: [url('goal.mp3')] }), // la foule crie sur un but
  save: new Howl({ src: [url('save.mp3')] }), // foule « choquée » sur un arrêt
  saveCheer: new Howl({ src: [url('save-cheer.mp3')], volume: 0.4 }), // foule contente, moins fort
  miss: new Howl({ src: [url('miss.mp3')] }), // foule déçue sur un tir raté
  victory: new Howl({ src: [url('victory.mp3')] }), // fanfare de fin de match
  applause: new Howl({ src: [url('applause.mp3')], loop: true, volume: 0.5 }), // en boucle sur l'écran de résultat
  ambiance: new Howl({ src: [url('ambiance.mp3')], loop: true, volume: 0.8 }), // ambiance de stade pendant le match (le fichier a été amplifié x4 : il était très faible)
  spin: new Howl({ src: [url('spin.mp3')] }), // pendant que les 3 ballons tournent
  reveal: new Howl({ src: [url('reveal.wav')] }), // quand le badge de niveau apparaît
  correct: new Howl({ src: [url('correct.mp3')] }), // bouton « Correct »
  incorrect: new Howl({ src: [url('incorrect.mp3')] }), // bouton « Incorrect »
}

// Certains fichiers ont un blanc au début : on les fait démarrer plus loin (en secondes).
// kick : le claquement n'arrive qu'à 0,2 s dans le fichier ; incorrect : à 0,5 s ; miss : à 0,2 s.
const START_AT = { kick: 0.2, incorrect: 0.5, miss: 0.2 }

// Joue un son ; stop() d'abord pour qu'un même son ne se superpose pas
export function playSound(name) {
  const sound = sounds[name]
  if (!sound) return
  // Si le navigateur a mis le moteur audio en veille (retour sur l'appli, écran verrouillé...), on le réveille
  if (Howler.ctx && Howler.ctx.state !== 'running') Howler.ctx.resume()
  sound.stop()
  const id = sound.play()
  // seek() juste après play() : Howler saute alors directement à cet instant du fichier
  if (START_AT[name]) sound.seek(START_AT[name], id)
}

// Coupe tous les sons en cours
export function stopAllSounds() {
  Howler.stop()
}

// Coupe seulement les sons de la liste (ex. stopSounds(['goal', 'miss']))
export function stopSounds(names) {
  names.forEach((name) => sounds[name]?.stop())
}

// Sons à jouer pour chaque résultat de tir. Les clés sont celles de `shot.result` dans game.jsx :
// goal = Goal · save = What a save · bonus = Keeper bonus · miss = Off target · nothing = No shot
export const RESULT_SOUNDS = {
  goal: ['goal'],
  save: ['save', 'saveCheer'],
  bonus: ['save', 'saveCheer'],
  miss: ['miss'],
  nothing: ['miss'],
}
