// Constantes partagées par toute l'app (une seule source de vérité)

// Couleurs des équipes (tokens du thème, définis dans index.css)
export const TEAM_COLOR = {
  blue: 'var(--color-royal)',
  green: 'var(--color-team-green)',
}

// Fin de match : 7 buts, ou 10 minutes (puis un dernier tir)
export const GOALS_TO_WIN = 7
export const MATCH_SECONDS = 30 // TEST : remettre 10 * 60 pour le vrai match

export const TEAM_LABEL = { blue: 'Blue', green: 'Green' }

// Niveaux de difficulté des cartes
export const LEVELS = [
  { id: 'easy', label: 'Easy', article: 'an', color: 'var(--color-easy)', stars: 1 },
  { id: 'medium', label: 'Medium', article: 'a', color: 'var(--color-medium)', stars: 2 },
  { id: 'hard', label: 'Hard', article: 'a', color: 'var(--color-hard)', stars: 3 },
  { id: 'extreme', label: 'Extreme', article: 'an', color: 'var(--color-extreme)', stars: 4 },
]

// [chance de cadrer, chance d'arrêt si le gardien a bon]
export const CHANCES = {
  easy: [0.3, 0.1],
  medium: [0.6, 0.2],
  hard: [0.9, 0.3],
}

// Les trois zones du but
export const ZONES = ['left', 'center', 'right']

// Position du gardien dans les cages : 0 = poteau gauche, 1 = poteau droit
export const KEEPER_ZONE = { left: 0, center: 0.5, right: 1 }

// Où part le ballon quand le tir est raté, selon le côté choisi
export const MISS_BALL = { left: 'wideLeft', center: 'over', right: 'wideRight' }
