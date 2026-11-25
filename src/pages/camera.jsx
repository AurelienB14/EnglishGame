import { useEffect, useRef } from 'react'

function Camera() {
  const videoRef = useRef(null)

  useEffect(() => {
    let stream

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        stream = s
        videoRef.current.srcObject = s
      })
      .catch((err) => console.error('Caméra refusée :', err))

    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])

  return (
    <>
    <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed inset-0 w-full h-full object-cover -z-10"
    />
    </>
  )
}

export default Camera
