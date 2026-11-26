// Constantes partagées par toute l'app (une seule source de vérité)

// Fin de match : 7 buts, ou 10 minutes (puis un dernier tir)
export const GOALS_TO_WIN = 7
export const MATCH_SECONDS = 10 * 60

export const TEAM_LABEL = { blue: 'Blue', green: 'Green' }

// Couleurs des équipes (tokens du thème, définis dans index.css)
export const TEAM_COLOR = {
  blue: 'var(--color-team-blue)',
  green: 'var(--color-team-green)',
}

// Niveaux de difficulté des cartes
export const LEVELS = [
  { id: 'easy', label: 'Easy', color: 'var(--color-easy)', stars: 1 },
  { id: 'medium', label: 'Medium', color: 'var(--color-medium)', stars: 2 },
  { id: 'hard', label: 'Hard', color: 'var(--color-hard)', stars: 3 },
  { id: 'extreme', label: 'Extreme', color: 'var(--color-extreme)', stars: 4 },
]

// [chance de cadrer, chance d'arrêt si le gardien a bon]
export const CHANCES = {
  easy: [0.3, 0.1],
  medium: [0.6, 0.2],
  hard: [0.9, 0.3],
}

// Les trois zones du but
export const ZONES = ['left', 'center', 'right']

// Positions dans le goal, en fractions de sa largeur (0 = poteau gauche, 1 = poteau droit)
// et de sa hauteur (0 = barre, 1 = sol). Le tir tombe à un point au hasard dans ces plages.
export const ZONE_RANGE = { left: [0.1, 0.3], center: [0.4, 0.6], right: [0.7, 0.9] }

// Où sort le ballon quand le tir est raté, selon le côté choisi (mêmes fractions du goal) :
// à gauche ou à droite à côté du poteau, au centre au-dessus de la barre (jamais tout droit)
export const MISS_AREA = {
  left: { x: [-0.4, -0.05], y: [0.1, 0.9] },
  center: { x: [0.25, 0.75], y: [-0.8, -0.25] },
  right: { x: [1.05, 1.4], y: [0.1, 0.9] },
}

// Inclinaison maximale du gardien (en degrés) quand il plonge
export const MAX_TILT = 40

// Proportions du pictogramme joueur (viewBox 120 x 170)
export const PLAYER_RATIO = 120 / 170
