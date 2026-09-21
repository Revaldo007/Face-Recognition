import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { errorMessage } from '../../services/api'
import Camera from '../../components/Camera'
import { Alert, PageHeader, PercentBadge, StatusBadge, fmtDate } from '../../components/ui'

const SCAN_EVERY_MS = 2000

export default function AttendanceSession() {
  const [params] = useSearchParams()
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ subject_id: params.get('subject') || '', section: 'A' })
  const [session, setSession] = useState(null)        // full session summary from the backend
  const [scanning, setScanning] = useState(true)
  const [last, setLast] = useState(null)              // last recognition result (for the info panel)
  const [message, setMessage] = useState('Position your face in front of the camera')
  const [boxes, setBoxes] = useState([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const cameraRef = useRef(null)
  const busy = useRef(false)

  useEffect(() => { api.get('/subjects').then((r) => setSubjects(r.data)).catch((e) => setError(errorMessage(e))) }, [])

  const start = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    try {
      const { data } = await api.post('/attendance/session', { subject_id: Number(form.subject_id), section: form.section })
      setSession(data); setLast(null); setBoxes([]); setScanning(true)
      if (data.resumed) setInfo('An active session already existed for this class - resumed it.')
    } catch (err) { setError(errorMessage(err)) }
  }

  const refreshSession = useCallback(async (id) => {
    const { data } = await api.get(`/attendance/session/${id}`)
    setSession(data)
  }, [])

  // Every 2 seconds: capture a frame -> send to FastAPI -> show who was recognised
  const active = session?.status === 'active'
  useEffect(() => {
    if (!active || !scanning) return
    const timer = setInterval(async () => {
      if (busy.current || !cameraRef.current?.isReady()) return
      busy.current = true
      try {
        const blob = await cameraRef.current.capture()
        const fd = new FormData()
        fd.append('session_id', session.id)
        fd.append('image', blob, 'frame.jpg')
        const { data } = await api.post('/attendance/recognize', fd)
        setMessage(data.message)
        setBoxes(data.faces.map((f) => ({
          ...f.box,
          color: f.recognized ? 'green' : f.status === 'NOT_RECOGNIZED' ? 'red' : 'amber',
          label: f.student?.name || (f.status === 'NOT_RECOGNIZED' ? 'Unknown' : ''),
        })))
        const hit = data.faces.find((f) => f.recognized) || data.faces[0]
        if (hit) setLast(hit)
        if (data.faces.some((f) => f.status === 'PRESENT')) await refreshSession(session.id)
      } catch (err) {
        setMessage(errorMessage(err))
      } finally { busy.current = false }
    }, SCAN_EVERY_MS)
    return () => clearInterval(timer)
  }, [active, scanning, session?.id, refreshSession])

  const endSession = async () => {
    if (!window.confirm('End this session? Students who were not recognised will be marked ABSENT.')) return
    try {
      const { data } = await api.post(`/attendance/session/${session.id}/close`)
      setSession(data); setBoxes([])
    } catch (err) { setError(errorMessage(err)) }
  }

  // ------------------------------------------------ 1) Start form
  if (!session) {
    return (
      <div>
        <PageHeader title="Attendance Session" subtitle="Choose the class and start taking attendance with the camera" />
        <form onSubmit={start} className="card max-w-xl space-y-4">
          <Alert>{error}</Alert>
          <div>
            <label className="label">Subject</label>
            <select className="input" required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">Select subject...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.course_name}, Sem {s.semester}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <input className="input" required value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} maxLength={10} />
          </div>
          <p className="text-sm text-slate-500">Date and start time are recorded automatically: {new Date().toLocaleString()}</p>
          <button className="btn-primary">Start Session</button>
        </form>
      </div>
    )
  }

  // ------------------------------------------------ 2) Closed: summary with absent students
  if (!active) {
    return (
      <div>
        <PageHeader title="Session Summary" subtitle={`${session.subject} · ${session.course} · Section ${session.section}`}>
          <button className="btn-primary" onClick={() => { setSession(null); setLast(null) }}>New Session</button>
        </PageHeader>
        <div className="mb-5 grid gap-4 sm:grid-cols-4">
          <Stat label="Total Students" value={session.total_students} />
          <Stat label="Present" value={session.present_count} color="text-emerald-600" />
          <Stat label="Absent" value={session.absent_count} color="text-rose-600" />
          <Stat label="Attendance" value={<PercentBadge value={session.percentage} total={session.total_students} />} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <StudentList title="Present Students" rows={session.present} status="PRESENT" />
          <StudentList title="Absent Students" rows={session.absent} status="ABSENT" />
        </div>
      </div>
    )
  }

  // ------------------------------------------------ 3) Active: camera + live info
  const faceOk = boxes.length > 0
  return (
    <div>
      <PageHeader title="Attendance Session" subtitle={`${session.subject} · ${session.course} · Sem ${session.semester} · Section ${session.section} · ${fmtDate(session.date)} ${session.start_time}`}>
        <StatusBadge status="active" />
        <button className="btn-secondary" onClick={() => setScanning((s) => !s)}>{scanning ? 'Pause' : 'Resume'}</button>
        <button className="btn-danger" onClick={endSession}>End Session</button>
      </PageHeader>
      <Alert type="info">{info}</Alert>
      <Alert>{error}</Alert>

      <div className="mt-3 grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Camera ref={cameraRef} boxes={boxes} statusText={faceOk ? '[ Face Detected ]' : message} />
          <div className="card">
            <p className="mb-2 text-sm text-slate-500">{message}</p>
            {last?.student ? (
              <div className="space-y-1">
                <p><span className="text-slate-500">Student:</span> <b>{last.student.name}</b> ({last.student.roll_number})</p>
                <p><span className="text-slate-500">Status:</span> <StatusBadge status="PRESENT" /> {last.status === 'ALREADY_MARKED' && <span className="text-xs text-slate-500">(already marked)</span>}</p>
                <p><span className="text-slate-500">Time:</span> {last.time}</p>
              </div>
            ) : last ? (
              <p className={last.status === 'NOT_RECOGNIZED' ? 'font-semibold text-rose-600' : 'text-amber-600'}>{last.message}</p>
            ) : <p className="text-slate-400">Waiting for a face...</p>}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total" value={session.total_students} />
            <Stat label="Present" value={session.present_count} color="text-emerald-600" />
            <Stat label="Yet to mark" value={session.absent_count} color="text-amber-600" />
          </div>
          <StudentList title="Marked Present" rows={session.present} status="PRESENT" showTime />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color = '' }) {
  return <div className="card !p-4 text-center"><p className="text-xs text-slate-500">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div>
}

function StudentList({ title, rows, status, showTime }) {
  return (
    <div className="card !p-0">
      <div className="border-b border-slate-200 px-4 py-3 font-semibold">{title} ({rows.length})</div>
      <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
        {rows.length === 0 && <li className="px-4 py-4 text-center text-sm text-slate-400">None</li>}
        {rows.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span><b>{s.name}</b> <span className="text-slate-400">{s.roll_number}</span></span>
            <span className="flex items-center gap-2">{showTime && <span className="text-xs text-slate-500">{s.time}</span>}<StatusBadge status={status} /></span>
          </li>
        ))}
      </ul>
    </div>
  )
}
