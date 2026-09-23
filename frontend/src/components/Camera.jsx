import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/**
 * Browser camera preview.
 *  - ref.current.capture()  -> Promise<Blob>  (a JPEG of the current frame)
 *  - boxes: [{x, y, w, h, color, label}]  fractions (0-1) from the backend, drawn over the video
 * The video is mirrored (like a selfie) so it feels natural; the captured image is NOT mirrored.
 */
const Camera = forwardRef(function Camera({ boxes = [], active = true, statusText, className = '' }, ref) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [state, setState] = useState('starting') // starting | ready | error
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active) return
    let cancelled = false
    async function start() {
      setState('starting')
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not available. Open the site on http://localhost or HTTPS.')
        return setState('error')
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        })
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setState('ready')
      } catch (e) {
        setError(
          e.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in the browser.'
            : e.name === 'NotFoundError' ? 'No camera found on this device.'
            : `Invalid camera input: ${e.message}`
        )
        setState('error')
      }
    }
    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [active])

  useImperativeHandle(ref, () => ({
    isReady: () => state === 'ready',
    capture: () =>
      new Promise((resolve, reject) => {
        const video = videoRef.current
        if (!video || state !== 'ready' || !video.videoWidth) return reject(new Error('Camera is not ready'))
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not capture image'))), 'image/jpeg', 0.85)
      }),
  }))

  const colors = { green: 'border-emerald-400', red: 'border-rose-500', amber: 'border-amber-400' }

  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-900 ${className}`}>
      <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />

      {state === 'ready' && boxes.map((b, i) => (
        <div key={i} className={`absolute rounded-md border-2 ${colors[b.color] || colors.amber}`}
          style={{ left: `${(1 - b.x - b.w) * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}>
          {b.label && (
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-xs text-white">{b.label}</span>
          )}
        </div>
      ))}

      {state === 'starting' && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">Starting camera...</div>}
      {state === 'error' && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-rose-300">{error}</div>}
      {state === 'ready' && statusText && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm text-white">{statusText}</div>
      )}
    </div>
  )
})

export default Camera
