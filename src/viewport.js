import { useEffect, useState } from 'react'

// Taille de l'écran, mise à jour quand elle change (rotation, barres du navigateur...)
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return viewport
}

// Le goal est stocké en fractions de l'écran (0 à 1) : x et w par rapport à la largeur,
// y et h par rapport à la hauteur. Cette fonction le convertit en pixels pour l'affichage.
export function goalToPx(goal, viewport) {
  return {
    x: goal.x * viewport.width,
    y: goal.y * viewport.height,
    w: goal.w * viewport.width,
    h: goal.h * viewport.height,
  }
}

// Hauteur réelle, en px, de la marge de sécurité du bas (--pb dans index.css : encoche + 16 px).
// Sert à connaître la position exacte du tireur, qui est posé en CSS à partir de cette marge.
export function readBottomInset() {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:var(--pb);visibility:hidden'
  document.body.appendChild(probe)
  const px = probe.getBoundingClientRect().height
  probe.remove()
  return px
}

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
