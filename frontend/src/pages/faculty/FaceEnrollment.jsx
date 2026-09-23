import { useEffect, useMemo, useRef, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import Camera from '../../components/Camera'
import { Alert, PageHeader } from '../../components/ui'

const PHOTOS = 3
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function FaceEnrollment() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detect, setDetect] = useState({ message: 'Starting...', ok: false, boxes: [] })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)   // { type, text }
  const cameraRef = useRef(null)
  const detecting = useRef(false)

  const loadStudents = () => api.get('/students').then((r) => setStudents(r.data)).catch((e) => setResult({ type: 'error', text: errorMessage(e) }))
  useEffect(() => { loadStudents() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter((s) => `${s.name} ${s.roll_number} ${s.student_id}`.toLowerCase().includes(q))
  }, [students, search])

  // Live check every 1.2s: is exactly one good face in front of the camera?
  useEffect(() => {
    if (!selected) return
    const timer = setInterval(async () => {
      if (detecting.current || busy || !cameraRef.current?.isReady()) return
      detecting.current = true
      try {
        const blob = await cameraRef.current.capture()
        const fd = new FormData()
        fd.append('image', blob, 'frame.jpg')
        const { data } = await api.post('/face/detect', fd)
        setDetect({ message: data.message, ok: !!data.ok, boxes: data.boxes })
      } catch { /* ignore one failed frame */ } finally { detecting.current = false }
    }, 1200)
    return () => clearInterval(timer)
  }, [selected, busy])

  const enroll = async () => {
    setBusy(true)
    setResult(null)
    try {
      const fd = new FormData()
      for (let i = 0; i < PHOTOS; i++) {          // capture a few frames for a better embedding
        fd.append('images', await cameraRef.current.capture(), `face${i}.jpg`)
        await sleep(400)
      }
      const { data } = await api.post(`/face/enroll/${selected.id}`, fd)
      setResult({ type: 'success', text: `${data.message} (${data.photos_used} photos used)` })
      await loadStudents()
      setSelected((s) => ({ ...s, face_enrolled: true }))
    } catch (e) {
      setResult({ type: 'error', text: errorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  const removeFace = async () => {
    if (!window.confirm('Delete stored face data for this student?')) return
    try {
      await api.delete(`/face/${selected.id}`)
      setResult({ type: 'success', text: 'Face data deleted' })
      await loadStudents()
      setSelected((s) => ({ ...s, face_enrolled: false }))
    } catch (e) { setResult({ type: 'error', text: errorMessage(e) }) }
  }

  const boxes = detect.boxes.map((b) => ({ ...b, color: detect.ok ? 'green' : 'amber' }))

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <PageHeader
        className="!mb-3 shrink-0"
        title="Face Enrollment"
        subtitle="Select a student, look at the camera and capture the face"
      />
      <div className="grid gap-4 lg:grid-cols-5 flex-1 min-h-0">
        {/* Student picker */}
        <div className="card lg:col-span-2 flex flex-col min-h-0 !p-4">
          <div className="shrink-0 mb-3">
            <input
              className="input text-sm"
              placeholder="Search name / roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {filtered.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No students found.</p>}
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelected(s); setResult(null); setDetect({ message: 'Starting...', ok: false, boxes: [] }) }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  selected?.id === s.id ? 'bg-indigo-50 ring-1 ring-indigo-400 font-medium' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-800 block leading-tight">{s.name}</span>
                  <span className="text-xs text-slate-500">{s.roll_number} · {s.course_name} · Sec {s.section}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ml-2 ${
                  s.face_enrolled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {s.face_enrolled ? 'Enrolled' : 'Pending'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Camera and Enrollment View */}
        <div className="card lg:col-span-3 flex flex-col justify-between min-h-0 !p-4">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
              <span className="mb-3 text-4xl">📸</span>
              <p className="text-base font-semibold text-slate-700">No Student Selected</p>
              <p className="text-xs text-slate-500 mt-1">Select a student from the list on the left to begin face enrollment.</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-between min-h-0 gap-2.5">
              {/* Student Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                <div>
                  <p className="text-base font-bold text-slate-800">{selected.name}</p>
                  <p className="text-xs text-slate-500">{selected.roll_number} · {selected.course_name} · Section {selected.section}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  selected.face_enrolled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {selected.face_enrolled ? 'Face Enrolled' : 'Not Enrolled'}
                </span>
              </div>

              {/* Centered camera with optimal size */}
              <div className="flex-1 flex items-center justify-center min-h-0 py-1">
                <Camera
                  ref={cameraRef}
                  boxes={boxes}
                  statusText={detect.message}
                  className="max-h-[300px] 2xl:max-h-[380px] max-w-[440px] mx-auto shadow-md"
                />
              </div>

              {/* Bottom controls & tip */}
              <div className="shrink-0 space-y-2 pt-2 border-t border-slate-100">
                {result ? (
                  <Alert type={result.type}>{result.text}</Alert>
                ) : (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Tip:</span> Face the camera in good light, look straight ahead, one person only.
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-primary"
                      onClick={enroll}
                      disabled={busy || !detect.ok}
                    >
                      {busy ? 'Capturing Face...' : selected.face_enrolled ? 'Re-enroll Face' : 'Capture & Enroll Face'}
                    </button>
                    {selected.face_enrolled && (
                      <button className="btn-danger" onClick={removeFace} disabled={busy}>
                        Delete Face
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Status: <span className={detect.ok ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{detect.message}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
