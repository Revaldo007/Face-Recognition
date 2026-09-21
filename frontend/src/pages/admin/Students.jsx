import { useEffect, useMemo, useRef, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import { Alert, Modal, PageHeader } from '../../components/ui'
import Camera from '../../components/Camera'

// ─── Field definitions (reused in both Add and Edit modals) ─────────────────
const FIELDS = [
  { name: 'student_id',    label: 'Student ID',  required: true },
  { name: 'roll_number',   label: 'Roll Number', required: true },
  { name: 'name',          label: 'Name',        required: true },
  { name: 'email',         label: 'Email',       type: 'email',    required: true },
  { name: 'phone',         label: 'Phone' },
  { name: 'department_id', label: 'Department',  type: 'select',   lookup: 'departments', required: true, numeric: true },
  { name: 'course_id',     label: 'Course',      type: 'select',   lookup: 'courses',     required: true, numeric: true },
  { name: 'year',          label: 'Year',        type: 'number',   required: true },
  { name: 'semester',      label: 'Semester',    type: 'number',   required: true },
  { name: 'section',       label: 'Section',     required: true },
  { name: 'password',      label: 'Password',    type: 'password', required: true },
]

const DEFAULTS = { year: 1, semester: 1, section: 'A' }
const ENDPOINT = '/students'

export default function Students() {
  // ── list state ──────────────────────────────────────────────────────────────
  const [rows,    setRows]    = useState([])
  const [options, setOptions] = useState({})
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // ── CRUD modal state ────────────────────────────────────────────────────────
  const [modal,     setModal]     = useState(null)   // null | { mode:'create'|'edit', row? }
  const [form,      setForm]      = useState({})
  const [formError, setFormError] = useState('')
  const [saving,    setSaving]    = useState(false)

  // ── Face enrollment modal state ─────────────────────────────────────────────
  const [faceModal,    setFaceModal]    = useState(null)   // null | { student }
  const [captures,     setCaptures]     = useState([])     // Blob[]
  const [detectStatus, setDetectStatus] = useState('')
  const [enrolling,    setEnrolling]    = useState(false)
  const [enrollResult, setEnrollResult] = useState(null)   // { ok, message }
  const cameraRef = useRef(null)
  const detectTimer = useRef(null)

  // ── load data ───────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true)
    try {
      setRows((await api.get(ENDPOINT)).data)
      setError('')
    } catch (e) { setError(errorMessage(e)) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const lookups = {
      departments: { endpoint: '/departments', label: (d) => d.name },
      courses:     { endpoint: '/courses',     label: (c) => `${c.name} (${c.code})` },
    }
    Object.entries(lookups).forEach(async ([key, cfg]) => {
      try {
        const data = (await api.get(cfg.endpoint)).data
        setOptions((o) => ({ ...o, [key]: data.map((d) => ({ value: d.id, label: cfg.label(d) })) }))
      } catch { /* ignore */ }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q)))
  }, [rows, search])

  // ── CRUD helpers ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({ ...DEFAULTS })
    setFormError('')
    setModal({ mode: 'create' })
  }
  const openEdit = (row) => {
    const values = {}
    FIELDS.forEach((f) => { values[f.name] = f.type === 'password' ? '' : row[f.name] ?? '' })
    setForm(values)
    setFormError('')
    setModal({ mode: 'edit', row })
  }
  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const payload = {}
    FIELDS.forEach((f) => {
      if (modal.mode === 'edit' && f.createOnly) return
      let v = form[f.name]
      if (f.type === 'password' && modal.mode === 'edit' && !v) return
      if (v === '' || v === undefined) v = f.required ? '' : null
      else if (f.type === 'number' || f.numeric) v = Number(v)
      payload[f.name] = v
    })
    try {
      if (modal.mode === 'create') await api.post(ENDPOINT, payload)
      else await api.put(`${ENDPOINT}/${modal.row.id}`, payload)
      setModal(null)
      load()
    } catch (err) { setFormError(errorMessage(err)) }
    finally { setSaving(false) }
  }
  const remove = async (row) => {
    if (!window.confirm('Delete this student?')) return
    try { await api.delete(`${ENDPOINT}/${row.id}`); load() }
    catch (err) { setError(errorMessage(err)) }
  }

  // ── Face enrollment helpers ─────────────────────────────────────────────────
  const openFaceModal = (student) => {
    setFaceModal({ student })
    setCaptures([])
    setDetectStatus('')
    setEnrollResult(null)
  }
  const closeFaceModal = () => {
    clearTimeout(detectTimer.current)
    setFaceModal(null)
  }

  // Poll live face detection while camera is active
  useEffect(() => {
    if (!faceModal || enrollResult) return
    const poll = async () => {
      if (!cameraRef.current?.isReady()) {
        detectTimer.current = setTimeout(poll, 1000)
        return
      }
      try {
        const blob = await cameraRef.current.capture()
        const fd = new FormData()
        fd.append('image', blob, 'frame.jpg')
        const res = await api.post('/face/detect', fd)
        setDetectStatus(res.data.message || '')
      } catch { /* ignore network blips */ }
      detectTimer.current = setTimeout(poll, 1500)
    }
    detectTimer.current = setTimeout(poll, 800)
    return () => clearTimeout(detectTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceModal, enrollResult])

  const capturePhoto = async () => {
    if (!cameraRef.current?.isReady()) return
    try {
      const blob = await cameraRef.current.capture()
      setCaptures((prev) => [...prev, blob])
    } catch (e) { setDetectStatus(e.message) }
  }

  const enrollFace = async () => {
    if (!captures.length) return
    setEnrolling(true)
    setEnrollResult(null)
    try {
      const fd = new FormData()
      captures.forEach((b, i) => fd.append('images', b, `photo${i}.jpg`))
      const res = await api.post(`/face/enroll/${faceModal.student.id}`, fd)
      setEnrollResult({ ok: true, message: `✅ ${res.data.message} (${res.data.photos_used} photo${res.data.photos_used !== 1 ? 's' : ''} used)` })
      load()   // refresh the face_enrolled badge
    } catch (err) {
      setEnrollResult({ ok: false, message: errorMessage(err) })
    } finally { setEnrolling(false) }
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Students" subtitle="Register and manage students">
        <input className="input !w-56" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-primary" onClick={openCreate}>+ Add student</button>
      </PageHeader>

      <Alert>{error}</Alert>

      <div className="card mt-3 overflow-x-auto !p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Student ID','Roll No','Name','Email','Course','Sem','Sec','Face','Actions'].map((h) => (
                <th key={h} className={`th ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td className="td text-center text-slate-500" colSpan={9}>Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td className="td text-center text-slate-500" colSpan={9}>No students found.</td></tr>}
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="td">{row.student_id ?? '-'}</td>
                <td className="td">{row.roll_number ?? '-'}</td>
                <td className="td font-medium">{row.name ?? '-'}</td>
                <td className="td">{row.email ?? '-'}</td>
                <td className="td">{row.course_name ?? '-'}</td>
                <td className="td">{row.semester ?? '-'}</td>
                <td className="td">{row.section ?? '-'}</td>
                <td className="td">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.face_enrolled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {row.face_enrolled ? 'Enrolled' : 'Not enrolled'}
                  </span>
                </td>
                <td className="td whitespace-nowrap text-right">
                  <button className="mr-3 text-sm font-medium text-violet-600 hover:underline" onClick={() => openFaceModal(row)}>
                    {row.face_enrolled ? 'Re-enroll' : 'Enroll Face'}
                  </button>
                  <button className="mr-3 text-sm font-medium text-indigo-600 hover:underline" onClick={() => openEdit(row)}>Edit</button>
                  <button className="text-sm font-medium text-rose-600 hover:underline" onClick={() => remove(row)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <Modal title={`${modal.mode === 'create' ? 'Add' : 'Edit'} student`} onClose={() => setModal(null)} wide>
          <form onSubmit={save} className="space-y-4">
            <Alert>{formError}</Alert>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => {
                if (modal.mode === 'edit' && f.createOnly) return null
                const opts = options[f.lookup] || []
                const common = {
                  className: 'input', value: form[f.name] ?? '',
                  onChange: (e) => setForm({ ...form, [f.name]: e.target.value }),
                  required: f.required && !(f.type === 'password' && modal.mode === 'edit'),
                }
                return (
                  <div key={f.name}>
                    <label className="label">{f.label}{f.required && ' *'}</label>
                    {f.type === 'select' ? (
                      <select {...common}>
                        <option value="">{f.required ? 'Select...' : 'None'}</option>
                        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input {...common} type={f.type || 'text'} min={f.type === 'number' ? 1 : undefined}
                        placeholder={f.type === 'password' && modal.mode === 'edit' ? 'Leave blank to keep current' : f.placeholder} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Face Enrollment Modal ── */}
      {faceModal && (
        <Modal title={`Enroll Face — ${faceModal.student.name}`} onClose={closeFaceModal} wide>
          <div className="space-y-4">

            {/* Camera */}
            {!enrollResult && (
              <>
                <Camera ref={cameraRef} active={true} statusText={detectStatus} />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Captured: <span className="font-semibold text-slate-700">{captures.length}</span> photo{captures.length !== 1 ? 's' : ''}
                    <span className="ml-1 text-xs text-slate-400">(max 8, more = better accuracy)</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      onClick={() => setCaptures([])}
                      disabled={!captures.length}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      onClick={capturePhoto}
                    >
                      📸 Capture
                    </button>
                  </div>
                </div>

                {/* Thumbnail strip */}
                {captures.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {captures.map((b, i) => (
                      <img
                        key={i}
                        src={URL.createObjectURL(b)}
                        alt={`capture ${i + 1}`}
                        className="h-16 w-16 rounded-lg object-cover ring-2 ring-indigo-300"
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Result banner */}
            {enrollResult && (
              <div className={`rounded-lg px-4 py-3 text-sm font-medium ${enrollResult.ok ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>
                {enrollResult.message}
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 pt-1">
              {enrollResult?.ok ? (
                <button className="btn-primary" onClick={closeFaceModal}>Done</button>
              ) : (
                <>
                  <button type="button" className="btn-secondary" onClick={closeFaceModal}>Cancel</button>
                  <button
                    className="btn-primary"
                    disabled={!captures.length || enrolling}
                    onClick={enrollFace}
                  >
                    {enrolling ? 'Enrolling...' : `Enroll (${captures.length} photo${captures.length !== 1 ? 's' : ''})`}
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
