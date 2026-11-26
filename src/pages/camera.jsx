import { useEffect, useRef, useState } from 'react'

const MIN_ZOOM = 0.5 // le plus dézoomé proposé (si le téléphone le permet)
const MAX_ZOOM = 2 // le plus zoomé proposé

// zoom : valeur voulue (null = minimum) · onZoomRange : appelé avec { min, max, step } si le zoom est géré
// (passer une fonction stable, ex. le setter d'un useState)
function Camera({ zoom = null, onZoomRange }) {
  const videoRef = useRef(null)
  const trackRef = useRef(null) // la piste vidéo, pour changer le zoom sans relancer la caméra
  // Si la caméra n'existe pas (HTTP, ancien navigateur), on affiche le fond de secours directement
  const [failed, setFailed] = useState(() => !navigator.mediaDevices?.getUserMedia)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return

    const video = videoRef.current
    let cancelled = false // vrai si le composant disparaît avant la réponse de la caméra
    let stream = null

    navigator.mediaDevices
      .getUserMedia({
        // Caméra arrière, limitée à 720p (éco-conception)
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
        },
        audio: false,
      })
      .then((s) => {
        // En dev, StrictMode lance l'effet deux fois : la première réponse arrive après
        // le nettoyage. On coupe alors ce flux tout de suite, sinon la caméra reste ouverte.
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        video.srcObject = s

        // Certains téléphones démarrent la caméra déjà zoomée (ex. 2x). Quand le navigateur gère
        // le zoom (Chrome Android), on le remet au minimum pour avoir la même vue large partout,
        // et on prévient l'app pour qu'elle propose un curseur de zoom.
        const track = s.getVideoTracks()[0]
        trackRef.current = track
        const range = track?.getCapabilities?.().zoom
        if (range) {
          // Le curseur va de x0.5 (ou du minimum du téléphone s'il est plus haut) à x2 (ou son maximum)
          const min = Math.max(range.min, MIN_ZOOM)
          const max = Math.min(range.max, MAX_ZOOM)
          track.applyConstraints({ advanced: [{ zoom: min }] }).catch(() => {})
          if (max > min) onZoomRange({ min, max, step: Math.max(range.step || 0, 0.1) })
        }

        return video.play()
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Camera unavailable:', err)
        setFailed(true)
      })

    return () => {
      cancelled = true
      trackRef.current = null
      stream?.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }
  }, [onZoomRange])

  // Quand le joueur règle le curseur de zoom
  useEffect(() => {
    if (zoom == null) return
    trackRef.current?.applyConstraints({ advanced: [{ zoom }] }).catch(() => {})
  }, [zoom])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`fixed inset-0 -z-10 h-full w-full object-cover ${failed ? 'hidden' : ''}`}
    />
  )
}

export default Camera
