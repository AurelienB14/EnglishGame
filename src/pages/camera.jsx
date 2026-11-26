import { useEffect, useRef, useState } from 'react'

// Diagnostic caméra : affiché seulement si l'adresse contient ?debug
const DEBUG = new URLSearchParams(window.location.search).has('debug')

const MIN_ZOOM = 0.5 // le plus dézoomé proposé (si le téléphone le permet)
const MAX_ZOOM = 2 // le plus zoomé proposé

// zoom : valeur voulue (null = minimum)
// lensId : objectif choisi (null = l'objectif arrière par défaut)
// onZoomRange : appelé avec { min, max, step } si le zoom est géré, sinon avec null
// onLenses : appelé avec { list: [{ id, label }], active } : les objectifs arrière disponibles
// (passer des fonctions stables, ex. des setters de useState)
function Camera({ zoom = null, lensId = null, onZoomRange, onLenses }) {
  const videoRef = useRef(null)
  const trackRef = useRef(null) // la piste vidéo, pour changer le zoom sans relancer la caméra
  // Si la caméra n'existe pas (HTTP, ancien navigateur), on affiche le fond de secours directement
  const [failed, setFailed] = useState(() => !navigator.mediaDevices?.getUserMedia)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return

    const video = videoRef.current
    let cancelled = false // vrai si le composant disparaît avant la réponse de la caméra
    let stream = null

    navigator.mediaDevices
      .getUserMedia({
        // Caméra arrière (ou l'objectif choisi), limitée à 720p (éco-conception)
        video: {
          ...(lensId ? { deviceId: { exact: lensId } } : { facingMode: 'environment' }),
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
        },
        audio: false,
      })
      .then(async (s) => {
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
          onZoomRange(max > min ? { min, max, step: Math.max(range.step || 0, 0.1) } : null)
        } else {
          onZoomRange(null)
        }

        // Les objectifs arrière (les noms ne sont connus qu'après l'autorisation de la caméra).
        // Sur iPhone on y trouve "Back Ultra Wide Camera" : c'est lui qui permet de dézoomer.
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (!cancelled && DEBUG) {
          // Diagnostic (ouvrir le site avec ?debug à la fin de l'adresse)
          const caps = track?.getCapabilities?.() ?? {}
          const st = track?.getSettings?.() ?? {}
          setDebugInfo(
            [
              `cameras: ${devices.filter((d) => d.kind === 'videoinput').map((d) => d.label || '(no label)').join(' | ') || 'none'}`,
              `active: ${track?.label ?? '?'}`,
              `zoom: ${caps.zoom ? `${caps.zoom.min} -> ${caps.zoom.max} (step ${caps.zoom.step})` : 'not supported'}`,
              `stream: ${st.width}x${st.height} @${Math.round(st.frameRate ?? 0)}fps`,
              `video: ${video.videoWidth}x${video.videoHeight} · screen: ${window.innerWidth}x${window.innerHeight}`,
            ].join('\n'),
          )
        }
        if (!cancelled) {
          const list = devices
            .filter((d) => d.kind === 'videoinput' && /back|rear|environment/i.test(d.label))
            .map((d) => ({ id: d.deviceId, label: d.label }))
          onLenses({ list, active: track?.getSettings?.().deviceId ?? null })
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
  }, [lensId, onZoomRange, onLenses])

  // Quand le joueur règle le curseur de zoom
  useEffect(() => {
    if (zoom == null) return
    trackRef.current?.applyConstraints({ advanced: [{ zoom }] }).catch(() => {})
  }, [zoom])

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`fixed inset-0 -z-10 h-full w-full object-cover ${failed ? 'hidden' : ''}`}
      />
      {DEBUG && (
        <pre className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] whitespace-pre-wrap bg-navy/90 p-2 font-mono text-[10px] leading-tight text-white">
          {failed ? 'camera: unavailable or refused' : debugInfo || 'camera: starting…'}
        </pre>
      )}
    </>
  )
}

export default Camera
