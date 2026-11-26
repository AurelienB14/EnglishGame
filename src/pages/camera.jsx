import { useEffect, useRef, useState } from 'react'

function Camera() {
  const videoRef = useRef(null)
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
        // le zoom (Chrome Android), on le remet au minimum pour avoir la même vue large partout.
        const track = s.getVideoTracks()[0]
        const zoom = track?.getCapabilities?.().zoom
        if (zoom) track.applyConstraints({ advanced: [{ zoom: zoom.min }] }).catch(() => {})

        return video.play()
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Camera unavailable:', err)
        setFailed(true)
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }
  }, [])

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
