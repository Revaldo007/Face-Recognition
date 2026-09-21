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
    <div>
      <PageHeader title="Face Enrollment" subtitle="Select a student, look at the camera and capture the face" />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Student picker */}
        <div className="card lg:col-span-2">
          <input className="input mb-3" placeholder="Search name / roll number..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="max-h-[28rem] space-y-1 overflow-y-auto">
            {filtered.length === 0 && <p className="py-4 text-center text-sm text-slate-500">No students found.</p>}
            {filtered.map((s) => (
              <button key={s.id} onClick={() => { setSelected(s); setResult(null); setDetect({ message: 'Starting...', ok: false, boxes: [] }) }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selected?.id === s.id ? 'bg-indigo-50 ring-1 ring-indigo-300' : 'hover:bg-slate-50'}`}>
                <span><span className="font-medium">{s.name}</span><br /><span className="text-xs text-slate-500">{s.roll_number} · {s.course_name} · Sec {s.section}</span></span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.face_enrolled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.face_enrolled ? 'Enrolled' : 'Pending'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Camera */}
        <div className="card lg:col-span-3">
          {!selected ? (
            <div className="flex h-64 items-center justify-center text-slate-500">← Select a student to begin</div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{selected.name}</p>
                <p className="text-sm text-slate-500">{selected.roll_number} · {selected.course_name}</p>
              </div>
              <Camera ref={cameraRef} boxes={boxes} statusText={detect.message} />
              <p className="text-xs text-slate-500">Tip: face the camera in good light, look straight ahead, one person only.</p>
              <Alert type={result?.type}>{result?.text}</Alert>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={enroll} disabled={busy || !detect.ok}>
                  {busy ? 'Capturing...' : selected.face_enrolled ? 'Re-enroll Face' : 'Capture & Enroll Face'}
                </button>
                {selected.face_enrolled && <button className="btn-secondary" onClick={removeFace} disabled={busy}>Delete Face Data</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
