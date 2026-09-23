import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { errorMessage } from '../../services/api'
import Camera from '../../components/Camera'
import { Alert, PageHeader, PercentBadge, StatusBadge, fmtDate, fmtTime } from '../../components/ui'

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
      <div className="flex flex-1 flex-col min-h-0">
        <PageHeader className="!mb-4 shrink-0" title="Attendance Session" subtitle="Choose the class and start taking attendance with the camera" />
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
      <div className="flex flex-1 flex-col min-h-0">
        <PageHeader className="!mb-4 shrink-0" title="Session Summary" subtitle={`${session.subject} · ${session.course} · Section ${session.section}`}>
          <button className="btn-primary" onClick={() => { setSession(null); setLast(null) }}>New Session</button>
        </PageHeader>
        <div className="mb-4 grid gap-3 sm:grid-cols-4 shrink-0">
          <Stat label="Total Students" value={session.total_students} />
          <Stat label="Present" value={session.present_count} color="text-emerald-600" />
          <Stat label="Absent" value={session.absent_count} color="text-rose-600" />
          <Stat label="Attendance" value={<PercentBadge value={session.percentage} total={session.total_students} />} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 flex-1 min-h-0">
          <StudentList title="Present Students" rows={session.present} status="PRESENT" />
          <StudentList title="Absent Students" rows={session.absent} status="ABSENT" />
        </div>
      </div>
    )
  }

  // ------------------------------------------------ 3) Active: camera + live info
  const faceOk = boxes.length > 0
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <PageHeader
        className="!mb-3 shrink-0"
        title="Attendance Session"
        subtitle={`${session.subject} · ${session.course} · Sem ${session.semester} · Section ${session.section} · ${fmtDate(session.date)} ${fmtTime(session.start_time)}`}
      >
        <StatusBadge status="active" />
        <button className="btn-secondary text-sm" onClick={() => setScanning((s) => !s)}>
          {scanning ? 'Pause' : 'Resume'}
        </button>
        <button className="btn-danger text-sm" onClick={endSession}>
          End Session
        </button>
      </PageHeader>

      {info && <div className="mb-2 shrink-0"><Alert type="info">{info}</Alert></div>}
      {error && <div className="mb-2 shrink-0"><Alert>{error}</Alert></div>}

      <div className="grid gap-4 lg:grid-cols-12 flex-1 min-h-0">
        {/* Left column: Camera + Live recognition status (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between min-h-0 gap-2.5">
          {/* Camera Viewfinder */}
          <div className="card !p-2.5 flex items-center justify-center bg-slate-900 overflow-hidden shrink-0">
            <Camera
              ref={cameraRef}
              boxes={boxes}
              statusText={faceOk ? '[ Face Detected ]' : message}
              className="max-h-[310px] 2xl:max-h-[400px] max-w-[460px] mx-auto shadow-md"
            />
          </div>

          {/* Live Recognition Status Card */}
          <div className="card !p-3 flex flex-col justify-center shrink-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${faceOk ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                Live Face Recognition
              </span>
              <span className="text-xs text-slate-500 font-medium">{message}</span>
            </div>

            {last?.student ? (
              <div className="flex items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {last.student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{last.student.name}</p>
                    <p className="text-xs text-slate-500">{last.student.roll_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {last.status === 'ALREADY_MARKED' ? (
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Already Marked</span>
                  ) : (
                    <StatusBadge status="PRESENT" />
                  )}
                  {last.time && <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200 rounded px-2 py-0.5">{last.time}</span>}
                </div>
              </div>
            ) : last ? (
              <div className={`rounded-lg px-3 py-2 text-xs font-medium ${
                last.status === 'NOT_RECOGNIZED' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {last.message}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1 text-center">Waiting for a face in front of the camera...</p>
            )}
          </div>
        </div>

        {/* Right column: Stats + Scrollable Marked Present List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 gap-2.5">
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <Stat label="Total" value={session.total_students} />
            <Stat label="Present" value={session.present_count} color="text-emerald-600" />
            <Stat label="Yet to mark" value={session.absent_count} color="text-amber-600" />
          </div>

          {/* Marked Present List */}
          <div className="card !p-0 flex flex-1 flex-col min-h-0 overflow-hidden">
            <div className="border-b border-slate-200 px-3.5 py-2 font-semibold text-sm flex items-center justify-between bg-slate-50/50 shrink-0">
              <span className="flex items-center gap-2">
                <span>Marked Present</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {session.present.length}
                </span>
              </span>
              <span className="text-xs font-normal text-slate-500">Live feed</span>
            </div>
            <ul className="divide-y divide-slate-100 overflow-y-auto flex-1 min-h-0">
              {session.present.length === 0 && (
                <li className="flex flex-col items-center justify-center p-8 text-center text-sm text-slate-400">
                  <span className="text-2xl mb-1">⏳</span>
                  <span>No students marked yet</span>
                </li>
              )}
              {session.present.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-3.5 py-2 text-sm hover:bg-slate-50">
                  <div>
                    <b className="text-slate-800">{s.name}</b>
                    <span className="ml-2 text-xs text-slate-400 font-mono">{s.roll_number}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.time && <span className="text-xs font-mono text-slate-500">{s.time}</span>}
                    <StatusBadge status="PRESENT" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color = '' }) {
  return (
    <div className="card !p-2.5 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function StudentList({ title, rows, status, showTime }) {
  return (
    <div className="card !p-0 flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-2.5 font-semibold text-sm flex items-center justify-between shrink-0 bg-slate-50/50">
        <span>{title}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{rows.length}</span>
      </div>
      <ul className="divide-y divide-slate-100 overflow-y-auto flex-1 min-h-0 max-h-72">
        {rows.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">None</li>}
        {rows.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50">
            <div>
              <b className="text-slate-800">{s.name}</b>
              <span className="ml-2 text-slate-400 text-xs font-mono">{s.roll_number}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showTime && s.time && <span className="text-xs font-mono text-slate-500">{s.time}</span>}
              <StatusBadge status={status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
